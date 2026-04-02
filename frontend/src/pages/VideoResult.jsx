// import { useState } from "react";
// import { useLocation, Link } from "react-router-dom";
// import {
//   Video, AlertCircle, CheckCircle2, AlertTriangle,
//   FlaskConical, Droplets, Map, FileDown, ChevronDown,
//   ChevronUp, ArrowLeft, ShieldAlert, Film,
// } from "lucide-react";
// import generateVideoResultPDF from "./detection/VideoResultPDF";

// // ─────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────
// function formatDiseaseName(name = "") {
//   return name
//     .split("_")
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(" ");
// }

// function SeverityBadge({ severity }) {
//   const cfg = {
//     HIGH:   { bg: "bg-red-100",    text: "text-red-700",    icon: <AlertCircle size={14} />,   label: "HIGH" },
//     MEDIUM: { bg: "bg-orange-100", text: "text-orange-700", icon: <AlertTriangle size={14} />, label: "MEDIUM" },
//     LOW:    { bg: "bg-yellow-100", text: "text-yellow-700", icon: <AlertTriangle size={14} />, label: "LOW" },
//     NONE:   { bg: "bg-green-100",  text: "text-green-700",  icon: <CheckCircle2 size={14} />,  label: "HEALTHY" },
//   };
//   const c = cfg[severity] ?? cfg.NONE;
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
//                       text-sm font-semibold ${c.bg} ${c.text}`}>
//       {c.icon}{c.label}
//     </span>
//   );
// }

// function StatCard({ label, value, sub, color = "blue" }) {
//   const colors = {
//     blue:   "from-blue-50   to-blue-100   border-blue-200   text-blue-800",
//     green:  "from-green-50  to-green-100  border-green-200  text-green-800",
//     red:    "from-red-50    to-red-100    border-red-200    text-red-800",
//     orange: "from-orange-50 to-orange-100 border-orange-200 text-orange-800",
//     gray:   "from-gray-50   to-gray-100   border-gray-200   text-gray-700",
//   };
//   return (
//     <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`}>
//       <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
//       <p className="text-2xl font-bold mt-1">{value}</p>
//       {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // MAIN
// // ─────────────────────────────────────────────
// export default function VideoResultPage() {
//   const { state } = useLocation();
//   const [landArea, setLandArea]         = useState("");
//   const [showAllDiseases, setShowAll]   = useState(false);

//   // ── NO DATA ──────────────────────────────────
//   if (!state) {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4
//                       bg-gradient-to-br from-gray-50 to-gray-100">
//         <div className="bg-white rounded-2xl shadow border border-gray-200
//                         p-8 max-w-sm w-full text-center space-y-4">
//           <AlertCircle size={40} className="mx-auto text-gray-400" />
//           <h2 className="text-xl font-bold text-gray-800">No Result Found</h2>
//           <p className="text-sm text-gray-500">
//             No video analysis data available. Please run a new detection.
//           </p>
//           <Link
//             to="/detect"
//             className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl
//                        bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
//           >
//             <ArrowLeft size={14} /> Start Detection
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const {
//     detections            = [],
//     primary_disease,
//     all_diseases          = [],
//     severity              = "NONE",
//     severity_reason       = "",
//     infected_leaf_percent = 0,
//     infected_regions      = 0,
//     frames_analyzed       = 0,
//     total_frames          = 0,
//     recommendation        = {},
//   } = state;

//   const isHealthy = !primary_disease || severity === "NONE";

//   // ── QUANTITY CALC ─────────────────────────────
//   const calculateQuantity = () => {
//     const dv = recommendation?.dose_value;
//     if (!dv || !landArea) return null;
//     const area = parseFloat(landArea);
//     if (isNaN(area) || area <= 0) return null;
//     const water = area * 500;
//     return { water, pesticide: water * dv };
//   };

//   const quantity = calculateQuantity();

//   // ── SEVERITY COLORS ───────────────────────────
//   const sevStatColor = { HIGH: "red", MEDIUM: "orange", LOW: "orange", NONE: "green" }[severity] ?? "blue";

//   // ─────────────────────────────────────────────
//   // RENDER
//   // ─────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50/40
//                     py-8 px-4">
//       <div className="max-w-5xl mx-auto space-y-6">

//         {/* ── BACK ── */}
//         <Link
//           to="/detect"
//           className="inline-flex items-center gap-2 text-sm text-gray-500
//                      hover:text-blue-700 transition-colors"
//         >
//           <ArrowLeft size={14} /> Back to Detection
//         </Link>

//         {/* ── HEADER BANNER ── */}
//         <div className={`rounded-2xl p-5 flex flex-wrap items-center
//                          justify-between gap-4 border
//                          ${isHealthy
//                            ? "bg-green-50 border-green-200"
//                            : "bg-white border-gray-200 shadow-sm"}`}>
//           <div className="flex items-center gap-3">
//             <div className={`w-12 h-12 rounded-xl flex items-center justify-center
//                             ${isHealthy ? "bg-green-100" : "bg-blue-50"}`}>
//               {isHealthy
//                 ? <CheckCircle2 size={24} className="text-green-600" />
//                 : <ShieldAlert size={24} className="text-red-500" />}
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
//                 Video Analysis Result
//               </p>
//               <h1 className="text-xl font-bold text-gray-900">
//                 {isHealthy ? "No Disease Detected" : formatDiseaseName(primary_disease)}
//               </h1>
//             </div>
//           </div>
//           <SeverityBadge severity={severity} />
//         </div>

//         {/* ── MAIN GRID ── */}
//         <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

//           {/* LEFT — STATS + FRAME INFO */}
//           <div className="lg:col-span-2 space-y-4">

//             {/* Frame analysis card */}
//             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
//               <div className="flex items-center gap-2">
//                 <Film size={16} className="text-blue-500" />
//                 <p className="text-sm font-semibold text-gray-700">Frame Analysis</p>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <StatCard
//                   label="Frames Analyzed"
//                   value={frames_analyzed}
//                   sub={`of ${total_frames} total`}
//                   color="blue"
//                 />
//                 <StatCard
//                   label="Infected Area"
//                   value={`${infected_leaf_percent}%`}
//                   sub="median across frames"
//                   color={sevStatColor}
//                 />
//                 <StatCard
//                   label="Infected Regions"
//                   value={infected_regions}
//                   sub="avg per frame"
//                   color={infected_regions > 0 ? "red" : "green"}
//                 />
//                 <StatCard
//                   label="Diseases Found"
//                   value={detections.length || "—"}
//                   sub={detections.length > 1 ? "multiple" : "identified"}
//                   color={detections.length > 1 ? "orange" : "gray"}
//                 />
//               </div>

//               {/* Severity reason */}
//               {severity_reason && (
//                 <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500
//                                  border border-gray-100 leading-relaxed">
//                   <span className="font-semibold text-gray-600">Analysis: </span>
//                   {severity_reason}
//                 </div>
//               )}
//             </div>

//             {/* Disease confidence bars */}
//             {detections.length > 0 && (
//               <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
//                 <p className="text-sm font-semibold text-gray-700">Detection Confidence</p>
//                 {detections.slice(0, 4).map((d) => (
//                   <div key={d.disease}>
//                     <div className="flex justify-between text-xs mb-1">
//                       <span className="text-gray-600 font-medium">
//                         {formatDiseaseName(d.disease)}
//                       </span>
//                       <span className="text-gray-400">
//                         {d.avg_confidence.toFixed(1)}%
//                       </span>
//                     </div>
//                     <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                       <div
//                         className={`h-full rounded-full transition-all
//                           ${d.disease === primary_disease
//                             ? "bg-blue-500"
//                             : "bg-gray-300"}`}
//                         style={{ width: `${Math.min(d.avg_confidence, 100)}%` }}
//                       />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* RIGHT — RECOMMENDATION + PDF */}
//           <div className="lg:col-span-3 space-y-5">

//             {/* Multiple diseases */}
//             {all_diseases.length > 1 && (
//               <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm">
//                 <button
//                   className="flex items-center justify-between w-full text-sm
//                              font-semibold text-orange-700"
//                   onClick={() => setShowAll(!showAllDiseases)}
//                 >
//                   <span>
//                     🔍 {all_diseases.length} diseases detected across frames
//                   </span>
//                   {showAllDiseases
//                     ? <ChevronUp size={16} />
//                     : <ChevronDown size={16} />}
//                 </button>
//                 {showAllDiseases && (
//                   <div className="mt-3 space-y-2">
//                     {all_diseases.map((d) => (
//                       <div key={d.name}
//                            className="flex items-center justify-between
//                                       bg-orange-50 rounded-lg px-3 py-2">
//                         <span className="text-sm text-gray-700">
//                           {formatDiseaseName(d.name)}
//                         </span>
//                         <div className="flex gap-2 text-xs">
//                           <span className="bg-orange-100 text-orange-700
//                                            px-2 py-0.5 rounded-full font-semibold">
//                             {d.infected_area_percent}%
//                           </span>
//                           <span className="bg-gray-100 text-gray-600
//                                            px-2 py-0.5 rounded-full">
//                             {d.votes} frames
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* ── RECOMMENDATION CARD ── */}
//             <div className={`rounded-xl border p-5 shadow-sm
//               ${recommendation?.type === "viral"
//                 ? "bg-red-50 border-red-200"
//                 : recommendation?.pesticide
//                 ? "bg-blue-50 border-blue-200"
//                 : "bg-green-50 border-green-200"}`}
//             >
//               <p className="text-sm font-bold text-gray-800 mb-3">
//                 💊 Recommended Action
//               </p>

//               {/* VIRAL */}
//               {recommendation?.type === "viral" && (
//                 <div className="space-y-2">
//                   <div className="flex items-center gap-2 text-red-700
//                                   font-semibold text-sm">
//                     <AlertCircle size={16} />
//                     Viral Disease — No Chemical Cure
//                   </div>
//                   <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
//                     <li>Chemical pesticides are NOT effective</li>
//                     <li>Remove & destroy infected plants immediately</li>
//                     <li>Control insect vectors (aphids, whiteflies)</li>
//                     <li>Disinfect tools and maintain field hygiene</li>
//                   </ul>
//                   {recommendation.advisory && (
//                     <p className="text-xs text-red-700 mt-2 italic bg-red-100
//                                    rounded-lg px-3 py-2">
//                       {recommendation.advisory}
//                     </p>
//                   )}
//                 </div>
//               )}

//               {/* CHEMICAL */}
//               {recommendation?.pesticide && (
//                 <div className="space-y-3">
//                   <div className="grid grid-cols-2 gap-3 text-sm">
//                     {[
//                       ["Pesticide",      recommendation.pesticide],
//                       ["Dosage",         recommendation.dose],
//                       ["Spray Interval", recommendation.interval],
//                       ["Max Sprays",     recommendation.max_sprays],
//                     ].map(([k, v]) => (
//                       <div key={k} className="bg-white/70 rounded-lg px-3 py-2">
//                         <p className="text-xs text-gray-500">{k}</p>
//                         <p className="font-semibold text-gray-800 mt-0.5">{v}</p>
//                       </div>
//                     ))}
//                   </div>

//                   {recommendation.source && (
//                     <p className="text-xs text-blue-600 font-medium">
//                       Source: {recommendation.source}
//                     </p>
//                   )}

//                   {recommendation.advisory && (
//                     <p className="text-xs text-blue-700 italic bg-blue-100
//                                    rounded-lg px-3 py-2">
//                       📌 {recommendation.advisory}
//                     </p>
//                   )}

//                   {/* LAND AREA INPUT */}
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-1.5">
//                       <Map size={13} className="inline mr-1" />
//                       Your Farm Area (hectares)
//                     </label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       value={landArea}
//                       onChange={(e) => setLandArea(e.target.value)}
//                       className="w-full border border-blue-200 bg-white rounded-lg
//                                  px-3 py-2 text-sm focus:outline-none focus:ring-2
//                                  focus:ring-blue-300"
//                       placeholder="e.g. 1.5"
//                     />
//                     <p className="text-xs text-gray-400 mt-1">
//                       1 hectare ≈ 2.47 acres
//                     </p>
//                   </div>

//                   {/* QUANTITY */}
//                   {quantity && (
//                     <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-2">
//                       <p className="text-sm font-bold text-green-700 flex items-center gap-1">
//                         🌾 Pesticide Requirement for {landArea} ha
//                       </p>
//                       <div className="flex gap-4">
//                         <div className="flex items-center gap-2 text-sm text-gray-700">
//                           <Droplets size={16} className="text-blue-500" />
//                           Water:{" "}
//                           <span className="font-bold">{quantity.water} L</span>
//                         </div>
//                         <div className="flex items-center gap-2 text-sm text-gray-700">
//                           <FlaskConical size={16} className="text-green-600" />
//                           Pesticide:{" "}
//                           <span className="font-bold">
//                             {quantity.pesticide.toFixed(2)} g
//                           </span>
//                         </div>
//                       </div>
//                       <p className="text-xs text-gray-400">
//                         Based on 500 L/ha standard spray volume
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* HEALTHY */}
//               {!recommendation?.pesticide &&
//                recommendation?.type !== "viral" && (
//                 <div className="flex items-start gap-2 text-green-700 text-sm">
//                   <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
//                   <div>
//                     <p className="font-semibold">No pesticide required</p>
//                     <p className="text-green-600 text-xs mt-0.5">
//                       {recommendation?.message ||
//                         "No disease detected. Continue standard crop care."}
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* ── PDF ── */}
//             <button
//               onClick={() =>
//                 generateVideoResultPDF({
//                   disease:              primary_disease || "Healthy",
//                   severity,
//                   severityReason:       severity_reason,
//                   infectedLeafPercent:  infected_leaf_percent,
//                   infectedRegions:      infected_regions,
//                   framesAnalyzed:       frames_analyzed,
//                   totalFrames:          total_frames,
//                   recommendation,
//                   landArea,
//                   quantity,
//                 })
//               }
//               className="w-full flex items-center justify-center gap-2
//                          bg-gray-800 hover:bg-gray-900 active:bg-black
//                          text-white text-sm font-semibold
//                          py-3 rounded-xl transition-all"
//             >
//               <FileDown size={16} />
//               Download Video Advisory Report (PDF)
//             </button>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Video, AlertCircle, CheckCircle2, AlertTriangle,
  FlaskConical, Droplets, Map, FileDown, ChevronDown,
  ChevronUp, ArrowLeft, ShieldAlert, Film,
} from "lucide-react";
import generateVideoResultPDF from "./detection/VideoResultPDF";

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

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function VideoResultPage() {
  const { state } = useLocation();
  const [landArea, setLandArea]       = useState("");
  const [showAllDiseases, setShowAll] = useState(false);

  // ── NO DATA ──────────────────────────────────
  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4
                      bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-2xl shadow border border-gray-200
                        p-8 max-w-sm w-full text-center space-y-4">
          <AlertCircle size={40} className="mx-auto text-gray-400" />
          <h2 className="text-xl font-bold text-gray-800">No Result Found</h2>
          <p className="text-sm text-gray-500">
            No video analysis data available. Please run a new detection.
          </p>
          <Link
            to="/detect"
            className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl
                       bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            <ArrowLeft size={14} /> Start Detection
          </Link>
        </div>
      </div>
    );
  }

  const {
    detections            = [],
    primary_disease,
    all_diseases          = [],
    severity              = "NONE",
    severity_reason       = "",
    infected_leaf_percent = 0,
    infected_regions      = 0,
    frames_analyzed       = 0,
    frames_skipped        = 0,   // ← new: blurry/dark frames rejected
    total_frames          = 0,
    recommendation        = {},
  } = state;

  const isHealthy = !primary_disease || severity === "NONE";

  // ── QUANTITY CALC ─────────────────────────────
  const calculateQuantity = () => {
    const dv = recommendation?.dose_value;
    if (!dv || !landArea) return null;
    const area = parseFloat(landArea);
    if (isNaN(area) || area <= 0) return null;
    const water = area * 500;
    return { water, pesticide: water * dv };
  };

  const quantity       = calculateQuantity();
  const sevStatColor   = { HIGH: "red", MEDIUM: "orange", LOW: "orange", NONE: "green" }[severity] ?? "blue";
  const qualityPct     = total_frames > 0
    ? Math.round((frames_analyzed / Math.ceil(total_frames / 5)) * 100)
    : 0;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50/40
                    py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── BACK ── */}
        <Link
          to="/detect"
          className="inline-flex items-center gap-2 text-sm text-gray-500
                     hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Detection
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
                : <ShieldAlert size={24} className="text-red-500" />}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Video Analysis Result
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

          {/* LEFT — STATS + FRAME INFO */}
          <div className="lg:col-span-2 space-y-4">

            {/* Frame analysis card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Film size={16} className="text-blue-500" />
                <p className="text-sm font-semibold text-gray-700">Frame Analysis</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Frames Analyzed"
                  value={frames_analyzed}
                  sub={`of ${total_frames} total`}
                  color="blue"
                />
                <StatCard
                  label="Infected Area"
                  value={`${infected_leaf_percent}%`}
                  sub="median across frames"
                  color={sevStatColor}
                />
                <StatCard
                  label="Infected Regions"
                  value={infected_regions}
                  sub="avg per frame"
                  color={infected_regions > 0 ? "red" : "green"}
                />
                <StatCard
                  label="Diseases Found"
                  value={detections.length || "—"}
                  sub={detections.length > 1 ? "multiple" : "identified"}
                  color={detections.length > 1 ? "orange" : "gray"}
                />
              </div>

              {/* Frame quality summary */}
              {frames_skipped > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl
                                p-3 text-xs text-amber-700 space-y-1">
                  <p className="font-semibold">🔍 Frame Quality Filter</p>
                  <p>
                    <span className="font-bold">{frames_skipped}</span> frames skipped
                    due to blur or poor lighting — only clear frames were analyzed
                    for higher accuracy.
                  </p>
                </div>
              )}

              {/* Severity reason */}
              {severity_reason && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500
                                 border border-gray-100 leading-relaxed">
                  <span className="font-semibold text-gray-600">Analysis: </span>
                  {severity_reason}
                </div>
              )}
            </div>

            {/* Disease confidence bars */}
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
                        {d.avg_confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all
                          ${d.disease === primary_disease
                            ? "bg-blue-500"
                            : "bg-gray-300"}`}
                        style={{ width: `${Math.min(d.avg_confidence, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — RECOMMENDATION + PDF */}
          <div className="lg:col-span-3 space-y-5">

            {/* Multiple diseases */}
            {all_diseases.length > 1 && (
              <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm">
                <button
                  className="flex items-center justify-between w-full text-sm
                             font-semibold text-orange-700"
                  onClick={() => setShowAll(!showAllDiseases)}
                >
                  <span>
                    🔍 {all_diseases.length} diseases detected across frames
                  </span>
                  {showAllDiseases
                    ? <ChevronUp size={16} />
                    : <ChevronDown size={16} />}
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
                  <div className="flex items-center gap-2 text-red-700
                                  font-semibold text-sm">
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

                  {/* QUANTITY */}
                  {quantity && (
                    <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-2">
                      <p className="text-sm font-bold text-green-700 flex items-center gap-1">
                        🌾 Pesticide Requirement for {landArea} ha
                      </p>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Droplets size={16} className="text-blue-500" />
                          Water:{" "}
                          <span className="font-bold">{quantity.water} L</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FlaskConical size={16} className="text-green-600" />
                          Pesticide:{" "}
                          <span className="font-bold">
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
              {!recommendation?.pesticide &&
               recommendation?.type !== "viral" && (
                <div className="flex items-start gap-2 text-green-700 text-sm">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">No pesticide required</p>
                    <p className="text-green-600 text-xs mt-0.5">
                      {recommendation?.message ||
                        "No disease detected. Continue standard crop care."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── PDF ── */}
            <button
              onClick={() =>
                generateVideoResultPDF({
                  disease:              primary_disease || "Healthy",
                  severity,
                  severityReason:       severity_reason,
                  infectedLeafPercent:  infected_leaf_percent,
                  infectedRegions:      infected_regions,
                  framesAnalyzed:       frames_analyzed,
                  framesSkipped:        frames_skipped,
                  totalFrames:          total_frames,
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
              Download Video Advisory Report (PDF)
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}