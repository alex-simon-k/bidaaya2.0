'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function DailyUploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [jsonData, setJsonData] = useState('')
  const [uploadMode, setUploadMode] = useState<'csv' | 'json'>('csv')
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (uploadMode === 'csv' && !file) {
      alert('Please select a CSV file')
      return
    }

    if (uploadMode === 'json' && !jsonData.trim()) {
      alert('Please paste JSON data')
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      
      if (uploadMode === 'csv' && file) {
        formData.append('file', file)
      } else if (uploadMode === 'json') {
        formData.append('jsonData', jsonData)
      }

      const response = await fetch('/api/admin/external-opportunities/daily-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)

      if (response.ok) {
        // Clear form on success
        if (uploadMode === 'csv') {
          setFile(null)
          const fileInput = document.getElementById('csv-file') as HTMLInputElement
          if (fileInput) fileInput.value = ''
        } else {
          setJsonData('')
        }
      }
    } catch (error) {
      setResult({
        error: 'Failed to upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-2">Daily Opportunity Upload</h1>
          <p className="text-gray-600 mb-6">
            Upload your daily CSV/JSON export. The system will automatically:
            <br />• <strong>Add new</strong> opportunities that are in your CSV but not in the database
            <br />• <strong>Close</strong> opportunities that are in the database but not in your CSV (mark as inactive)
            <br />• <strong>Leave unchanged</strong> opportunities that exist in both
          </p>

          {/* Upload Mode Toggle */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => {
                setUploadMode('csv')
                setFile(null)
                setResult(null)
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                uploadMode === 'csv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="inline-block mr-2" size={18} />
              CSV File
            </button>
            <button
              onClick={() => {
                setUploadMode('json')
                setFile(null)
                setResult(null)
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                uploadMode === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="inline-block mr-2" size={18} />
              JSON Data
            </button>
          </div>

          {/* CSV Upload */}
          {uploadMode === 'csv' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          )}

          {/* JSON Upload */}
          {uploadMode === 'json' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste JSON Data
              </label>
              <textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder='[{"title": "Job Title", "company": "Company Name", "applicationUrl": "https://...", ...}, ...]'
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || (uploadMode === 'csv' && !file) || (uploadMode === 'json' && !jsonData.trim())}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload & Compare
              </>
            )}
          </button>

          {/* Results */}
          {result && (
            <div className="mt-6">
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                    <XCircle size={20} />
                    Error
                  </div>
                  <p className="text-red-700">{result.error}</p>
                  {result.details && (
                    <p className="text-red-600 text-sm mt-1">{result.details}</p>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 font-medium mb-4">
                    <CheckCircle size={20} />
                    Upload Complete
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{result.created || 0}</div>
                      <div className="text-sm text-gray-600">New Added</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-orange-600">{result.closed || 0}</div>
                      <div className="text-sm text-gray-600">Closed</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{result.skipped || 0}</div>
                      <div className="text-sm text-gray-600">Skipped (Exist)</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">{result.failed || 0}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                  </div>

                  {result.message && (
                    <p className="text-green-700 text-sm mb-4">{result.message}</p>
                  )}

                  {/* New Opportunities List */}
                  {result.newOpportunities && result.newOpportunities.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-800 mb-2">New Opportunities Added:</h3>
                      <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                        <ul className="space-y-1 text-sm">
                          {result.newOpportunities.slice(0, 20).map((opp: any, idx: number) => (
                            <li key={idx} className="text-gray-700">
                              • {opp.title} at {opp.company}
                              {opp.location && <span className="text-gray-500"> - {opp.location}</span>}
                            </li>
                          ))}
                          {result.newOpportunities.length > 20 && (
                            <li className="text-gray-500 italic">
                              ... and {result.newOpportunities.length - 20} more
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Closed Opportunities */}
                  {result.closedOpportunities && result.closedOpportunities.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-medium text-orange-800 mb-2">
                        Closed (No Longer in CSV) - First 50:
                      </h3>
                      <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                        <ul className="space-y-1 text-sm">
                          {result.closedOpportunities.map((opp: any, idx: number) => (
                            <li key={idx} className="text-orange-700">
                              • {opp.title} at {opp.company}
                            </li>
                          ))}
                        </ul>
                        {result.closed && result.closed > 50 && (
                          <p className="text-orange-600 text-xs mt-2 italic">
                            ... and {result.closed - 50} more closed opportunities
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skipped Opportunities */}
                  {result.skippedOpportunities && result.skippedOpportunities.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-800 mb-2">
                        Skipped (Already Exist) - First 20:
                      </h3>
                      <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                        <ul className="space-y-1 text-sm">
                          {result.skippedOpportunities.map((opp: any, idx: number) => (
                            <li key={idx} className="text-gray-600">
                              • {opp.title} at {opp.company}
                              <span className="text-gray-400 text-xs ml-2">({opp.reason})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {result.errors && result.errors.length > 0 && (
                    <div>
                      <h3 className="font-medium text-red-800 mb-2">Errors:</h3>
                      <div className="bg-white rounded-lg p-3 max-h-32 overflow-y-auto">
                        <ul className="space-y-1 text-sm text-red-700">
                          {result.errors.map((error: string, idx: number) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle size={18} />
              How It Works
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Upload your daily CSV/JSON export from your scraping tool</li>
              <li>The system compares each opportunity with existing active ones by title and URL</li>
              <li><strong>New opportunities</strong> (in CSV but not in DB) are automatically added</li>
              <li><strong>Closed opportunities</strong> (in DB but not in CSV) are marked as inactive</li>
              <li><strong>Existing opportunities</strong> (in both) are left unchanged</li>
              <li>New opportunities are automatically marked as "new" for early access (48 hours)</li>
            </ul>
            <div className="mt-3 text-sm text-blue-700">
              <strong>Required CSV columns:</strong> title, company, applicationUrl
              <br />
              <strong>Optional:</strong> location, description, category, experienceLevel, remote, salary, deadline, source
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

