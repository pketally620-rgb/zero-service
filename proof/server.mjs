import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { vehicles as seedVehicles, services as seedServices, tierLabels, priceFor, classifyVehicle, BookingStore, readPrivateCustomer } from './core.mjs';

// Deliberately one loopback process, synthetic in-memory state, no external services.
export function createProofServer() {
  const vehicles = structuredClone(seedVehicles), services = structuredClone(seedServices);
  const slots = new BookingStore(['2026-09-18', '2026-09-19'].flatMap((date, d) => ['10:00','13:30','15:30'].map((time,i) => ({ id:`S${d*3+i+1}`, date, time }))));
  const sessions = new Map();
  const credentials = { A:'proof-a', B:'proof-b', owner:'proof-owner' };
  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  const safeSlots = () => slots.slots.map(({ bookingId, ...s }) => s);
  return http.createServer(async (req,res) => {
    const send = (status,data) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(JSON.stringify(data)); };
    try {
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host || '')) fail(403,'HOST_DENIED');
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) fail(403,'ORIGIN_DENIED');
      const url = new URL(req.url, `http://${req.headers.host}`), path = url.pathname;
      const token = /(?:^|; )proof_session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
      const actor = sessions.get(token) || {type:'anonymous'};
      const owner = () => { if(actor.type !== 'owner') fail(403,'OWNER_REQUIRED'); };
      let body = {};
      if (req.method === 'POST') {
        if (!(req.headers['content-type'] || '').startsWith('application/json')) fail(415,'JSON_REQUIRED');
        let raw=''; for await(const chunk of req) { raw += chunk; if(raw.length>16000) fail(413,'BODY_TOO_LARGE'); }
        try { body=JSON.parse(raw || '{}'); } catch { fail(400,'INVALID_JSON'); }
      }
      if(req.method === 'GET' && path === '/api/catalog') return send(200,{vehicles,services,tierLabels,slots:safeSlots(),actor});
      if(req.method === 'POST' && path === '/api/login') {
        if (!Object.hasOwn(credentials,body.identity) || credentials[body.identity] !== body.password) fail(401,'INVALID_CREDENTIALS');
        if(token) sessions.delete(token);
        const next = randomBytes(32).toString('hex');
        sessions.set(next, body.identity === 'owner' ? {type:'owner'} : {type:'customer',customerId:body.identity});
        res.setHeader('Set-Cookie',`proof_session=${next}; HttpOnly; SameSite=Strict; Path=/`);
        return send(200,{ok:true});
      }
      if(req.method === 'POST' && path === '/api/logout') {
        sessions.delete(token); res.setHeader('Set-Cookie','proof_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send(200,{ok:true});
      }
      if(req.method === 'GET' && /^\/api\/customers\/[^/]+$/.test(path)) {
        try { return send(200,readPrivateCustomer(actor,path.split('/').pop())); }
        catch(e) { fail(actor.type === 'anonymous' ? 401 : 403,e.message); }
      }
      if(req.method === 'POST' && path === '/api/quote') {
        const v=vehicles.find(v=>v.id===body.vehicleId),s=services.find(s=>s.id===body.serviceId);
        if(!v || !s) fail(400,'INVALID_SELECTION');
        return send(200,{...priceFor(s,v),autoTier:classifyVehicle(v,false),note:s.note});
      }
      if(req.method === 'POST' && path === '/api/bookings') {
        const v=vehicles.find(v=>v.id===body.vehicleId),s=services.find(s=>s.id===body.serviceId);
        if(!v || !s) fail(400,'INVALID_SELECTION');
        const capability=randomBytes(24).toString('hex');
        const b=slots.request(body.slotId,{vehicleName:`${v.brand} ${v.model}`,serviceName:s.name,quote:priceFor(s,v),capability});
        return send(201,b);
      }
      if(req.method === 'GET' && path === '/api/manage/bookings') { owner(); return send(200,[...slots.bookings.values()].map(({capability,...b})=>b)); }
      if(req.method === 'POST' && /^\/api\/bookings\/[^/]+\/(confirm|change|cancel)$/.test(path)) {
        const [, , , id, action] = path.split('/');
        const b=slots.bookings.get(id);
        if(actor.type !== 'owner' && (!b || body.capability !== b.capability)) fail(403,'BOOKING_ACCESS_DENIED');
        if(action === 'confirm') owner();
        return send(200,action === 'change' ? slots.change(id,body.slotId) : slots[action](id));
      }
      if(req.method === 'POST' && path === '/api/manage/price') {
        owner(); if(!Number.isInteger(body.price) || body.price<1 || body.price>1000000) fail(400,'INVALID_PRICE');
        services[0].prices.mid=body.price; return send(200,{ok:true});
      }
      if(req.method === 'POST' && path === '/api/manage/slot') {
        owner(); if(typeof body.open !== 'boolean') fail(400,'INVALID_SLOT_STATE');
        return send(200,slots.setSlotOpen(body.slotId,body.open));
      }
      if(req.method === 'POST' && path === '/api/manage/vehicle') {
        owner(); const v=vehicles.find(v=>v.id===body.vehicleId);
        if(!v || !Number.isInteger(body.lengthMm) || body.lengthMm<2000 || body.lengthMm>8000 || !['passenger','mpv','van'].includes(body.kind) || (body.override && !Object.hasOwn(tierLabels,body.override))) fail(400,'INVALID_VEHICLE');
        Object.assign(v,{lengthMm:body.lengthMm,kind:body.kind,ownerOverrideTier:body.override || undefined}); return send(200,{ok:true});
      }
      const publicFiles = {'/':'index.html','/index.html':'index.html','/app.mjs':'app.mjs','/style.css':'style.css','/review.html':'review.html','/review.mjs':'review.mjs','/review.css':'review.css'};
      if(req.method === 'GET' && Object.hasOwn(publicFiles,path)) {
        const name=publicFiles[path], content=await readFile(new URL(name,import.meta.url));
        res.writeHead(200,{'Content-Type':name.endsWith('.mjs')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'"}); return res.end(content);
      }
      fail(404,'NOT_FOUND');
    } catch(e) { send(e.status || 409,{error:e.message}); }
  });
}
if(process.argv[1] === fileURLToPath(import.meta.url)) {
  const server=createProofServer(); server.listen(4173,'127.0.0.1',()=>console.log('ZERO Proof: http://127.0.0.1:4173 — synthetic, resets on restart'));
}
