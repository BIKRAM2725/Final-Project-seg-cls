import jsPDF from "jspdf";

export default function generateResultPDF({
  disease = "Healthy Crop",
  severity = "NONE",
  infectedLeafPercent = 0,
  infectedRegions = 0,
  recommendation = {},
  landArea = "",
  quantity = null,
}) {
  const doc = new jsPDF();
  let y = 20;

  // ==================================================
  // SAFETY: NORMALIZE QUANTITY (FIXES landArea = 1 BUG)
  // ==================================================
  let safeQuantity = null;

  // Case 1: quantity already correct object
  if (quantity && typeof quantity === "object" && quantity.grams !== undefined) {
    safeQuantity = quantity;
  }

  // Case 2: quantity is number (BUG CASE)
  else if (typeof quantity === "number") {
    safeQuantity = {
      grams: quantity,
      litres: null,
    };
  }

  // Case 3: auto calculate from land area
  else if (
    recommendation?.pesticide &&
    recommendation?.dose &&
    landArea
  ) {
    const doseValue = parseFloat(recommendation.dose); // "2 g / litre" → 2

    if (!isNaN(doseValue)) {
      const SPRAY_VOLUME_L_PER_HA = 500;
      const litres = Number(landArea) * SPRAY_VOLUME_L_PER_HA;

      safeQuantity = {
        litres,
        grams: litres * doseValue,
      };
    }
  }

  // ===============================
  // HEADER
  // ===============================
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 0, 210, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Plant Disease Detection Report", 105, 16, { align: "center" });

  doc.setFontSize(10);
  doc.text("AI-based Advisory for Farmers", 105, 22, { align: "center" });

  doc.setTextColor(0, 0, 0);
  y = 35;

  // ===============================
  // DISEASE DETAILS
  // ===============================
  doc.setFillColor(240, 248, 240);
  doc.rect(10, y - 6, 190, 42, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Disease Details", 12, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(`Disease Name: ${disease}`, 12, y); y += 7;
  doc.text(`Severity Level: ${severity}`, 12, y); y += 7;
  doc.text(`Infected Leaf Area: ${infectedLeafPercent}%`, 12, y); y += 7;
  doc.text(`Detected Infected Regions: ${infectedRegions}`, 12, y);

  y += 16;

  // ===============================
  // RECOMMENDED ACTION
  // ===============================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Recommended Action", 10, y);
  y += 6;

  // ===============================
  // VIRAL DISEASE
  // ===============================
  if (recommendation?.type === "viral") {
    doc.setFillColor(255, 235, 235);
    doc.rect(10, y - 4, 190, 52, "F");

    doc.setTextColor(180, 0, 0);
    doc.setFontSize(12);
    doc.text("⚠ Viral Disease Detected", 12, y);
    y += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    const viralText =
      "• Chemical pesticides are not effective\n" +
      "• Remove infected plants immediately\n" +
      "• Control insect vectors\n" +
      "• Maintain field hygiene";

    const lines = doc.splitTextToSize(viralText, 180);
    doc.text(lines, 12, y);
    y += lines.length * 6 + 8;
  }

  // ===============================
  // CHEMICAL / FUNGAL
  // ===============================
  else if (recommendation?.pesticide) {
    doc.setFillColor(235, 245, 255);
    doc.rect(10, y - 4, 190, 65, "F");

    doc.setFontSize(12);
    doc.setTextColor(0, 70, 140);
    doc.text("Chemical Control Recommended", 12, y);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    doc.text(`Pesticide: ${recommendation.pesticide}`, 12, y); y += 7;
    doc.text(`Dosage: ${recommendation.dose}`, 12, y); y += 7;
    doc.text(`Spray Interval: ${recommendation.interval}`, 12, y); y += 7;
    doc.text(`Maximum Sprays: ${recommendation.max_sprays}`, 12, y); y += 7;

    if (landArea && safeQuantity?.grams !== undefined) {
      doc.text(`Farmer Land Area: ${landArea} hectare(s)`, 12, y); y += 7;
      doc.text(
        `Total Pesticide Required: ${safeQuantity.grams.toFixed(2)} grams`,
        12,
        y
      );
      y += 7;
    }

    y += 6;
  }

  // ===============================
  // HEALTHY
  // ===============================
  else {
    doc.setFillColor(245, 245, 245);
    doc.rect(10, y - 4, 190, 28, "F");

    doc.setFontSize(11);
    const msg =
      "No disease detected.\n" +
      "No chemical pesticide required.\n" +
      "Follow good crop management practices.";

    const lines = doc.splitTextToSize(msg, 180);
    doc.text(lines, 12, y);
    y += lines.length * 6 + 8;
  }

  // ===============================
  // FOOTER
  // ===============================
  doc.setDrawColor(180);
  doc.line(10, 275, 200, 275);

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(
    "Disclaimer: This AI-generated report is for advisory purposes only.",
    10,
    282
  );
  doc.text(
    "Please consult local agriculture officers before applying pesticides.",
    10,
    288
  );
  doc.text(
    "Generated by AI Plant Disease Detection System",
    10,
    294
  );

  doc.save("Plant_Disease_Report.pdf");
}
