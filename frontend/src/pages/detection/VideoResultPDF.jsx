import jsPDF from "jspdf";

/**
 * generateVideoResultPDF
 * Generates and downloads a video-analysis farmer advisory PDF.
 */
export default function generateVideoResultPDF({
  disease             = "Unknown",
  severity            = "NONE",
  severityReason      = "",
  infectedLeafPercent = 0,
  infectedRegions     = 0,
  framesAnalyzed      = 0,
  totalFrames         = 0,
  recommendation      = {},
  landArea            = "",
  quantity            = null,
}) {
  const doc  = new jsPDF();
  const pageW = 210;
  let y = 0;

  // ─────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────
  doc.setFillColor(20, 80, 160);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Plant Disease Video Analysis Report", pageW / 2, 13, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Based Farmer Advisory System — Video Detection", pageW / 2, 21, {
    align: "center",
  });

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
  // VIDEO ANALYSIS STATS
  // ─────────────────────────────────────────
  doc.setFillColor(235, 244, 255);
  doc.roundedRect(10, y - 5, pageW - 20, 30, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 80, 160);
  doc.text("Video Analysis Summary", 14, y + 3);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);

  doc.text(
    `Frames Analyzed: ${framesAnalyzed} of ${totalFrames} total`,
    14, y
  );
  y += 6;

  if (severityReason) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(80);
    const rLines = doc.splitTextToSize(severityReason, 180);
    doc.text(rLines, 14, y);
    y += rLines.length * 5;
    doc.setTextColor(0, 0, 0);
  }

  y += 8;

  // ─────────────────────────────────────────
  // DISEASE DETAILS
  // ─────────────────────────────────────────
  const severityColor =
    severity === "HIGH"   ? [200, 30, 30]  :
    severity === "MEDIUM" ? [180, 100, 0]  :
    severity === "LOW"    ? [0, 120, 60]   : [80, 80, 80];

  doc.setFillColor(242, 248, 242);
  doc.roundedRect(10, y - 5, pageW - 20, 46, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 100, 50);
  doc.text("Disease Details", 14, y + 3);
  y += 11;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  doc.text("Disease Name:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(
    disease
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    62, y
  );
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text("Severity Level:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...severityColor);
  doc.text(severity, 62, y);
  doc.setTextColor(0, 0, 0);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text("Infected Leaf Area:", 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(`${infectedLeafPercent}%`, 62, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text("Infected Regions (avg):", 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(String(infectedRegions), 62, y);

  y += 14;

  // ─────────────────────────────────────────
  // RECOMMENDED ACTION
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

    [
      "• Chemical pesticides are NOT effective against viral diseases.",
      "• Immediately remove and destroy all infected plant material.",
      "• Control insect vectors (aphids, whiteflies) with approved insecticides.",
      "• Disinfect farming tools after each use.",
      "• Maintain strict field hygiene to prevent spread.",
    ].forEach((pt) => { doc.text(pt, 14, y); y += 6.5; });

    y += 6;
  }

  // CHEMICAL
  else if (recommendation?.pesticide) {
    const boxH = landArea && quantity ? 86 : 64;
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

    [
      ["Pesticide:",      recommendation.pesticide],
      ["Dosage:",         recommendation.dose],
      ["Spray Interval:", recommendation.interval],
      ["Max Sprays:",     String(recommendation.max_sprays)],
    ].forEach(([lbl, val]) => {
      doc.setFont("helvetica", "normal");
      doc.text(lbl, 14, y);
      doc.setFont("helvetica", "bold");
      doc.text(val, 62, y);
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

    if (landArea && quantity) {
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 100, 50);
      doc.text("Pesticide Quantity for Your Farm", 14, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      doc.text("Farmer Land Area:", 14, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${landArea} hectare(s)`, 62, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.text("Total Water Required:", 14, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${quantity.water} litres`, 62, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.text("Total Pesticide Required:", 14, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${quantity.pesticide.toFixed(2)} grams`, 62, y);
      y += 6;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(80);
      doc.text("(Based on standard 500 L/hectare spray volume)", 14, y);
      y += 5;
      doc.setTextColor(0, 0, 0);
    }

    if (recommendation?.advisory) {
      y += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(60);
      const advLines = doc.splitTextToSize(
        `Advisory: ${recommendation.advisory}`, 180
      );
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

    [
      "• No chemical pesticide required at this time.",
      "• Continue regular monitoring and good crop practices.",
      "• Ensure proper irrigation, fertilization, and ventilation.",
    ].forEach((pt) => { doc.text(pt, 14, y); y += 6.5; });

    y += 6;
  }

  // ─────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────
  doc.setFillColor(20, 80, 160);
  doc.rect(0, 270, pageW, 27, "F");

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 210, 240);
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
  doc.text(
    "AI Plant Disease Detection System — Video Analysis",
    pageW / 2, 291, { align: "center" }
  );

  doc.save("Plant_Disease_Video_Report.pdf");
}