const list=document.querySelector('#events');
const message=document.querySelector('#message');
const errorBox=document.querySelector('#error');
const refresh=document.querySelector('#retry');
// Server snapshots belong to this screen; only the signed-in member's registrations arrive.
const state={events:[],registrations:[],busy:false};
async function request(path,options={}) {
 const response=await fetch(path,{credentials:'same-origin',...options});
 if (response.status===401) {window.location.assign('/login');throw new Error('Please sign in again');}
 const data=response.status===204?null:await response.json();
 if (!response.ok) throw new Error(data.message || data.error || 'Request failed');
 return data;
}
function busy(value) {
 state.busy=value; list.setAttribute('aria-busy',String(value));refresh.disabled=value;
 for(const button of list.querySelectorAll('button')) button.disabled=value || button.dataset.full==='true';
}
function showError(error) {
 errorBox.hidden=false;
 errorBox.textContent=error instanceof TypeError?'Could not reach the server. Check your connection and try again.':error.message;
 refresh.textContent='Try again';
}
function render() {
 list.replaceChildren();
 for(const event of state.events) {
  const article=document.createElement('article');article.className='event';
  const date=document.createElement('p');date.className='date';date.textContent=new Date(event.date).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
  const title=document.createElement('h2');title.textContent=event.title;
  const available=document.createElement('p');available.className='places';available.textContent=`${event.free_places} places available`;
  const reservation=state.registrations.find(r=>r.event_id===event.id);
  const button=document.createElement('button');button.type='button';
  button.textContent=reservation?'Cancel reservation':event.free_places?'Reserve a place':'Event full';
  button.setAttribute('aria-label',`${button.textContent}: ${event.title}`);
  button.dataset.full=String(!reservation && event.free_places<=0);
  button.disabled=button.dataset.full==='true';
  if(reservation) {const confirmed=document.createElement('p');confirmed.className='confirmed';confirmed.textContent='Your place is reserved';article.append(confirmed);}
  button.addEventListener('click',async()=>{
   if(state.busy) return;busy(true);errorBox.hidden=true;message.textContent=reservation?'Cancelling reservation...':'Reserving your place...';
   try {
    await request(reservation?`/api/registrations/${reservation.id}`:'/api/registrations',reservation?{method:'DELETE'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:event.id})});
    await load(reservation?'Reservation cancelled. Your place is available again.':'Your place is reserved.');
   } catch(error) {message.textContent='Your request could not be completed. Refresh to see current availability.';showError(error);busy(false);}
  });
  article.append(date,title,available,button);list.append(article);
 }
}
async function load(success='') {
 busy(true);errorBox.hidden=true;message.textContent='Loading events...';
 try {
  const [events,registrations,me]=await Promise.all([request('/api/events'),request('/api/registrations'),request('/api/me')]);
  state.events=events.events;state.registrations=registrations.registrations;
  document.querySelector('#poster-panel').hidden=me.user.role!=='organizer';
  render();
  message.textContent=success || (state.events.length?`${state.events.length} upcoming events. Choose an event to reserve a place.`:'No upcoming events yet. Check back soon or refresh to look for new activities.');
  refresh.textContent='Refresh events';
 } catch(error) {message.textContent='Events could not be refreshed.';showError(error);}
 finally {busy(false);}
}
refresh.addEventListener('click',()=>load());
document.querySelector('#logout').addEventListener('click',async()=>{
 try {await request('/api/logout',{method:'POST'});window.location.assign('/login');}
 catch(error){showError(error);}
});
document.querySelector('#poster-form').addEventListener('submit',async event=>{
 event.preventDefault(); const form=event.currentTarget; const output=document.querySelector('#poster-message');const file=document.querySelector('#poster-image').files[0];
 if(file && (file.size>2*1024*1024 || !['image/png','image/jpeg','image/webp'].includes(file.type))) {output.textContent='Choose a PNG, JPEG or WebP image up to 2 MB.';return;}
 form.querySelector('button').disabled=true;output.textContent='Reading poster...';
 try {
  const image=file?await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);}):'';
  const result=await request('/api/poster-suggestions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,mimeType:file?.type})});
  output.textContent=result.message;
  for(const field of ['title','date','location']) document.querySelector(`#draft-${field}`).value=result.suggestion?.[field] || '';
 } catch(error){output.textContent=error.message;}
 finally {form.querySelector('button').disabled=false;}
});
load();
