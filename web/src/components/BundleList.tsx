// web/src/components/BundleList.tsx
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, RefreshCw, ChevronDown, ChevronRight, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Bundle {
  name: string
  changed: boolean
  fileCount: number
  content: string
  files: string[]
  lastGenerated: string
  size: number
}

const fetchBundles = async (): Promise<Bundle[]> => {
  const response = await fetch('http://localhost:3333/api/bundles')
  if (!response.ok) throw new Error('Failed to fetch bundles')
  return response.json()
}

export function BundleList() {
  const { data: bundles, isLoading, refetch } = useQuery({
    queryKey: ['bundles'],
    queryFn: fetchBundles,
    refetchInterval: 5000,
  })

  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set())
  const [loadingButtons, setLoadingButtons] = useState<Set<string>>(new Set())
  const [successButtons, setSuccessButtons] = useState<Set<string>>(new Set())
  const [errorButtons, setErrorButtons] = useState<Set<string>>(new Set())

  const toggleExpanded = (bundleName: string) => {
    const newExpanded = new Set(expandedBundles)
    if (newExpanded.has(bundleName)) {
      newExpanded.delete(bundleName)
    } else {
      newExpanded.add(bundleName)
    }
    setExpandedBundles(newExpanded)
  }

  const setButtonState = (key: string, state: 'loading' | 'success' | 'error' | 'idle') => {
    setLoadingButtons(prev => {
      const newSet = new Set(prev)
      if (state === 'loading') newSet.add(key)
      else newSet.delete(key)
      return newSet
    })

    setSuccessButtons(prev => {
      const newSet = new Set(prev)
      if (state === 'success') {
        newSet.add(key)
        // Auto-clear success state after 2 seconds
        setTimeout(() => setSuccessButtons(current => {
          const updated = new Set(current)
          updated.delete(key)
          return updated
        }), 2000)
      } else {
        newSet.delete(key)
      }
      return newSet
    })

    setErrorButtons(prev => {
      const newSet = new Set(prev)
      if (state === 'error') {
        newSet.add(key)
        // Auto-clear error state after 3 seconds
        setTimeout(() => setErrorButtons(current => {
          const updated = new Set(current)
          updated.delete(key)
          return updated
        }), 3000)
      } else {
        newSet.delete(key)
      }
      return newSet
    })
  }

  const copyBundle = async (bundleName: string) => {
    const key = `copy-${bundleName}`
    setButtonState(key, 'loading')

    try {
      const response = await fetch(`http://localhost:3333/api/bundles/${bundleName}`)
      if (!response.ok) throw new Error('Failed to fetch bundle content')

      const content = await response.text()
      await navigator.clipboard.writeText(content)

      setButtonState(key, 'success')
      toast.success(`Bundle "${bundleName}" copied to clipboard!`)
    } catch (error) {
      setButtonState(key, 'error')
      toast.error(`Failed to copy bundle: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const downloadBundle = async (bundleName: string) => {
    const key = `download-${bundleName}`
    setButtonState(key, 'loading')

    try {
      const response = await fetch(`http://localhost:3333/api/bundles/${bundleName}`)
      if (!response.ok) throw new Error('Failed to fetch bundle content')

      const content = await response.text()
      const blob = new Blob([content], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${bundleName}-bundle.xml`
      a.click()
      URL.revokeObjectURL(url)

      setButtonState(key, 'success')
      toast.success(`Bundle "${bundleName}" downloaded!`)
    } catch (error) {
      setButtonState(key, 'error')
      toast.error(`Failed to download bundle: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const regenerateBundle = async (bundleName: string) => {
    const key = `regen-${bundleName}`
    setButtonState(key, 'loading')

    try {
      const response = await fetch(`http://localhost:3333/api/regenerate/${bundleName}`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to regenerate bundle')

      await refetch()
      setButtonState(key, 'success')
      toast.success(`Bundle "${bundleName}" regenerated successfully!`)
    } catch (error) {
      setButtonState(key, 'error')
      toast.error(`Failed to regenerate bundle: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading) return <div>Loading bundles...</div>
  if (!bundles) return <div>No bundles found</div>

  return (
    <div className="space-y-4">
      {bundles.map((bundle) => {
        const copyKey = `copy-${bundle.name}`
        const downloadKey = `download-${bundle.name}`
        const regenKey = `regen-${bundle.name}`
        const isCopyLoading = loadingButtons.has(copyKey)
        const isDownloadLoading = loadingButtons.has(downloadKey)
        const isRegenLoading = loadingButtons.has(regenKey)
        const isCopySuccess = successButtons.has(copyKey)
        const isDownloadSuccess = successButtons.has(downloadKey)
        const isRegenSuccess = successButtons.has(regenKey)
        const isCopyError = errorButtons.has(copyKey)
        const isDownloadError = errorButtons.has(downloadKey)
        const isRegenError = errorButtons.has(regenKey)

        return (
          <Card key={bundle.name} className={bundle.changed ? 'border-yellow-500' : ''}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  {bundle.name}
                  <Badge variant={bundle.changed ? 'destructive' : 'secondary'}>
                    {bundle.changed ? 'CHANGED' : 'SYNCED'}
                  </Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => regenerateBundle(bundle.name)}
                    disabled={isRegenLoading}
                    className={`transition-all duration-200 ${isRegenSuccess ? 'border-green-500 bg-green-50 text-green-700' :
                      isRegenError ? 'border-red-500 bg-red-50 text-red-700' :
                        isRegenLoading ? 'opacity-75' : ''
                      }`}
                  >
                    {isRegenLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : isRegenSuccess ? (
                      <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    ) : isRegenError ? (
                      <AlertCircle className="w-4 h-4 mr-1 text-red-600" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyBundle(bundle.name)}
                    disabled={isCopyLoading}
                    className={`transition-all duration-200 ${isCopySuccess ? 'border-green-500 bg-green-50 text-green-700' :
                      isCopyError ? 'border-red-500 bg-red-50 text-red-700' :
                        isCopyLoading ? 'opacity-75' : ''
                      }`}
                  >
                    {isCopyLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : isCopySuccess ? (
                      <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    ) : isCopyError ? (
                      <AlertCircle className="w-4 h-4 mr-1 text-red-600" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copy XML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadBundle(bundle.name)}
                    disabled={isDownloadLoading}
                    className={`transition-all duration-200 ${isDownloadSuccess ? 'border-green-500 bg-green-50 text-green-700' :
                      isDownloadError ? 'border-red-500 bg-red-50 text-red-700' :
                        isDownloadLoading ? 'opacity-75' : ''
                      }`}
                  >
                    {isDownloadLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : isDownloadSuccess ? (
                      <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    ) : isDownloadError ? (
                      <AlertCircle className="w-4 h-4 mr-1 text-red-600" />
                    ) : (
                      <Download className="w-4 h-4 mr-1" />
                    )}
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-3">
                {bundle.fileCount} files • {(bundle.size / 1024).toFixed(1)}kb
                {bundle.lastGenerated &&
                  ` • Generated ${new Date(bundle.lastGenerated).toLocaleTimeString()}`
                }
              </div>

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(bundle.name)}
                  className="p-0 h-auto font-normal"
                >
                  {expandedBundles.has(bundle.name) ? (
                    <ChevronDown className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-1" />
                  )}
                  View Files ({bundle.files.length})
                </Button>

                {expandedBundles.has(bundle.name) && (
                  <div className="ml-5 space-y-1 max-h-40 overflow-y-auto">
                    {bundle.files.map((file) => (
                      <div key={file} className="text-sm font-mono text-muted-foreground">
                        {file}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
