'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  User,
  MessageSquare,
  Star,
  Edit3,
  Save,
  Trash2,
  Eye
} from 'lucide-react'

interface TranscriptFile {
  id: string
  fileName: string
  fileUrl: string
  uploadedAt: string
  fileSize: number
  duration?: number
  status: 'uploaded' | 'processing' | 'analyzed' | 'error'
  analysis?: {
    sentiment: 'positive' | 'neutral' | 'negative'
    confidence: number
    keyTopics: string[]
    strengths: string[]
    concerns: string[]
    recommendations: string[]
    summary: string
  }
}

interface InterviewTranscript {
  id: string
  candidateId: string
  candidateName: string
  projectId: string
  interviewDate: string
  interviewer: string
  duration: number
  transcriptFile?: TranscriptFile
  audioFile?: TranscriptFile
  notes: string
  score: number
  status: 'scheduled' | 'completed' | 'analyzed'
  keyHighlights: string[]
  concerns: string[]
  recommendation: 'hire' | 'maybe' | 'pass'
}

interface TranscriptUploadSystemProps {
  candidateId: string
  candidateName: string
  projectId: string
  onTranscriptUploaded?: (transcript: InterviewTranscript) => void
}

export function TranscriptUploadSystem({ 
  candidateId, 
  candidateName, 
  projectId, 
  onTranscriptUploaded 
}: TranscriptUploadSystemProps) {
  const [transcript, setTranscript] = useState<InterviewTranscript | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [score, setScore] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    const allowedTypes = [
      'text/plain', 
      'application/pdf', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'video/mp4'
    ]

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid file type (TXT, PDF, DOC, DOCX, MP3, WAV, MP4)')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate file upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('candidateId', candidateId)
      formData.append('projectId', projectId)
      formData.append('type', file.type.startsWith('audio/') || file.type.startsWith('video/') ? 'audio' : 'transcript')

      // Upload file
      const uploadResponse = await fetch('/api/interviews/upload-transcript', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const uploadResult = await uploadResponse.json()
      setUploadProgress(100)

      // Create transcript record
      const newTranscript: InterviewTranscript = {
        id: uploadResult.id,
        candidateId,
        candidateName,
        projectId,
        interviewDate: new Date().toISOString(),
        interviewer: 'Current User', // Would come from session
        duration: 0,
        transcriptFile: file.type.startsWith('audio/') ? undefined : {
          id: uploadResult.fileId,
          fileName: file.name,
          fileUrl: uploadResult.fileUrl,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
          status: 'uploaded'
        },
        audioFile: file.type.startsWith('audio/') || file.type.startsWith('video/') ? {
          id: uploadResult.fileId,
          fileName: file.name,
          fileUrl: uploadResult.fileUrl,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
          status: 'uploaded'
        } : undefined,
        notes: '',
        score: 0,
        status: 'completed',
        keyHighlights: [],
        concerns: [],
        recommendation: 'maybe'
      }

      setTranscript(newTranscript)
      setNotes('')
      setScore(0)

      // Auto-analyze if it's a text transcript
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        await analyzeTranscript(newTranscript)
      }

      onTranscriptUploaded?.(newTranscript)

    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const analyzeTranscript = async (transcriptData: InterviewTranscript) => {
    if (!transcriptData.transcriptFile) return

    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/interviews/analyze-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptId: transcriptData.id,
          candidateId: transcriptData.candidateId,
          projectId: transcriptData.projectId
        })
      })

      if (response.ok) {
        const analysis = await response.json()
        
        setTranscript(prev => prev ? {
          ...prev,
          transcriptFile: prev.transcriptFile ? {
            ...prev.transcriptFile,
            status: 'analyzed',
            analysis: analysis.analysis
          } : undefined,
          keyHighlights: analysis.keyHighlights || [],
          concerns: analysis.concerns || [],
          recommendation: analysis.recommendation || 'maybe'
        } : null)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveInterview = async () => {
    if (!transcript) return

    try {
      const response = await fetch(`/api/interviews/${transcript.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          score,
          status: 'analyzed'
        })
      })

      if (response.ok) {
        setTranscript(prev => prev ? { ...prev, notes, score, status: 'analyzed' } : null)
        setEditingNotes(false)
      }
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Interview Transcript</h3>
            <p className="text-gray-600">{candidateName}</p>
          </div>
          {transcript && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                transcript.status === 'completed' ? 'bg-green-100 text-green-800' :
                transcript.status === 'analyzed' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {transcript.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Upload Area */}
      {!transcript && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx,.mp3,.wav,.mp4"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">Uploading...</p>
                <div className="w-64 mx-auto mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">Upload Interview Materials</p>
                <p className="text-gray-600">Drag and drop files here, or click to browse</p>
                <p className="text-sm text-gray-500 mt-2">
                  Supported: TXT, PDF, DOC, DOCX (transcripts) • MP3, WAV, MP4 (audio/video)
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Upload Transcript
                </button>
                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Upload Audio/Video
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="space-y-6">
          {/* Files Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="font-medium text-gray-900 mb-4">Uploaded Files</h4>
            <div className="space-y-3">
              {transcript.transcriptFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{transcript.transcriptFile.fileName}</p>
                      <p className="text-sm text-gray-600">
                        {(transcript.transcriptFile.fileSize / 1024).toFixed(1)} KB • 
                        Uploaded {new Date(transcript.transcriptFile.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transcript.transcriptFile.status === 'analyzed' ? 'bg-green-100 text-green-800' :
                      transcript.transcriptFile.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {transcript.transcriptFile.status}
                    </span>
                    <button className="p-1 text-gray-600 hover:text-blue-600">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {transcript.audioFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">{transcript.audioFile.fileName}</p>
                      <p className="text-sm text-gray-600">
                        {(transcript.audioFile.fileSize / 1024 / 1024).toFixed(1)} MB • 
                        Uploaded {new Date(transcript.audioFile.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-purple-600 hover:text-purple-700">
                      <Play className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-blue-600">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          {transcript.transcriptFile?.analysis && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">AI Analysis</h4>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Analyzing...</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {transcript.transcriptFile.analysis.summary}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Sentiment Analysis</h5>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transcript.transcriptFile.analysis.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                      transcript.transcriptFile.analysis.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transcript.transcriptFile.analysis.sentiment}
                    </span>
                    <span className="text-sm text-gray-600">
                      {transcript.transcriptFile.analysis.confidence}% confidence
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Strengths</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {transcript.transcriptFile.analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Concerns</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {transcript.transcriptFile.analysis.concerns.map((concern, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-2">
                  <h5 className="font-medium text-gray-900 mb-2">Key Topics</h5>
                  <div className="flex flex-wrap gap-2">
                    {transcript.transcriptFile.analysis.keyTopics.map((topic, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interview Notes & Scoring */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Interview Evaluation</h4>
              <div className="flex items-center gap-2">
                {editingNotes ? (
                  <>
                    <button
                      onClick={saveInterview}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingNotes(false)}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-1"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Notes
                </label>
                {editingNotes ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your interview notes here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                  />
                ) : (
                  <div className="min-h-[150px] p-3 border border-gray-300 rounded-lg bg-gray-50">
                    {transcript.notes || notes || (
                      <span className="text-gray-500 italic">No notes added yet</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Score
                  </label>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={score}
                        onChange={(e) => setScore(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-6 w-6 ${
                            i < (transcript.score || score) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {transcript.score || score}/5
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommendation
                  </label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    transcript.recommendation === 'hire' ? 'bg-green-100 text-green-800' :
                    transcript.recommendation === 'pass' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transcript.recommendation === 'hire' ? 'Recommend Hire' :
                     transcript.recommendation === 'pass' ? 'Do Not Hire' :
                     'Needs Review'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 