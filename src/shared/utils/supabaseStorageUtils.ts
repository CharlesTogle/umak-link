import api from '@/shared/lib/api';

export async function uploadAndGetPublicUrl(
  path: string,
  blob: Blob,
  contentType: string
): Promise<string> {
  // Get signed upload URL from backend
  const uploadData = await api.storage.getUploadUrl('items', path, contentType);

  // Upload directly to Supabase Storage using signed URL
  const uploadRes = await fetch(uploadData.uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.statusText}`);
  }

  // Confirm upload with backend
  await api.storage.confirmUpload('items', uploadData.objectPath);

  return uploadData.publicUrl;
}
