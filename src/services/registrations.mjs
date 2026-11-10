import { transaction, getEvent, registrationCount, findRegistration, insertRegistration, getRegistration, deleteRegistration, getUserRegistrations } from '../data/db.mjs';
export class RegistrationError extends Error {
 constructor(name,message,status) { super(message); this.name=name; this.status=status; }
}
const fail=(name,message,status)=>{throw new RegistrationError(name,message,status);};
function identity(userId) { if (!Number.isSafeInteger(userId) || userId<1) fail('Unauthenticated','Sign in first',401); }
function identifier(id) { if (!Number.isSafeInteger(id) || id<1) fail('InvalidInput','Choose a valid event or reservation',422); }
export function reservePlace(db,userId,eventId) {
 identity(userId); identifier(eventId);
 return transaction(db,()=> {
  const event=getEvent(db,eventId);
  if (!event) fail('NotFound','Event not found',404);
  if (event.start_at<=new Date().toISOString()) fail('EventPast','This event has already started',409);
  if (findRegistration(db,userId,eventId)) fail('AlreadyRegistered','You already reserved a place',409);
  // Capacity rule: the transaction serializes this check with the insert.
  if (registrationCount(db,eventId)>=event.capacity) fail('EventFull','This event is full',409);
  return insertRegistration(db,userId,eventId);
 });
}
export function cancelReservation(db,userId,id) {
 identity(userId); identifier(id);
 return transaction(db,()=>{
  const registration=getRegistration(db,id);
  if (!registration) fail('NotFound','Reservation not found',404);
  if (registration.user_id!==userId) fail('NotOwner','Only the reservation owner may cancel',403);
  deleteRegistration(db,id);
 });
}
export function myRegistrations(db,userId) { identity(userId); return getUserRegistrations(db,userId); }
