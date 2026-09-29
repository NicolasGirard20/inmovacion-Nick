import "dotenv/config";
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

  // 5. Tipos de Documento
  console.log("\n📦 5. Tipos de Documento:");
  const tiposDocumento = [
    { nombre: "DNI", longitud_min: 7, longitud_max: 8, solo_numeros: true, descripcion: "Documento Nacional de Identidad" },
    { nombre: "CUIL", longitud_min: 11, longitud_max: 11, solo_numeros: true, descripcion: "Código Único de Identificación Laboral" },
    { nombre: "CUIT", longitud_min: 11, longitud_max: 11, solo_numeros: true, descripcion: "Clave Única de Identificación Tributaria" },
  ];
  for (const doc of tiposDocumento) {
    const existe = await prisma.tipoDocumento.findFirst({ where: { nombre: doc.nombre } });
    if (!existe) {
      await prisma.tipoDocumento.create({ data: doc });
      console.log(`   ✅ Creado tipo de documento: ${doc.nombre}`);
    } else {
      console.log(`   ℹ️ Tipo de documento existente: ${doc.nombre}`);
    }
  }

  // 6. Localidades y Barrios
  console.log("\n📦 6. Localidades y Barrios:");
  const localidades = [
    { nombre: "Córdoba Capital", barrios: ["Nueva Córdoba", "Cerro de las Rosas", "Centro"] },
  ];
  for (const loc of localidades) {
    const existeLocalidad = await prisma.localidad.findFirst({ where: { nombre: loc.nombre } });
    if (!existeLocalidad) {
      const localidad = await prisma.localidad.create({ data: { nombre: loc.nombre } });
      console.log(`   ✅ Creada localidad: ${loc.nombre}`);
      for (const barrioNombre of loc.barrios) {
        const existeBarrio = await prisma.barrio.findFirst({
          where: { nombre: barrioNombre, id_localidad: localidad.id_localidad }
        });
        if (!existeBarrio) {
          await prisma.barrio.create({ data: { nombre: barrioNombre, id_localidad: localidad.id_localidad } });
          console.log(`      ✅ Creado barrio: ${barrioNombre}`);
        } else {
          console.log(`      ℹ️ Barrio existente: ${barrioNombre}`);
        }
      }
    } else {
      console.log(`   ℹ️ Localidad existente: ${loc.nombre}`);
    }
  }

  // 7. Clientes de ejemplo
  console.log("\n📦 7. Clientes de ejemplo:");
  const clientesData = [
    { nombre: "Carlos", apellido: "González", email: "carlos.gonzalez@email.com", telefono: "351-1234567", numero_documento: "12345678", tipoDocumentoNombre: "DNI", tipoClienteNombre: "Propietario" },
    { nombre: "María", apellido: "López", email: "maria.lopez@email.com", telefono: "351-2345678", numero_documento: "23456789", tipoDocumentoNombre: "DNI", tipoClienteNombre: "Propietario" },
    { nombre: "Inmobiliaria", apellido: "Del Centro", email: "info@inmobiliariacentro.com", telefono: "351-3456789", numero_documento: "30-12345678-9", tipoDocumentoNombre: "CUIT", tipoClienteNombre: "Inquilino" },
  ];
  for (const cd of clientesData) {
    const existe = await prisma.cliente.findFirst({ where: { email: cd.email } });
    if (!existe) {
      const tipoDoc = await prisma.tipoDocumento.findFirst({ where: { nombre: cd.tipoDocumentoNombre } });
      const tipoCliente = await prisma.tipoCliente.findFirst({ where: { nombre: cd.tipoClienteNombre } });
      if (tipoDoc && tipoCliente) {
        const cliente = await prisma.cliente.create({
          data: {
            nombre: cd.nombre,
            apellido: cd.apellido,
            email: cd.email,
            telefono: cd.telefono,
            numero_documento: cd.numero_documento,
            tipoDocumentoId: tipoDoc.id_tipo_documento,
            tiposCliente: { create: { tipoClienteId: tipoCliente.id_tipo_cliente } },
          }
        });
        console.log(`   ✅ Creado cliente: ${cliente.nombre} ${cliente.apellido || ''}`);
      }
    } else {
      console.log(`   ℹ️ Cliente existente: ${cd.nombre} ${cd.apellido || ''}`);
    }
  }

  // 8. Ubicaciones de ejemplo
  console.log("\n📦 8. Ubicaciones de ejemplo:");
  const ubicacionesData = [
    { direccion: "Av. Vélez Sarsfield 500", ciudad: "Córdoba", provincia: "Córdoba", barrioNombre: "Nueva Córdoba" },
    { direccion: "Av. Rafael Núñez 4000", ciudad: "Córdoba", provincia: "Córdoba", barrioNombre: "Cerro de las Rosas" },
    { direccion: "San Martín 300", ciudad: "Córdoba", provincia: "Córdoba", barrioNombre: "Centro" },
  ];
  for (const ub of ubicacionesData) {
    const existe = await prisma.ubicacion.findFirst({ where: { direccion: ub.direccion } });
    if (!existe) {
      const barrio = await prisma.barrio.findFirst({
        where: { nombre: ub.barrioNombre },
        include: { localidad: true }
      });
      await prisma.ubicacion.create({
        data: {
          direccion: ub.direccion,
          ciudad: ub.ciudad,
          provincia: ub.provincia,
          id_barrio: barrio?.id_barrio,
        }
      });
      console.log(`   ✅ Creada ubicación: ${ub.direccion}`);
    } else {
      console.log(`   ℹ️ Ubicación existente: ${ub.direccion}`);
    }
  }

  // 9. Inmuebles de ejemplo
  console.log("\n📦 9. Inmuebles de ejemplo:");
  const inmueblesData = [
    {
      titulo: "Departamento 2 ambientes en Nueva Córdoba",
      tipoNombre: "Departamento",
      direccion: "Av. Vélez Sarsfield 500",
      estadoNombre: "Disponible",
      operacionNombre: "Alquiler",
      clienteEmail: "carlos.gonzalez@email.com",
      superficie_total: 55.00,
      superficie_cubierta: 45.00,
      cantidad_ambientes: 2,
      cantidad_banos: 1,
      cantidad_dormitorios: 1,
      cantidad_cocheras: 0,
      antiguedad: 5,
      precio: 150000.00,
      detalles: "Departamento luminoso con balcón, cocina comedor y baño completo. A pasos de la Ciudad Universitaria.",
    },
    {
      titulo: "Casa 3 dormitorios en Cerro de las Rosas",
      tipoNombre: "Casa",
      direccion: "Av. Rafael Núñez 4000",
      estadoNombre: "Disponible",
      operacionNombre: "Venta",
      clienteEmail: "maria.lopez@email.com",
      superficie_total: 180.00,
      superficie_cubierta: 130.00,
      cantidad_ambientes: 5,
      cantidad_banos: 2,
      cantidad_dormitorios: 3,
      cantidad_cocheras: 1,
      cantidad_pisos: 2,
      antiguedad: 10,
      precio: 185000000.00,
      detalles: "Casa con patio amplio, cochera cubierta, terraza y dependencia de servicio. Excelente estado.",
    },
    {
      titulo: "Local comercial céntrico en alquiler",
      tipoNombre: "Local comercial",
      direccion: "San Martín 300",
      estadoNombre: "Disponible",
      operacionNombre: "Alquiler",
      clienteEmail: "info@inmobiliariacentro.com",
      superficie_total: 80.00,
      superficie_cubierta: 80.00,
      cantidad_ambientes: 3,
      cantidad_banos: 1,
      antiguedad: 20,
      precio: 350000.00,
      detalles: "Local comercial sobre calle San Martín, excelente vidriera, baño, depósito y oficina. Ideal para indumentaria o gastronomía.",
    },
  ];
  for (const inm of inmueblesData) {
    const existe = await prisma.inmueble.findFirst({ where: { titulo: inm.titulo } });
    if (!existe) {
      const tipo = await prisma.tipo_inmueble.findFirst({ where: { nombre: inm.tipoNombre } });
      const ubicacion = await prisma.ubicacion.findFirst({ where: { direccion: inm.direccion } });
      const estado = await prisma.estado.findFirst({ where: { nombre: inm.estadoNombre } });
      const operacion = inm.operacionNombre ? await prisma.operacion.findFirst({ where: { nombre: inm.operacionNombre } }) : null;
      const cliente = await prisma.cliente.findFirst({ where: { email: inm.clienteEmail } });

      if (tipo && ubicacion && estado && cliente) {
        await prisma.inmueble.create({
          data: {
            id_tipo_inmueble: tipo.id_tipo_inmueble,
            id_ubicacion: ubicacion.id_ubicacion,
            id_estado: estado.id_estado,
            id_operacion: operacion?.id_operacion ?? null,
            id_cliente: cliente.id_cliente,
            titulo: inm.titulo,
            superficie_total: inm.superficie_total,
            superficie_cubierta: inm.superficie_cubierta,
            cantidad_ambientes: inm.cantidad_ambientes,
            cantidad_banos: inm.cantidad_banos,
            cantidad_dormitorios: inm.cantidad_dormitorios,
            cantidad_cocheras: inm.cantidad_cocheras,
            cantidad_pisos: "cantidad_pisos" in inm ? inm.cantidad_pisos : null,
            antiguedad: inm.antiguedad,
            precio: inm.precio,
            detalles: inm.detalles,
          }
        });
        console.log(`   ✅ Creado inmueble: ${inm.titulo}`);
      }
    } else {
      console.log(`   ℹ️ Inmueble existente: ${inm.titulo}`);
    }
  }

  // 10. Tipos de Servicio
  console.log("\n📦 10. Tipos de Servicio:");
  const tiposServicio = [
    { nombre: "Seguridad" },
    { nombre: "Limpieza" },
    { nombre: "Mantenimiento" },
  ];
  for (const ts of tiposServicio) {
    const existe = await prisma.tipoServicio.findFirst({ where: { nombre: ts.nombre } });
    if (!existe) {
      await prisma.tipoServicio.create({ data: ts });
      console.log(`   ✅ Creado tipo de servicio: ${ts.nombre}`);
    } else {
      console.log(`   ℹ️ Tipo de servicio existente: ${ts.nombre}`);
    }
  }

  // 11. Proveedores de ejemplo
  console.log("\n📦 11. Proveedores de ejemplo:");
  const proveedoresData = [
    {
      nombre_razon_social: "Prosegur Argentina S.A.",
      cuit_cuil: "30-12345678-9",
      correo_contacto: "contacto@prosegur.com",
      telefono_contacto: "351-4567890",
      direccion: "Av. Colón 1500, Córdoba",
      tipoServicioNombre: "Seguridad",
      datos_bancarios: "Banco Galicia - Cuenta Corriente N° 123456/7",
      observaciones: "Contrato de monitoreo mensual",
    },
    {
      nombre_razon_social: "Limpieza Total S.R.L.",
      cuit_cuil: "27-98765432-1",
      correo_contacto: "info@limpiezatotal.com",
      telefono_contacto: "351-5678901",
      direccion: "Av. Maipú 800, Córdoba",
      tipoServicioNombre: "Limpieza",
      datos_bancarios: "Banco Provincia - Caja de Ahorro N° 987654/3",
      observaciones: "Servicio de limpieza integral de oficinas",
    },
    {
      nombre_razon_social: "TecnoMantenimiento S.A.",
      cuit_cuil: "30-45678912-3",
      correo_contacto: "admin@tecnomantenimiento.com",
      telefono_contacto: "351-6789012",
      direccion: "Av. Sabattini 2000, Córdoba",
      tipoServicioNombre: "Mantenimiento",
      datos_bancarios: "Banco Nación - Cuenta Corriente N° 456789/1",
      observaciones: "Mantenimiento general de instalaciones",
    },
  ];
  for (const prov of proveedoresData) {
    const existe = await prisma.proveedor.findFirst({ where: { cuit_cuil: prov.cuit_cuil } });
    if (!existe) {
      const tipoServicio = await prisma.tipoServicio.findFirst({ where: { nombre: prov.tipoServicioNombre } });
      if (tipoServicio) {
        await prisma.proveedor.create({
          data: {
            nombre_razon_social: prov.nombre_razon_social,
            cuit_cuil: prov.cuit_cuil,
            correo_contacto: prov.correo_contacto,
            telefono_contacto: prov.telefono_contacto,
            direccion: prov.direccion,
            tipoServicioId: tipoServicio.id_tipo_servicio,
            datos_bancarios: prov.datos_bancarios,
            observaciones: prov.observaciones,
          }
        });
        console.log(`   ✅ Creado proveedor: ${prov.nombre_razon_social}`);
      }
    } else {
      console.log(`   ℹ️ Proveedor existente: ${prov.nombre_razon_social}`);
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
