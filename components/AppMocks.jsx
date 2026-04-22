// Faithful recreations of the real WWM Monitor Live / Dashboard / Overlay UI.
// Drawn from src/index.html + src/style.css + src/overlay.html in the repo.
const { useState, useEffect, useMemo, useRef } = React;

// --- Live ping sim (matches app's semantics: ok <80, warn <150, crit) -----
function useLivePing({ base = 28, jitter = 6, spikeChance = 0.04 } = {}) {
  const [v, setV] = useState(base);
  useEffect(() => {
    let t;
    const tick = () => {
      const spike = Math.random() < spikeChance;
      const n = spike ? base + 80 + Math.random()*80 : base + (Math.random()-0.5)*jitter*2;
      setV(Math.max(8, Math.round(n)));
      t = setTimeout(tick, 1000 + Math.random()*400);
    };
    tick();
    return () => clearTimeout(t);
  }, [base, jitter, spikeChance]);
  return v;
}
function useSeries(len = 50, opts) {
  const p = useLivePing(opts);
  const [s, setS] = useState(() => Array.from({length:len}, () => (opts?.base ?? 28) + (Math.random()-0.5)*8));
  useEffect(() => { setS(x => [...x.slice(1), p]); }, [p]);
  return { series: s, ping: p };
}
function pingClass(ms) {
  if (ms >= 150) return "ping-crit";
  if (ms >= 80) return "ping-warn";
  return "ping-ok";
}
function pingHex(ms) {
  if (ms >= 150) return "#ef4444";
  if (ms >= 80) return "#f59e0b";
  return "#22c55e";
}

// --- Shared SVG line graph (matches ping history + jitter canvas feel) ----
function LineGraph({ series, height = 120, color = "#22c55e", fill = false, showTimes = false, startTime, endTime }) {
  const w = 800, pad = 10;
  const max = Math.max(...series, 50) * 1.1;
  const min = 0;
  const step = (w - pad*2)/(series.length-1);
  const y = v => pad + (height - pad*2) * (1 - (v-min)/(max-min));
  const path = series.map((v,i) => `${i===0?"M":"L"} ${pad+i*step} ${y(v)}`).join(" ");
  const area = `${path} L ${pad+(series.length-1)*step} ${height-pad} L ${pad} ${height-pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{width:"100%", height:"100%", display:"block", overflow:"visible"}}>
      {fill && (
        <>
          <defs>
            <linearGradient id={`lg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#lg-${color.replace("#","")})`} />
        </>
      )}
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      {showTimes && (
        <>
          <text x={pad} y={height-2} fontSize="11" fill="rgba(255,255,255,0.3)" fontFamily="Segoe UI, system-ui, sans-serif">{startTime}</text>
          <text x={w-pad} y={height-2} fontSize="11" fill="rgba(255,255,255,0.3)" textAnchor="end" fontFamily="Segoe UI, system-ui, sans-serif">{endTime}</text>
        </>
      )}
    </svg>
  );
}

// --- Live page mock -------------------------------------------------------
function LivePageMock() {
  const { series, ping } = useSeries(50, { base: 28 });
  const jitterSeries = useMemo(() => series.map((v,i) => i>0 ? Math.abs(v - series[i-1])*2.5 : 0), [series]);
  const avg = Math.round(series.reduce((a,b)=>a+b,0)/series.length);
  const min = Math.round(Math.min(...series));
  const max = Math.round(Math.max(...series));
  const jitter = Math.round(jitterSeries.reduce((a,b)=>a+b,0)/jitterSeries.length);
  const spikes = series.filter(v=>v>=120).length;
  const sent = 1204, lost = 0;
  const last10 = series.slice(-10).map(v => v >= 120 ? "bad" : v >= 60 ? "warn" : "ok");

  return (
    <div className="app-shell">
      <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>
      <AppSidebar active="live" />
      <div className="app-main">
        <div className="app-live">
          <div className="ping-row">
            {/* Ping card */}
            <div className="card ping-card">
              <div className="ping-eyebrow">LIVE PING · WWM SERVER</div>
              <div className="ping-hero">
                <div className={`ping-num ${pingClass(ping)}`}>{ping}</div>
                <div className="ping-unit">ms</div>
              </div>
              <div className="status-pill" style={{background:`${pingHex(ping)}22`, borderColor:`${pingHex(ping)}55`, color:pingHex(ping)}}>● {ping<80?"STABLE":ping<150?"DEGRADED":"CRITICAL"}</div>
              <div className="secondary-row">
                <div className="sec-cell"><div className="sec-lbl">ROUTER</div><div className="sec-val">1 ms</div></div>
                <div className="sec-cell"><div className="sec-lbl">8.8.8.8</div><div className="sec-val">14 ms</div></div>
              </div>
              <div className="prov-wrap">
                <div className="prov-label"><span>PROVIDER HEALTH</span><span>98%</span></div>
                <div className="prov-track"><div className="prov-fill" style={{width:"98%", background:"#22c55e"}}/></div>
              </div>
              <div className="geo-divider"/>
              <div className="geo-row"><span className="geo-lbl">SERVER IP</span><span className="geo-val">203.0.113.24</span></div>
              <div className="geo-row"><span className="geo-lbl">LOCATION</span><span className="geo-val wrap">Frankfurt, DE</span></div>
              <div className="geo-row"><span className="geo-lbl">ISP</span><span className="geo-val wrap">Game Server Host</span></div>
              <div className="geo-row"><span className="geo-lbl">HOPS</span><span className="geo-val">11 ▾</span></div>
              <div className="geo-row"><span className="geo-lbl">PROCESS</span><span className="geo-val">wwm.exe</span></div>
              <div className="geo-row"><span className="geo-lbl">SESSION</span><span className="geo-val session-dur">01:24:07</span></div>
              <div className="quality-block">
                <div className="quality-score-row">
                  <div className="quality-grade">A</div>
                  <div className="quality-breakdown">
                    <div className="qb-row"><span className="qb-lbl">PING</span><div className="qb-bar-track"><div className="qb-bar-fill" style={{width:"95%",background:"#22c55e"}}/></div><span className="qb-val">95</span></div>
                    <div className="qb-row"><span className="qb-lbl">LOSS</span><div className="qb-bar-track"><div className="qb-bar-fill" style={{width:"100%",background:"#22c55e"}}/></div><span className="qb-val">100</span></div>
                    <div className="qb-row"><span className="qb-lbl">JITTER</span><div className="qb-bar-track"><div className="qb-bar-fill" style={{width:"92%",background:"#22c55e"}}/></div><span className="qb-val">92</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Graph card */}
            <div className="card graph-card">
              <div className="graph-sublabel">PING HISTORY — last 50 pings</div>
              <div style={{flex:2, minHeight:0}}><LineGraph series={series} height={180} color="#22c55e" showTimes startTime="9:37:42 AM" endTime="9:39:20 AM" /></div>
              <div className="graph-spacer"/>
              <div className="graph-sublabel">JITTER HISTORY — last 50</div>
              <div style={{flex:1, minHeight:0}}><LineGraph series={jitterSeries} height={90} color="#22c55e" /></div>
              <div className="divider-line"/>
              <div className="stat-row">
                <Tile v={sent} l="SENT" c="rgba(255,255,255,.65)"/>
                <Tile v={sent-lost} l="RECV" c="#22c55e"/>
                <Tile v={lost} l="LOST" c="#ef4444"/>
                <Tile v={`${((lost/sent)*100).toFixed(1)}%`} l="LOSS" c="#f59e0b"/>
                <Tile v={spikes} l="SPIKES" c="#a855f7"/>
                <Tile v={min} l="MIN ms" c="#22c55e"/>
                <Tile v={max} l="MAX ms" c="#ef4444"/>
                <Tile v={avg} l="AVG ms" c="#f59e0b"/>
                <Tile v={jitter} l="JITTER" c="#f59e0b"/>
                <Tile v={0} l="STREAK" c="#ef4444"/>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="map-section">
            <div className="map-wrap">
              <RealMap server={{lat:50.11,lon:8.68,label:"Frankfurt, DE"}} pastServers={[{lat:52.37,lon:4.90}]} zoomScale={4.5} />
              <div className="map-badge">
                <div className="map-badge-lbl">SERVER LOCATION</div>
                <div className="map-badge-val">Frankfurt, Germany · 203.0.113.24</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ v, l, c }) {
  return (
    <div className="stat-tile">
      <div className="stat-val" style={{color:c}}>{v}</div>
      <div className="stat-lbl">{l}</div>
    </div>
  );
}

// --- Dot world-map (original stylized continents) -------------------------
function DotMap() {
  const dots = useMemo(() => {
    const pts = [];
    const rows = 20, cols = 52;
    const f = (x,y) => {
      const nx=x/cols, ny=y/rows;
      const n = Math.sin(nx*8+ny*4)*0.5 + Math.cos(nx*3-ny*6)*0.3 + Math.sin((nx+ny)*10)*0.2;
      return n > 0.05 && n < 0.55;
    };
    for (let y=0;y<rows;y++) for (let x=0;x<cols;x++) if (f(x,y)) pts.push([x,y]);
    return pts;
  }, []);
  return (
    <svg viewBox="0 0 520 200" style={{width:"100%",height:"100%",display:"block",background:"#080808"}}>
      {dots.map(([x,y],i) => <circle key={i} cx={x*10+5} cy={y*10+5} r="1.3" fill="rgba(255,255,255,0.18)" />)}
      <g transform="translate(280,72)">
        <circle r="14" fill="#22c55e" opacity="0.15"><animate attributeName="r" from="6" to="18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.35" to="0" dur="2s" repeatCount="indefinite"/></circle>
        <circle r="4" fill="#22c55e" />
      </g>
      <g transform="translate(120,100)"><circle r="3" fill="rgba(255,255,255,0.7)"/></g>
      <path d="M120 100 Q 200 30 280 72" stroke="#22c55e" strokeWidth="1.1" strokeDasharray="3 4" fill="none" opacity="0.7"/>
    </svg>
  );
}

// --- Sidebar --------------------------------------------------------------
function AppSidebar({ active }) {
  return (
    <aside className="app-sb">
      <div className="app-sb-logo">
        <img src="assets/logo.png" alt="WWM" style={{width:32,height:32,borderRadius:8,display:"block",objectFit:"cover"}}/>
      </div>
      <nav className="app-sb-nav">
        <button className={`sb-btn ${active==="live"?"active":""}`} title="Live">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,10 4.5,10 6.5,4 8.5,16 10.5,7 12.5,13 14.5,10 19,10"/></svg>
        </button>
        <button className={`sb-btn ${active==="dash"?"active":""}`} title="Dashboard">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="1.5" y="11" width="4" height="7" rx="1.5"/><rect x="8" y="6" width="4" height="12" rx="1.5"/><rect x="14.5" y="2" width="4" height="16" rx="1.5"/></svg>
        </button>
        <button className="sb-btn" title="Settings">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M8.43 2.76a1.75 1.75 0 013.14 0l.24.5a1.75 1.75 0 002.36.8l.5-.24a1.75 1.75 0 012.22 2.22l-.24.5a1.75 1.75 0 00.8 2.36l.5.24a1.75 1.75 0 010 3.14l-.5.24a1.75 1.75 0 00-.8 2.36l.24.5a1.75 1.75 0 01-2.22 2.22l-.5-.24a1.75 1.75 0 00-2.36.8l-.24.5a1.75 1.75 0 01-3.14 0l-.24-.5a1.75 1.75 0 00-2.36-.8l-.5.24a1.75 1.75 0 01-2.22-2.22l.24-.5a1.75 1.75 0 00-.8-2.36l-.5-.24a1.75 1.75 0 010-3.14l.5-.24a1.75 1.75 0 00.8-2.36l-.24-.5a1.75 1.75 0 012.22-2.22l.5.24a1.75 1.75 0 002.36-.8l.24-.5zM10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>
        </button>
      </nav>
      <div className="app-sb-bot">
        <div className="status-dot alive" />
        <div className="sb-ver">v1.3.2</div>
      </div>
    </aside>
  );
}

// --- Dashboard mock -------------------------------------------------------
function DashboardMock() {
  const { series } = useSeries(50, { base: 30 });
  const hourly = useMemo(()=>Array.from({length:24},()=>25+Math.random()*40),[]);
  const jitter24 = useMemo(()=>Array.from({length:24},()=>2+Math.random()*8),[]);
  return (
    <div className="app-shell">
      <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>
      <AppSidebar active="dash"/>
      <div className="app-main">
        <div className="app-dash">
          {/* Hero row */}
          <div className="hero-row">
            <div className="card grade-card">
              <div className="grade-big" style={{color:"#22c55e"}}>A</div>
              <div className="grade-sub">QUALITY</div>
            </div>
            <div className="card hero-card">
              <div className="hero-lbl">AVG PING</div>
              <div className="hero-val" style={{color:"rgba(255,255,255,.82)"}}>28<span style={{fontSize:14,color:"rgba(255,255,255,.35)"}}> ms</span></div>
              <div className="hero-sub">Best: 18 · Worst: 142</div>
            </div>
            <div className="card hero-card">
              <div className="hero-lbl">PACKET LOSS</div>
              <div className="hero-val" style={{color:"rgba(255,255,255,.82)"}}>0.0<span style={{fontSize:14,color:"rgba(255,255,255,.35)"}}> %</span></div>
              <div className="hero-sub">1,204 sent · 0 lost</div>
            </div>
            <div className="card hero-card">
              <div className="hero-lbl">AVG JITTER</div>
              <div className="hero-val" style={{color:"rgba(255,255,255,.82)"}}>4<span style={{fontSize:14,color:"rgba(255,255,255,.35)"}}> ms</span></div>
              <div className="hero-sub">2 spikes detected</div>
            </div>
            <div className="card hero-card">
              <div className="hero-lbl">UPTIME</div>
              <div className="hero-val" style={{color:"rgba(255,255,255,.82)"}}>98.4<span style={{fontSize:14,color:"rgba(255,255,255,.35)"}}> %</span></div>
              <div className="hero-sub">24 sessions</div>
            </div>
          </div>

          {/* Secondary tiles */}
          <div className="card">
            <div className="stat-row">
              <Tile v="12,840" l="TOTAL PINGS" c="rgba(255,255,255,.65)"/>
              <Tile v="28" l="AVG ms" c="#f59e0b"/>
              <Tile v="18" l="BEST ms" c="#22c55e"/>
              <Tile v="142" l="WORST ms" c="#ef4444"/>
              <Tile v="4" l="AVG JITTER" c="#f59e0b"/>
              <Tile v="0.2%" l="LOSS" c="#ef4444"/>
              <Tile v="14" l="SPIKES" c="#a855f7"/>
              <Tile v="24" l="SESSIONS" c="rgba(255,255,255,.65)"/>
            </div>
          </div>

          {/* Dual charts */}
          <div className="dual-chart-row">
            <div className="card chart-card">
              <div className="sec-hdr" style={{justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><div className="sec-bar"/><div className="sec-title">PING TREND — LAST 24H</div></div>
                <div style={{display:"flex",gap:3}}>
                  <span className="seg-btn active">24H</span>
                  <span className="seg-btn">7D</span>
                  <span className="seg-btn">30D</span>
                </div>
              </div>
              <div className="chart-area"><BarChart data={hourly} color="#22c55e"/></div>
            </div>
            <div className="card chart-card">
              <div className="sec-hdr"><div className="sec-bar"/><div className="sec-title">JITTER TREND — LAST 24H</div></div>
              <div className="chart-area"><BarChart data={jitter24} color="#a855f7"/></div>
            </div>
          </div>

          {/* Session cards */}
          <div className="card">
            <div style={{padding:"12px 14px 2px"}}><div className="sec-hdr"><div className="sec-bar"/><div className="sec-title">SESSION HISTORY</div></div></div>
            <div className="sess-grid">
              {[
                {g:"A",gc:"#22c55e",d:"2h 14m",s:"Frankfurt · 203.0.113.24",ping:28,loss:"0.0%",spikes:2,b:"#22c55e"},
                {g:"B",gc:"#f59e0b",d:"1h 02m",s:"Frankfurt · 203.0.113.24",ping:42,loss:"0.2%",spikes:7,b:"#f59e0b"},
                {g:"A",gc:"#22c55e",d:"3h 07m",s:"Amsterdam · 198.51.100.8",ping:31,loss:"0.0%",spikes:1,b:"#22c55e"},
                {g:"C",gc:"#ef4444",d:"48m",s:"Amsterdam · 198.51.100.8",ping:68,loss:"1.1%",spikes:14,b:"#ef4444"},
              ].map((s,i)=>(
                <div key={i} className="sess-card">
                  <div className="sess-top">
                    <div className="sess-grade" style={{color:s.gc}}>{s.g}</div>
                    <div style={{textAlign:"right"}}>
                      <div className="sess-time">Apr 21 · {["22:14","19:02","21:47","18:30"][i]}</div>
                      <div className="sess-dur">{s.d}</div>
                    </div>
                  </div>
                  <div className="sess-server">{s.s}</div>
                  <div className="sess-stats">
                    <div className="ss"><div className="ss-val">{s.ping}</div><div className="ss-lbl">AVG</div></div>
                    <div className="ss"><div className="ss-val">{s.loss}</div><div className="ss-lbl">LOSS</div></div>
                    <div className="ss"><div className="ss-val">{s.spikes}</div><div className="ss-lbl">SPIKES</div></div>
                  </div>
                  <div className="sess-bar" style={{background:s.b}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div className="bottom-row">
            <div className="card switch-card">
              <div className="sec-hdr" style={{marginBottom:8}}><div className="sec-bar"/><div className="sec-title">SERVER SWITCH HISTORY</div></div>
              <div>
                {[
                  ["22:14","Amsterdam","Frankfurt","2h 14m"],
                  ["19:02","Frankfurt","Amsterdam","1h 02m"],
                  ["15:55","—","Frankfurt","3h 07m"],
                ].map((r,i)=>(
                  <div key={i} className="sw-row">
                    <span className="sw-time">{r[0]}</span>
                    <span className="sw-from">{r[1]}</span>
                    <span className="sw-arrow">→</span>
                    <span className="sw-to">{r[2]}</span>
                    <span className="sw-dur">{r[3]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card dash-map-card">
              <RealMap server={{lat:50.11,lon:8.68}} pastServers={[{lat:52.37,lon:4.90},{lat:51.51,lon:-0.13}]} showHint={false} zoomScale={2.5}/>
              <div className="map-badge"><div className="map-badge-lbl">SERVER LOCATIONS</div><div className="map-badge-val">2 seen today</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, color }) {
  const max = Math.max(...data)*1.2;
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:2,height:"100%",padding:"0 2px"}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1,height:`${(v/max)*100}%`,background:color,opacity:0.75,borderRadius:"2px 2px 0 0"}}/>
      ))}
    </div>
  );
}

// --- Overlay widget (matches src/overlay.html) ----------------------------
function OverlayWidget() {
  const { series, ping } = useSeries(10, { base: 28 });
  const col = pingHex(ping);
  const maxMs = Math.max(...series), minMs = Math.min(...series);
  const range = Math.max(maxMs - minMs, 10);
  return (
    <div className="ov-wrap">
      <div className="ov-accent" style={{background:col, boxShadow:`0 0 10px ${col}b3`}}/>
      <div className="ov-info">
        <div className="ov-label">PING</div>
        <div className="ov-city">Frankfurt, DE</div>
      </div>
      <div className="ov-ping" style={{color: ping<80?"#fff":col, textShadow: ping<80?"none":`0 0 20px ${col}99`}}>{ping}</div>
      <div className="ov-unit">ms</div>
      <div className="ov-divider"/>
      <div className="ov-mcol"><div className="ov-mval">4</div><div className="ov-mlabel">JITTER</div></div>
      <div className="ov-divider"/>
      <div className="ov-mcol"><div className="ov-mval" style={{color:"#22c55e"}}>0%</div><div className="ov-mlabel">LOSS</div></div>
      <div className="ov-divider"/>
      <div className="ov-spark">
        {series.slice(-10).map((v,i)=>{
          const px = Math.max(2, Math.round(((v-minMs)/range)*18+4));
          return <div key={i} className="ov-bar" style={{height:px, background:pingHex(v)}}/>;
        })}
      </div>
    </div>
  );
}

Object.assign(window, { LivePageMock, DashboardMock, OverlayWidget, DotMap, pingHex });
