// Presentation-only visual gate. Switching skins never mutates product state.
const directions=['A','B','C'];
const selected=new URLSearchParams(location.search).get('direction');
const initial=directions.includes(selected)?selected:'A';
const frame=document.querySelector('iframe');
if(!frame){
 document.documentElement.dataset.direction=initial;
 addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.type==='zero-direction'&&directions.includes(event.data.direction))document.documentElement.dataset.direction=event.data.direction;});
}else{
 let current=initial;
 const apply=()=>{frame.contentWindow.postMessage({type:'zero-direction',direction:current},location.origin);document.querySelector('#standalone').href='/?direction='+current;for(const button of document.querySelectorAll('[data-direction]'))button.setAttribute('aria-pressed',String(button.dataset.direction===current));};
 frame.src='/?direction='+initial;frame.addEventListener('load',apply);apply();
 for(const button of document.querySelectorAll('[data-direction]'))button.onclick=()=>{current=button.dataset.direction;history.replaceState(null,'','?direction='+current);apply();};
 for(const name of ['desktop','mobile'])document.getElementById(name).onclick=()=>{frame.classList.toggle('mobile',name==='mobile');for(const id of ['desktop','mobile'])document.getElementById(id).setAttribute('aria-pressed',String(id===name));};
}
