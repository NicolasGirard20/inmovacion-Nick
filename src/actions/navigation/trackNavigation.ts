'use server';
import { db } from '@/lib/db';
import { auth } from '../../../auth';
import { z } from 'zod';

const schema = z.object({ module: z.string().min(1).max(100), path: z.string().min(1).max(500) });

export async function trackNavigation(input: { module: string; path: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;
    const parsed = schema.parse(input);
    await db.navigationLog.create({ data: { userId: session.user.id, module: parsed.module, path: parsed.path } });
  } catch { }
}
