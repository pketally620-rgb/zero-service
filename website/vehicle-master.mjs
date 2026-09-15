import {classifyVehicle,priceFor} from './domain.mjs';
export function validateMaster(master){
 if(master?.schema!==1||master.candidate!=='R4.2'||!Array.isArray(master.vehicles)||master.vehicles.length>1500)throw Error('Invalid master');
 const ids=new Set();for(const v of master.vehicles){
  if(!/^vm-[a-z0-9-]+$/.test(v.id)||ids.has(v.id)||typeof v.brand!=='string'||v.brand.length>50||typeof v.model!=='string'||v.model.length>60||!Number.isInteger(v.lengthMm)||v.lengthMm<2000||v.lengthMm>8000||!['passenger','mpv','van'].includes(v.kind)||v.verification!=='SOURCE_SUPPORTED'||!v.sources?.length||!v.sourceVariants?.length||v.sources.some(s=>!s.url?.startsWith('https://'))||v.ownerOverrideTier!==null||v.zeroTier!==classifyVehicle(v))throw Error('Invalid or unsupported row '+v.id);
  ids.add(v.id);
 }return master;
}
export function lookupVehicle(master,id){return master.vehicles.find(v=>v.id===id)||null;}
export function quoteFromMaster(master,id,service){const v=lookupVehicle(master,id);return v?priceFor(service,v):{type:'unknown',action:'CONTACT_ZERO'};}
// Explicit preparation only. No automatic mutation on server startup or source refresh.
export function prepareVehicleMaster(store,master){
 validateMaster(master);return store.mutate(s=>{
  if(s.dataClass!=='APPROVED_LAUNCH_PREPARATION')throw Error('Not a launch preparation DB');
  const prior=new Map(s.vehicles.map(v=>[v.id,v]));
  // Do not silently delete Owner-managed rows or overwrite an approved override.
  if([...prior.keys()].some(id=>!master.vehicles.some(v=>v.id===id)))throw Error('Unmapped Owner vehicle; review required');
  s.vehicles=master.vehicles.map(v=>{const old=prior.get(v.id);return old||{id:v.id,brand:v.brand,model:v.model,lengthMm:v.lengthMm,kind:v.kind,ownerOverrideTier:undefined,sourceVariants:v.sourceVariants,applicability:v.applicability};});
  s.vehicleMaster={candidate:master.candidate,asOf:master.asOf,authority:master.authority};return {vehicles:s.vehicles.length};
 },'vehicle-master:prepare-r42');
}
