import { useState, useEffect } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const API = "http://localhost:8000";

// Pulse ring animation injected once
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@300;400;600;700&display=swap');

  :root {
    --bg: #0a0c0f;
    --surface: #10141a;
    --surface2: #161c24;
    --border: #1e2832;
    --accent: #00e5a0;
    --accent-dim: rgba(0,229,160,0.12);
    --danger: #ff3d5a;
    --danger-dim: rgba(255,61,90,0.12);
    --warn: #ffb020;
    --text: #c8d6e5;
    --text-muted: #4a5a6a;
    --mono: 'Share Tech Mono', monospace;
    --sans: 'Barlow', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); }

  .drone-root {
    min-height: 100vh;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,229,160,0.05) 0%, transparent 70%);
    padding: 24px;
    font-family: var(--sans);
  }

  /* ── HEADER ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .header-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-icon {
    width: 36px; height: 36px;
    background: var(--accent-dim);
    border: 1px solid var(--accent);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .header-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text);
  }
  .header-sub {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--mono);
    letter-spacing: 0.05em;
  }
  .status-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 11px;
    font-family: var(--mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .status-pill.live {
    border-color: var(--accent);
    background: var(--accent-dim);
    color: var(--accent);
  }
  .status-pill.idle {
    color: var(--text-muted);
  }
  .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
  .dot.pulse {
    animation: dotpulse 1.2s ease-in-out infinite;
  }
  @keyframes dotpulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  /* ── LAUNCH SCREEN ── */
  .launch {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 120px);
    gap: 20px;
    text-align: center;
  }
  .launch-icon {
    font-size: 48px;
    opacity: 0.6;
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .launch h2 {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
  }
  .launch p {
    font-size: 13px;
    color: var(--text-muted);
    max-width: 300px;
    line-height: 1.6;
  }
  .btn-primary {
    margin-top: 8px;
    padding: 14px 36px;
    background: var(--accent);
    color: #000;
    font-family: var(--sans);
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
    box-shadow: 0 0 28px rgba(0,229,160,0.3);
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 40px rgba(0,229,160,0.45);
  }
  .btn-primary:active { transform: translateY(0); }

  /* ── GRID ── */
  .grid {
    display: grid;
    grid-template-columns: 260px 1fr 280px;
    gap: 16px;
    align-items: start;
  }

  /* ── PANEL ── */
  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }
  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .panel-label {
    font-size: 10px;
    font-family: var(--mono);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .panel-body { padding: 16px; }

  /* ── QR ── */
  .qr-wrap {
    background: #fff;
    border-radius: 10px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .scan-hint {
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
    font-family: var(--mono);
    margin-top: 10px;
  }

  /* ── DETECTION RESULT ── */
  .detect-idle {
    text-align: center;
    padding: 16px 0;
  }
  .detect-idle-icon { font-size: 28px; opacity: 0.3; }
  .detect-idle-text {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--mono);
    margin-top: 6px;
  }
  .detect-result {
    border-radius: 10px;
    background: var(--danger-dim);
    border: 1px solid rgba(255,61,90,0.25);
    padding: 14px;
    margin-top: 12px;
  }
  .detect-label {
    font-size: 10px;
    font-family: var(--mono);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .detect-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--danger);
    line-height: 1.2;
    margin-bottom: 12px;
  }
  .confidence-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .confidence-label { font-size: 10px; color: var(--text-muted); font-family: var(--mono); }
  .confidence-val { font-size: 12px; font-family: var(--mono); color: var(--warn); }
  .conf-bar-bg {
    height: 4px;
    background: var(--border);
    border-radius: 4px;
    overflow: hidden;
  }
  .conf-bar-fill {
    height: 100%;
    background: var(--warn);
    border-radius: 4px;
    transition: width 0.6s ease;
    box-shadow: 0 0 8px rgba(255,176,32,0.5);
  }

  /* ── VIDEO FEED ── */
  .feed-container {
    position: relative;
    background: #000;
    aspect-ratio: 16/9;
    overflow: hidden;
  }
  .feed-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .feed-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .corner {
    position: absolute;
    width: 20px; height: 20px;
    border-color: var(--accent);
    border-style: solid;
    opacity: 0.7;
  }
  .corner.tl { top: 12px; left: 12px; border-width: 2px 0 0 2px; border-radius: 2px 0 0 0; }
  .corner.tr { top: 12px; right: 12px; border-width: 2px 2px 0 0; border-radius: 0 2px 0 0; }
  .corner.bl { bottom: 12px; left: 12px; border-width: 0 0 2px 2px; border-radius: 0 0 0 2px; }
  .corner.br { bottom: 12px; right: 12px; border-width: 0 2px 2px 0; border-radius: 0 0 2px 0; }

  .feed-badge {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    border: 1px solid var(--accent);
    color: var(--accent);
    font-size: 9px;
    font-family: var(--mono);
    letter-spacing: 0.2em;
    padding: 3px 10px;
    border-radius: 4px;
    backdrop-filter: blur(4px);
  }

  .feed-footer {
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .feed-stats {
    display: flex;
    gap: 20px;
  }
  .stat-item { text-align: left; }
  .stat-label { font-size: 9px; font-family: var(--mono); color: var(--text-muted); letter-spacing: 0.1em; text-transform: uppercase; }
  .stat-val { font-size: 13px; font-family: var(--mono); color: var(--text); margin-top: 1px; }
  .stat-val.accent { color: var(--accent); }
  .stat-val.danger { color: var(--danger); }

  .btn-stop {
    padding: 10px 24px;
    background: var(--danger);
    color: #fff;
    font-family: var(--sans);
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
    box-shadow: 0 0 20px rgba(255,61,90,0.3);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn-stop:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 0 30px rgba(255,61,90,0.5);
  }
  .btn-stop:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  /* ── MAP PANEL ── */
  .map-idle {
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--text-muted);
    font-size: 11px;
    font-family: var(--mono);
  }
  .map-idle-icon { font-size: 32px; opacity: 0.2; }
  .map-wrap {
    border-radius: 0 0 14px 14px;
    overflow: hidden;
  }
  .map-wrap .leaflet-container {
    height: 260px !important;
  }

  .coord-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    border-top: 1px solid var(--border);
    font-size: 10px;
    font-family: var(--mono);
    color: var(--text-muted);
    gap: 8px;
  }
  .coord-row span { color: var(--accent); }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
`;

export default function DroneDetection() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [disease, setDisease] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [gps, setGps] = useState(null);
  const [running, setRunning] = useState(false);

  const createQR = async () => {
    const res = await axios.post(`${API}/drone/pair/create`);
    setToken(res.data.pair_token);
    setSessionId(res.data.session_id);
    setRunning(true);
  };

  useEffect(() => {
    if (!sessionId) return;
    let ws = new WebSocket(`ws://localhost:8000/drone/ws/${sessionId}`);
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.status === "streaming") {
        setRunning(true);
        if (d.result?.primary_disease) setDisease(d.result.primary_disease);
        if (d.result?.detections?.length) setConfidence(d.result.detections[0].avg_confidence || 0);
      }
      if (d.gps) setGps(d.gps);
    };
    return () => ws.close();
  }, [sessionId]);

  const stopStreaming = async () => {
    const res = await axios.post(`${API}/drone/stop/${sessionId}`);
    setRunning(false);
    navigate("/result/live", { state: res.data });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="drone-root">

        {/* HEADER */}
        <header className="header">
          <div className="header-brand">
            <div className="header-icon">🛸</div>
            <div>
              <div className="header-title">AgroScan Drone</div>
              <div className="header-sub">Disease Detection System</div>
            </div>
          </div>
          <div className={`status-pill ${running ? "live" : "idle"}`}>
            <div className={`dot ${running ? "pulse" : ""}`} />
            {running ? "Live Feed" : "Standby"}
          </div>
        </header>

        {/* LAUNCH SCREEN */}
        {!token && (
          <div className="launch">
            <div className="launch-icon">🛸</div>
            <h2>Ready to Deploy</h2>
            <p>Launch a new drone session and scan the QR code to begin aerial crop surveillance.</p>
            <button className="btn-primary" onClick={createQR}>
              Initialize Session
            </button>
          </div>
        )}

        {/* MAIN GRID */}
        {token && (
          <div className="grid">

            {/* ── LEFT: QR + Detection ── */}
            <div>
              <div className="panel" style={{ marginBottom: 12 }}>
                <div className="panel-header">
                  <span className="panel-label">Pair Device</span>
                  <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-muted)" }}>
                    {sessionId?.slice(0, 8)}…
                  </span>
                </div>
                <div className="panel-body">
                  <div className="qr-wrap">
                    <QRCode value={token} size={180} />
                  </div>
                  <p className="scan-hint">↑ SCAN TO CONNECT DRONE</p>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <span className="panel-label">Detection</span>
                  {disease && (
                    <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--danger)", letterSpacing: "0.1em" }}>
                      ⚠ ALERT
                    </span>
                  )}
                </div>
                <div className="panel-body">
                  {!disease ? (
                    <div className="detect-idle">
                      <div className="detect-idle-icon">🔍</div>
                      <div className="detect-idle-text">Scanning…</div>
                    </div>
                  ) : (
                    <div className="detect-result">
                      <div className="detect-label">Identified Disease</div>
                      <div className="detect-name">{disease}</div>
                      <div className="confidence-row">
                        <span className="confidence-label">Confidence</span>
                        <span className="confidence-val">{confidence.toFixed(1)}%</span>
                      </div>
                      <div className="conf-bar-bg">
                        <div className="conf-bar-fill" style={{ width: `${confidence}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── CENTER: Video Feed ── */}
            <div className="panel">
              <div className="feed-container">
                <img
                  src={`${API}/drone/mjpeg/${sessionId}`}
                  className="feed-img"
                  alt="Live drone feed"
                />
                <div className="feed-overlay">
                  <div className="corner tl" />
                  <div className="corner tr" />
                  <div className="corner bl" />
                  <div className="corner br" />
                  <div className="feed-badge">● REC</div>
                </div>
              </div>
              <div className="feed-footer">
                <div className="feed-stats">
                  <div className="stat-item">
                    <div className="stat-label">Status</div>
                    <div className={`stat-val ${running ? "accent" : ""}`}>
                      {running ? "STREAMING" : "IDLE"}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Detections</div>
                    <div className={`stat-val ${disease ? "danger" : ""}`}>
                      {disease ? "1 FOUND" : "—"}
                    </div>
                  </div>
                  {gps && (
                    <div className="stat-item">
                      <div className="stat-label">GPS</div>
                      <div className="stat-val accent">LOCKED</div>
                    </div>
                  )}
                </div>
                <button className="btn-stop" onClick={stopStreaming} disabled={!running}>
                  ⏹ Stop & Report
                </button>
              </div>
            </div>

            {/* ── RIGHT: Map ── */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-label">GPS Location</span>
                {gps && <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--accent)" }}>LOCKED</span>}
              </div>
              {!gps ? (
                <div className="map-idle">
                  <div className="map-idle-icon">📡</div>
                  <div>Awaiting GPS signal…</div>
                </div>
              ) : (
                <>
                  <div className="map-wrap">
                    <MapContainer center={[gps.lat, gps.lng]} zoom={16} style={{ height: 260 }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[gps.lat, gps.lng]} />
                    </MapContainer>
                  </div>
                  <div className="coord-row">
                    <span>LAT <span>{gps.lat.toFixed(5)}</span></span>
                    <span>LNG <span>{gps.lng.toFixed(5)}</span></span>
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}