import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Upload, AlertCircle, X, Play } from "lucide-react";
import api from "../../services/api";

// Human-readable file size
function fmtSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Human-readable duration
function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function VideoDetection() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);
  const videoRef     = useRef(null);

  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [duration, setDuration]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Progress
  const [uploadPct, setUploadPct] = useState(0);
  const [stage, setStage]         = useState("idle"); // idle | upload | processing

  // ─────────────────────────────────────────
  // FILE HANDLING
  // ─────────────────────────────────────────
  const handleFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("video/")) {
      setError("Please upload a valid video file (MP4, MOV, AVI, WEBM).");
      return;
    }
    if (selected.size > 200 * 1024 * 1024) {
      setError("File too large. Maximum size is 200 MB.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setDuration(null);
    setError("");
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);

  const handleDragOver  = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setDuration(null);
    setError("");
    setStage("idle");
    setUploadPct(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─────────────────────────────────────────
  // DETECT
  // ─────────────────────────────────────────
  const handleDetect = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setUploadPct(0);
    setStage("upload");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/detect/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total);
            setUploadPct(pct);
            if (pct === 100) setStage("processing");
          }
        },
      });

      navigate("/result/video", {
        state: {
          detections:            res.data.detections            ?? [],
          primary_disease:       res.data.primary_disease       ?? null,
          all_diseases:          res.data.all_diseases          ?? [],
          severity:              res.data.severity              ?? "NONE",
          severity_reason:       res.data.severity_reason       ?? "",
          infected_leaf_percent: res.data.infected_leaf_percent ?? 0,
          infected_regions:      res.data.infected_regions      ?? 0,
          frames_analyzed:       res.data.frames_analyzed       ?? 0,
          total_frames:          res.data.total_frames          ?? 0,
          recommendation:        res.data.recommendation        ?? {},
        },
      });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
        "Video analysis failed. Please try again with a clear crop video."
      );
    } finally {
      setLoading(false);
      setStage("idle");
    }
  };

  // Stage label
  const stageLabel = {
    idle:       "",
    upload:     `Uploading… ${uploadPct}%`,
    processing: "Analyzing frames…",
  }[stage];

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────
  return (
    <div className="min-h-[60vh] bg-gradient-to-br from-blue-50 via-white to-sky-50
                    flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14
                          bg-blue-100 rounded-2xl mb-4">
            <Video size={26} className="text-blue-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Video Disease Detection
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
            Upload a crop video — AI samples frames to identify and aggregate disease
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !preview && fileInputRef.current.click()}
            className={`
              relative rounded-xl border-2 border-dashed transition-all duration-200
              ${preview
                ? "cursor-default border-blue-300 bg-blue-50/30"
                : "cursor-pointer hover:border-blue-400 hover:bg-blue-50/40"}
              ${dragActive ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-gray-200"}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {preview ? (
              /* ── Video Preview ── */
              <div className="p-3 space-y-2">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    src={preview}
                    className="w-full max-h-52 object-contain"
                    onLoadedMetadata={(e) => setDuration(e.target.duration)}
                    controls={false}
                    muted
                  />
                  {/* Play overlay hint */}
                  <div className="absolute inset-0 flex items-center justify-center
                                   pointer-events-none">
                    <div className="w-10 h-10 bg-white/20 rounded-full
                                    flex items-center justify-center backdrop-blur-sm">
                      <Play size={16} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  {/* Remove button */}
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70
                               rounded-full p-1.5 transition-all hover:scale-110"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>

                {/* File meta */}
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-gray-500 truncate max-w-[70%]">
                    {file?.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                    {duration !== null && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        {fmtDuration(duration)}
                      </span>
                    )}
                    <span>{file ? fmtSize(file.size) : ""}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Empty State ── */
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl
                                flex items-center justify-center mb-3">
                  <Upload size={22} className="text-blue-600" />
                </div>
                <p className="font-medium text-gray-700 text-sm">
                  <span className="text-blue-600">Click to upload</span>
                  {" "}or drag & drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  MP4, MOV, AVI, WEBM · Max 200 MB
                </p>
              </div>
            )}
          </div>

          {/* Change video */}
          {preview && (
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full text-sm text-blue-700 hover:text-blue-800
                         border border-blue-200 hover:border-blue-400
                         rounded-lg py-2 transition-colors bg-blue-50 hover:bg-blue-100"
            >
              Choose a Different Video
            </button>
          )}

          {/* Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{stageLabel}</span>
                {stage === "upload" && (
                  <span className="font-medium text-blue-600">{uploadPct}%</span>
                )}
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300
                    ${stage === "upload"
                      ? "bg-blue-500"
                      : "bg-green-500 animate-pulse w-full"}`}
                  style={{ width: stage === "upload" ? `${uploadPct}%` : "100%" }}
                />
              </div>
              {stage === "processing" && (
                <p className="text-xs text-gray-400 text-center">
                  Sampling frames and running disease classification…
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200
                            rounded-lg px-4 py-3">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Detect Button */}
          <button
            onClick={handleDetect}
            disabled={!file || loading}
            className="
              w-full py-3 px-6 rounded-xl font-semibold text-white text-sm
              bg-blue-600 hover:bg-blue-700 active:bg-blue-800
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white
                                 rounded-full animate-spin" />
                {stage === "upload" ? "Uploading…" : "Analyzing…"}
              </>
            ) : (
              <>
                <Video size={16} />
                Analyze Video
              </>
            )}
          </button>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              🎥 Tips for best results
            </p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
              <li>Film leaves slowly and steadily in good light</li>
              <li>Keep leaves in frame — avoid rapid panning</li>
              <li>Shorter videos (15–60s) process faster</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}