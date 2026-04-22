// Shared primitives: animated metrics, ping graph SVG, overlay chrome, dashboard chrome
const { useState, useEffect, useRef, useMemo } = React;

// --- Animated live ping value ----------------------------------------------
function useLivePing({ base = 28, jitter = 6, spikeChance = 0.04 } = {}) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    let t;
    const tick = () => {
      const spike = Math.random() < spikeChance;
      const n = spike
        ? base + 80 + Math.random() * 60
        : base + (Math.random() - 0.5) * jitter * 2;
      setVal(Math.max(8, Math.round(n)));
      t = setTimeout(tick, 900 + Math.random() * 400);
    };
    tick();
    return () => clearTimeout(t);
  }, [base, jitter, spikeChance]);
  return val;
}

// --- Rolling series for sparklines / graphs --------------------------------
function useSeries(length = 50, opts) {
  const ping = useLivePing(opts);
  const [series, setSeries] = useState(() =>
    Array.from({ length }, () => (opts?.base ?? 28) + (Math.random() - 0.5) * 8)
  );
  useEffect(() => {
    setSeries((s) => [...s.slice(1), ping]);
  }, [ping]);
  return { series, ping };
}

function pingColor(ms, warn = 60, crit = 120) {
  if (ms >= crit) return "var(--c-bad)";
  if (ms >= warn) return "var(--c-warn)";
  return "var(--c-good)";
}

// --- Big ping graph (live, SVG) --------------------------------------------
function PingGraph({ width = 640, height = 180, padding = 16, series, warn = 60, crit = 120, showGrid = true, accent }) {
  const max = Math.max(150, ...series) * 1.1;
  const min = 0;
  const step = (width - padding * 2) / (series.length - 1);
  const y = (v) => padding + (height - padding * 2) * (1 - (v - min) / (max - min));
  const path = series.map((v, i) => `${i === 0 ? "M" : "L"} ${padding + i * step} ${y(v)}`).join(" ");
  const area = `${path} L ${padding + (series.length - 1) * step} ${height - padding} L ${padding} ${height - padding} Z`;
  const warnY = y(warn);
  const critY = y(crit);
  const accentColor = accent || "var(--accent)";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="pingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showGrid && [0.25, 0.5, 0.75].map((t, i) => (
        <line key={i} x1={padding} x2={width - padding} y1={padding + (height - padding * 2) * t} y2={padding + (height - padding * 2) * t}
          stroke="var(--line)" strokeDasharray="2 4" strokeWidth="1" />
      ))}
      <line x1={padding} x2={width - padding} y1={warnY} y2={warnY} stroke="var(--c-warn)" strokeOpacity="0.35" strokeDasharray="3 3" />
      <line x1={padding} x2={width - padding} y1={critY} y2={critY} stroke="var(--c-bad)" strokeOpacity="0.4" strokeDasharray="3 3" />
      <path d={area} fill="url(#pingGrad)" />
      <path d={path} fill="none" stroke={accentColor} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((v, i) => v >= crit ? (
        <circle key={i} cx={padding + i * step} cy={y(v)} r="2.5" fill="var(--c-bad)" />
      ) : null)}
    </svg>
  );
}

// --- Sparkline (small) -----------------------------------------------------
function Sparkline({ series, width = 80, height = 22, accent }) {
  const max = Math.max(80, ...series);
  const min = Math.min(...series, 0);
  const step = width / (series.length - 1);
  const y = (v) => height - ((v - min) / (max - min || 1)) * height;
  const path = series.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <path d={path} fill="none" stroke={accent || "var(--accent)"} strokeWidth="1.5" />
    </svg>
  );
}

// --- World-map-ish dot constellation (original, not a real map) ------------
function DotMap({ accent }) {
  const dots = useMemo(() => {
    // hand-tuned pseudo-continent silhouette using a seeded grid
    const pts = [];
    const rows = 22, cols = 48;
    const silhouette = (x, y) => {
      // produces rough continent blobs
      const nx = x / cols, ny = y / rows;
      const n =
        Math.sin(nx * 8 + ny * 4) * 0.5 +
        Math.cos(nx * 3 - ny * 6) * 0.3 +
        Math.sin((nx + ny) * 12) * 0.2;
      return n > 0.05 && n < 0.55;
    };
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (silhouette(x, y)) pts.push([x, y]);
      }
    }
    return pts;
  }, []);
  return (
    <svg viewBox="0 0 480 220" width="100%" style={{ display: "block" }}>
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x * 10 + 5} cy={y * 10 + 5} r="1.4" fill="var(--muted)" opacity="0.5" />
      ))}
      {/* current server pin */}
      <g transform="translate(340,90)">
        <circle r="14" fill={accent || "var(--accent)"} opacity="0.15">
          <animate attributeName="r" from="6" to="18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.35" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle r="4" fill={accent || "var(--accent)"} />
      </g>
      {/* home pin */}
      <g transform="translate(140,120)">
        <circle r="3" fill="var(--fg)" />
      </g>
      <path d="M140 120 Q 240 40 340 90" stroke={accent || "var(--accent)"} strokeWidth="1.25" fill="none" strokeDasharray="3 4" opacity="0.7" />
    </svg>
  );
}

// --- Big metric (flips smoothly) ------------------------------------------
function MetricBig({ label, value, unit = "ms", color, mono = true }) {
  return (
    <div className="metric-big">
      <div className="metric-big__label">{label}</div>
      <div className="metric-big__value" style={{ color, fontFamily: mono ? "var(--mono)" : "inherit" }}>
        {value}<span className="metric-big__unit">{unit}</span>
      </div>
    </div>
  );
}

// --- Overlay chrome (the in-game overlay mockup) ---------------------------
function OverlayMock({ compact = false, accent }) {
  const { series, ping } = useSeries(24, { base: 32 });
  const jitter = Math.round(4 + Math.random() * 2);
  return (
    <div className={`overlay-chrome ${compact ? "overlay-chrome--compact" : ""}`}>
      <div className="overlay-chrome__row">
        <span className="overlay-chrome__dot" style={{ background: pingColor(ping) }} />
        <span className="overlay-chrome__label">PING</span>
        <span className="overlay-chrome__val" style={{ color: pingColor(ping) }}>{ping}<em>ms</em></span>
      </div>
      <div className="overlay-chrome__row">
        <span className="overlay-chrome__label">JIT</span>
        <span className="overlay-chrome__val">{jitter}<em>ms</em></span>
      </div>
      <div className="overlay-chrome__row">
        <span className="overlay-chrome__label">LOSS</span>
        <span className="overlay-chrome__val">0.0<em>%</em></span>
      </div>
      <div className="overlay-chrome__spark">
        <Sparkline series={series} width={120} height={20} accent={accent} />
      </div>
    </div>
  );
}

// --- Dashboard mock (big UI frame) -----------------------------------------
function DashboardMock({ accent }) {
  const { series, ping } = useSeries(50, { base: 30 });
  const avg = Math.round(series.reduce((a, b) => a + b, 0) / series.length);
  const max = Math.round(Math.max(...series));
  const min = Math.round(Math.min(...series));
  const jitter = 4;
  return (
    <div className="dash">
      <div className="dash__bar">
        <div className="dash__bar-dots"><span/><span/><span/></div>
        <div className="dash__bar-title">WWM Monitor</div>
        <div className="dash__bar-tabs">
          <span className="is-active">Live</span><span>Dashboard</span><span>Settings</span>
        </div>
      </div>
      <div className="dash__body">
        <div className="dash__row">
          <MetricBig label="Live ping" value={ping} color={pingColor(ping)} />
          <MetricBig label="Jitter" value={jitter} />
          <MetricBig label="Loss" value="0.0" unit="%" />
          <MetricBig label="Grade" value="A" unit="" color={accent || "var(--accent)"} />
        </div>
        <div className="dash__graph">
          <div className="dash__graph-hd">
            <span>Ping · last 50</span>
            <span className="dash__graph-legend">
              <em style={{background:"var(--c-warn)"}}/>warn 60
              <em style={{background:"var(--c-bad)"}}/>crit 120
            </span>
          </div>
          <PingGraph series={series} accent={accent} />
        </div>
        <div className="dash__row dash__row--sm">
          <MetricBig label="Avg" value={avg} mono />
          <MetricBig label="Min" value={min} mono />
          <MetricBig label="Max" value={max} mono />
          <MetricBig label="Sent" value="1,204" unit="" mono />
          <MetricBig label="Lost" value="0" unit="" mono />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  useLivePing, useSeries, pingColor,
  PingGraph, Sparkline, DotMap, MetricBig, OverlayMock, DashboardMock,
});
