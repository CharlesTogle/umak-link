import { supabase } from '@/shared/lib/supabase'

export async function uploadAndGetPublicUrl (
  path: string,
  blob: Blob,
  contentType: string
) {
  const res = await supabase.storage
    .from('items')
    .upload(path, blob, { contentType, upsert: true })
  if (res.error) throw res.error
  const urlRes = supabase.storage.from('items').getPublicUrl(path)
  const url = urlRes.data?.publicUrl
  if (!url) throw new Error(`No public URL for ${path}`)
  return url
}
