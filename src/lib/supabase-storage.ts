import { supabaseServer } from './supabase/server';

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob | ArrayBuffer
) {
  const { data, error } = await supabaseServer.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;
  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  const { data: { publicUrl } } = supabaseServer.storage
    .from(bucket)
    .getPublicUrl(path);
  return publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabaseServer.storage
    .from(bucket)
    .remove([path]);
  if (error) throw error;
}

export async function listFiles(bucket: string, folder: string) {
  const { data, error } = await supabaseServer.storage
    .from(bucket)
    .list(folder);
  if (error) throw error;
  return data;
}