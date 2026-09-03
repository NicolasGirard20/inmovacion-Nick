// scripts/create-admin.ts
// Script para crear un usuario admin con password hasheado correctamente
// Uso: pnpm tsx scripts/create-admin.ts [email] [password] [nombre]

import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL no está definida en .env');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createAdmin() {
  const email = process.argv[2] || 'nicolas.girard279@gmail.com';
  const password = process.argv[3] || 'Admin123!';
  const name = process.argv[4] || 'Admin GBS';

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`⚠️  El usuario ${email} ya existe.`);
      console.log('   Para actualizar la password, usa:');
      console.log(`   pnpm tsx scripts/create-admin.ts ${email} "${password}" "${name}" --update`);

      if (process.argv.includes('--update')) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { email },
          data: {
            password: hashedPassword,
            emailVerified: new Date(),
            status: 'active',
            role: 'admin',
            name,
          },
        });
        console.log(`✅ Password actualizada para ${email}`);
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'admin',
        status: 'active',
      },
    });

    console.log('✅ Usuario admin creado exitosamente:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`\n   Ya podés iniciar sesión en /login`);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createAdmin();