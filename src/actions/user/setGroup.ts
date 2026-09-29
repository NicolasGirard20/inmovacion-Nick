'use server';
import { cookies } from 'next/headers';
import { auth } from '../../../auth';
import { z } from 'zod';

const schema = z.enum(['abogacia', 'inmobiliaria']);

export async function setGroup(group: unknown) {
  const session = await auth();
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized');
  const parsed = schema.parse(group);
  const cks = await cookies();
  cks.set('active-group', parsed, { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: 'strict' });
}
