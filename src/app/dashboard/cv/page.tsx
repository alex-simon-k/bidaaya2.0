'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  User,
  GraduationCap,
  Briefcase,
  FolderKanban,
  Award,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Calendar,
  Plus,
  Edit2,
  ArrowLeft,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface CVData {
  profile: {
    id: string
    name: string
    email: string
    dateOfBirth?: string
    whatsapp?: string
    location?: string
    linkedin?: string
    image?: string
    bio?: string
  }
  education: any[]
  experience: any[]
  projects: any[]
  skills: any[]
}

export default function CVProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [cvData, setCVData] = useState<CVData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCVData()
  }, [])

  const fetchCVData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/cv/complete')
      if (response.ok) {
        const data = await response.json()
        setCVData(data)
      }
    } catch (error) {
      console.error('Error fetching CV data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Present'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bidaaya-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-bidaaya-accent border-t-transparent"></div>
      </div>
    )
  }

  if (!cvData) {
    return (
      <div className="min-h-screen bg-bidaaya-dark flex items-center justify-center">
        <p className="text-bidaaya-light">Failed to load CV data</p>
      </div>
    )
  }

  const { profile, education, experience, projects, skills } = cvData

  return (
    <div className="min-h-screen bg-bidaaya-dark pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-bidaaya-accent/20 to-blue-500/20 border-b border-bidaaya-light/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="text-bidaaya-light hover:bg-bidaaya-light/10 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-bidaaya-accent/20 flex items-center justify-center text-2xl font-bold text-bidaaya-accent">
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-bidaaya-light">{profile.name}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-bidaaya-light/60">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </div>
                )}
                {profile.whatsapp && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {profile.whatsapp}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Education */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-bidaaya-accent" />
              <h2 className="text-xl font-semibold text-bidaaya-light">Education</h2>
            </div>
            <Button
              onClick={() => {
                // Route to AI CV builder to add education
                router.push('/dashboard?cv_edit=education')
              }}
              variant="ghost"
              size="sm"
              className="text-bidaaya-accent hover:bg-bidaaya-accent/10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {education.length === 0 ? (
            <p className="text-bidaaya-light/40 text-sm">No education added yet</p>
          ) : (
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="border-l-2 border-bidaaya-accent/30 pl-4">
                  <h3 className="font-semibold text-bidaaya-light">{edu.degreeTitle || edu.program}</h3>
                  <p className="text-sm text-bidaaya-light/60">{edu.institution}</p>
                  <p className="text-xs text-bidaaya-light/40 mt-1">
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate)}
                  </p>
                  {edu.modules && edu.modules.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {edu.modules.map((module: string, i: number) => (
                        <span key={i} className="text-xs bg-bidaaya-accent/10 text-bidaaya-accent px-2 py-0.5 rounded">
                          {module}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Experience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-bidaaya-accent" />
              <h2 className="text-xl font-semibold text-bidaaya-light">Experience</h2>
            </div>
            <Button
              onClick={() => {
                // Route to AI CV builder to add experience
                router.push('/dashboard?cv_edit=experience')
              }}
              variant="ghost"
              size="sm"
              className="text-bidaaya-accent hover:bg-bidaaya-accent/10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {experience.length === 0 ? (
            <p className="text-bidaaya-light/40 text-sm">No experience added yet</p>
          ) : (
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-bidaaya-accent/30 pl-4">
                  <h3 className="font-semibold text-bidaaya-light">{exp.title}</h3>
                  <p className="text-sm text-bidaaya-light/60">{exp.employer}</p>
                  <p className="text-xs text-bidaaya-light/40 mt-1">
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                  </p>
                  {exp.summary && (
                    <p className="text-sm text-bidaaya-light/70 mt-2">{exp.summary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-bidaaya-accent" />
              <h2 className="text-xl font-semibold text-bidaaya-light">Projects</h2>
            </div>
            <Button
              onClick={() => {
                // Route to AI CV builder to add projects
                router.push('/dashboard?cv_edit=projects')
              }}
              variant="ghost"
              size="sm"
              className="text-bidaaya-accent hover:bg-bidaaya-accent/10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {projects.length === 0 ? (
            <p className="text-bidaaya-light/40 text-sm">No projects added yet</p>
          ) : (
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx} className="border-l-2 border-bidaaya-accent/30 pl-4">
                  <h3 className="font-semibold text-bidaaya-light">{proj.name}</h3>
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.techStack.map((tech: string, i: number) => (
                        <span key={i} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  {(proj.projectUrl || proj.githubUrl) && (
                    <div className="flex gap-2 mt-2 text-xs text-bidaaya-accent">
                      {proj.projectUrl && <a href={proj.projectUrl} target="_blank" rel="noopener noreferrer">Live Demo</a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-bidaaya-accent" />
              <h2 className="text-xl font-semibold text-bidaaya-light">Skills</h2>
            </div>
            <Button
              onClick={() => {
                // Route to AI CV builder to add skills
                router.push('/dashboard?cv_edit=skills')
              }}
              variant="ghost"
              size="sm"
              className="text-bidaaya-accent hover:bg-bidaaya-accent/10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {skills.length === 0 ? (
            <p className="text-bidaaya-light/40 text-sm">No skills added yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-bidaaya-accent/20 text-bidaaya-accent rounded-full text-sm"
                >
                  {skill.skillName}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Completion Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center"
        >
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-bidaaya-light mb-2">Profile Complete!</h3>
          <p className="text-sm text-bidaaya-light/60 mb-4">
            You can now apply to internships and get matched with opportunities
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
          >
            Browse Opportunities
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

