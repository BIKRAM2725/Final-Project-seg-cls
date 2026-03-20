import { useState, useEffect } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const API = "http://localhost:8000";

export default function DroneDetection() {
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [disease, setDisease] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [gps, setGps] = useState(null);
  const [running, setRunning] = useState(false);

  const createQR = async () => {
    const res = await axios.post(`${API}/drone/pair/create`);
    setToken(res.data.pair_token);
    setSessionId(res.data.session_id);
  };

  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`ws://localhost:8000/drone/ws/${sessionId}`);

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);

      if (d.status) {
        setStatus(d.status);
        if (d.status === "streaming") setRunning(true);
      }

      if (d.detections?.length) {
        const diseaseObj = d.detections.find((x) => x.class !== "leaf");

        if (diseaseObj) {
          setDisease(diseaseObj.class);
          setConfidence(Math.round(diseaseObj.conf * 100));
        }
      }

      if (d.gps) setGps(d.gps);
    };

    return () => ws.close();
  }, [sessionId]);

  const stopStreaming = async () => {
    const res = await axios.post(`${API}/drone/stop-analysis/${sessionId}`);
    setRunning(false);
    navigate("/result/live", { state: res.data });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1500px] mx-auto px-6 py-6">
        {/* HEADER */}
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">
            Drone Monitoring Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Live AI Detection • Drone Feed • GPS Tracking
          </p>
        </header>

        {!token && (
          <div className="flex justify-center py-32">
            <button
              onClick={createQR}
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-xl shadow-lg text-lg"
            >
              Start Drone Session
            </button>
          </div>
        )}

        {token && (
          <div className="grid grid-cols-12 gap-6">
            {/* ================= LEFT PANEL ================= */}
            <aside className="col-span-12 lg:col-span-3 space-y-6">
              {/* SCANNER */}
              <div className="bg-white rounded-xl border shadow-sm p-5 text-center">
                <p className="text-xs uppercase text-gray-400 mb-3">
                  Drone Scanner
                </p>
                <div className="flex justify-center">
                  <QRCode value={token} size={150} />
                </div>
              </div>

              {/* DISEASE SECTION */}
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <p className="text-xs uppercase text-gray-400 mb-2">
                  Disease Detection
                </p>

                {disease ? (
                  <>
                    <h2 className="text-xl font-semibold text-red-600">
                      {disease}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Confidence: {confidence}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    Waiting for detection...
                  </p>
                )}
              </div>
            </aside>

            {/* ================= CENTER LIVE SCREEN ================= */}
            <main className="col-span-12 lg:col-span-6 flex flex-col">
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b text-sm font-semibold text-gray-700">
                  LIVE DRONE FEED
                </div>

                <div className="relative w-full aspect-video bg-black">
                  <img
                    src={`${API}/drone/mjpeg/${sessionId}`}
                    className="absolute inset-0 w-full h-full object-contain"
                    alt="Drone Feed"
                  />
                </div>
              </div>

              {/* CENTER STOP BUTTON */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={stopStreaming}
                  disabled={!running}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-10 py-3 rounded-xl shadow-md text-base"
                >
                  Stop & Generate Report
                </button>
              </div>
            </main>

            {/* ================= RIGHT MAP ================= */}
            <aside className="col-span-12 lg:col-span-3">
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b text-xs uppercase text-gray-400">
                  Drone Location
                </div>

                {gps ? (
                  <MapContainer
                    center={[gps.lat, gps.lng]}
                    zoom={16}
                    style={{ height: 310 }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[gps.lat, gps.lng]} />
                  </MapContainer>
                ) : (
                  <div className="p-5 text-sm text-gray-400">
                    Waiting for GPS…
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
