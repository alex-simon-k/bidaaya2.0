'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Clock, RefreshCw, FileText, Building2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CV {
  id: string
  title: string
  createdAt: Date
  expiresAt: Date
  opportunity?: {
    company: string
    companyLogoUrl?: string | null
  } | null
}

export function CVHistoryClient({ initialCvs }: { initialCvs: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleDownload = async (cv: CV) => {
    setLoadingId(cv.id)
    try {
      const res = await fetch('/api/cv/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedCvId: cv.id }),
      })
      
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${cv.title.replace(/[^a-z0-9]/gi, '_')}.docx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        const err = await res.json()
        alert(err.error || 'Download failed')
      }
    } catch (e) {
      console.error(e)
      alert('Download failed')
    } finally {
      setLoadingId(null)
    }
  }

  const handleExtend = async (cv: CV) => {
    if (!confirm('Extend this CV for 10 days for 2 credits?')) return
    
    setLoadingId(cv.id)
    try {
      const res = await fetch('/api/cv/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedCvId: cv.id }),
      })
      
      if (res.ok) {
        alert('✅ CV Extended!')
        window.location.reload()
      } else {
        const err = await res.json()
        alert(err.error || 'Extension failed')
      }
    } catch (e) {
      alert('Extension failed')
    } finally {
      setLoadingId(null)
    }
  }

  if (initialCvs.length === 0) {
    return (
      <div className="text-center py-12 bg-bidaaya-dark/30 rounded-xl border border-bidaaya-light/10">
        <FileText className="h-12 w-12 text-bidaaya-light/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-bidaaya-light">No CVs generated yet</h3>
        <p className="text-bidaaya-light/60 max-w-sm mx-auto mt-2">
          Generate a custom CV from an opportunity page to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {initialCvs.map((cv) => {
        const isExpired = new Date(cv.expiresAt) < new Date()
        const daysLeft = Math.ceil((new Date(cv.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        const isLoading = loadingId === cv.id

        return (
          <Card key={cv.id} className="p-6 bg-bidaaya-dark/50 border-bidaaya-light/10 hover:border-bidaaya-accent/30 transition-colors flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bidaaya-light/10 flex items-center justify-center overflow-hidden border border-bidaaya-light/5">
                  {cv.opportunity?.companyLogoUrl ? (
                    <img src={cv.opportunity.companyLogoUrl} alt={cv.opportunity.company} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-bidaaya-light/60" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-bidaaya-light line-clamp-1">{cv.title}</h3>
                  <p className="text-xs text-bidaaya-light/60">{new Date(cv.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {isExpired ? (
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">Expired</Badge>
              ) : (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">Active</Badge>
              )}
            </div>

            {/* Expiry Info */}
            <div className="flex items-center gap-2 text-sm text-bidaaya-light/60 mb-6">
              <Clock className="h-4 w-4" />
              {isExpired ? (
                <span>Expired on {new Date(cv.expiresAt).toLocaleDateString()}</span>
              ) : (
                <span>Expires in {daysLeft} days</span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleDownload(cv)}
                disabled={isExpired || isLoading}
                variant="outline"
                className="w-full border-bidaaya-accent/30 text-bidaaya-accent hover:bg-bidaaya-accent/10"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleExtend(cv)}
                disabled={isLoading}
                variant="ghost"
                className="w-full hover:bg-bidaaya-light/5 text-bidaaya-light/70"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Extend (2c)
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

