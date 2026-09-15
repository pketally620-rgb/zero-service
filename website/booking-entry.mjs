import {requireValue} from './validation.mjs';
import {serviceEnabled} from './service-management.mjs';
import {priceFor} from './domain.mjs';
import {bookingStore,saveBookings} from './store.mjs';
// Both entry points execute this inside the same SQLite BEGIN IMMEDIATE transaction.
export function requestBooking(state,input,now){
 const vehicle=state.vehicles.find(v=>v.id===input.vehicleId),service=state.services.find(s=>s.id===input.serviceId);
 requireValue(vehicle&&service&&serviceEnabled(service),'請選擇已開放的車款與服務。');
 const slot=state.slots.find(s=>s.id===input.slotId);
 requireValue(slot&&slot.status==='OPEN'&&!slot.bookingId&&Date.parse(slot.date+'T'+slot.time+':00+08:00')>now,'此時段目前無法申請，請重新選擇開放時段。');
 const bookings=bookingStore(state),createdAt=new Date(now).toISOString();
 const booking=bookings.request(slot.id,{slotDate:slot.date,slotTime:slot.time,ownerHash:input.ownerHash,vehicleName:vehicle.brand+' '+vehicle.model,serviceName:service.name,quote:priceFor(service,vehicle),createdAt,pendingSince:createdAt,...(input.assisted?{assisted:input.assisted}:{})});
 saveBookings(state,bookings);return booking;
}
