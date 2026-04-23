// Landing page wrapping the real LivePageMock / DashboardMock / OverlayWidget
const Site = () => {
  const [tab, setTab] = React.useState("live");
  return (
    <div className="lp">
      <div className="lp-orbs"><div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/></div>

      <nav className="lp-nav">
        <div className="lp-brand">
          <img src="assets/logo.png" alt="WWM" style={{width:26,height:26,borderRadius:6,objectFit:"cover"}}/>
          <span>WWM Monitor</span>
          <span className="lp-ver">v1.3.2</span>
        </div>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="https://github.com/onyxdigital-dev/WWM-Monitor" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="lp-hero-eyebrow">● LIVE · REAL-TIME NETWORK MONITOR</div>
        <h1 className="lp-hero-title">See what your connection feels.</h1>
        <p className="lp-hero-sub">Live ping, jitter, packet loss, spike detection, server tracking and geo mapping -S for Where Winds Meet. A quiet always-on-top overlay with near-zero CPU and memory impact on your game.</p>
        <div className="lp-cta">
          <a className="lp-btn lp-btn-primary" href="https://github.com/onyxdigital-dev/WWM-Monitor/releases/latest" target="_blank" rel="noreferrer">⬇ DOWNLOAD FOR WINDOWS</a>
          <a className="lp-btn lp-btn-ghost" href="https://github.com/onyxdigital-dev/WWM-Monitor" target="_blank" rel="noreferrer">View source</a>
        </div>
        <div className="lp-hero-meta">Free · MIT · Windows 10 / 11 · No Python or Node required</div>
      </header>

      <section className="lp-screenshot" id="screenshot">
        <div className="lp-app-frame">
          <div className="lp-app-titlebar">
            <div className="lp-app-dots"><span/><span/><span/></div>
            <div className="lp-app-title">WWM Monitor</div>
          </div>
          <div className="lp-app-inner">
            {tab==="live" && <LivePageMock/>}
            {tab==="dash" && <DashboardMock/>}
            {tab==="overlay" && (
              <div className="lp-overlay-stage">
                <div className="lp-overlay-scene">
                  {Array.from({length:60}).map((_,i)=>(<span key={i} style={{animationDelay:`${i*0.05}s`}}/>))}
                  <div className="lp-overlay-caption">IN-GAME OVERLAY · ALWAYS ON TOP</div>
                </div>
                <div className="lp-overlay-float"><OverlayWidget/></div>
              </div>
            )}
          </div>
        </div>
        <div className="lp-tab-row">
          {[["live","Live"],["dash","Dashboard"],["overlay","Overlay"]].map(([k,l])=>(
            <button key={k} className={`lp-tab ${tab===k?"is-active":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
      </section>

      <section className="lp-features" id="features">
        <div className="lp-kicker">· FEATURES</div>
        <h2 className="lp-h2">Every millisecond, accounted for.</h2>
        <div className="lp-feat-grid">
          {[
            ["LIVE PING","Real-time ms display, colour-coded green / amber / red against your own thresholds."],
            ["PING & JITTER GRAPH","Last 50 pings visualized with spike markers. Jitter tracked beneath."],
            ["PACKET LOSS","Sent / received / lost / loss % counters with live update."],
            ["ROUTER & DNS","Side-by-side ICMP latency for quick local diagnostics."],
            ["SERVER MAP","Interactive world map showing your current game server location."],
            ["SPIKE ALERTS","Desktop notifications when ping crosses your threshold."],
            ["QUALITY GRADE","A–F score derived from ping, jitter and loss."],
            ["SESSION HISTORY","Every past session with avg/min/max, loss, spikes and duration."],
            ["SERVER SWITCH LOG","Every hop logged with from/to and timestamp."],
            ["CSV EXPORT","Download your full ping history as a spreadsheet."],
            ["OVERLAY HOTKEY","Configurable global shortcut to toggle the overlay."],
            ["CUSTOM COLUMNS","Pick what the overlay shows: ping, jitter, loss, sparkline."],
          ].map(([k,d])=>(
            <div key={k} className="lp-feat">
              <div className="lp-feat-k">{k}</div>
              <div className="lp-feat-d">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-how" id="how">
        <div className="lp-kicker">· HOW IT WORKS</div>
        <h2 className="lp-h2">Install. Launch. Play.</h2>
        <div className="lp-steps">
          <div className="lp-step"><div className="lp-step-n">01</div><h3>Install</h3><p>Download the installer from GitHub Releases. No Python or Node.js required - everything is bundled.</p></div>
          <div className="lp-step"><div className="lp-step-n">02</div><h3>Launch</h3><p>Start your game. The monitor auto-detects the process and reads the live server IP from your TCP connections.</p></div>
          <div className="lp-step"><div className="lp-step-n">03</div><h3>Watch</h3><p>ICMP ping every 2 seconds - identical to Windows <code>ping</code>. What you see is what the game feels.</p></div>
        </div>
        <div className="lp-how-note">Sits in your system tray and keeps running in the background. Reconnects automatically on new sessions or server switches.</div>
      </section>

      <section className="lp-cta-strip">
        <div>
          <div className="lp-kicker">· FREE · MIT · WINDOWS 10 / 11</div>
          <h2 className="lp-h2">Ready when you are.</h2>
        </div>
        <a className="lp-btn lp-btn-primary lp-btn-lg" href="https://github.com/onyxdigital-dev/WWM-Monitor/releases/latest" target="_blank" rel="noreferrer">⬇ GET THE LATEST RELEASE</a>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-col">
          <div className="lp-brand">
            <img src="assets/logo.png" alt="WWM" style={{width:26,height:26,borderRadius:6,objectFit:"cover"}}/>
            <span>WWM Monitor</span>
          </div>
          <p>Real-time network monitor for Where Winds Meet.</p>
        </div>
        <div className="lp-footer-col">
          <div className="lp-footer-hd">Project</div>
          <a href="https://github.com/onyxdigital-dev/WWM-Monitor" target="_blank" rel="noreferrer">GitHub repo</a>
          <a href="https://github.com/onyxdigital-dev/WWM-Monitor/releases" target="_blank" rel="noreferrer">Releases</a>
        </div>
        <div className="lp-footer-col">
          <div className="lp-footer-hd">Built by</div>
          <p>Onyx Digital. Not affiliated with or endorsed by the publishers of Where Winds Meet.</p>
        </div>
      </footer>
    </div>
  );
};
window.Site = Site;
