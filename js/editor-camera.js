
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const workspace = document.querySelector('.workspace');
  const layer = $('layer');
  const grid = $('grid');
  const playLayer = $('playLayer');
  if (!workspace || !layer || !grid) return;

  const camera = {
    x: 0,
    y: 0,
    zoom: 1,
    dragging: false,
    moved: false,
    startMouseX: 0,
    startMouseY: 0,
    startX: 0,
    startY: 0
  };

  function clampZoom(value) {
    return Math.max(0.25, Math.min(4, value));
  }

  function applyCamera() {
    const transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
    layer.style.transformOrigin = '0 0';
    layer.style.transform = transform;
    grid.style.transformOrigin = '0 0';
    grid.style.transform = transform;

    // Keep the grid visually covering the viewport even when panned.
    grid.style.width = `${Math.max(workspace.clientWidth / camera.zoom + Math.abs(camera.x) / camera.zoom + 800, 2400)}px`;
    grid.style.height = `${Math.max(workspace.clientHeight / camera.zoom + Math.abs(camera.y) / camera.zoom + 800, 1600)}px`;

    const readout = $('editorCameraReadout');
    if (readout) readout.textContent = `Zoom ${Math.round(camera.zoom * 100)}%`;
  }

  function pointIsBackground(target) {
    return target === workspace || target === grid || target === layer;
  }

  workspace.addEventListener('contextmenu', event => {
    if (!workspace.classList.contains('playing')) event.preventDefault();
  });

  workspace.addEventListener('pointerdown', event => {
    if (workspace.classList.contains('playing')) return;
    if (event.button !== 2 || !pointIsBackground(event.target)) return;

    camera.dragging = true;
    camera.moved = false;
    camera.startMouseX = event.clientX;
    camera.startMouseY = event.clientY;
    camera.startX = camera.x;
    camera.startY = camera.y;
    workspace.setPointerCapture?.(event.pointerId);
    workspace.classList.add('cameraDragging');
    event.preventDefault();
  });

  workspace.addEventListener('pointermove', event => {
    if (!camera.dragging) return;

    const dx = event.clientX - camera.startMouseX;
    const dy = event.clientY - camera.startMouseY;
    if (Math.abs(dx) + Math.abs(dy) > 2) camera.moved = true;

    camera.x = camera.startX + dx;
    camera.y = camera.startY + dy;
    applyCamera();
    event.preventDefault();
  });

  function stopDrag(event) {
    if (!camera.dragging) return;
    camera.dragging = false;
    workspace.classList.remove('cameraDragging');
    try { workspace.releasePointerCapture?.(event.pointerId); } catch {}
    event.preventDefault();
  }

  workspace.addEventListener('pointerup', stopDrag);
  workspace.addEventListener('pointercancel', stopDrag);

  workspace.addEventListener('wheel', event => {
    if (workspace.classList.contains('playing')) return;

    const rect = workspace.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const worldX = (mouseX - camera.x) / camera.zoom;
    const worldY = (mouseY - camera.y) / camera.zoom;

    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    const nextZoom = clampZoom(camera.zoom * factor);
    if (nextZoom === camera.zoom) return;

    camera.zoom = nextZoom;
    camera.x = mouseX - worldX * camera.zoom;
    camera.y = mouseY - worldY * camera.zoom;
    applyCamera();
    event.preventDefault();
  }, { passive: false });

  // Convert editor pointer coordinates through the camera so placement/dragging stays accurate.
  window.editorScreenToWorld = function(clientX, clientY) {
    const rect = workspace.getBoundingClientRect();
    return {
      x: (clientX - rect.left - camera.x) / camera.zoom,
      y: (clientY - rect.top - camera.y) / camera.zoom
    };
  };

  window.resetEditorCamera = function() {
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1;
    applyCamera();
  };

  // Patch common pointer coordinate calculations used by the editor.
  const oldAdd = typeof add === 'function' ? add : null;
  if (oldAdd) {
    window.add = function(type) {
      return oldAdd(type);
    };
  }

  applyCamera();
})();
