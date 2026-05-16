// helpers.ts
export async function loadBitmap (file: File): Promise<ImageBitmap> {
  return await createImageBitmap(file)
}

function drawToCanvas (bmp: ImageBitmap, maxEdge: number): HTMLCanvasElement {
  const { width, height } = bmp
  const scale = maxEdge / Math.max(width, height)
  const w = Math.round(width * Math.min(1, scale))
  const h = Math.round(height * Math.min(1, scale))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bmp, 0, 0, w, h)
  return c
}

async function canvasToBlobWebP (
  c: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    c.toBlob(
      b => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/webp',
      quality
    )
  })
}

async function blobToDataUrl (blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Failed to encode image'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to encode image'))
    reader.readAsDataURL(blob)
  })
}

export async function makeDisplay (file: File) {
  const bmp = await loadBitmap(file)
  const displayCanvas = drawToCanvas(bmp, 1600) // long edge 1600px
  const displayBlob = await canvasToBlobWebP(displayCanvas, 0.82) // ~120–170 KB typical
  return displayBlob
}

export async function makeThumb (file: File) {
  const bmp = await loadBitmap(file)
  const thumbCanvas = drawToCanvas(bmp, 400) // long edge 400px
  const thumbBlob = await canvasToBlobWebP(thumbCanvas, 0.8)
  return thumbBlob
}

export async function makeDisplayAndThumb (file: File) {
  const bmp = await loadBitmap(file)

  // 1) Display image
  const displayCanvas = drawToCanvas(bmp, 1600) // long edge 1600px
  const displayBlob = await canvasToBlobWebP(displayCanvas, 0.82) // ~120–170 KB typical

  // 2) Thumbnail
  const thumbCanvas = drawToCanvas(bmp, 400) // long edge 400px
  const thumbBlob = await canvasToBlobWebP(thumbCanvas, 0.8) // ~25–45 KB

  return { displayBlob, thumbBlob }
}

const AI_DATA_URL_TARGET_BYTES = 700 * 1024
const AI_DATA_URL_VARIANTS = [
  { maxEdge: 1600, quality: 0.82 },
  { maxEdge: 1280, quality: 0.76 },
  { maxEdge: 1024, quality: 0.7 },
  { maxEdge: 896, quality: 0.64 }
]

export async function makeAiDataUrl (file: File): Promise<string> {
  const bmp = await loadBitmap(file)

  try {
    let fallbackBlob: Blob | null = null

    // AI routes send JSON bodies through Fastify, so keep the encoded image well under 1 MiB.
    for (const variant of AI_DATA_URL_VARIANTS) {
      const canvas = drawToCanvas(bmp, variant.maxEdge)
      const blob = await canvasToBlobWebP(canvas, variant.quality)
      fallbackBlob = blob

      if (blob.size <= AI_DATA_URL_TARGET_BYTES) {
        return await blobToDataUrl(blob)
      }
    }

    if (!fallbackBlob) {
      throw new Error('Failed to prepare image for AI upload')
    }

    return await blobToDataUrl(fallbackBlob)
  } finally {
    bmp.close?.()
  }
}
