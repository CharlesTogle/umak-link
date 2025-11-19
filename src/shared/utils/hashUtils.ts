import { bmvbhash } from 'blockhash-core';

// Returns 64-bit (16-hex) perceptual hash
export async function computeBlockHash64(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return bmvbhash(imgData, 8);
}
