import { useState } from "react";
import { useLocation } from "react-router-dom";
import generateLivePDF from "./detection/LiveResultPDF";

export default function LiveResult() {
  const { state } = useLocation();
  const [landArea, setLandArea] = useState("");

  if (!state) {
    return <div className="p-6">No live result found.</div>;
  }

  const {
    primary_disease,
    severity,
    infection_ratio,
    avg_confidence,
    infected_leaves,
    total_leaves,
    recommendation,
  } = state;

  /* ===============================
     PESTICIDE CALCULATION
  =============================== */
  const calculateQuantity = () => {
    if (!recommendation?.pesticide || !recommendation?.dose || !landArea)
      return null;

    const doseValue = parseFloat(recommendation.dose); // g/L
    const area = parseFloat(landArea); // hectares
    if (isNaN(doseValue) || isNaN(area)) return null;

    const WATER_PER_HA = 500; // standard litres/hectare
    const totalWater = area * WATER_PER_HA;
    const totalPesticide = totalWater * doseValue;

    return {
      water: totalWater,
      pesticide: totalPesticide,
    };
  };

  const quantity = calculateQuantity();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">

      <h2 className="text-2xl font-bold">🌿 Live Detection Summary</h2>

      <p><b>Disease:</b> {primary_disease || "Healthy Crop"}</p>
      <p><b>Severity:</b> {severity}</p>
      <p><b>Infected Leaves:</b> {infected_leaves} / {total_leaves}</p>
      <p><b>Confidence:</b> {avg_confidence}%</p>

      {/* RECOMMENDATION */}
      {recommendation?.pesticide && (
        <div className="bg-green-50 p-4 rounded space-y-2">
          <p className="font-semibold">Recommended Action</p>
          <p><b>Pesticide:</b> {recommendation.pesticide}</p>
          <p><b>Dosage:</b> {recommendation.dose}</p>
          <p><b>Spray Interval:</b> {recommendation.interval}</p>

          {/* FARMER LAND INPUT */}
          <div className="mt-3">
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

          {/* CALCULATED RESULT */}
          {quantity && (
            <div className="mt-3 p-3 bg-white border rounded">
              <p className="font-semibold text-green-700">
                🌾 Pesticide Requirement
              </p>
              <p>💧 Total Water: <b>{quantity.water} L</b></p>
              <p>
                🧪 Total Pesticide:{" "}
                <b>{quantity.pesticide.toFixed(2)} g</b>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Based on standard practice (500 L/ha)
              </p>
            </div>
          )}
        </div>
      )}

      {/* PDF BUTTON */}
      <button
        onClick={() =>
          generateLivePDF({
            primary_disease,
            severity,
            infection_ratio,
            avg_confidence,
            infected_leaves,
            total_leaves,
            recommendation,
            landArea,
            quantity,
          })
        }
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
      >
        📄 Download Live Advisory PDF
      </button>
    </div>
  );
}
