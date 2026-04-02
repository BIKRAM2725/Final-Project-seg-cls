import { useRef, useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Play, Square, Camera, AlertCircle, Wifi, WifiOff } from "lucide-react";

// ── Minimum frames before showing a disease label ──
// Prevents single-frame false positives from showing on screen
const MIN_DISPLAY_VOTES = 3;

function formatDiseaseName(name = "") {
  return name
    .replace(/_{2,}/g, "_")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function LiveDetection() {
  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);
  const intervalRef    = useRef(null);
  const sessionIdRef   = useRef(null);
  const voteCounterRef = useRef({});   // local vote count for display debounce
  const navigate       = useNavigate();

  const [running, setRunning]               = useState(false);
  const [cameraReady, setCameraReady]       = useState(false);
  const [displayLabel, setDisplayLabel]     = useState("Point at a leaf…");
  const [displaySeverity, setDisplaySeverity] = useState("NONE");
  const [frameQuality, setFrameQuality]     = useState("ok");   // "ok" | "low"
  const [fps, setFps]                       = useState(1);
  const [frameCount, setFrameCount]         = useState(0);
  const [error, setError]                   = useState("");
  const [stopping, setStopping]             = useState(false);

  // ── Severity → color map ──
  const SEV_COLOR = {
    HIGH:   "text-red-400",
    MEDIUM: "text-orange-400",
    LOW:    "text-yellow-400",
    NONE:   "text-green-400",
  };

  // ─────────────────────────────────────────
  // START CAMERA + SESSION
  // ─────────────────────────────────────────
  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
    } catch (err) {
      setError("Camera access denied or unavailable.");
      return;
    }

    // Start backend session
    try {
      const res = await api.post("/live/start");
      sessionIdRef.current   = res.data.session_id;
      voteCounterRef.current = {};
      setFrameCount(0);
      setRunning(true);
    } catch (err) {
      setError("Failed to start detection session.");
      stopStream();
    }
  };

  // ─────────────────────────────────────────
  // CAPTURE + SEND FRAME
  // ─────────────────────────────────────────
  const captureAndSend = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState < 2 || !sessionIdRef.current) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const blob = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", 0.8)
    );

    const fd = new FormData();
    fd.append("frame",      blob);
    fd.append("session_id", sessionIdRef.current);

    try {
      const res = await api.post("/live/frame", fd);
      const data = res.data;

      setFrameCount((n) => n + 1);

      // ── Low quality frame ──
      if (data.quality === "low") {
        setFrameQuality("low");
        return;
      }

      setFrameQuality("ok");

      // ── No disease this frame ──
      if (!data.primary_disease) {
        // Decay votes — gradually reduce if no disease seen
        const updated = { ...voteCounterRef.current };
        for (const k in updated) {
          updated[k] = Math.max(0, updated[k] - 1);
          if (updated[k] === 0) delete updated[k];
        }
        voteCounterRef.current = updated;

        // Only reset label if no disease has enough votes
        const hasStable = Object.values(updated).some((v) => v >= MIN_DISPLAY_VOTES);
        if (!hasStable) {
          setDisplayLabel("Scanning…");
          setDisplaySeverity("NONE");
        }
        return;
      }

      // ── Disease detected this frame ──
      const disease = data.primary_disease;
      voteCounterRef.current[disease] = (voteCounterRef.current[disease] || 0) + 1;

      // Only show label if it has crossed the vote threshold
      if (voteCounterRef.current[disease] >= MIN_DISPLAY_VOTES) {
        setDisplayLabel(formatDiseaseName(disease));
        setDisplaySeverity(data.severity || "LOW");
      } else {
        setDisplayLabel("Analyzing…");
        setDisplaySeverity("NONE");
      }

    } catch {
      // Silent — don't crash UI on single frame failure
    }
  }, []);

  // ─────────────────────────────────────────
  // INTERVAL MANAGEMENT
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    const ms = Math.max(400, 1000 / fps);
    intervalRef.current = setInterval(captureAndSend, ms);
    return () => clearInterval(intervalRef.current);
  }, [running, fps, captureAndSend]);

  // ─────────────────────────────────────────
  // STOP CAMERA
  // ─────────────────────────────────────────
  const stopStream = () => {
    clearInterval(intervalRef.current);
    videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    setRunning(false);
    setCameraReady(false);
  };

  const stopCamera = async () => {
    if (!sessionIdRef.current || stopping) return;
    setStopping(true);
    clearInterval(intervalRef.current);

    try {
      const res = await api.post(`/live/stop/${sessionIdRef.current}`);
      stopStream();
      navigate("/result/live", { state: res.data });
    } catch (err) {
      setError("Failed to get final result. Please try again.");
      stopStream();
    } finally {
      sessionIdRef.current = null;
      setStopping(false);
    }
  };

  // ─────────────────────────────────────────
  // CLEANUP ON UNMOUNT
  // ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
      // Best-effort session cleanup if user navigates away
      if (sessionIdRef.current) {
        api.post(`/live/stop/${sessionIdRef.current}`).catch(() => {});
      }
    };
  }, []);

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────
  const severityColor = SEV_COLOR[displaySeverity] || "text-green-400";

  return (
    <div className="relative w-full bg-black overflow-hidden rounded-2xl"
         style={{ aspectRatio: "16/9", minHeight: 280 }}>

      {/* ── VIDEO ── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center
                      justify-between px-4 py-3
                      bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <Camera size={15} className="text-white/70" />
          <span className="text-white text-sm font-semibold tracking-wide">
            AI Crop Scanner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Frame quality indicator */}
          {running && (
            frameQuality === "low"
              ? <span className="flex items-center gap-1 text-xs text-yellow-400">
                  <WifiOff size={12} /> Low Quality
                </span>
              : <span className="flex items-center gap-1 text-xs text-green-400">
                  <Wifi size={12} /> {frameCount} frames
                </span>
          )}

          {/* Live badge */}
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider
            ${running
              ? "bg-red-500 text-white animate-pulse"
              : "bg-white/20 text-white/60"}`}>
            {running ? "● LIVE" : "IDLE"}
          </span>
        </div>
      </div>

      {/* ── CENTER OVERLAY ── */}
      {running ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center
                        pointer-events-none">
          {/* Scan reticle */}
          <div className="relative w-48 h-48 mb-6">
            <div className="absolute inset-0 border-2 border-white/20 rounded-xl" />
            {/* Corner brackets */}
            {[
              "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
              "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
              "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
              "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
            ].map((cls, i) => (
              <div key={i}
                   className={`absolute w-5 h-5 border-white/80 ${cls}`} />
            ))}
            {/* Scan line */}
            <div className="absolute left-0 right-0 h-0.5 bg-green-400/60
                            top-1/2 animate-ping" />
          </div>

          {/* Disease label */}
          <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-2xl
                          text-center border border-white/10">
            <p className="text-white/50 text-xs mb-1 uppercase tracking-widest">
              {frameQuality === "low" ? "Adjusting…" : "Detected"}
            </p>
            <p className={`text-xl font-bold ${severityColor}`}>
              {displayLabel}
            </p>
            {displaySeverity !== "NONE" && (
              <p className={`text-xs mt-1 font-semibold ${severityColor}`}>
                {displaySeverity} severity
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ── Idle state ── */
        !cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center
                          justify-center text-white/50 space-y-3">
            <Camera size={40} strokeWidth={1} />
            <p className="text-sm">Press Start to begin scanning</p>
          </div>
        )
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="absolute bottom-20 left-4 right-4">
          <div className="flex items-center gap-2 bg-red-900/80 border border-red-500/40
                          rounded-xl px-4 py-2.5 text-sm text-red-200">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* ── FPS CONTROL ── */}
      {running && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm
                          rounded-full px-4 py-1.5 border border-white/10">
            <span className="text-white/50 text-xs">Speed</span>
            {[1, 2, 3].map((f) => (
              <button
                key={f}
                onClick={() => setFps(f)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition
                  ${fps === f
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"}`}
              >
                {f} fps
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTROLS ── */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 p-4
                      bg-gradient-to-t from-black/70 to-transparent">
        {!running ? (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400
                       active:bg-green-600 px-8 py-3 rounded-full text-white
                       font-semibold text-sm transition-all shadow-lg
                       shadow-green-500/30"
          >
            <Play size={16} fill="white" /> Start Scanning
          </button>
        ) : (
          <button
            onClick={stopCamera}
            disabled={stopping}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-400
                       active:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed
                       px-8 py-3 rounded-full text-white font-semibold text-sm
                       transition-all shadow-lg shadow-red-500/30"
          >
            {stopping ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white
                                 rounded-full animate-spin" />
                Finalizing…
              </>
            ) : (
              <>
                <Square size={16} fill="white" /> Stop & Get Result
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}