import { useLocation } from "react-router-dom";
import { useState } from "react";
import generateVideoPDF from "./detection/VideoResultPDF";

export default function VideoResult() {
  const { state } = useLocation();
  const [landArea, setLandArea] = useState("");

  if (!state) {
    return <p className="p-6">No video result</p>;
  }

  const {
    video,
    severity,
    infected_leaf_percent,
    primary_disease,
    recommendation,
  } = state;

  // ===============================
  // PESTICIDE CALCULATION
  // ===============================
  const calculateQuantity = () => {
    if (!recommendation?.pesticide || !recommendation?.dose || !landArea)
      return null;

    const doseValue = parseFloat(recommendation.dose); // g/L
    const area = parseFloat(landArea); // hectare

    if (isNaN(doseValue) || isNaN(area)) return null;

    const WATER_PER_HA = 500; // litres per hectare
    const water = area * WATER_PER_HA;
    const grams = water * doseValue;

    return { water, grams };
  };

  const quantity = calculateQuantity();

  // ===============================
  // UI
  // ===============================
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        AI Plant Disease Detection
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: VIDEO */}
        <div className="bg-gray-100 rounded-xl overflow-hidden">
          <video
            src={`http://localhost:8000/video/${video}`}
            controls
            className="w-full"
          />
          <p className="text-sm text-gray-500 text-center mt-2">
            🔴 Red regions indicate detected infection
          </p>
        </div>

        {/* RIGHT: INFO */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">

          <h2 className="text-2xl font-bold text-red-700">
            🍃 {primary_disease || "Detected Disease"}
          </h2>

          <p>
            <b>Severity:</b>{" "}
            <span
              className={`font-semibold ${
                severity === "HIGH"
                  ? "text-red-600"
                  : severity === "MEDIUM"
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {severity}
            </span>
          </p>

          <p>
            <b>Infected Area:</b> {infected_leaf_percent}%
          </p>

          {/* ===============================
              FARMER LAND INPUT
          =============================== */}
          {recommendation?.pesticide && (
            <div>
              <label className="block text-sm font-medium">
                Farmer Land Area (hectares)
              </label>
              <input
                type="number"
                step="0.01"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                placeholder="Example: 1.0 hectare"
              />
              <p className="text-xs text-gray-500 mt-1">
                (1 hectare ≈ 2.47 acres)
              </p>
            </div>
          )}

          {/* ===============================
              RECOMMENDATION
          =============================== */}
          <div className="bg-green-50 p-4 rounded space-y-2">
            <p className="font-semibold">Recommended Action</p>

            {/* CHEMICAL / FUNGAL CASE */}
            {recommendation?.pesticide && (
              <div className="text-sm space-y-1">
                <p className="font-semibold text-green-700">
                  Chemical Control Recommended
                </p>
                <p>
                  <b>Pesticide:</b> {recommendation.pesticide}
                </p>
                <p>
                  <b>Dosage:</b> {recommendation.dose}
                </p>
                <p>
                  <b>Spray Interval:</b> {recommendation.interval}
                </p>
                {recommendation.max_sprays && (
                  <p>
                    <b>Max Sprays:</b> {recommendation.max_sprays}
                  </p>
                )}
              </div>
            )}

            {/* VIRAL CASE */}
            {recommendation?.type === "viral" && (
              <p className="text-sm text-red-700">
                ⚠ Viral disease detected. No chemical control is effective.
              </p>
            )}

            {/* HEALTHY / FALLBACK */}
            {!recommendation && (
              <p className="text-sm text-gray-600">
                Treatment data unavailable.
              </p>
            )}
          </div>

          

          {/* ===============================
              CALCULATION RESULT
          =============================== */}
          {quantity && (
            <div className="bg-white border rounded p-3 text-sm">
              <p className="font-semibold text-green-700">
                🌾 Pesticide Requirement
              </p>
              <p>
                💧 Total Water: <b>{quantity.water} L</b>
              </p>
              <p>
                🧪 Total Pesticide:{" "}
                <b>{quantity.grams.toFixed(2)} g</b>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Calculation based on standard practice (500 L/ha)
              </p>
            </div>
          )}

          {/* ===============================
              PDF DOWNLOAD
          =============================== */}
          <button
            onClick={() =>
              generateVideoPDF({
                disease: primary_disease,
                severity,
                infected_leaf_percent,
                recommendation,
                landArea,
                quantity,
              })
            }
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded w-full"
          >
            📄 Download Video Advisory
          </button>
        </div>
      </div>
    </div>
  );
}
