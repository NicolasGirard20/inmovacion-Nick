// src/app/api/pagos/[id]/pdf/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  const pago = await db.pagoProveedor.findUnique({
    where: { id_pago: id },
    include: {
      proveedor: true,
      medioPago: true,
      estadoPago: true,
    },
  });

  if (!pago) {
    return NextResponse.json(
      { error: "Pago no encontrado" },
      { status: 404 }
    );
  }

  // ✔ ahora TypeScript sabe que NO es null
  const pagoData = pago;

  // ✔ convertir Decimal → number
  const importeNumber = pagoData.importe.toNumber();

  const importeFormateado = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(importeNumber);

  // ============================
  // CREAR PDF
  // ============================

  const pdfDoc = await PDFDocument.create();

  // horizontal tipo recibo inmobiliario
  const page = pdfDoc.addPage([842, 595]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  const mitad = width / 2;

  // ============================
  // FUNCION DIBUJAR RECIBO
  // ============================

  function drawRecibo(xOffset: number, titulo: string) {
    let y = height - 40;

    // TITULO
    page.drawText(titulo, {
      x: xOffset + 110,
      y,
      size: 14,
      font: bold,
    });

    y -= 25;

    // linea superior
    page.drawLine({
      start: { x: xOffset + 20, y },
      end: { x: xOffset + mitad - 20, y },
      thickness: 1,
    });

    y -= 30;

    const datos = [
      ["IMPORTE", `$ ${importeFormateado}`],
      ["UN. FUNCIONAL", "—"],
      [
        "RECIBÍ DE",
        pagoData.proveedor?.nombre_razon_social ?? "—",
      ],
      [
        "CONCEPTO DE PAGO",
        pagoData.concepto ?? "—",
      ],
      [
        "TOTAL A PAGAR",
        `$ ${importeFormateado}`,
      ],
    ];

    datos.forEach(([label, value]) => {
      page.drawText(label + ":", {
        x: xOffset + 20,
        y,
        size: 10,
        font: bold,
      });

      page.drawText(String(value), {
        x: xOffset + 160,
        y,
        size: 10,
        font,
      });

      y -= 25;

      // linea separadora
      page.drawLine({
        start: { x: xOffset + 20, y },
        end: { x: xOffset + mitad - 20, y },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      y -= 15;
    });

    y -= 20;

    page.drawText("Firma Administración", {
      x: xOffset + 20,
      y,
      size: 10,
      font,
    });

    page.drawText(
      "Fecha: " +
        new Date().toLocaleDateString("es-AR"),
      {
        x: xOffset + 250,
        y,
        size: 10,
        font,
      }
    );
  }

  // ============================
  // DIBUJAR RECIBOS
  // ============================

  drawRecibo(0, "RECIBO ORIGINAL");

  drawRecibo(mitad, "RECIBO DUPLICADO");

  // linea vertical central
  page.drawLine({
    start: { x: mitad, y: 0 },
    end: { x: mitad, y: height },
    thickness: 1,
  });

  // ============================
  // EXPORTAR
  // ============================

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recibo-${id}.pdf"`,
    },
  });
}
