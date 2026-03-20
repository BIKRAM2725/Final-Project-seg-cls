import { useState } from "react";
import { useLocation } from "react-router-dom";
import generateResultPDF from "./detection/ResultPDF";

export default function Result() {
  const { state } = useLocation();

  if (!state || !state.image) {
    return (
      <div className="p-6 text-center text-gray-500">
        No detection data found.
      </div>
    );
  }

  const {
    image,
    detections = [],
    severity = "N/A",
    severity_reason = "",
    infected_leaf_percent = 0,
    infected_regions = 0,
    primary_disease,
    all_diseases = [],
    recommendation = {},
  } = state;

  const [landArea, setLandArea] = useState("");

  // ===============================
  // PESTICIDE CALCULATION
  // ===============================
  const calculateQuantity = () => {
    if (!recommendation?.pesticide || !recommendation?.dose || !landArea)
      return null;

    const doseValue = parseFloat(recommendation.dose); // g/L
    const area = parseFloat(landArea); // hectare

    if (isNaN(doseValue) || isNaN(area)) return null;

    const WATER_PER_HA = 500; // litres per hectare (standard)
    const totalWater = area * WATER_PER_HA;
    const totalPesticide = totalWater * doseValue;

    return {
      water: totalWater,
      pesticide: totalPesticide,
    };
  };

  const quantity = calculateQuantity();

  // ===============================
  // HEALTHY CASE
  // ===============================
  if (detections.length === 0) {
    return (
      <div className="p-6 text-center">
        <img src={image} className="mx-auto max-w-md mb-4 rounded" />
        <p className="text-green-600 font-semibold text-lg">
          🌱 No disease detected. Crop looks healthy.
        </p>
      </div>
    );
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">

      {/* IMAGE (Overlay hidden temporarily) */}
      <div className="bg-gray-100 rounded-xl overflow-hidden">
        <img
          src={image}
          alt="Leaf Image"
          className="w-full h-auto"
        />
        {/* 
          🔴 Disease overlay temporarily disabled.
          Will enable after final retrained model.
        */}
      </div>

      {/* INFO */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">

        <h2 className="text-2xl font-bold capitalize text-red-700">
          🍃 {primary_disease || "Detected Disease"}
        </h2>

        <p>
          <b>Severity:</b>{" "}
          <span
            title={severity_reason}
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

        <p><b>Infected Leaf Area:</b> {infected_leaf_percent}%</p>
        <p><b>Detected Infected Regions:</b> {infected_regions}</p>

        {all_diseases.length > 1 && (
          <div className="p-3 bg-yellow-50 rounded">
            <p className="font-semibold mb-1">Other detected diseases:</p>
            <ul className="list-disc ml-5 text-sm">
              {all_diseases.map((d) => (
                <li key={d.name}>
                  {d.name} — {d.infected_area_percent}%
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FARMER LAND INPUT */}
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

        {/* ACTION */}
        <div className="p-4 bg-green-50 rounded">
          <p className="font-semibold mb-2">Recommended Action</p>

          {recommendation?.type === "viral" && (
            <div className="text-red-700 text-sm">
              <p>⚠ Viral disease detected</p>
              <ul className="list-disc ml-5">
                <li>No chemical pesticide works</li>
                <li>Remove infected plants</li>
                <li>Control insect vectors</li>
                <li>Maintain field hygiene</li>
              </ul>
            </div>
          )}

          {recommendation?.pesticide && (
            <div className="text-sm space-y-1">
              <p><b>Pesticide:</b> {recommendation.pesticide}</p>
              <p><b>Dosage:</b> {recommendation.dose}</p>
              <p><b>Spray Interval:</b> {recommendation.interval}</p>

              {quantity && (
                <div className="mt-3 p-3 bg-white border rounded">
                  <p className="font-semibold text-green-700">
                    🌾 Pesticide Requirement
                  </p>
                  <p>💧 Total Water: <b>{quantity.water} L</b></p>
                  <p>🧪 Total Pesticide: <b>{quantity.pesticide.toFixed(2)} g</b></p>
                  <p className="text-xs text-gray-600 mt-1">
                    Calculation based on standard practice (500 L/ha)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PDF */}
        <button
          onClick={() =>
            generateResultPDF({
              disease: primary_disease,
              severity,
              severity_reason,
              infectedArea: infected_leaf_percent,
              infectedRegions: infected_regions,
              recommendation,
              landArea,
              quantity,
            })
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          📄 Download Farmer Advisory Report
        </button>
      </div>
    </div>
  );
}
