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
