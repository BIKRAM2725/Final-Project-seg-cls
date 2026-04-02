import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  AlertCircle, CheckCircle2, AlertTriangle,
  FlaskConical, Droplets, Map, FileDown,
  ChevronDown, ChevronUp, ArrowLeft, ShieldAlert,
  Film, Wifi,
} from "lucide-react";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function formatDiseaseName(name = "") {
  return name
    .replace(/_{2,}/g, "_")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function SeverityBadge({ severity }) {
  const cfg = {
    HIGH:   { bg: "bg-red-100",    text: "text-red-700",    icon: <AlertCircle size={14} />,   label: "HIGH" },
    MEDIUM: { bg: "bg-orange-100", text: "text-orange-700", icon: <AlertTriangle size={14} />, label: "MEDIUM" },
    LOW:    { bg: "bg-yellow-100", text: "text-yellow-700", icon: <AlertTriangle size={14} />, label: "LOW" },
    NONE:   { bg: "bg-green-100",  text: "text-green-700",  icon: <CheckCircle2 size={14} />,  label: "HEALTHY" },
  };
  const c = cfg[severity] ?? cfg.NONE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                      text-sm font-semibold ${c.bg} ${c.text}`}>
      {c.icon}{c.label}
    </span>
  );
}

function StatCard({ label, value, sub, color = "blue" }) {
  const colors = {
    blue:   "from-blue-50   to-blue-100   border-blue-200   text-blue-800",
    green:  "from-green-50  to-green-100  border-green-200  text-green-800",
    red:    "from-red-50    to-red-100    border-red-200    text-red-800",
    orange: "from-orange-50 to-orange-100 border-orange-200 text-orange-800",
    gray:   "from-gray-50   to-gray-100   border-gray-200   text-gray-700",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function LiveResultPage() {
  const { state }                       = useLocation();
  const [landArea, setLandArea]         = useState("");
  const [showAllDiseases, setShowAll]   = useState(false);

  /* ── No data guard ── */
  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4
                      bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-2xl shadow border border-gray-200
                        p-8 max-w-sm w-full text-center space-y-4">
          <AlertCircle size={40} className="mx-auto text-gray-400" />
          <h2 className="text-xl font-bold text-gray-800">No Result Found</h2>
          <p className="text-sm text-gray-500">
            No live session data available. Please run a new scan.
          </p>
          <Link
            to="/live"
            className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl
                       bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            <ArrowLeft size={14} /> Start New Scan
          </Link>
        </div>
      </div>
    );
  }

  /* ── Destructure REAL backend fields only (no fake fallbacks) ── */
  const {
    detections            = [],
    primary_disease       = null,
    all_diseases          = [],
    severity              = "NONE",
    severity_reason       = "",
    infected_leaf_percent = 0,
    infected_regions      = 0,
    frames_analyzed       = 0,
    frames_skipped        = 0,
    total_frames          = 0,
    avg_confidence        = 0,
    recommendation        = {},
  } = state;

  const isHealthy    = !primary_disease || severity === "NONE";
  const sevStatColor = { HIGH: "red", MEDIUM: "orange", LOW: "orange", NONE: "green" }[severity] ?? "blue";

  /* ── Quantity calculator ── */
  const quantity = (() => {
    const dv   = recommendation?.dose_value;
    const area = parseFloat(landArea);
    if (!dv || !area || isNaN(area) || area <= 0) return null;
    const water = area * 500;
    return { water, pesticide: water * dv };
  })();

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50/40
                    py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── BACK ── */}
        <Link
          to="/live"
          className="inline-flex items-center gap-2 text-sm text-gray-500
                     hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Live Scanner
        </Link>

        {/* ── HEADER BANNER ── */}
        <div className={`rounded-2xl p-5 flex flex-wrap items-center
                         justify-between gap-4 border
                         ${isHealthy
                           ? "bg-green-50 border-green-200"
                           : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                            ${isHealthy ? "bg-green-100" : "bg-blue-50"}`}>
              {isHealthy
                ? <CheckCircle2 size={24} className="text-green-600" />
                : <ShieldAlert  size={24} className="text-red-500" />}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Live Scan Result
              </p>
              <h1 className="text-xl font-bold text-gray-900">
                {isHealthy ? "No Disease Detected" : formatDiseaseName(primary_disease)}
              </h1>
            </div>
          </div>
          <SeverityBadge severity={severity} />
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT — STATS */}
          <div className="lg:col-span-2 space-y-4">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Film size={16} className="text-blue-500" />
                <p className="text-sm font-semibold text-gray-700">Scan Analysis</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Frames Scanned"
                  value={frames_analyzed}
                  sub={`${total_frames} total captured`}
                  color="blue"
                />
                <StatCard
                  label="Infected Area"
                  value={`${infected_leaf_percent}%`}
                  sub="median across frames"
                  color={sevStatColor}
                />
                <StatCard
                  label="Avg Confidence"
                  value={`${avg_confidence}%`}
                  sub="verified detections only"
                  color={avg_confidence >= 70 ? "green" : avg_confidence >= 50 ? "orange" : "gray"}
                />
                <StatCard
                  label="Regions Found"
                  value={infected_regions || "—"}
                  sub="avg per frame"
                  color={infected_regions > 0 ? "red" : "green"}
                />
              </div>

              {/* Quality info */}
              {frames_skipped > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl
                                p-3 text-xs text-amber-700 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Wifi size={12} /> Frame Quality Filter Active
                  </p>
                  <p>
                    <span className="font-bold">{frames_skipped}</span> frames skipped
                    (blurry or dark) — only clear frames contributed to this result.
                  </p>
                </div>
              )}

              {/* Severity reason */}
              {severity_reason && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500
                                 border border-gray-100 leading-relaxed">
                  <span className="font-semibold text-gray-600">How this was determined: </span>
                  {severity_reason}
                </div>
              )}
            </div>

            {/* Confidence bars */}
            {detections.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Detection Confidence</p>
                {detections.slice(0, 4).map((d) => (
                  <div key={d.disease}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">
                        {formatDiseaseName(d.disease)}
                      </span>
                      <span className="text-gray-400">
                        {Number(d.avg_confidence).toFixed(1)}%
                        <span className="ml-1 text-gray-300">({d.votes} frames)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all
                          ${d.disease === primary_disease
                            ? "bg-blue-500"
                            : "bg-gray-300"}`}
                        style={{ width: `${Math.min(Number(d.avg_confidence), 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — RECOMMENDATION */}
          <div className="lg:col-span-3 space-y-5">

            {/* Multiple diseases accordion */}
            {all_diseases.length > 1 && (
              <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm">
                <button
                  className="flex items-center justify-between w-full text-sm
                             font-semibold text-orange-700"
                  onClick={() => setShowAll(!showAllDiseases)}
                >
                  <span>🔍 {all_diseases.length} diseases detected</span>
                  {showAllDiseases ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showAllDiseases && (
                  <div className="mt-3 space-y-2">
                    {all_diseases.map((d) => (
                      <div key={d.name}
                           className="flex items-center justify-between
                                      bg-orange-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-700">
                          {formatDiseaseName(d.name)}
                        </span>
                        <div className="flex gap-2 text-xs">
                          <span className="bg-orange-100 text-orange-700
                                           px-2 py-0.5 rounded-full font-semibold">
                            {d.infected_area_percent}%
                          </span>
                          <span className="bg-gray-100 text-gray-600
                                           px-2 py-0.5 rounded-full">
                            {d.votes} frames
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendation card */}
            <div className={`rounded-xl border p-5 shadow-sm
              ${recommendation?.type === "viral"
                ? "bg-red-50 border-red-200"
                : recommendation?.pesticide
                ? "bg-blue-50 border-blue-200"
                : "bg-green-50 border-green-200"}`}>

              <p className="text-sm font-bold text-gray-800 mb-3">💊 Recommended Action</p>

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
                                   rounded-lg px-3 py-2">{recommendation.advisory}</p>
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
                    ].map(([k, v]) => v ? (
                      <div key={k} className="bg-white/70 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500">{k}</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{v}</p>
                      </div>
                    ) : null)}
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

                  {/* Farm area input */}
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
                    <p className="text-xs text-gray-400 mt-1">1 hectare ≈ 2.47 acres</p>
                  </div>

                  {quantity && (
                    <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-2">
                      <p className="text-sm font-bold text-green-700">
                        🌾 Pesticide Requirement for {landArea} ha
                      </p>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Droplets size={16} className="text-blue-500" />
                          Water: <span className="font-bold ml-1">{quantity.water} L</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FlaskConical size={16} className="text-green-600" />
                          Pesticide: <span className="font-bold ml-1">{quantity.pesticide.toFixed(2)} g</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Based on 500 L/ha standard spray volume</p>
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
                      {recommendation?.message || "No disease detected. Continue standard crop care."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PDF button */}
            <button
              className="w-full flex items-center justify-center gap-2
                         bg-gray-800 hover:bg-gray-900 active:bg-black
                         text-white text-sm font-semibold
                         py-3 rounded-xl transition-all"
            >
              <FileDown size={16} />
              Download Live Scan Report (PDF)
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}