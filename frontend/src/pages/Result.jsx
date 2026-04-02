import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Leaf, AlertCircle, CheckCircle2, AlertTriangle,
  FlaskConical, Droplets, Map, FileDown, ChevronDown,
  ChevronUp, ArrowLeft, ShieldAlert,
} from "lucide-react";
import generateResultPDF from "./detection/ResultPDF";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatDiseaseName(name = "") {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function SeverityBadge({ severity }) {
  const cfg = {
    HIGH:   { bg: "bg-red-100",    text: "text-red-700",    icon: <AlertCircle size={14} />,  label: "HIGH" },
    MEDIUM: { bg: "bg-orange-100", text: "text-orange-700", icon: <AlertTriangle size={14} />,label: "MEDIUM" },
    LOW:    { bg: "bg-yellow-100", text: "text-yellow-700", icon: <AlertTriangle size={14} />,label: "LOW" },
    NONE:   { bg: "bg-green-100",  text: "text-green-700",  icon: <CheckCircle2 size={14} />, label: "HEALTHY" },
  };
  const c = cfg[severity] ?? cfg.NONE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                      text-sm font-semibold ${c.bg} ${c.text}`}>
      {c.icon}{c.label}
    </span>
  );
}

function StatCard({ label, value, sub, color = "green" }) {
  const colors = {
    green:  "from-green-50  to-green-100  border-green-200  text-green-800",
    red:    "from-red-50    to-red-100    border-red-200    text-red-800",
    orange: "from-orange-50 to-orange-100 border-orange-200 text-orange-800",
    blue:   "from-blue-50   to-blue-100   border-blue-200   text-blue-800",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ResultPage() {
  const { state } = useLocation();
  const [landArea, setLandArea]       = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [activeImage, setActiveImage] = useState("original"); // original | overlay | clean

  // ── NO DATA ──────────────────────────────────
  if (!state || !state.image) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4
                      bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-2xl shadow border border-gray-200
                        p-8 max-w-sm w-full text-center space-y-4">
          <AlertCircle size={40} className="mx-auto text-gray-400" />
          <h2 className="text-xl font-bold text-gray-800">No Result Found</h2>
          <p className="text-sm text-gray-500">
            No detection data available. Please run a new detection.
          </p>
          <Link
            to="/detect"
            className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl
                       bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
          >
            <ArrowLeft size={14} /> Start Detection
          </Link>
        </div>
      </div>
    );
  }

  const {
    image,
    overlay_image,
    leaf_clean_image,
    detections         = [],
    severity           = "NONE",
    severity_reason    = "",
    infected_leaf_percent = 0,
    infected_regions   = 0,
    primary_disease,
    all_diseases       = [],
    recommendation     = {},
  } = state;

  // ── QUANTITY CALCULATION ─────────────────────
  const calculateQuantity = () => {
    if (!recommendation?.dose_value || !landArea) return null;
    const area = parseFloat(landArea);
    if (isNaN(area) || area <= 0) return null;
    const WATER_PER_HA = 500;
    const totalWater    = area * WATER_PER_HA;
    const totalPesticide = totalWater * recommendation.dose_value;
    return { water: totalWater, pesticide: totalPesticide };
  };

  const quantity = calculateQuantity();

  // ── HEALTHY ────────────────────────────────
  const isHealthy = detections.length === 0 || severity === "NONE";

  // ── SEVERITY COLOR ──────────────────────────
  const sevColor = {
    HIGH:   "text-red-600",
    MEDIUM: "text-orange-600",
    LOW:    "text-yellow-600",
    NONE:   "text-green-600",
  }[severity] ?? "text-gray-600";

  const sevStatColor = {
    HIGH: "red", MEDIUM: "orange", LOW: "orange", NONE: "green",
  }[severity] ?? "green";

  // ── IMAGE TABS ──────────────────────────────
  const imageTabs = [
    { id: "original", label: "Original",   src: image },
    overlay_image    && { id: "overlay",   label: "Disease Map",    src: overlay_image },
    leaf_clean_image && { id: "clean",     label: "Leaf (No BG)",   src: leaf_clean_image },
  ].filter(Boolean);

  const activeImageSrc = imageTabs.find((t) => t.id === activeImage)?.src ?? image;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── BACK ── */}
        <Link
          to="/detect"
          className="inline-flex items-center gap-2 text-sm text-gray-500
                     hover:text-green-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Detection
        </Link>

        {/* ── HEADER BANNER ── */}
        <div className={`rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4
                         border ${isHealthy
                           ? "bg-green-50 border-green-200"
                           : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                            ${isHealthy ? "bg-green-100" : "bg-red-50"}`}>
              {isHealthy
                ? <Leaf size={24} className="text-green-600" />
                : <ShieldAlert size={24} className="text-red-500" />}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                {isHealthy ? "Detection Result" : "Disease Identified"}
              </p>
              <h1 className="text-xl font-bold text-gray-900">
                {isHealthy
                  ? "Crop Looks Healthy"
                  : formatDiseaseName(primary_disease)}
              </h1>
            </div>
          </div>
          <SeverityBadge severity={severity} />
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT — IMAGE PANEL */}
          <div className="lg:col-span-2 space-y-3">

            {/* Image Tabs */}
            {imageTabs.length > 1 && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {imageTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveImage(tab.id)}
                    className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all
                      ${activeImage === tab.id
                        ? "bg-white text-green-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Image */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden
                            border border-gray-200 aspect-square
                            flex items-center justify-center">
              <img
                src={activeImageSrc}
                alt="Leaf analysis"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Severity Breakdown */}
            {severity_reason && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-xs
                              text-gray-600 space-y-1 shadow-sm">
                <p className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                  <FlaskConical size={13} /> Pixel Analysis
                </p>
                <p className="leading-relaxed">{severity_reason}</p>
              </div>
            )}
          </div>

          {/* RIGHT — INFO PANEL */}
          <div className="lg:col-span-3 space-y-5">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Infected Leaf Area"
                value={`${infected_leaf_percent}%`}
                sub="of total leaf pixels"
                color={sevStatColor}
              />
              <StatCard
                label="Infected Regions"
                value={infected_regions}
                sub="contour areas detected"
                color={infected_regions > 0 ? "red" : "green"}
              />
            </div>

            {/* All Diseases (if multiple) */}
            {all_diseases.length > 1 && (
              <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm">
                <button
                  className="flex items-center justify-between w-full text-sm
                             font-semibold text-orange-700"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <span>🔍 Multiple Diseases Detected ({all_diseases.length})</span>
                  {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showDetails && (
                  <div className="mt-3 space-y-2">
                    {all_diseases.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center justify-between
                                   bg-orange-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-gray-700">
                          {formatDiseaseName(d.name)}
                        </span>
                        <span className="text-xs font-semibold text-orange-700 bg-orange-100
                                         px-2 py-0.5 rounded-full">
                          {d.infected_area_percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── RECOMMENDATION CARD ── */}
            <div className={`rounded-xl border p-5 shadow-sm
              ${recommendation?.type === "viral"
                ? "bg-red-50 border-red-200"
                : recommendation?.pesticide
                ? "bg-blue-50 border-blue-200"
                : "bg-green-50 border-green-200"}`}
            >
              <p className="text-sm font-bold text-gray-800 mb-3">
                💊 Recommended Action
              </p>

              {/* VIRAL */}
              {recommendation?.type === "viral" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                    <AlertCircle size={16} />
                    Viral Disease — No Chemical Cure
                  </div>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    <li>Chemical pesticides are NOT effective</li>
                    <li>Remove & destroy infected plants immediately</li>
                    <li>Control insect vectors (aphids, whiteflies)</li>
                    <li>Disinfect tools and maintain field hygiene</li>
                  </ul>
                  {recommendation.advisory && (
                    <p className="text-xs text-red-700 mt-2 italic bg-red-100
                                   rounded-lg px-3 py-2">
                      {recommendation.advisory}
                    </p>
                  )}
                </div>
              )}

              {/* CHEMICAL */}
              {recommendation?.pesticide && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Pesticide",      recommendation.pesticide],
                      ["Dosage",         recommendation.dose],
                      ["Spray Interval", recommendation.interval],
                      ["Max Sprays",     recommendation.max_sprays],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white/70 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500">{k}</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>

                  {recommendation.source && (
                    <p className="text-xs text-blue-600 font-medium">
                      Source: {recommendation.source}
                    </p>
                  )}

                  {recommendation.advisory && (
                    <p className="text-xs text-blue-700 italic bg-blue-100
                                   rounded-lg px-3 py-2">
                      📌 {recommendation.advisory}
                    </p>
                  )}

                  {/* LAND AREA INPUT */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <Map size={13} className="inline mr-1" />
                      Your Farm Area (hectares)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-lg
                                 px-3 py-2 text-sm focus:outline-none focus:ring-2
                                 focus:ring-blue-300"
                      placeholder="e.g. 1.5"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      1 hectare ≈ 2.47 acres
                    </p>
                  </div>

                  {/* QUANTITY RESULT */}
                  {quantity && (
                    <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-2">
                      <p className="text-sm font-bold text-green-700 flex items-center gap-1">
                        🌾 Pesticide Requirement for {landArea} ha
                      </p>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Droplets size={16} className="text-blue-500" />
                          Water: <span className="font-bold">{quantity.water} L</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FlaskConical size={16} className="text-green-600" />
                          Pesticide: <span className="font-bold">
                            {quantity.pesticide.toFixed(2)} g
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        Based on 500 L/ha standard spray volume
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* HEALTHY */}
              {!recommendation?.pesticide && recommendation?.type !== "viral" && (
                <div className="flex items-start gap-2 text-green-700 text-sm">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">No pesticide required</p>
                    <p className="text-green-600 text-xs mt-0.5">
                      {recommendation?.message ||
                        "Continue regular crop monitoring and good agronomic practices."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── PDF BUTTON ── */}
            <button
              onClick={() =>
                generateResultPDF({
                  disease:              primary_disease || "Healthy",
                  severity,
                  severityReason:       severity_reason,
                  infectedLeafPercent:  infected_leaf_percent,
                  infectedRegions:      infected_regions,
                  recommendation,
                  landArea,
                  quantity,
                })
              }
              className="w-full flex items-center justify-center gap-2
                         bg-gray-800 hover:bg-gray-900 active:bg-black
                         text-white text-sm font-semibold
                         py-3 rounded-xl transition-all"
            >
              <FileDown size={16} />
              Download Farmer Advisory Report (PDF)
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}