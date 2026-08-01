'use strict';
(() => {
  function clamp(value,min,max){
    if(max<min)return min;
    return Math.max(min,Math.min(max,value));
  }

  function targetFor(g){
    const mode=g.camera?.mode||'fixed';
    if(mode==='fixed')return {x:0,y:0};

    const zoom=Math.max(.1,Number(g.camera.zoom)||1);
    let x=(g.pl.x+g.pl.w/2)-g.w/(2*zoom);
    let y=(g.pl.y+g.pl.h/2)-g.h/(2*zoom);

    if(!g.camera.infinite){
      x=clamp(x,0,Math.max(0,g.worldW-g.w/zoom));
      y=clamp(y,0,Math.max(0,g.worldH-g.h/zoom));
    }
    return {x,y};
  }

  function update(g,dt){
    g.camera??={x:0,y:0,zoom:1,mode:'fixed',infinite:false};
    const target=targetFor(g);

    if(g.camera.mode==='fixed'){
      g.camera.x=0;g.camera.y=0;
      return;
    }

    // Small smoothing that remains responsive and does not overshoot.
    const smooth=Math.max(0,Math.min(1,Number(g.camera?.smooth??.18)));const followSpeed=30-(smooth*27);
    const amount=1-Math.exp(-followSpeed*Math.max(0,dt));
    g.camera.x+=(target.x-g.camera.x)*amount;
    g.camera.y+=(target.y-g.camera.y)*amount;

    if(Math.abs(target.x-g.camera.x)<.05)g.camera.x=target.x;
    if(Math.abs(target.y-g.camera.y)<.05)g.camera.y=target.y;
  }

  function apply(g,ctx){
    const zoom=Math.max(.1,Number(g.camera?.zoom)||1);
    ctx.scale(zoom,zoom);
    ctx.translate(-(g.camera?.x||0),-(g.camera?.y||0));
  }

  function screenToWorld(g,x,y){
    const zoom=Math.max(.1,Number(g.camera?.zoom)||1);
    return {
      x:x/zoom+(g.camera?.x||0),
      y:y/zoom+(g.camera?.y||0)
    };
  }

  window.DerpeditCamera={update,apply,screenToWorld};
})();
