// Real world-map canvas drawer, ported from src/js/maps.js
// Loads countries-110m.json, decodes TopoJSON arcs, renders on an HTML5 canvas.
const { useEffect, useRef } = React;

function decodeTopo(topo) {
  const arcs = topo.arcs, polygons = [];
  const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
  function decodeArc(idx) {
    const rev = idx < 0, arc = arcs[rev ? ~idx : idx];
    let cx = 0, cy = 0;
    const pts = arc.map(([dx, dy]) => { cx += dx; cy += dy; return [cx * sx + tx, cy * sy + ty]; });
    if (rev) pts.reverse();
    return pts;
  }
  topo.objects.countries.geometries.forEach(geo => {
    const collect = (arcsArr) => {
      const ring = [];
      arcsArr.forEach(idx => decodeArc(idx).forEach(p => ring.push(p)));
      polygons.push(ring);
    };
    if (geo.type === 'Polygon') geo.arcs.forEach(collect);
    else if (geo.type === 'MultiPolygon') geo.arcs.forEach(a => a.forEach(collect));
  });
  return polygons;
}

let _cachedPolys = null;
let _loadPromise = null;
function loadPolys() {
  if (_cachedPolys) return Promise.resolve(_cachedPolys);
  if (_loadPromise) return _loadPromise;
  _loadPromise = fetch('data/countries-110m.json')
    .then(r => r.json())
    .then(t => { _cachedPolys = decodeTopo(t); return _cachedPolys; });
  return _loadPromise;
}

const MAP_W = 1000, MAP_H = 500;

function RealMap({ server = { lat: 50.11, lon: 8.68, label: "Frankfurt, DE" }, pastServers = [], showHint = true, zoomToServer = true, zoomScale = 5 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(0);
  const pulseRef = useRef(0);
  const viewRef = useRef({ x: 0, y: 0, scale: 1, initialized: false });
  const draggingRef = useRef(null);
  const polysRef = useRef(null);
  const zoomAnimRef = useRef(null);

  function smoothZoomTo(lon, lat, targetScale) {
    const canvas = canvasRef.current; if (!canvas) return;
    if (zoomAnimRef.current) cancelAnimationFrame(zoomAnimRef.current);
    const W = canvas.width || canvas.offsetWidth, H = canvas.height || canvas.offsetHeight;
    const bx = (lon + 180) / 360 * MAP_W, by = (90 - lat) / 180 * MAP_H;
    const destX = W/2 - bx*targetScale, destY = H/2 - by*targetScale;
    const v = viewRef.current;
    const startX = v.x, startY = v.y, startS = v.scale;
    const t0 = performance.now(), DUR = 900;
    const step = (now) => {
      const t = Math.min((now-t0)/DUR, 1);
      const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
      v.scale = startS + (targetScale-startS)*e;
      v.x = startX + (destX-startX)*e;
      v.y = startY + (destY-startY)*e;
      if (t < 1) zoomAnimRef.current = requestAnimationFrame(step);
      else zoomAnimRef.current = null;
    };
    zoomAnimRef.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    let alive = true;
    loadPolys().then(p => {
      if (!alive) return;
      polysRef.current = p;
      draw();
      // Auto-zoom after polys + layout ready
      if (zoomToServer && server) {
        // Two-frame delay so the canvas has been sized correctly
        requestAnimationFrame(() => requestAnimationFrame(() => {
          // Trigger size init
          const c = canvasRef.current;
          if (c) {
            c.width = c.offsetWidth; c.height = c.offsetHeight;
            const v = viewRef.current;
            v.scale = c.height / MAP_H;
            v.x = (c.width - MAP_W * v.scale) / 2;
            v.y = 0;
            v.initialized = true;
          }
          setTimeout(() => smoothZoomTo(server.lon, server.lat, zoomScale), 250);
        }));
      }
    });
    return () => { alive = false; };
  }, []);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth || 800, H = canvas.offsetHeight || 220;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W; canvas.height = H;
      const v = viewRef.current;
      if (!v.initialized || (v.x === 0 && v.y === 0 && v.scale === 1)) {
        v.scale = H / MAP_H;
        v.x = (W - MAP_W * v.scale) / 2;
        v.y = 0;
        v.initialized = true;
      }
    }
    const v = viewRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    const toXY = (lon, lat) => [
      (lon + 180) / 360 * MAP_W * v.scale + v.x,
      (90 - lat) / 180 * MAP_H * v.scale + v.y,
    ];
    const wrapThresh = MAP_W * v.scale * 0.4;

    if (polysRef.current) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 0.7;
      polysRef.current.forEach(ring => {
        if (ring.length < 3) return;
        ctx.beginPath();
        let px = null, hasWrap = false;
        ring.forEach(([lon, lat]) => {
          const [x, y] = toXY(lon, lat);
          if (px === null || Math.abs(x - px) > wrapThresh) {
            ctx.moveTo(x, y);
            if (px !== null) hasWrap = true;
          } else {
            ctx.lineTo(x, y);
          }
          px = x;
        });
        if (!hasWrap) ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    }

    pastServers.forEach(ps => {
      const [x, y] = toXY(ps.lon, ps.lat);
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
    });

    if (server) {
      const [sx, sy] = toXY(server.lon, server.lat);
      const pulse = (pulseRef.current % 420) / 420;
      ctx.beginPath();
      ctx.arc(sx, sy, 7 + pulse * 22, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34,197,94,${Math.pow(1 - pulse, 2) * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 16;
      ctx.shadowColor = 'rgba(34,197,94,0.8)';
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (showHint && v.scale <= H / MAP_H * 1.1) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '10px Segoe UI, system-ui, sans-serif';
      ctx.fillText('Scroll to zoom  ·  Drag to pan', W / 2 - 95, H - 10);
    }
  }

  useEffect(() => {
    const loop = () => { pulseRef.current++; draw(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const delta = e.deltaY > 0 ? 0.85 : 1.18;
      const v = viewRef.current;
      const ns = Math.max(0.8, Math.min(12, v.scale * delta));
      v.x = mx - (mx - v.x) * (ns / v.scale);
      v.y = my - (my - v.y) * (ns / v.scale);
      v.scale = ns;
    };
    const onDown = (e) => { draggingRef.current = { sx: e.clientX, sy: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y }; canvas.style.cursor = 'grabbing'; };
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const d = draggingRef.current;
      viewRef.current.x = d.vx + (e.clientX - d.sx);
      viewRef.current.y = d.vy + (e.clientY - d.sy);
    };
    const onUp = () => { draggingRef.current = null; if (canvas) canvas.style.cursor = 'grab'; };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.style.cursor = 'grab';
    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

window.RealMap = RealMap;
