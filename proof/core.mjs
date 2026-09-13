export const vehicleRules = { midMax: 4630, largeMax: 4850 };

export const vehicles = [
  { id: 'corolla-cross', brand: 'Toyota', model: 'Corolla Cross', lengthMm: 4460, kind: 'passenger' },
  { id: 'lexus-nx', brand: 'Lexus', model: 'NX', lengthMm: 4660, kind: 'passenger' },
  { id: 'porsche-cayenne', brand: 'Porsche', model: 'Cayenne', lengthMm: 4930, kind: 'passenger' },
  { id: 'tesla-model-y', brand: 'Tesla', model: 'Model Y', lengthMm: 4790, kind: 'passenger' },
  { id: 'toyota-alphard', brand: 'Toyota', model: 'Alphard', lengthMm: 5010, kind: 'mpv', ownerOverrideTier: 'business' },
];

export const tierLabels = { mid: '中型車', large: '大型車', special: '特殊型車', business: '商務型車' };

export const services = [
  { id: 'wash', name: '精緻手工洗車', mode: 'tier', prices: { mid: 1800, large: 2100, special: 2500, business: 3000 }, note: '正常車況基準；特殊髒污於施工前說明。' },
  { id: 'paint-coating', name: '單層鍍膜｜車漆', mode: 'fixed', fixedPrice: 16500, note: '正常車況基準；若需額外拋光或修復，先說明再決定。' },
  { id: 'correction', name: '漆面傷痕修復／進階拋光', mode: 'assessment', note: '依實車傷痕、漆況與施工範圍現場評估。' },
];

export function classifyVehicle(vehicle, useOverride = true) {
  if (!vehicle) throw new Error('vehicle required');
  if (useOverride && vehicle.ownerOverrideTier) return vehicle.ownerOverrideTier;
  if (vehicle.lengthMm <= vehicleRules.midMax) return 'mid';
  if (vehicle.lengthMm <= vehicleRules.largeMax) return 'large';
  return vehicle.kind === 'mpv' || vehicle.kind === 'van' ? 'business' : 'special';
}

export function priceFor(service, vehicle) {
  const tier = classifyVehicle(vehicle, true);
  if (service.mode === 'tier') return { type: 'amount', amount: service.prices[tier], tier };
  if (service.mode === 'fixed') return { type: 'amount', amount: service.fixedPrice, tier };
  return { type: 'assessment', tier };
}

export class BookingStore {
  constructor(slots) {
    this.slots = slots.map((s) => ({ ...s, status: s.status || 'OPEN', bookingId: null }));
    this.bookings = new Map();
    this.sequence = 1;
  }
  request(slotId, payload) {
    const slot = this.#slot(slotId);
    if (slot.status !== 'OPEN') throw new Error('slot not open');
    const bookingId = `PB-${String(this.sequence++).padStart(3, '0')}`;
    const booking = { id: bookingId, slotId, status: 'PENDING', ...payload };
    this.bookings.set(bookingId, booking);
    slot.status = 'PENDING'; slot.bookingId = bookingId;
    return booking;
  }
  confirm(bookingId) {
    const booking = this.#booking(bookingId);
    const slot = this.#slot(booking.slotId);
    if (slot.bookingId !== bookingId) throw new Error('slot ownership mismatch');
    const conflicting = [...this.bookings.values()].find((b) => b.id !== bookingId && b.slotId === booking.slotId && b.status === 'CONFIRMED');
    if (conflicting) throw new Error('double confirmed booking blocked');
    booking.status = 'CONFIRMED'; slot.status = 'CONFIRMED';
    return booking;
  }
  change(bookingId, newSlotId) {
    const booking = this.#booking(bookingId);
    const oldSlot = this.#slot(booking.slotId);
    const newSlot = this.#slot(newSlotId);
    if (newSlot.status !== 'OPEN') throw new Error('new slot not open');
    oldSlot.status = 'OPEN'; oldSlot.bookingId = null;
    booking.slotId = newSlotId; booking.status = 'PENDING';
    newSlot.status = 'PENDING'; newSlot.bookingId = bookingId;
    return booking;
  }
  cancel(bookingId) {
    const booking = this.#booking(bookingId);
    const slot = this.#slot(booking.slotId);
    booking.status = 'CANCELLED';
    if (slot.bookingId === bookingId) { slot.status = 'OPEN'; slot.bookingId = null; }
    return booking;
  }
  setSlotOpen(slotId, isOpen) {
    const slot = this.#slot(slotId);
    if (slot.bookingId) throw new Error('booked slot cannot be manually toggled');
    slot.status = isOpen ? 'OPEN' : 'CLOSED';
    return slot;
  }
  #slot(id) { const slot = this.slots.find((s) => s.id === id); if (!slot) throw new Error('slot not found'); return slot; }
  #booking(id) { const booking = this.bookings.get(id); if (!booking) throw new Error('booking not found'); return booking; }
}

export const proofCustomers = {
  A: { id: 'A', displayName: '王先生（測試 A）', phoneMasked: '09•••1234', vehicles: ['Toyota Corolla Cross', 'Tesla Model Y'], warranty: '單層鍍膜｜有效至 2027-05-01' },
  B: { id: 'B', displayName: '陳小姐（測試 B）', phoneMasked: '09•••5678', vehicles: ['Lexus NX'], warranty: '玻璃鍍膜｜有效至 2027-02-15' },
};

export function readPrivateCustomer(actor, targetId) {
  if (!actor || actor.type === 'anonymous') throw new Error('AUTH_REQUIRED');
  if (actor.type !== 'customer') throw new Error('FORBIDDEN');
  if (actor.customerId !== targetId) throw new Error('FORBIDDEN');
  return structuredClone(proofCustomers[targetId]);
}

export function lineHandoffUrl(summary, baseUrl = 'https://lin.ee/y8kjBXa') { return { url: baseUrl, summary }; }
export function formatMoney(amount) { return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(amount); }
