"use strict";
(() => {
  const $=id=>document.getElementById(id);
  function currentRoom(){
    try{return typeof room==='function'?room():null}catch{return null}
  }
  function sync(){
    const r=currentRoom(); if(!r)return;
    r.zoom??=1; r.cameraSmooth??=.18;
    if($('roomZoom'))$('roomZoom').value=r.zoom;
    if($('roomZoomValue'))$('roomZoomValue').textContent=Number(r.zoom).toFixed(2)+'×';
    if($('cameraSmooth'))$('cameraSmooth').value=r.cameraSmooth;
    if($('cameraSmoothValue'))$('cameraSmoothValue').textContent=Number(r.cameraSmooth).toFixed(2);
  }
  $('roomZoom')?.addEventListener('input',()=>{
    const r=currentRoom();if(!r)return;
    r.zoom=Math.max(.1,Math.min(4,Number($('roomZoom').value)||1));
    $('roomZoomValue').textContent=r.zoom.toFixed(2)+'×';
  });
  $('roomZoom')?.addEventListener('change',()=>{try{persistProject();render()}catch{} sync()});
  $('cameraSmooth')?.addEventListener('input',()=>{
    const r=currentRoom();if(!r)return;
    r.cameraSmooth=Math.max(0,Math.min(1,Number($('cameraSmooth').value)||0));
    $('cameraSmoothValue').textContent=r.cameraSmooth.toFixed(2);
  });
  $('cameraSmooth')?.addEventListener('change',()=>{try{persistProject();render()}catch{} sync()});
  $('zoomOutPreset')?.addEventListener('click',()=>{
    const r=currentRoom();if(!r)return;r.zoom=.5;try{persistProject();render()}catch{}sync();
  });
  $('zoomResetPreset')?.addEventListener('click',()=>{
    const r=currentRoom();if(!r)return;r.zoom=1;try{persistProject();render()}catch{}sync();
  });
  $('cameraMode')?.addEventListener('change',()=>setTimeout(sync,0));
  document.querySelector('[data-tab="rooms"]')?.addEventListener('click',()=>setTimeout(sync,0));
  window.DerpeditSyncCameraUI=sync;
  setTimeout(sync,0);
})();
