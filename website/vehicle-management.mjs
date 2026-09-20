import {randomUUID} from 'node:crypto';
import {requireValue,text} from './validation.mjs';
import {tierLabels} from './domain.mjs';

export const vehicleEnabled=vehicle=>vehicle?.enabled!==false;

export function saveVehicle(state,input){
 const existing=input.id?state.vehicles.find(vehicle=>vehicle.id===input.id):undefined;
 requireValue(!input.id||existing,'找不到此車款。');
 requireValue(text(input.brand,50)&&text(input.model,60)&&Number.isInteger(input.lengthMm)&&input.lengthMm>=2000&&input.lengthMm<=8000&&['passenger','mpv','van'].includes(input.kind)&&(!input.override||Object.hasOwn(tierLabels,input.override))&&typeof input.enabled==='boolean');
 const values={brand:input.brand.trim(),model:input.model.trim(),lengthMm:input.lengthMm,kind:input.kind,ownerOverrideTier:input.override||undefined,enabled:input.enabled};
 if(existing){Object.assign(existing,values);return existing;}
 const vehicle={id:'vehicle-'+randomUUID(),...values};state.vehicles.push(vehicle);return vehicle;
}
