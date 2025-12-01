'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ProfileView } from '@/components/profile-viewer/ProfileView'
import { UserData } from '@/components/profile-viewer/types'
import { Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
      fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/cv/complete')
      
      if (response.ok) {
        const data = await response.json()
        
        // Map database data to ProfileView format
        const mappedData: UserData = {
          profile: {
            fullName: data.profile.name || '',
            dob: data.profile.dateOfBirth ? new Date(data.profile.dateOfBirth).toISOString().split('T')[0] : '',
            email: data.profile.email || '',
            whatsapp: data.profile.whatsapp || '',
            location: data.profile.location || '',
            linkedinUrl: data.profile.linkedin || '',
            portfolioUrl: data.profile.portfolio || '',
            githubUrl: data.profile.github || '',
            profilePicture: data.profile.image || undefined
          },
          education: data.education.map((edu: any) => ({
            id: edu.id,
            level: edu.degreeType || 'Bachelor\'s Degree',
            program: edu.degreeTitle || edu.program || '',
            institution: edu.institution || '',
            country: edu.institutionLocation || edu.country || '',
            startDate: edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
            endDate: edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : undefined,
            isCurrent: edu.isCurrent || false,
            courses: edu.modules || []
          })),
          experience: data.experience.map((exp: any) => ({
            id: exp.id,
            jobTitle: exp.title || '',
            company: exp.employer || '',
            employmentType: exp.employmentType || 'Full-time',
            startDate: exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
            endDate: exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : undefined,
            isCurrent: exp.isCurrent || false,
            description: exp.summary || ''
          })),
          projects: data.projects.map((proj: any) => ({
            id: proj.id,
            name: proj.name || '',
            skills: proj.techStack || [],
            link: proj.projectUrl || undefined,
            githubUrl: proj.githubUrl || undefined
          })),
          skills: data.skills.map((skill: any) => ({
            id: skill.id,
            name: skill.skillName || '',
            type: skill.category || 'Technical',
            level: skill.proficiency || undefined
          }))
        }
        
        setProfileData(mappedData)
      }
      } catch (error) {
      console.error('Error fetching profile data:', error)
      } finally {
        setIsLoading(false)
      }
    }

  const handleEditSection = (sectionType: 'profile' | 'education' | 'experience' | 'projects' | 'skills') => {
    // Redirect to edit profile page (Phase II) with the section to edit
    // Map profile sections to edit sections
    const sectionMap: Record<string, string> = {
      'profile': 'profile',
      'education': 'education',
      'experience': 'experience',
      'projects': 'projects',
      'skills': 'skills'
    }
    router.push(`/dashboard/edit-profile?section=${sectionMap[sectionType]}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Failed to load profile data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center selection:bg-blue-500/30 overflow-y-auto">
      {/* Background Ambience */}
      <div className="fixed top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-20%] w-[80vw] h-[80vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md px-5 py-10 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-blue-500 uppercase tracking-widest mb-2">Your Profile</h2>
          <p className="text-gray-400 text-sm">View and manage your professional information</p>
        </div>

        {/* Profile View Component */}
        <ProfileView 
          data={profileData}
          onEditSection={handleEditSection}
        />
      </div>

      {/* Custom Styles for glassmorphism */}
      <style jsx global>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  )
  }
