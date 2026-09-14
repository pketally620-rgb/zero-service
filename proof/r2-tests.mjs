import test from 'node:test';
import assert from 'node:assert/strict';
import {brandsFor,modelsFor,lineHandoffUrl,LINE_ACCOUNT_ID} from './ux.mjs';
import {vehicles,services,priceFor} from './core.mjs';
test('R2-A: brand → only its models → unchanged prices and override',()=>{
 assert.deepEqual(brandsFor(vehicles),['Toyota','Lexus','Porsche','Tesla']);
 assert.deepEqual(modelsFor(vehicles,'Toyota').map(v=>v.model),['Corolla Cross','Alphard']);
 assert.deepEqual(modelsFor(vehicles,'').map(v=>v.model),[]);
 const expected={'corolla-cross':1800,'lexus-nx':2100,'porsche-cayenne':2500,'tesla-model-y':2100,'toyota-alphard':3000};
 for(const brand of brandsFor(vehicles))for(const model of modelsFor(vehicles,brand)){
  assert.equal(model.brand,brand);assert.equal(priceFor(services[0],model).amount,expected[model.id]);
  assert.equal(priceFor(services[1],model).amount,16500);assert.equal(priceFor(services[2],model).type,'assessment');
 }
 assert.equal(priceFor(services[0],{...modelsFor(vehicles,'Toyota')[1],ownerOverrideTier:'special'}).amount,2500);
});
test('R2-B: exact official account and lossless encoded draft including query delimiters',()=>{
 const summary='【ZERO Proof・請勿送出】\nPB-001 Toyota Alphard\n服務：清潔 & 防護 + 鍍膜? #1\n價格：$3,000\n2026-09-18 10:00\nPENDING';
 const url=new URL(lineHandoffUrl(summary));
 assert.equal(url.origin,'https://line.me');assert.equal(url.pathname,'/R/oaMessage/%40udu6260e/');
 assert.equal(LINE_ACCOUNT_ID,'@udu6260e');assert.equal(decodeURIComponent(url.search.slice(1)),summary);assert.equal(url.hash,'');
 assert.ok(!url.search.includes('&'));assert.ok(!url.search.includes('\n'));
 const changed=summary.replace('09-18','09-19').replace('PENDING','CONFIRMED');assert.equal(decodeURIComponent(new URL(lineHandoffUrl(changed)).search.slice(1)),changed);
});
