import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ImageDetection() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // =========================
  // HANDLE FILE (COMMON)
  // =========================
  const handleFile = (selected) => {
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
  };

  // =========================
  // FILE INPUT CHANGE
  // =========================
  const handleFileChange = (e) => {
    handleFile(e.target.files[0]);
  };

  // =========================
  // DRAG EVENTS
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

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/detect/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/result/image", {
        state: {
          image: preview,
          overlay_image: res.data.overlay_image
            ? `http://localhost:8000/${res.data.overlay_image}`
            : null,
          detections: res.data.detections,
          severity: res.data.severity,
          severity_reason: res.data.severity_reason,
          infected_leaf_percent: res.data.infected_leaf_percent,
          infected_regions: res.data.infected_regions,
          primary_disease: res.data.primary_disease,
          all_diseases: res.data.all_diseases,
          recommendation: res.data.recommendation,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Detection failed. Please try again.");
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
        Plant Leaf Disease Image Detection
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
              ? "border-green-600 bg-green-50"
              : "border-gray-300 hover:border-green-500"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <p className="text-gray-600">
          <span className="font-semibold text-green-600">Click to upload</span>{" "}
          or drag & drop
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, JPEG supported</p>
      </div>

      {/* PREVIEW */}
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="max-h-64 w-auto mx-auto border rounded"
        />
      )}

      {/* ERROR */}
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {/* BUTTON */}
      <button
        onClick={handleDetect}
        disabled={!file || loading}
        className="w-full bg-green-600 text-white px-4 py-2 rounded
                   disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading && (
          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
        )}
        {loading ? "Detecting..." : "Detect Disease"}
      </button>
    </div>
  );
}
