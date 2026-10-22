import {journeyAt} from './journey.js';
import {films,websites} from './collection.js';
const $=id=>document.getElementById(id),body=document.body;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let selectedFilm='watch',selectedWebsite='gina';
const dispatch=(name,detail)=>document.dispatchEvent(new CustomEvent(name,{detail}));
const dialog=$('film-dialog'),video=dialog.querySelector('video');let returnFocus=null;
function openFilm(key,trigger){const transmission=key==='transmission';const title=transmission?'The transmission film':films[key].title;
  const src=transmission?'/assets/studio-live/transmission-studio-watermarked.mp4':`/assets/studio/${key}.mp4`;
  const poster=transmission?'/assets/studio-live/poster-studio.jpg':`/assets/studio/${key}.jpg`;
  returnFocus=trigger;$('dialog-title').textContent=title;video.poster=poster;video.querySelector('source').src=src;video.setAttribute('aria-label',title+' — watermarked film');$('video-direct').href=src;$('video-error').hidden=true;video.load();dialog.showModal();$('close-film').focus();video.play().catch(()=>{ /* Native controls remain available if playback is blocked. */ });}
$('film').addEventListener('click',()=>openFilm('transmission',$('film')));
$('play-selected').addEventListener('click',()=>openFilm(selectedFilm,$('play-selected')));
$('close-film').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{video.pause();returnFocus?.focus();});dialog.addEventListener('cancel',()=>video.pause());
video.addEventListener('error',()=>{$('video-error').hidden=false;});video.querySelector('source').addEventListener('error',()=>{$('video-error').hidden=false;});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function chooseFilm(key){if(!films[key])return;selectedFilm=key;const f=films[key];document.querySelectorAll('[data-film]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.film===key)));document.querySelectorAll('[data-hd]').forEach(a=>a.hidden=a.dataset.hd!==key);$('film-kind').textContent=f.kind;$('film-copy').textContent=f.copy;$('play-selected').textContent=f.label+' ▷';$('film-poster').src='/assets/studio/'+f.poster+'.jpg';$('film-poster').alt='Watermarked '+f.title+' film preview';body.dataset.selectedFilm=key;dispatch('studio:film',key);}
function chooseWebsite(key){if(!websites[key])return;selectedWebsite=key;const p=websites[key];document.querySelectorAll('[data-website]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.website===key)));$('website-request').href='/studio?project=website&example='+key;$('website-kind').textContent=p.kind;$('website-copy').textContent=p.copy;$('website-link').href=p.url;$('website-link').textContent=p.cta+' ↗';$('website-poster').src=p.poster;$('website-poster').alt=p.title+' portfolio artwork';body.dataset.selectedWebsite=key;dispatch('studio:website',key);}
document.querySelectorAll('[data-film]').forEach(b=>b.addEventListener('click',()=>chooseFilm(b.dataset.film)));
document.querySelectorAll('[data-website]').forEach(b=>b.addEventListener('click',()=>chooseWebsite(b.dataset.website)));
document.addEventListener('studio:screen',e=>{if(e.detail.kind==='film')chooseFilm(e.detail.value);if(e.detail.kind==='website')chooseWebsite(e.detail.value);});
$('copy-email').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('studio@vetopsfinancial.com');$('copy-status').textContent='Email address copied.';}catch{$('copy-status').textContent='Copy this address: studio@vetopsfinancial.com';}});
function reduce(value){body.classList.toggle('reduced',value);document.documentElement.style.scrollBehavior=value?'auto':'';}
$('reduce-motion').checked=motion.matches;reduce(motion.matches);$('reduce-motion').addEventListener('change',e=>reduce(e.target.checked));motion.addEventListener('change',e=>reduce(e.matches));
let simple=false;
$('simple-view').addEventListener('click',()=>{if(body.dataset.sceneFailed){location.href=location.pathname;return;}simple=!simple;body.classList.toggle('simple',simple);$('simple-view').setAttribute('aria-pressed',String(simple));$('simple-view').textContent=simple?'Return to 3D':'Simple view';dispatch('studio:simple',simple);schedule();});
const chapters=[...document.querySelectorAll('[data-scene]')];let queued=false;
function position(){queued=false;const focus=scrollY+innerHeight*.5,centers=chapters.map(el=>el.offsetTop+el.offsetHeight*.5);const value=journeyAt(focus,centers,body.classList.contains('reduced'));
  const index=Math.round(value);body.dataset.chapter=String(index);body.dataset.journey=value.toFixed(4);
  const railIndex=index<=1?0:index;document.querySelectorAll('[data-rail]').forEach(a=>{if(Number(a.dataset.rail)===railIndex)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});dispatch('studio:journey',{value,index});}
function schedule(){if(!queued){queued=true;requestAnimationFrame(position);}}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);document.fonts?.ready.then(schedule);position();
chooseFilm('watch');chooseWebsite('gina');
if(navigator.connection?.saveData){body.classList.add('simple');simple=true;$('simple-view').textContent='Load live 3D';$('simple-view').setAttribute('aria-pressed','true');$('loading').textContent='Data saver is on. Choose Load live 3D to explore.';let loaded=false;$('simple-view').addEventListener('click',()=>{if(!simple&&!loaded){loaded=true;import('./viewer.js');}});}else import('./viewer.js');
