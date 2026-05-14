import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function UserCustodyQrCode ({
  value
}: {
  value: string
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    let isCancelled = false

    const renderQrCode = async () => {
      const dataUrl = await QRCode.toDataURL(value, {
        color: {
          dark: '#0f172b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 280
      })

      if (!isCancelled) {
        setQrDataUrl(dataUrl)
      }
    }

    void renderQrCode()

    return () => {
      isCancelled = true
    }
  }, [value])

  if (!qrDataUrl) {
    return (
      <div className='flex h-[280px] w-[280px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500'>
        Generating QR code...
      </div>
    )
  }

  return (
    <img
      alt='Custody handover QR code'
      className='h-[280px] w-[280px] rounded-2xl bg-white p-3'
      data-testid='user-custody-qr-image'
      src={qrDataUrl}
    />
  )
}
