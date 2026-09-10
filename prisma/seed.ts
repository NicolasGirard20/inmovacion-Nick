import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando Seeding de la Base de Datos...\n");

  // 1. Tipos de Cliente
  console.log("📦 1. Tipos de Cliente:");
  const tiposCliente = ["Inquilino", "Propietario"];
  for (const nombre of tiposCliente) {
    const existe = await prisma.tipoCliente.findFirst({ where: { nombre } });
    if (!existe) {
      await prisma.tipoCliente.create({ data: { nombre } });
      console.log(`   ✅ Creado tipo de cliente: ${nombre}`);
    } else {
      console.log(`   ℹ️ Tipo de cliente existente: ${nombre}`);
    }
  }

  // 2. Estados de Inmueble
  console.log("\n📦 2. Estados de Inmueble:");
  const estados = ["Disponible", "No disponible", "Reservada", "Vendida"];
  for (const nombre of estados) {
    const existe = await prisma.estado.findFirst({ where: { nombre } });
    if (!existe) {
      await prisma.estado.create({ data: { nombre } });
      console.log(`   ✅ Creado estado: ${nombre}`);
    } else {
      console.log(`   ℹ️ Estado existente: ${nombre}`);
    }
  }

  // 3. Operaciones de Inmueble
  console.log("\n📦 3. Operaciones de Inmueble:");
  const operaciones = ["Venta", "Alquiler", "Alquiler temporal"];
  for (const nombre of operaciones) {
    const existe = await prisma.operacion.findFirst({ where: { nombre } });
    if (!existe) {
      await prisma.operacion.create({ data: { nombre } });
      console.log(`   ✅ Creada operación: ${nombre}`);
    } else {
      console.log(`   ℹ️ Operación existente: ${nombre}`);
    }
  }

  // 4. Tipos de Inmueble
  console.log("\n📦 4. Tipos de Inmueble:");
  const tiposInmueble = [
    "Departamento",
    "Casa",
    "Local comercial",
    "Oficina",
    "Terreno",
    "Cochera",
    "Galpón"
  ];
  for (const nombre of tiposInmueble) {
    const existe = await prisma.tipo_inmueble.findFirst({ where: { nombre } });
    if (!existe) {
      await prisma.tipo_inmueble.create({ data: { nombre } });
      console.log(`   ✅ Creado tipo de inmueble: ${nombre}`);
    } else {
      console.log(`   ℹ️ Tipo de inmueble existente: ${nombre}`);
    }
  }

  console.log("\n✨ Seeding finalizado con éxito.");
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
