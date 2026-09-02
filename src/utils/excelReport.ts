import ExcelJS from "exceljs";

// ── Styles partagés pour les exports Excel premium (thème bleu foncé) ──

export const EXCEL_STYLE = {
  HEADER_FILL: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } } as ExcelJS.Fill,
  ZEBRA_FILL: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } } as ExcelJS.Fill,
  TOTAL_FILL: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } } as ExcelJS.Fill,
  SECTION_FILL: { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } } as ExcelJS.Fill,
  BORDER: {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  } as Partial<ExcelJS.Borders>,
  TITLE_COLOR: "FF1E3A8A",
  MUTED_COLOR: "FF64748B",
};

/** Applique le style d'en-tête (fond bleu foncé, texte blanc gras, centré). */
export const applyExcelHeader = (row: ExcelJS.Row) => {
  row.height = 20;
  row.eachCell((cell) => {
    cell.fill = EXCEL_STYLE.HEADER_FILL;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = EXCEL_STYLE.BORDER;
  });
};

/** Ajoute un bandeau de section (titre fusionné, fond bleu clair, texte bleu gras). */
export const addExcelSectionHeader = (ws: ExcelJS.Worksheet, title: string, colCount: number) => {
  const row = ws.addRow([title]);
  ws.mergeCells(row.number, 1, row.number, colCount);
  row.getCell(1).font = { bold: true, size: 12, color: { argb: EXCEL_STYLE.TITLE_COLOR } };
  row.getCell(1).alignment = { vertical: "middle" };
  row.getCell(1).fill = EXCEL_STYLE.SECTION_FILL;
  row.height = 22;
};

export type StyledSectionOptions = {
  widths?: number[];
  numberCols?: number[];
  rateCols?: number[];
  totals?: (string | number)[];
  totalsRateCols?: number[];
  mergeTo?: number;
};

/**
 * Ajoute un tableau stylisé complet : bandeau de section + en-tête + données + totaux.
 * - numberCols / rateCols : colonnes (1-based) alignées à droite et formatées (#,##0 / 0"%").
 */
export const addExcelSection = (
  ws: ExcelJS.Worksheet,
  sectionTitle: string,
  headers: string[],
  rows: (string | number)[][],
  options?: StyledSectionOptions
) => {
  addExcelSectionHeader(ws, sectionTitle, options?.mergeTo ?? headers.length);

  applyExcelHeader(ws.addRow(headers));

  options?.widths?.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const styleCell = (cell: ExcelJS.Cell, colIdx: number, zebra: boolean) => {
    cell.border = EXCEL_STYLE.BORDER;
    cell.alignment = { vertical: "middle", horizontal: "left" };
    if (zebra) cell.fill = EXCEL_STYLE.ZEBRA_FILL;
    if (options?.numberCols?.includes(colIdx)) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "#,##0";
    }
    if (options?.rateCols?.includes(colIdx)) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = '0"%"';
    }
  };

  rows.forEach((r, idx) => {
    const row = ws.addRow(r);
    row.height = 18;
    row.eachCell((cell, colIdx) => styleCell(cell, colIdx, idx % 2 === 1));
  });

  if (options?.totals) {
    const totalsRow = ws.addRow(options.totals);
    totalsRow.height = 18;
    totalsRow.eachCell((cell, colIdx) => {
      styleCell(cell, colIdx, false);
      cell.font = { bold: true };
      cell.fill = EXCEL_STYLE.TOTAL_FILL;
      if (options.totalsRateCols?.includes(colIdx)) {
        cell.numFmt = '0"%"';
      } else if (typeof cell.value === "number") {
        cell.numFmt = "#,##0";
      }
    });
  }

  ws.addRow([]);
};

/** Sérialise le classeur et déclenche le téléchargement. */
export const downloadWorkbook = async (workbook: ExcelJS.Workbook, filename: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as any], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
