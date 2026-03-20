import { useRef, useState, useEffect } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function LiveDetection() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const intervalRef = useRef(null);

  const navigate = useNavigate();

  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [fps, setFps] = useState(1);
  const [currentDetected, setCurrentDetected] = useState(null);

  /* ================= START CAMERA ================= */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      const res = await api.post("/live/start");
      const sid = res.data.session_id;

      setSessionId(sid);
      setRunning(true);
      startInterval(sid, fps);
    } catch (err) {
      console.error("startCamera failed", err);
      alert("Camera start failed.");
    }
  };

  const startInterval = (sid, fpsValue) => {
    stopInterval();
    const ms = Math.max(200, Math.round(1000 / Math.max(0.2, fpsValue)));
    intervalRef.current = setInterval(() => {
      captureAndSendFrame(sid);
    }, ms);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (running && sessionId) startInterval(sessionId, fps);
    return () => stopInterval();
    // eslint-disable-next-line
  }, [fps]);

  /* ================= STOP CAMERA ================= */
  const stopCameraAndSession = async () => {
    try {
      stopInterval();

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }

      if (sessionId) {
        const res = await api.post(`/live/stop/${sessionId}`);
        setRunning(false);
        setSessionId(null);
        navigate("/result/live", { state: res.data });
      } else {
        setRunning(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to stop session.");
    }
  };

  /* ================= CAPTURE FRAME ================= */
  const captureAndSendFrame = async (sid) => {
    try {
      const video = videoRef.current;
      const canvas = hiddenCanvasRef.current;
      if (!video || video.readyState < 2) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, vw, vh);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8)
      );

      const fd = new FormData();
      fd.append("frame", blob, "frame.jpg");
      fd.append("session_id", sid);

      const res = await api.post("/live/frame", fd);
      const { boxes } = res.data || { boxes: [] };

      drawBoxes(boxes, vw, vh);
      setCurrentDetected(boxes.length ? boxes[0].class : null);
    } catch {}
  };

  /* ================= DRAW BOXES ================= */
  const drawBoxes = (boxes = [], frameWidth = 640, frameHeight = 480) => {
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!overlay || !video) return;

    overlay.width = frameWidth;
    overlay.height = frameHeight;

    overlay.style.width = `${video.clientWidth}px`;
    overlay.style.height = `${video.clientHeight}px`;

    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    ctx.lineWidth = 2;
    ctx.font = "14px Arial";

    boxes.forEach((b) => {
      ctx.strokeStyle = "red";
      ctx.fillStyle = "red";
      ctx.strokeRect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1);

      const label = `${b.class} ${(b.conf * 100).toFixed(0)}%`;
      ctx.fillRect(b.x1, b.y1 - 18, ctx.measureText(label).width + 8, 18);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, b.x1 + 4, b.y1 - 4);
      ctx.fillStyle = "red";
    });
  };

  useEffect(() => {
    return () => {
      stopInterval();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">
              Live Detection Dashboard
            </h2>
            <p className="text-sm text-gray-500">
              Real-time AI Crop Monitoring
            </p>
          </div>

          <span
            className={`px-4 py-1 rounded-full text-xs font-medium ${
              running
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {running ? "LIVE STREAMING" : "IDLE"}
          </span>
        </div>

        {/* VIDEO CARD */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="relative bg-black">
            <video ref={videoRef} className="w-full" muted playsInline />
            <canvas
              ref={overlayRef}
              style={{ position: "absolute", left: 0, top: 0 }}
            />
          </div>
        </div>

        <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />

        {/* CONTROL PANEL */}
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">

          <button
            onClick={startCamera}
            disabled={running}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-40"
          >
            Start
          </button>

          <button
            onClick={stopCameraAndSession}
            disabled={!running}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-40"
          >
            Stop
          </button>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-600">FPS</label>
            <input
              type="number"
              min="0.2"
              step="0.2"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value) || 1)}
              className="border rounded-md px-2 py-1 w-20"
            />
          </div>
        </div>

        {/* DETECTION STATUS */}
        <div className="bg-white rounded-xl border shadow-sm p-4 text-sm">
          Live Detected:{" "}
          <span className="font-semibold text-green-700">
            {currentDetected || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
