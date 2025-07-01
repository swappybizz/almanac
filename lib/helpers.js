// lib/helpers.js
import PptxGenJS from "pptxgenjs";

/**
 * Converts a data URL to a Blob.
 * @param {string} dataUrl
 */
export function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const match = header.match(/data:(.*?);base64/);
  const contentType = match ? match[1] : "application/octet-stream";
  const raw = atob(base64);
  const len = raw.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) buf[i] = raw.charCodeAt(i);
  return new Blob([buf], { type: contentType });
}

/**
 * Generate a PPTX “offer” with all bill items in one table,
 * splitting into slides of max 7 rows each.
 */
export const gen_rep_pptx = async (observations) => {
  const ppt = new PptxGenJS();

  // Format today's date (DD.MM.YYYY)
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const today = `${dd}.${mm}.${yyyy}`;

  // Flatten all items
  const allItems = observations.flatMap((obs) =>
    obs.billItems.map((m) => ({
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      unitCost: m.unitCost,
      totalCost: (m.quantity || 0) * (m.unitCost || 0),
    }))
  );

  // Grand total
  const grandTotal = allItems.reduce((sum, m) => sum + m.totalCost, 0);

  // Chunk into groups of 7
  const chunkSize = 7;
  for (let offset = 0; offset < allItems.length; offset += chunkSize) {
    const chunk = allItems.slice(offset, offset + chunkSize);
    const slide = ppt.addSlide();
    slide.background = { fill: "FFFFFF" };

    // — HEADER —
    slide.addImage({
      path: "/logo.png", // placeholder
      x: 0.25,
      y: 0.2,
      w: 2.0,
      h: 0.8,
    });
    slide.addText("NILS KLOSTER A.S.", {
      x: 0.25,
      y: 1.0,
      w: 6,
      h: 0.4,
      fontSize: 24,
      bold: true,
      color: "000000",
    });
    slide.addText(
      [
        { text: `Dato: ${today}\n`, options: { fontSize: 12 } },
        { text: `Gyldig til: 01.02.2025\n`, options: { fontSize: 12 } },
        { text: `Deres ref: Tomas Eftestøl\n`, options: { fontSize: 12 } },
        { text: `Vår ref: Jim Vidar Omland`, options: { fontSize: 12 } },
      ],
      {
        x: 6.5,
        y: 0.2,
        w: 3,
        h: 1.2,
        align: "right",
        color: "000000",
      }
    );

    // — TITLE —
    slide.addText(
      "Tilbud elektrisk installasjon i nytt grisefjøs på Fjotland",
      {
        x: 0.25,
        y: 1.6,
        w: 9,
        h: 0.6,
        fontSize: 18,
        bold: true,
        color: "333333",
      }
    );

    // — TABLE —
    const headerRow = ["Navn", "Antall", "Enhet", "Enhetspris", "Totalpris"];
    const rows = chunk.map((m) => [
      m.name,
      String(m.quantity),
      m.unit,
      `${m.unitCost.toLocaleString()} kr`,
      `${m.totalCost.toLocaleString()} kr`,
    ]);
    slide.addTable([headerRow, ...rows], {
      x: 0.25,
      y: 2.3,
      colW: [4, 1, 1, 1.5, 1.5],
      rowH: 0.35,
      border: { type: "solid", pt: 1, color: "DDDDDD" },
      fill: "F9F9F9",
      fontSize: 10,
      align: "left",
    });

    // If last chunk, add total & signature
    if (offset + chunkSize >= allItems.length) {
      const tableHeight = (rows.length + 1) * 0.35; // +1 for header
      const totalY = 2.3 + tableHeight + 0.1;

      slide.addText(`Total eks. mva: ${grandTotal.toLocaleString()} kr`, {
        x: 6.5,
        y: totalY,
        w: 3,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: "000000",
        align: "right",
      });

      slide.addText(
        [
          { text: "Med vennlig hilsen\n", options: { fontSize: 12, bold: true } },
          {
            text:
              "Jim Vidar Omland\nMob: 90 73 57 62\njim.vidar@nilskloster.no",
            options: { fontSize: 12 },
          },
        ],
        {
          x: 0.25,
          y: totalY + 0.6,
          w: 4,
          h: 1.2,
          color: "333333",
        }
      );
    }

    // — FOOTER BAR —
    slide.addShape("rect", {
      x: 0,
      y: 6.8,
      w: 10,
      h: 0.3,
      fill: { color: "540069" },
      line: { color: "540069" },
    });
  }

  await ppt.writeFile({
    fileName: `Tilbud_NilsKloster_${Date.now()}.pptx`,
  });
};
