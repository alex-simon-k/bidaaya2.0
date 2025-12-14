import { PrismaClient } from '@prisma/client'
import { DataStandardizationService } from './data-standardization'

const prisma = new PrismaClient()

export interface InstitutionInfo {
  id: string
  name: string
  shortName: string
  region: string
  type: 'university' | 'school' | 'mixed'
}

export interface InstitutionStats {
  totalStudents: number
  activeStudents: number
  totalApplications: number
  averageStreak: number
  profileCompletionRate: number
  universityStudents?: number
  schoolStudents?: number
}

export interface OpportunityData {
  id: string
  title: string
  viewCount: number
  applicationCount: number
  company?: string
  category?: string
}

export interface StudentDistribution {
  major?: string
  subject?: string
  count: number
}

export interface TopStudent {
  id: string
  name: string | null
  streak: number
  applications: number
  email: string
}

export interface InstitutionAnalytics {
  institution: InstitutionInfo
  stats: InstitutionStats
  opportunities: {
    mostViewed: OpportunityData[]
    mostApplied: OpportunityData[]
  }
  students: {
    byMajor: StudentDistribution[]
    byGraduationYear: Array<{ year: number | null; count: number }>
    topByStreak: TopStudent[]
  }
  skills: Array<{ skill: string; count: number; percentage: number }>
  applications: {
    byStatus: Array<{ status: string; count: number }>
    overTime: Array<{ date: string; count: number }>
  }
  charts: {
    majorDistribution: Array<{ name: string; value: number }>
    skillsDistribution: Array<{ name: string; value: number }>
    applicationsOverTime: Array<{ date: string; count: number }>
  }
}

/**
 * Map slug to standardized institution name
 */
export function mapSlugToInstitution(slug: string): {
  universityName: string | null
  schoolName: string | null
  institutionInfo: InstitutionInfo | null
} {
  const slugLower = slug.toLowerCase().trim()

  // Try to match as university first
  const universityName = DataStandardizationService.standardizeUniversity(slug)
  
  // For schools, we'll do fuzzy matching on the highSchool field
  // Since we don't have a standardization service for schools yet,
  // we'll return the slug as-is and let the query handle it
  const schoolName = slugLower // Will be matched case-insensitively in queries

  if (universityName) {
    // Find university info
    const STANDARD_UNIVERSITIES = [
      { id: 'aud', name: 'American University of Dubai', shortName: 'AUD', region: 'Dubai' },
      { id: 'aus', name: 'American University of Sharjah', shortName: 'AUS', region: 'Sharjah' },
      { id: 'cud', name: 'Canadian University Dubai', shortName: 'CUD', region: 'Dubai' },
      { id: 'hw', name: 'Heriot-Watt University Dubai', shortName: 'Heriot-Watt', region: 'Dubai' },
      { id: 'zu', name: 'Zayed University', shortName: 'ZU', region: 'UAE' },
      { id: 'ku', name: 'Khalifa University', shortName: 'KU', region: 'Abu Dhabi' },
      { id: 'uaeu', name: 'United Arab Emirates University', shortName: 'UAEU', region: 'Al Ain' },
      { id: 'au', name: 'Ajman University', shortName: 'AU', region: 'Ajman' },
      { id: 'uos', name: 'University of Sharjah', shortName: 'UoS', region: 'Sharjah' },
    ]

    const uni = STANDARD_UNIVERSITIES.find(
      u => u.id === slugLower || u.name.toLowerCase() === universityName.toLowerCase()
    )

    if (uni) {
      return {
        universityName,
        schoolName: null,
        institutionInfo: {
          id: uni.id,
          name: uni.name,
          shortName: uni.shortName,
          region: uni.region,
          type: 'university'
        }
      }
    }
  }

  // Handle demo slug specifically
  if (slugLower === 'demo') {
    return {
      universityName: null,
      schoolName: null,
      institutionInfo: {
        id: 'demo',
        name: 'UOBD',
        shortName: 'UOBD',
        region: 'UAE',
        type: 'university'
      }
    }
  }

  // If no university match, return as potential school
  return {
    universityName: null,
    schoolName: slugLower,
    institutionInfo: {
      id: slugLower,
      name: slugLower.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      shortName: slugLower.toUpperCase(),
      region: 'UAE',
      type: 'school'
    }
  }
}

/**
 * Get all student IDs for an institution
 */
async function getInstitutionStudentIds(
  universityName: string | null,
  schoolName: string | null
): Promise<{ studentIds: string[]; universityCount: number; schoolCount: number }> {
  const whereClause: any = {
    role: 'STUDENT'
  }

  const orConditions: any[] = []
  
  if (universityName) {
    // Match university name with variations
    orConditions.push({
      university: {
        contains: universityName,
        mode: 'insensitive'
      }
    })
    
    // Also check for abbreviations
    const uniLower = universityName.toLowerCase()
    if (uniLower.includes('american university of dubai')) {
      orConditions.push({ university: { contains: 'AUD', mode: 'insensitive' } })
    } else if (uniLower.includes('american university of sharjah')) {
      orConditions.push({ university: { contains: 'AUS', mode: 'insensitive' } })
    }
  }

  if (schoolName) {
    orConditions.push({
      highSchool: {
        contains: schoolName,
        mode: 'insensitive'
      }
    })
  }

  if (orConditions.length === 0) {
    return { studentIds: [], universityCount: 0, schoolCount: 0 }
  }

  whereClause.OR = orConditions

  const students = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      university: true,
      highSchool: true
    }
  })

  const universityCount = students.filter(s => s.university && !s.highSchool).length
  const schoolCount = students.filter(s => s.highSchool && !s.university).length
  const studentIds = students.map(s => s.id)

  return { studentIds, universityCount, schoolCount }
}

/**
 * Aggregate analytics for an institution
 */
export async function getInstitutionAnalytics(
  slug: string
): Promise<InstitutionAnalytics | null> {
  const { universityName, schoolName, institutionInfo } = mapSlugToInstitution(slug)

  if (!institutionInfo) {
    return null
  }

  const { studentIds, universityCount, schoolCount } = await getInstitutionStudentIds(
    universityName,
    schoolName
  )

  // Determine institution type even if no students
  let institutionType: 'university' | 'school' | 'mixed' = institutionInfo.type
  if (universityCount > 0 && schoolCount > 0) {
    institutionType = 'mixed'
  } else if (universityCount > 0) {
    institutionType = 'university'
  } else if (schoolCount > 0) {
    institutionType = 'school'
  }

  if (studentIds.length === 0) {
    return {
      institution: {
        ...institutionInfo,
        type: institutionType
      },
      stats: {
        totalStudents: 0,
        activeStudents: 0,
        totalApplications: 0,
        averageStreak: 0,
        profileCompletionRate: 0,
        universityStudents: universityCount > 0 ? universityCount : undefined,
        schoolStudents: schoolCount > 0 ? schoolCount : undefined
      },
      opportunities: { mostViewed: [], mostApplied: [] },
      students: { byMajor: [], byGraduationYear: [], topByStreak: [] },
      skills: [],
      applications: { byStatus: [], overTime: [] },
      charts: { majorDistribution: [], skillsDistribution: [], applicationsOverTime: [] }
    }
  }

  // Institution type already determined above

  // Get student data
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: {
      id: true,
      name: true,
      email: true,
      university: true,
      highSchool: true,
      major: true,
      subjects: true,
      graduationYear: true,
      skills: true,
      currentStreak: true,
      longestStreak: true,
      profileCompleted: true,
      lastActiveAt: true,
      createdAt: true
    }
  })

  // Calculate stats
  const totalStudents = students.length
  const activeStudents = students.filter(
    s => s.profileCompleted && s.lastActiveAt && 
    new Date(s.lastActiveAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length
  const averageStreak = students.length > 0
    ? students.reduce((sum, s) => sum + s.currentStreak, 0) / students.length
    : 0
  const profileCompletionRate = students.length > 0
    ? (students.filter(s => s.profileCompleted).length / students.length) * 100
    : 0

  // Get applications
  const applications = await prisma.application.findMany({
    where: { userId: { in: studentIds } },
    select: {
      id: true,
      userId: true,
      status: true,
      createdAt: true,
      projectId: true
    }
  })

  const externalApplications = await prisma.externalOpportunityApplication.findMany({
    where: { userId: { in: studentIds } },
    select: {
      id: true,
      userId: true,
      appliedAt: true,
      externalOpportunityId: true
    }
  })

  const totalApplications = applications.length + externalApplications.length

  // Get opportunity views (from external opportunities)
  const opportunityViews = await prisma.externalOpportunity.findMany({
    where: {
      viewCount: { gt: 0 }
    },
    orderBy: { viewCount: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      company: true,
      category: true,
      viewCount: true,
      clickCount: true
    }
  })

  // Count applications per opportunity
  const opportunityApplicationCounts = await prisma.externalOpportunityApplication.groupBy({
    by: ['externalOpportunityId'],
    where: {
      userId: { in: studentIds }
    },
    _count: true
  })

  const appCountMap = new Map(
    opportunityApplicationCounts.map(item => [item.externalOpportunityId, item._count])
  )

  const mostViewed: OpportunityData[] = opportunityViews.map(opp => ({
    id: opp.id,
    title: opp.title,
    viewCount: opp.viewCount,
    applicationCount: appCountMap.get(opp.id) || 0,
    company: opp.company,
    category: opp.category || undefined
  }))

  // Get most applied opportunities
  const mostApplied = mostViewed
    .filter(opp => opp.applicationCount > 0)
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, 10)

  // Major/Subject distribution
  const majorMap = new Map<string, number>()
  const subjectMap = new Map<string, number>()

  students.forEach(student => {
    if (student.major) {
      majorMap.set(student.major, (majorMap.get(student.major) || 0) + 1)
    }
    if (student.subjects) {
      const subjects = student.subjects.split(',').map(s => s.trim())
      subjects.forEach(subj => {
        if (subj) {
          subjectMap.set(subj, (subjectMap.get(subj) || 0) + 1)
        }
      })
    }
  })

  const byMajor: StudentDistribution[] = Array.from(majorMap.entries())
    .map(([major, count]) => ({ major, count }))
    .sort((a, b) => b.count - a.count)

  const bySubject: StudentDistribution[] = Array.from(subjectMap.entries())
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count)

  // Graduation year distribution
  const yearMap = new Map<number | null, number>()
  students.forEach(student => {
    const year = student.graduationYear
    yearMap.set(year, (yearMap.get(year) || 0) + 1)
  })

  const byGraduationYear = Array.from(yearMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => {
      if (a.year === null) return 1
      if (b.year === null) return -1
      return b.year - a.year
    })

  // Get application counts per user
  const applicationCounts = new Map<string, number>()
  applications.forEach(app => {
    applicationCounts.set(app.userId, (applicationCounts.get(app.userId) || 0) + 1)
  })
  externalApplications.forEach(app => {
    applicationCounts.set(app.userId, (applicationCounts.get(app.userId) || 0) + 1)
  })

  // Top students by streak
  const topByStreak = students
    .map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      streak: student.currentStreak,
      applications: applicationCounts.get(student.id) || 0
    }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 10)

  // Skills distribution
  const skillMap = new Map<string, number>()
  students.forEach(student => {
    if (student.skills && Array.isArray(student.skills)) {
      student.skills.forEach(skill => {
        if (skill) {
          const normalized = skill.trim()
          skillMap.set(normalized, (skillMap.get(normalized) || 0) + 1)
        }
      })
    }
  })

  // Also get skills from CVSkill table
  const cvSkills = await prisma.cVSkill.findMany({
    where: { userId: { in: studentIds } },
    select: { skillName: true }
  })

  cvSkills.forEach(cvSkill => {
    const skill = cvSkill.skillName.trim()
    skillMap.set(skill, (skillMap.get(skill) || 0) + 1)
  })

  const totalSkillOccurrences = Array.from(skillMap.values()).reduce((sum, count) => sum + count, 0)
  const skills = Array.from(skillMap.entries())
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: totalSkillOccurrences > 0 ? (count / totalSkillOccurrences) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // Application status breakdown
  const statusMap = new Map<string, number>()
  applications.forEach(app => {
    statusMap.set(app.status, (statusMap.get(app.status) || 0) + 1)
  })
  
  // Add external applications as "APPLIED"
  statusMap.set('APPLIED', (statusMap.get('APPLIED') || 0) + externalApplications.length)

  const byStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))

  // Applications over time (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const allApps = [
    ...applications.map(app => ({ date: app.createdAt, type: 'internal' })),
    ...externalApplications.map(app => ({ date: app.appliedAt, type: 'external' }))
  ].filter(app => app.date >= thirtyDaysAgo)

  const dateMap = new Map<string, number>()
  allApps.forEach(app => {
    const dateStr = app.date.toISOString().split('T')[0]
    dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1)
  })

  const overTime = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Chart data
  const majorDistribution = byMajor.slice(0, 10).map(item => ({
    name: item.major || 'Unknown',
    value: item.count
  }))

  const skillsDistribution = skills.slice(0, 10).map(item => ({
    name: item.skill,
    value: item.count
  }))

  const applicationsOverTime = overTime.map(item => ({
    date: item.date,
    count: item.count
  }))

  return {
    institution: {
      ...institutionInfo,
      type: institutionType,
      name: institutionInfo.name
    },
    stats: {
      totalStudents,
      activeStudents,
      totalApplications,
      averageStreak: Math.round(averageStreak * 10) / 10,
      profileCompletionRate: Math.round(profileCompletionRate * 10) / 10,
      universityStudents: universityCount > 0 ? universityCount : undefined,
      schoolStudents: schoolCount > 0 ? schoolCount : undefined
    },
    opportunities: {
      mostViewed: mostViewed.slice(0, 10),
      mostApplied: mostApplied.slice(0, 10)
    },
    students: {
      byMajor: institutionType === 'university' || institutionType === 'mixed' 
        ? byMajor 
        : bySubject.map(s => ({ major: s.subject, count: s.count })),
      byGraduationYear,
      topByStreak
    },
    skills,
    applications: {
      byStatus,
      overTime
    },
    charts: {
      majorDistribution,
      skillsDistribution,
      applicationsOverTime
    }
  }
}
