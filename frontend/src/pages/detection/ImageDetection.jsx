import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Leaf, AlertCircle, X } from "lucide-react";
import api from "../../services/api";

export default function ImageDetection() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // ─────────────────────────────────────────
  // FILE HANDLING
  // ─────────────────────────────────────────
  const handleFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);

  const handleDragOver  = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = ()  => setDragActive(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─────────────────────────────────────────
  // DETECT
  // ─────────────────────────────────────────
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
          image:                preview,
          overlay_image:        res.data.overlay_image
                                  ? `data:image/jpeg;base64,${res.data.overlay_image}`
                                  : null,
          leaf_clean_image:     res.data.leaf_clean_image
                                  ? `data:image/jpeg;base64,${res.data.leaf_clean_image}`
                                  : null,
          detections:           res.data.detections           ?? [],
          severity:             res.data.severity             ?? "NONE",
          severity_reason:      res.data.severity_reason      ?? "",
          infected_leaf_percent:res.data.infected_leaf_percent ?? 0,
          infected_regions:     res.data.infected_regions     ?? 0,
          primary_disease:      res.data.primary_disease      ?? null,
          all_diseases:         res.data.all_diseases         ?? [],
          recommendation:       res.data.recommendation       ?? {},
        },
      });
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        "Detection failed. Please try again with a clear leaf image.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50
                    flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-lg">

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14
                          bg-green-100 rounded-2xl mb-4">
            <Leaf size={28} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Leaf Disease Detection
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload a plant leaf image for instant AI-powered disease analysis
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
              ${preview ? "cursor-default border-green-300 bg-green-50/40"
                        : "cursor-pointer hover:border-green-400 hover:bg-green-50/50"}
              ${dragActive ? "border-green-500 bg-green-50 scale-[1.01]"
                           : "border-gray-200"}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {preview ? (
              /* ─── Preview Image ─── */
              <div className="relative p-3">
                <img
                  src={preview}
                  alt="Selected leaf"
                  className="w-full max-h-72 object-contain rounded-lg"
                />

                {/* Remove button */}
                <button
                  onClick={clearFile}
                  className="absolute top-5 right-5 bg-white/90 hover:bg-white
                             border border-gray-200 rounded-full p-1.5 shadow-sm
                             transition-all hover:scale-110"
                  title="Remove image"
                >
                  <X size={14} className="text-gray-600" />
                </button>

                {/* File info */}
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500 truncate px-4">
                    {file?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                  </p>
                </div>
              </div>
            ) : (
              /* ─── Empty State ─── */
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl
                                flex items-center justify-center mb-3">
                  <Upload size={22} className="text-green-600" />
                </div>
                <p className="font-medium text-gray-700 text-sm">
                  <span className="text-green-600">Click to upload</span>
                  {" "}or drag & drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, WEBP · Max 10 MB
                </p>
              </div>
            )}
          </div>

          {/* Change image button (when preview shown) */}
          {preview && (
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full text-sm text-green-700 hover:text-green-800
                         border border-green-200 hover:border-green-400
                         rounded-lg py-2 transition-colors bg-green-50 hover:bg-green-100"
            >
              Choose a Different Image
            </button>
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
              bg-green-600 hover:bg-green-700 active:bg-green-800
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white
                                 rounded-full animate-spin" />
                Analyzing Leaf…
              </>
            ) : (
              <>
                <Leaf size={16} />
                Detect Disease
              </>
            )}
          </button>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">📸 Tips for best results</p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
              <li>Use a clear, well-lit photo of a single leaf</li>
              <li>Ensure the leaf fills most of the frame</li>
              <li>Avoid blur, shadows, or extreme reflections</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}