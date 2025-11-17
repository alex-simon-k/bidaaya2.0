'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  RefreshCcw, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  FileUp,
  Link as LinkIcon,
  Calendar,
  Eye,
  Clock
} from 'lucide-react'

export default function OctoParseUploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'upload' | 'update' | 'manage'>('upload')
  
  // CSV Upload State
  const [csvData, setCsvData] = useState('')
  const [publishAsEarlyAccess, setPublishAsEarlyAccess] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  
  // URL Update State
  const [urlUpdateData, setUrlUpdateData] = useState('')
  const [isUpdatingUrls, setIsUpdatingUrls] = useState(false)
  const [updateResult, setUpdateResult] = useState<any>(null)
  
  // Early Access Management State
  const [earlyAccessOpps, setEarlyAccessOpps] = useState<any[]>([])
  const [isLoadingEarly, setIsLoadingEarly] = useState(false)

  useEffect(() => {
    if (!session?.user?.role) return
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    
    if (activeTab === 'manage') {
      fetchEarlyAccessOpportunities()
    }
  }, [session, activeTab])

  const fetchEarlyAccessOpportunities = async () => {
    setIsLoadingEarly(true)
    try {
      const response = await fetch('/api/admin/external-opportunities?earlyAccess=true')
      const data = await response.json()
      if (response.ok) {
        setEarlyAccessOpps(data.opportunities || [])
      }
    } catch (error) {
      console.error('Error fetching early access opportunities:', error)
    } finally {
      setIsLoadingEarly(false)
    }
  }

  const handleCSVUpload = async () => {
    if (!csvData.trim()) {
      alert('Please paste CSV data')
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      // Parse CSV data
      let opportunities
      try {
        opportunities = JSON.parse(csvData)
      } catch (e) {
        alert('Invalid JSON format. Please use the conversion script first.')
        setIsUploading(false)
        return
      }

      const response = await fetch('/api/admin/external-opportunities/csv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          csvData: opportunities,
          publishAsEarlyAccess 
        })
      })

      const data = await response.json()
      setUploadResult(data)

      if (response.ok) {
        alert(`✅ Upload Complete!\n\nCreated: ${data.created}\nFailed: ${data.failed}\n\nOpportunities start as INACTIVE. Review and activate them.`)
        setCsvData('')
      }
    } catch (error) {
      setUploadResult({ 
        error: 'Failed to upload', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleURLUpdate = async () => {
    if (!urlUpdateData.trim()) {
      alert('Please paste URL update data')
      return
    }

    setIsUpdatingUrls(true)
    setUpdateResult(null)

    try {
      // Parse URL update data
      let urlUpdates
      try {
        urlUpdates = JSON.parse(urlUpdateData)
      } catch (e) {
        alert('Invalid JSON format. Please use the conversion script first.')
        setIsUpdatingUrls(false)
        return
      }

      const response = await fetch('/api/admin/external-opportunities/update-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlUpdates })
      })

      const data = await response.json()
      setUpdateResult(data)

      if (response.ok) {
        alert(`✅ URL Update Complete!\n\nUpdated: ${data.updated}\nSkipped: ${data.skipped} (no true URL)\nFailed: ${data.failed}`)
        setUrlUpdateData('')
      }
    } catch (error) {
      setUpdateResult({ 
        error: 'Failed to update URLs', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setIsUpdatingUrls(false)
    }
  }

  const handleReleaseEarlyAccess = async (id: string) => {
    if (!confirm('Release this opportunity to all students now?')) return

    try {
      const response = await fetch(`/api/admin/external-opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isActive: true,
          isNewOpportunity: false,
          earlyAccessUntil: null 
        })
      })

      if (response.ok) {
        fetchEarlyAccessOpportunities()
        alert('✅ Opportunity released to all students!')
      }
    } catch (error) {
      console.error('Error releasing opportunity:', error)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OctoParse Upload Manager
          </h1>
          <p className="text-gray-600">
            Upload scraped opportunities and manage true URLs
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-0">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileUp className="inline-block w-4 h-4 mr-2" />
                Phase 1: Upload Opportunities
              </button>
              <button
                onClick={() => setActiveTab('update')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'update'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <LinkIcon className="inline-block w-4 h-4 mr-2" />
                Phase 2: Update URLs
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'manage'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Clock className="inline-block w-4 h-4 mr-2" />
                Early Access Management
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Phase 1: CSV Upload */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Instructions
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-2 ml-5 list-decimal">
                    <li>Export your OctoParse scraping results as CSV</li>
                    <li>Run: <code className="bg-blue-100 px-2 py-1 rounded">node scripts/convert-octoparse-csv.js yourfile.csv output.json</code></li>
                    <li>Copy the content from output.json and paste below</li>
                    <li>Click "Upload Opportunities"</li>
                  </ol>
                  <p className="text-sm text-blue-700 mt-3">
                    <strong>Note:</strong> Opportunities will start as INACTIVE. Review and activate them in the main admin panel.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste JSON Data (from conversion script)
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder='[{"Title": "...", "Title_URL": "...", "Image": "...", "Name": "...", "Location": "..."}]'
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    {csvData.trim() ? `${csvData.split('\n').length} lines` : 'No data pasted yet'}
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publishAsEarlyAccess}
                      onChange={(e) => setPublishAsEarlyAccess(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        🌟 Enable 24-Hour Early Access
                      </div>
                      <div className="text-sm text-gray-600">
                        Mark as new opportunities - premium users get 24-hour exclusive access
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleCSVUpload}
                  disabled={isUploading || !csvData.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isUploading ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Opportunities
                    </>
                  )}
                </button>

                {/* Upload Result */}
                {uploadResult && (
                  <div className={`rounded-lg p-4 ${
                    uploadResult.error 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    {uploadResult.error ? (
                      <>
                        <div className="flex items-center gap-2 text-red-900 font-semibold mb-2">
                          <XCircle className="w-5 h-5" />
                          Upload Failed
                        </div>
                        <p className="text-sm text-red-800">{uploadResult.error}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-green-900 font-semibold mb-2">
                          <CheckCircle className="w-5 h-5" />
                          Upload Successful
                        </div>
                        <div className="text-sm text-green-800 space-y-1">
                          <p>✅ Created: {uploadResult.created}</p>
                          <p>❌ Failed: {uploadResult.failed}</p>
                          {uploadResult.errors && uploadResult.errors.length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer font-medium">View Errors</summary>
                              <ul className="mt-2 space-y-1 ml-4 list-disc">
                                {uploadResult.errors.map((err: string, i: number) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Phase 2: URL Updates */}
            {activeTab === 'update' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Instructions
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-2 ml-5 list-decimal">
                    <li>Run your second OctoParse workflow to scrape true URLs</li>
                    <li>Export results with columns: Title, Title_URL (old), TrueURL (new)</li>
                    <li>Run: <code className="bg-blue-100 px-2 py-1 rounded">node scripts/convert-octoparse-csv.js --urls yourfile.csv output.json</code></li>
                    <li>Copy the content from output.json and paste below</li>
                    <li>Click "Update URLs"</li>
                  </ol>
                  <p className="text-sm text-blue-700 mt-3">
                    <strong>Note:</strong> Opportunities without a true URL (e.g., Glassdoor Easy Apply) will be skipped automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste JSON Data (from conversion script)
                  </label>
                  <textarea
                    value={urlUpdateData}
                    onChange={(e) => setUrlUpdateData(e.target.value)}
                    placeholder='[{"Title": "...", "OldURL": "...", "TrueURL": "..."}]'
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    {urlUpdateData.trim() ? `${urlUpdateData.split('\n').length} lines` : 'No data pasted yet'}
                  </p>
                </div>

                <button
                  onClick={handleURLUpdate}
                  disabled={isUpdatingUrls || !urlUpdateData.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isUpdatingUrls ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      Updating URLs...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-5 h-5" />
                      Update URLs
                    </>
                  )}
                </button>

                {/* Update Result */}
                {updateResult && (
                  <div className={`rounded-lg p-4 ${
                    updateResult.error 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    {updateResult.error ? (
                      <>
                        <div className="flex items-center gap-2 text-red-900 font-semibold mb-2">
                          <XCircle className="w-5 h-5" />
                          Update Failed
                        </div>
                        <p className="text-sm text-red-800">{updateResult.error}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-green-900 font-semibold mb-2">
                          <CheckCircle className="w-5 h-5" />
                          Update Successful
                        </div>
                        <div className="text-sm text-green-800 space-y-1">
                          <p>✅ Updated: {updateResult.updated}</p>
                          <p>⏭️  Skipped: {updateResult.skipped} (no true URL)</p>
                          <p>❌ Failed: {updateResult.failed}</p>
                          {updateResult.errors && updateResult.errors.length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer font-medium">View Errors</summary>
                              <ul className="mt-2 space-y-1 ml-4 list-disc">
                                {updateResult.errors.map((err: string, i: number) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Early Access Management */}
            {activeTab === 'manage' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Early Access System
                  </h3>
                  <p className="text-sm text-purple-800">
                    Opportunities with early access are visible only to premium users for 24 hours. 
                    After the early access period ends, they become available to all students.
                    You can manually release them early here.
                  </p>
                </div>

                {isLoadingEarly ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading early access opportunities...</p>
                  </div>
                ) : earlyAccessOpps.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No opportunities currently in early access</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {earlyAccessOpps.map((opp) => {
                      const hoursLeft = opp.earlyAccessUntil 
                        ? Math.max(0, Math.ceil((new Date(opp.earlyAccessUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60)))
                        : 0
                      
                      return (
                        <div key={opp.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{opp.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{opp.company}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-purple-600">
                                  <Clock className="w-4 h-4" />
                                  {hoursLeft}h left
                                </span>
                                <span className="flex items-center gap-1 text-gray-600">
                                  <Eye className="w-4 h-4" />
                                  {opp.viewCount} views
                                </span>
                                <span className="flex items-center gap-1 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  Added {new Date(opp.addedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleReleaseEarlyAccess(opp.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              Release Now
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/admin/external-opportunities"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Eye className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Manage All Opportunities</div>
                <div className="text-sm text-gray-600">Review, activate, and edit opportunities</div>
              </div>
            </a>
            <a
              href="/dashboard/browse-opportunities"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Student View</div>
                <div className="text-sm text-gray-600">See how students view opportunities</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

