import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function VideoDetection() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // 🔹 Progress states
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("idle"); // idle | upload | processing

  // =========================
  // HANDLE FILE
  // =========================
  const handleFile = (selected) => {
    if (!selected) return;

    if (!selected.type.startsWith("video/")) {
      setError("Please upload a valid video file.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
  };

  // =========================
  // INPUT CHANGE
  // =========================
  const handleFileChange = (e) => {
    handleFile(e.target.files[0]);
  };

  // =========================
  // DRAG & DROP
  // =========================
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // =========================
  // SEND TO BACKEND
  // =========================
  const handleDetect = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setProgress(0);
    setStage("upload");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/detect/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },

        // ✅ REAL upload progress
        onUploadProgress: (e) => {
          if (e.total) {
            const percent = Math.round((e.loaded * 100) / e.total);
            setProgress(percent);
          }
        },
      });

      // upload finished → backend processing
      setStage("processing");

      if (res.data?.error) {
        setError(res.data.error);
        return;
      }

      navigate("/result/video", {
        state: {
          video: res.data.video,
          severity: res.data.severity,
          infected_leaf_percent: res.data.infected_leaf_percent,
          primary_disease: res.data.primary_disease,
          recommendation: res.data.recommendation,
        },
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "Video detection failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold text-center">
        Plant Leaf Disease Video Detection
      </h2>

      {/* DRAG & DROP ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
          ${
            dragActive
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 hover:border-blue-500"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <p className="text-gray-600">
          <span className="font-semibold text-blue-600">Click to upload</span>{" "}
          or drag & drop
        </p>
        <p className="text-xs text-gray-400 mt-1">
          MP4, MOV, WEBM supported
        </p>
      </div>

      {/* PREVIEW */}
      {preview && (
        <video
          src={preview}
          controls
          className="max-h-64 w-full mx-auto border rounded"
        />
      )}

      {/* PROGRESS BAR */}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {stage === "upload"
                ? "Uploading video…"
                : "Analyzing video…"}
            </span>
            <span>
              {stage === "upload" ? `${progress}%` : "Processing"}
            </span>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                stage === "upload"
                  ? "bg-blue-600"
                  : "bg-green-600 animate-pulse"
              }`}
              style={{
                width:
                  stage === "upload"
                    ? `${progress}%`
                    : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <p className="text-red-600 text-sm text-center">{error}</p>
      )}

      {/* BUTTON (UNCHANGED STRUCTURE) */}
      <button
        onClick={handleDetect}
        disabled={!file || loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded
                   disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading && (
          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
        )}
        {loading ? "Analyzing Video..." : "Detect Disease"}
      </button>
    </div>
  );
}
