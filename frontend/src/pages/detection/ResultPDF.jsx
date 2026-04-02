import jsPDF from "jspdf";

/**
 * generateResultPDF
 * Generates and downloads a farmer advisory PDF report.
 *
 * @param {Object} params
 * @param {string}  params.disease
 * @param {string}  params.severity
 * @param {string}  params.severityReason
 * @param {number}  params.infectedLeafPercent
 * @param {number}  params.infectedRegions
 * @param {Object}  params.recommendation
 * @param {string}  params.landArea  — hectares (string input from user)
 * @param {Object|null} params.quantity — { water, pesticide } or null
 */
export default function generateResultPDF({
  disease = "Unknown",
  severity = "NONE",
  severityReason = "",
  infectedLeafPercent = 0,
  infectedRegions = 0,
  recommendation = {},
  landArea = "",
  quantity = null,
}) {
  const doc = new jsPDF();
  const pageW = 210;
  let y = 0;

  // ─────────────────────────────────────────
  // HEADER BAR
  // ─────────────────────────────────────────
  doc.setFillColor(30, 100, 50);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Plant Disease Detection Report", pageW / 2, 13, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Based Farmer Advisory System", pageW / 2, 21, { align: "center" });

  doc.setTextColor(0, 0, 0);
  y = 36;

  // Date
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Report Date: ${today}`, 14, y);
  doc.setTextColor(0, 0, 0);
  y += 8;

  // ─────────────────────────────────────────
  // SECTION: DISEASE DETAILS
  // ─────────────────────────────────────────
  const severityColor =
    severity === "HIGH"
      ? [200, 30, 30]
      : severity === "MEDIUM"
      ? [180, 100, 0]
      : severity === "LOW"
      ? [0, 120, 60]
      : [80, 80, 80];

  doc.setFillColor(242, 248, 242);
  doc.roundedRect(10, y - 5, pageW - 20, 52, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 100, 50);
  doc.text("Disease Details", 14, y + 3);
  y += 11;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  doc.text(`Disease Name:`, 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(
    disease
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    60, y
  );
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text(`Severity Level:`, 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...severityColor);
  doc.text(severity, 60, y);
  doc.setTextColor(0, 0, 0);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text(`Infected Leaf Area:`, 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(`${infectedLeafPercent}%`, 60, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text(`Infected Regions:`, 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(String(infectedRegions), 60, y);
  y += 7;

  if (severityReason) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(80);
    const reasonLines = doc.splitTextToSize(`Analysis: ${severityReason}`, 180);
    doc.text(reasonLines, 14, y);
    y += reasonLines.length * 5;
    doc.setTextColor(0, 0, 0);
  }

  y += 10;

  // ─────────────────────────────────────────
  // SECTION: RECOMMENDED ACTION
  // ─────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 100, 50);
  doc.text("Recommended Action", 14, y);
  y += 8;

  // VIRAL
  if (recommendation?.type === "viral") {
    doc.setFillColor(255, 235, 235);
    doc.roundedRect(10, y - 5, pageW - 20, 58, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(160, 20, 20);
    doc.text("⚠  Viral Disease — No Chemical Cure", 14, y + 3);
    y += 11;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);

    const viralPoints = [
      "• Chemical pesticides are NOT effective against viral diseases.",
      "• Immediately remove and destroy all infected plant material.",
      "• Control insect vectors (aphids, whiteflies) with approved insecticides.",
      "• Disinfect farming tools after handling infected crops.",
      "• Maintain strict field hygiene to prevent spread.",
    ];
    viralPoints.forEach((pt) => {
      doc.text(pt, 14, y);
      y += 6.5;
    });

    if (recommendation?.advisory) {
      y += 2;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(80);
      const advLines = doc.splitTextToSize(`Advisory: ${recommendation.advisory}`, 180);
      doc.text(advLines, 14, y);
      y += advLines.length * 5;
      doc.setTextColor(0, 0, 0);
    }

    y += 8;
  }

  // CHEMICAL (FUNGAL / BACTERIAL)
  else if (recommendation?.pesticide) {
    const boxH = landArea && quantity ? 88 : 66;
    doc.setFillColor(235, 244, 255);
    doc.roundedRect(10, y - 5, pageW - 20, boxH, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 60, 140);
    doc.text("Chemical Control Recommended", 14, y + 3);
    y += 11;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    const rows = [
      ["Pesticide:", recommendation.pesticide],
      ["Dosage:", recommendation.dose],
      ["Spray Interval:", recommendation.interval],
      ["Maximum Sprays:", String(recommendation.max_sprays)],
    ];

    rows.forEach(([label, val]) => {
      doc.setFont("helvetica", "normal");
      doc.text(label, 14, y);
      doc.setFont("helvetica", "bold");
      doc.text(val, 65, y);
      y += 7;
    });

    if (recommendation?.source) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`Source: ${recommendation.source}`, 14, y);
      y += 6;
      doc.setTextColor(0, 0, 0);
    }

    // QUANTITY SECTION
    if (landArea && quantity) {
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 100, 50);
      doc.text("Pesticide Quantity for Your Farm", 14, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      doc.text(`Farmer Land Area:`, 14, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${landArea} hectare(s)`, 65, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`Total Water Required:`, 14, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${quantity.water} litres`, 65, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`Total Pesticide Required:`, 14, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${quantity.pesticide.toFixed(2)} grams`, 65, y);
      y += 7;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(80);
      doc.text("(Based on standard 500 L/hectare spray volume)", 14, y);
      y += 6;
      doc.setTextColor(0, 0, 0);
    }

    // Advisory note
    if (recommendation?.advisory) {
      y += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(60);
      const advLines = doc.splitTextToSize(`Advisory: ${recommendation.advisory}`, 180);
      doc.text(advLines, 14, y);
      y += advLines.length * 5;
      doc.setTextColor(0, 0, 0);
    }

    y += 6;
  }

  // HEALTHY
  else {
    doc.setFillColor(242, 248, 242);
    doc.roundedRect(10, y - 5, pageW - 20, 36, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 100, 50);
    doc.text("✓  Crop Appears Healthy", 14, y + 3);
    y += 11;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    const healthyPoints = [
      "• No chemical pesticide required at this time.",
      "• Continue regular monitoring and good crop practices.",
      "• Ensure proper irrigation, fertilization, and ventilation.",
    ];
    healthyPoints.forEach((pt) => {
      doc.text(pt, 14, y);
      y += 6.5;
    });

    y += 6;
  }

  // ─────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────
  doc.setFillColor(30, 100, 50);
  doc.rect(0, 270, pageW, 27, "F");

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 230, 200);
  doc.text(
    "Disclaimer: This AI-generated report is for advisory purposes only.",
    pageW / 2, 277, { align: "center" }
  );
  doc.text(
    "Consult your local agriculture officer before applying any pesticide.",
    pageW / 2, 283, { align: "center" }
  );
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("AI Plant Disease Detection System", pageW / 2, 291, { align: "center" });

  doc.save("Plant_Disease_Advisory_Report.pdf");
}