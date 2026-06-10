'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PrescriptionPdfProps } from './prescription-pdf'

export function PrescriptionPdfActions(props: PrescriptionPdfProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  async function handleDownload() {
    setLoading(true)
    try {
      // Dynamic import to avoid SSR bundling
      const [{ pdf }, { PrescriptionDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./prescription-pdf'),
      ])

      const doc = PrescriptionDocument(props)
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      const safeName = props.prescription.patientName.replace(/[^a-zA-Z0-9]/g, '_')
      const dateStr = props.prescription.date.slice(0, 10)
      a.download = `Prescription_${safeName}_${dateStr}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="mr-1.5 h-3.5 w-3.5" />
      )}
      {loading ? 'Generating\u2026' : 'Download PDF'}
    </Button>
  )
}
