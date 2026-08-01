"use strict";
(() => {
  const $=id=>document.getElementById(id);
  function currentRoom(){try{return typeof room==='function'?room():null}catch{return null}}
  function sync(){
    const r=currentRoom(); if(!r)return;
    r.zoom??=1;
    if($('roomZoom'))$('roomZoom').value=r.zoom;
    if($('roomZoomValue'))$('roomZoomValue').textContent=Number(r.zoom).toFixed(2)+'×';
  }
  $('roomZoom')?.addEventListener('input',()=>{
    const r=currentRoom();if(!r)return;
    r.zoom=Math.max(.1,Math.min(4,Number($('roomZoom').value)||1));
    if($('roomZoomValue'))$('roomZoomValue').textContent=r.zoom.toFixed(2)+'×';
  });
  $('roomZoom')?.addEventListener('change',()=>{try{persistProject();render()}catch{} sync()});
  $('zoomOutPreset')?.addEventListener('click',()=>{const r=currentRoom();if(!r)return;r.zoom=.5;try{persistProject();render()}catch{}sync()});
  $('zoomResetPreset')?.addEventListener('click',()=>{const r=currentRoom();if(!r)return;r.zoom=1;try{persistProject();render()}catch{}sync()});
  document.querySelector('[data-tab="rooms"]')?.addEventListener('click',()=>setTimeout(sync,0));
  window.DerpeditSyncZoomUI=sync;
  setTimeout(sync,0);
})();
