declare global {
  interface BarcodeDetectorOptions {
    formats?: string[]
  }

  interface DetectedBarcode {
    rawValue?: string
  }

  class BarcodeDetector {
    constructor (options?: BarcodeDetectorOptions)
    detect (image: ImageBitmapSource): Promise<DetectedBarcode[]>
  }

  interface Window {
    BarcodeDetector: typeof BarcodeDetector
  }
}

export {}
