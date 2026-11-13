import ExcelJS from "exceljs";

export interface ParsedIpcRow {
  mes: number;
  anio: number;
  valor: number;
  fuente: string;
  fechaConsulta: string;
}

function unwrapCellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("result" in value) return value.result ?? null;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value) return value.text ?? null;
  }
  return value;
}

/**
 * Parses an IPC .xlsx spreadsheet buffer using ExcelJS without relying on the vulnerable xlsx package.
 */
export async function parseIpcExcelBuffer(buffer: ArrayBuffer | Uint8Array): Promise<ParsedIpcRow[]> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer =
    buffer instanceof ArrayBuffer
      ? buffer
      : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  await workbook.xlsx.load(arrayBuffer as ArrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const raw = unwrapCellValue(cell.value);
    headers[colNumber] = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
  });

  const rows: ParsedIpcRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const record: Record<string, unknown> = {};
    headers.forEach((header, colNumber) => {
      if (!header) return;
      record[header] = unwrapCellValue(row.getCell(colNumber).value);
    });

    const normalizedLookup = Object.fromEntries(
      Object.entries(record).map(([k, v]) => [k.toLowerCase(), v]),
    );

    const mesRaw = normalizedLookup["mes"];
    const anioRaw = normalizedLookup["anio"] ?? normalizedLookup["año"];
    const mes = mesRaw !== null && mesRaw !== undefined && mesRaw !== "" ? Number(mesRaw) : NaN;
    const anio = anioRaw !== null && anioRaw !== undefined && anioRaw !== "" ? Number(anioRaw) : NaN;

    if (Number.isNaN(mes) || Number.isNaN(anio)) return;

    const valorRaw = normalizedLookup["valor"];
    const valor =
      valorRaw !== undefined && valorRaw !== null && valorRaw !== "" ? Number(valorRaw) : 0;

    const fuenteRaw = normalizedLookup["fuente"];
    const fuente =
      typeof fuenteRaw === "string" && fuenteRaw.trim() ? fuenteRaw.trim() : "Archivo Excel";

    const fechaRaw = normalizedLookup["fecha_publicacion"] ?? normalizedLookup["fechaconsulta"];
    const fechaConsulta =
      typeof fechaRaw === "string" && fechaRaw.trim()
        ? fechaRaw.trim()
        : new Date().toISOString();

    rows.push({
      mes,
      anio,
      valor: Number.isNaN(valor) ? 0 : valor,
      fuente,
      fechaConsulta,
    });
  });

  return rows;
}
