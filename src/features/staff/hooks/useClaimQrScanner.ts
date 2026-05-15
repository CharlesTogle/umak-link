import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { ClaimQrScanPayload } from '@/shared/lib/api-types'
import { parseClaimQrPayload } from '@/features/staff/utils/parseClaimQrPayload'

type ClaimQrScannerPhase =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'unsupported'
  | 'error'

interface ClaimQrScannerState {
  isOpen: boolean
  message: string
  phase: ClaimQrScannerPhase
}

type ClaimQrScannerAction =
  | { type: 'cameraClosed' }
  | { type: 'cameraOpened' }
  | { type: 'errorShown'; message: string }
  | { type: 'scanningStarted'; message: string }
  | { type: 'startupStarted'; message: string }
  | { type: 'unsupportedShown'; message: string }

interface UseClaimQrScannerOptions {
  onDetected: (payload: ClaimQrScanPayload) => Promise<void>
}

const CAMERA_IDLE_MESSAGE =
  'Open the camera and point it at the student claim QR. The claim form updates after the scan.'
const CAMERA_SCANNING_MESSAGE =
  'Hold the student claim QR inside the frame until the scan completes.'
const CAMERA_STARTING_MESSAGE = 'Opening the camera...'
const CAMERA_UNSUPPORTED_MESSAGE =
  'Camera scanning is not available on this device. Use the fallback option on this screen.'
const CAMERA_PERMISSION_MESSAGE =
  'Camera access was blocked. Allow camera access, then open the scanner again.'

const initialState: ClaimQrScannerState = {
  isOpen: false,
  message: CAMERA_IDLE_MESSAGE,
  phase: 'idle'
}

function scannerStateReducer (
  state: ClaimQrScannerState,
  action: ClaimQrScannerAction
): ClaimQrScannerState {
  switch (action.type) {
    case 'cameraClosed':
      return {
        isOpen: false,
        message: CAMERA_IDLE_MESSAGE,
        phase: 'idle'
      }
    case 'cameraOpened':
      return {
        ...state,
        isOpen: true
      }
    case 'errorShown':
      return {
        isOpen: false,
        message: action.message,
        phase: 'error'
      }
    case 'scanningStarted':
      return {
        isOpen: true,
        message: action.message,
        phase: 'scanning'
      }
    case 'startupStarted':
      return {
        isOpen: true,
        message: action.message,
        phase: 'starting'
      }
    case 'unsupportedShown':
      return {
        isOpen: false,
        message: action.message,
        phase: 'unsupported'
      }
    default:
      return state
  }
}

function supportsClaimCameraScan (): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof window.BarcodeDetector !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

function getScannerErrorMessage (error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return CAMERA_PERMISSION_MESSAGE
    }

    if (error.message.trim()) {
      return error.message
    }
  }

  return 'Unable to scan the QR code right now. Use the fallback option on this screen.'
}

export function useClaimQrScanner ({
  onDetected
}: UseClaimQrScannerOptions) {
  const [state, dispatch] = useReducer(scannerStateReducer, initialState)
  const scanTimeoutRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isDetectingRef = useRef(false)
  const isMountedRef = useRef(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const clearScanTimeout = useCallback(() => {
    if (scanTimeoutRef.current !== null) {
      window.clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
  }, [])

  const releaseCamera = useCallback(() => {
    clearScanTimeout()

    streamRef.current?.getTracks().forEach(track => {
      track.stop()
    })

    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    isDetectingRef.current = false
  }, [clearScanTimeout])

  const stopCamera = useCallback(() => {
    releaseCamera()
    dispatch({ type: 'cameraClosed' })
  }, [releaseCamera])

  const scheduleNextScan = useCallback(
    (runScan: () => Promise<void>) => {
      clearScanTimeout()
      scanTimeoutRef.current = window.setTimeout(() => {
        void runScan()
      }, 300)
    },
    [clearScanTimeout]
  )

  const openCamera = useCallback(async () => {
    if (streamRef.current) {
      return
    }

    if (!supportsClaimCameraScan()) {
      dispatch({
        type: 'unsupportedShown',
        message: CAMERA_UNSUPPORTED_MESSAGE
      })
      return
    }

    try {
      dispatch({
        type: 'startupStarted',
        message: CAMERA_STARTING_MESSAGE
      })

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: {
            ideal: 'environment'
          }
        }
      })

      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => {
          track.stop()
        })
        return
      }

      streamRef.current = stream
      dispatch({ type: 'cameraOpened' })

      const detector = new window.BarcodeDetector({
        formats: ['qr_code']
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        void videoRef.current.play().catch(() => {
          // Some browser test environments reject play() even when the stream exists.
        })
      }

      const detectQrCode = async () => {
        if (!isMountedRef.current || !streamRef.current) {
          return
        }

        if (!videoRef.current || isDetectingRef.current) {
          scheduleNextScan(detectQrCode)
          return
        }

        isDetectingRef.current = true

        try {
          const detectedCodes = await detector.detect(videoRef.current)
          const rawValue = detectedCodes[0]?.rawValue?.trim()

          if (!rawValue) {
            scheduleNextScan(detectQrCode)
            return
          }

          const payload = parseClaimQrPayload(rawValue)
          stopCamera()
          await onDetected(payload)
        } catch (error) {
          releaseCamera()
          dispatch({
            type: 'errorShown',
            message: getScannerErrorMessage(error)
          })
        } finally {
          isDetectingRef.current = false
        }
      }

      dispatch({
        type: 'scanningStarted',
        message: CAMERA_SCANNING_MESSAGE
      })
      scheduleNextScan(detectQrCode)
    } catch (error) {
      releaseCamera()
      dispatch({
        type: 'errorShown',
        message: getScannerErrorMessage(error)
      })
    }
  }, [onDetected, releaseCamera, scheduleNextScan, stopCamera])

  const closeCamera = useCallback(() => {
    stopCamera()
  }, [stopCamera])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      releaseCamera()
    }
  }, [releaseCamera])

  return {
    closeCamera,
    isSupported: supportsClaimCameraScan(),
    openCamera,
    state,
    videoRef
  }
}
