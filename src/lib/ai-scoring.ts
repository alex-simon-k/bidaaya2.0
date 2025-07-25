import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface StudentProfile {
  skills: string[]
  interests: string[]
  university: string | null
  major: string | null
  graduationYear: number | null
  education: string | null
  bio: string | null
}

interface ProjectRequirements {
  title: string
  description: string
  skillsRequired: string[]
  department: string | null
  industry: string | null
  companyName: string | null
  duration: string | null
  location: string | null
  remote: boolean
}

export interface CompatibilityResult {
  score: number // 0-100
  reasoning: string
  keyMatches: string[]
  improvements: string[]
}

export async function calculateCompatibilityScore(
  studentId: string, 
  projectId: string
): Promise<CompatibilityResult> {
  // Fetch student and project data
  const [student, project] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: {
        skills: true,
        interests: true,
        university: true,
        major: true,
        graduationYear: true,
        education: true,
        bio: true,
      }
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: {
          select: {
            companyName: true,
            industry: true,
          }
        }
      }
    })
  ])

  if (!student || !project) {
    throw new Error('Student or project not found')
  }

  const studentProfile: StudentProfile = {
    skills: student.skills || [],
    interests: student.interests || [],
    university: student.university,
    major: student.major,
    graduationYear: student.graduationYear,
    education: student.education,
    bio: student.bio,
  }

  const projectRequirements: ProjectRequirements = {
    title: project.title,
    description: project.description,
    skillsRequired: project.skillsRequired || [],
    department: project.department,
    industry: project.company?.industry || null,
    companyName: project.company?.companyName || null,
    duration: project.duration,
    location: project.location,
    remote: project.remote,
  }

  // Try DeepSeq API first, fallback to OpenAI
  try {
    if (process.env.DEEPSEQ_API_KEY) {
      return await calculateWithDeepSeq(studentProfile, projectRequirements)
    } else {
      return await calculateWithOpenAI(studentProfile, projectRequirements)
    }
  } catch (error) {
    console.error('AI scoring error:', error)
    // Fallback to simple rule-based scoring
    return calculateBasicCompatibility(studentProfile, projectRequirements)
  }
}

async function calculateWithDeepSeq(
  student: StudentProfile, 
  project: ProjectRequirements
): Promise<CompatibilityResult> {
  const response = await fetch('https://api.deepseq.ai/v1/compatibility', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student: student,
      project: project,
      options: {
        includeReasoning: true,
        includeMatches: true,
        includeSuggestions: true,
      }
    })
  })

  if (!response.ok) {
    throw new Error(`DeepSeq API error: ${response.status}`)
  }

  const result = await response.json()
  
  return {
    score: Math.round(result.compatibilityScore * 100),
    reasoning: result.reasoning || 'AI-generated compatibility analysis',
    keyMatches: result.keyMatches || [],
    improvements: result.suggestions || [],
  }
}

async function calculateWithOpenAI(
  student: StudentProfile, 
  project: ProjectRequirements
): Promise<CompatibilityResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('No OpenAI API key configured')
  }

  const prompt = `
Analyze the compatibility between this student and project opportunity:

STUDENT PROFILE:
- Skills: ${student.skills.join(', ')}
- Interests: ${student.interests.join(', ')}
- University: ${student.university || 'Not specified'}
- Major: ${student.major || 'Not specified'}
- Graduation Year: ${student.graduationYear || 'Not specified'}
- Bio: ${student.bio || 'Not provided'}

PROJECT REQUIREMENTS:
- Title: ${project.title}
- Description: ${project.description}
- Required Skills: ${project.skillsRequired.join(', ')}
- Department: ${project.department || 'Not specified'}
- Industry: ${project.industry || 'Not specified'}
- Company: ${project.companyName || 'Not specified'}
- Duration: ${project.duration || 'Not specified'}
- Location: ${project.location || 'Not specified'}
- Remote: ${project.remote ? 'Yes' : 'No'}

Please provide a JSON response with:
{
  "score": number between 0-100,
  "reasoning": "brief explanation of the match",
  "keyMatches": ["list", "of", "key", "matching", "factors"],
  "improvements": ["suggestions", "for", "student", "improvement"]
}
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career counselor and recruiter. Analyze student-project compatibility and provide objective scoring.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const result = JSON.parse(data.choices[0].message.content)
  
  return {
    score: Math.round(result.score),
    reasoning: result.reasoning,
    keyMatches: result.keyMatches || [],
    improvements: result.improvements || [],
  }
}

function calculateBasicCompatibility(
  student: StudentProfile, 
  project: ProjectRequirements
): CompatibilityResult {
  let score = 50 // Base score
  const keyMatches: string[] = []
  const improvements: string[] = []

  // Skill matching (40% weight)
  const studentSkills = student.skills.map(s => s.toLowerCase())
  const requiredSkills = project.skillsRequired.map(s => s.toLowerCase())
  
  const skillMatches = requiredSkills.filter(skill => 
    studentSkills.some(studentSkill => 
      studentSkill.includes(skill) || skill.includes(studentSkill)
    )
  )
  
  const skillMatchRatio = requiredSkills.length > 0 ? skillMatches.length / requiredSkills.length : 0.5
  score += (skillMatchRatio * 40)
  
  if (skillMatches.length > 0) {
    keyMatches.push(`Matching skills: ${skillMatches.join(', ')}`)
  }

  // Interest alignment (20% weight)
  const studentInterests = student.interests.map(i => i.toLowerCase())
  const projectKeywords = [
    ...project.title.toLowerCase().split(' '),
    ...project.description.toLowerCase().split(' '),
    project.industry?.toLowerCase() || '',
    project.department?.toLowerCase() || '',
  ].filter(word => word.length > 3)

  const interestMatches = studentInterests.filter(interest =>
    projectKeywords.some(keyword => keyword.includes(interest))
  )

  if (interestMatches.length > 0) {
    score += Math.min(20, interestMatches.length * 5)
    keyMatches.push(`Interest alignment: ${interestMatches.join(', ')}`)
  }

  // Education relevance (20% weight)
  if (student.major && project.description) {
    const majorKeywords = student.major.toLowerCase().split(' ')
    const descriptionWords = project.description.toLowerCase().split(' ')
    
    const educationMatch = majorKeywords.some(major =>
      descriptionWords.some(word => word.includes(major) || major.includes(word))
    )
    
    if (educationMatch) {
      score += 15
      keyMatches.push(`Educational background aligns with project requirements`)
    }
  }

  // Experience level (10% weight)
  const currentYear = new Date().getFullYear()
  if (student.graduationYear) {
    const yearsToGraduation = student.graduationYear - currentYear
    if (yearsToGraduation >= 0 && yearsToGraduation <= 2) {
      score += 10
      keyMatches.push('Graduation timeline aligns well')
    }
  }

  // Generate improvements
  if (skillMatches.length < requiredSkills.length) {
    const missingSkills = requiredSkills.filter(skill => !skillMatches.includes(skill))
    improvements.push(`Consider developing skills in: ${missingSkills.slice(0, 3).join(', ')}`)
  }

  if (keyMatches.length === 0) {
    improvements.push('Update your profile with relevant skills and interests')
    improvements.push('Add more details to your bio and education background')
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    reasoning: keyMatches.length > 0 
      ? `Strong match based on ${keyMatches.length} key factors`
      : 'Limited alignment found - consider profile improvements',
    keyMatches,
    improvements,
  }
}

export async function updateApplicationScore(
  applicationId: string,
  compatibilityResult: CompatibilityResult
): Promise<void> {
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      compatibilityScore: compatibilityResult.score,
    }
  })
}

export async function getProjectApplicationStats(projectId: string): Promise<{
  totalApplications: number
  averageScore: number
  topScores: number[]
  shouldShowScores: boolean
}> {
  const applications = await prisma.application.findMany({
    where: { projectId },
    select: { compatibilityScore: true }
  })

  const scoresWithValues = applications
    .filter(app => app.compatibilityScore !== null)
    .map(app => app.compatibilityScore!)

  const shouldShowScores = applications.length >= 3 // Show scores after 3+ applications

  return {
    totalApplications: applications.length,
    averageScore: scoresWithValues.length > 0 
      ? Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length)
      : 0,
    topScores: scoresWithValues.sort((a, b) => b - a).slice(0, 5),
    shouldShowScores,
  }
} 