import { InstitutionAnalytics } from './institution-analytics'

/**
 * Generate mock analytics data for demo purposes
 */
export function generateMockInstitutionData(slug: string): InstitutionAnalytics {
  // Determine institution type and name based on slug
  const isUniversity = !slug.includes('school') && !slug.includes('college')
  const institutionType = isUniversity ? 'university' : 'school'
  
  const institutionNames: Record<string, { name: string; shortName: string; region: string; logoUrl?: string }> = {
    'aud': { name: 'American University of Dubai', shortName: 'AUD', region: 'Dubai', logoUrl: '/images/university-logos/aud.png' },
    'aus': { name: 'American University of Sharjah', shortName: 'AUS', region: 'Sharjah', logoUrl: '/images/university-logos/aus.png' },
    'cud': { name: 'Canadian University Dubai', shortName: 'CUD', region: 'Dubai', logoUrl: '/images/university-logos/cud.png' },
    'hw': { name: 'Heriot-Watt University Dubai', shortName: 'Heriot-Watt', region: 'Dubai', logoUrl: '/images/university-logos/hw.png' },
    'zu': { name: 'Zayed University', shortName: 'ZU', region: 'UAE', logoUrl: '/images/university-logos/zu.png' },
    'ku': { name: 'Khalifa University', shortName: 'KU', region: 'Abu Dhabi', logoUrl: '/images/university-logos/ku.png' },
    'uaeu': { name: 'United Arab Emirates University', shortName: 'UAEU', region: 'Al Ain', logoUrl: '/images/university-logos/uaeu.png' },
    'au': { name: 'Ajman University', shortName: 'AU', region: 'Ajman', logoUrl: '/images/university-logos/au.png' },
    'uos': { name: 'University of Sharjah', shortName: 'UoS', region: 'Sharjah', logoUrl: '/images/university-logos/uos.png' },
    'slug': { name: 'Demo Institution', shortName: 'DEMO', region: 'UAE', logoUrl: '/images/university-logos/demo.png' }
  }

  const institutionInfo = institutionNames[slug] || institutionNames['slug']

  // Generate dates for the last 30 days
  const generateDates = () => {
    const dates: string[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const dates = generateDates()

  return {
    institution: {
      id: slug,
      name: institutionInfo.name,
      shortName: institutionInfo.shortName,
      region: institutionInfo.region,
      type: institutionType as 'university' | 'school' | 'mixed'
    },
    stats: {
      totalStudents: 1247,
      activeStudents: 892,
      totalApplications: 3456,
      averageStreak: 12.4,
      profileCompletionRate: 87.3,
      universityStudents: institutionType === 'university' ? 1247 : undefined,
      schoolStudents: institutionType === 'school' ? 1247 : undefined
    },
    opportunities: {
      mostViewed: [
        { id: '1', title: 'Software Engineering Intern', company: 'Tech Corp', viewCount: 342, applicationCount: 89, category: 'Technology' },
        { id: '2', title: 'Marketing Assistant', company: 'Marketing Agency', viewCount: 298, applicationCount: 67, category: 'Marketing' },
        { id: '3', title: 'Data Analyst Position', company: 'Data Solutions', viewCount: 267, applicationCount: 54, category: 'Analytics' },
        { id: '4', title: 'Business Development Intern', company: 'Startup Hub', viewCount: 234, applicationCount: 43, category: 'Business' },
        { id: '5', title: 'Graphic Designer', company: 'Creative Studio', viewCount: 198, applicationCount: 38, category: 'Design' },
        { id: '6', title: 'Finance Analyst', company: 'Finance Group', viewCount: 187, applicationCount: 32, category: 'Finance' },
        { id: '7', title: 'Product Manager', company: 'Product Co', viewCount: 165, applicationCount: 28, category: 'Product' },
        { id: '8', title: 'Content Writer', company: 'Media House', viewCount: 143, applicationCount: 25, category: 'Content' },
        { id: '9', title: 'HR Coordinator', company: 'HR Solutions', viewCount: 132, applicationCount: 21, category: 'HR' },
        { id: '10', title: 'Sales Representative', company: 'Sales Corp', viewCount: 118, applicationCount: 19, category: 'Sales' }
      ],
      mostApplied: [
        { id: '1', title: 'Software Engineering Intern', company: 'Tech Corp', viewCount: 342, applicationCount: 89, category: 'Technology' },
        { id: '2', title: 'Marketing Assistant', company: 'Marketing Agency', viewCount: 298, applicationCount: 67, category: 'Marketing' },
        { id: '3', title: 'Data Analyst Position', company: 'Data Solutions', viewCount: 267, applicationCount: 54, category: 'Analytics' },
        { id: '4', title: 'Business Development Intern', company: 'Startup Hub', viewCount: 234, applicationCount: 43, category: 'Business' },
        { id: '5', title: 'Graphic Designer', company: 'Creative Studio', viewCount: 198, applicationCount: 38, category: 'Design' }
      ]
    },
    students: {
      byMajor: institutionType === 'university' ? [
        { major: 'Computer Science', count: 342 },
        { major: 'Business Administration', count: 298 },
        { major: 'Engineering', count: 267 },
        { major: 'Marketing', count: 189 },
        { major: 'Finance', count: 151 }
      ] : [
        { major: 'Mathematics', count: 342 },
        { major: 'Science', count: 298 },
        { major: 'English', count: 267 },
        { major: 'Business Studies', count: 189 },
        { major: 'Arts', count: 151 }
      ],
      byGraduationYear: [
        { year: 2025, count: 342 },
        { year: 2026, count: 298 },
        { year: 2027, count: 267 },
        { year: 2028, count: 189 },
        { year: null, count: 151 }
      ],
      topByStreak: [
        { id: '1', name: 'Ahmed Al-Mansoori', email: 'ahmed@example.com', streak: 45, applications: 23 },
        { id: '2', name: 'Fatima Hassan', email: 'fatima@example.com', streak: 38, applications: 19 },
        { id: '3', name: 'Mohammed Ali', email: 'mohammed@example.com', streak: 34, applications: 17 },
        { id: '4', name: 'Sarah Johnson', email: 'sarah@example.com', streak: 31, applications: 15 },
        { id: '5', name: 'Omar Khaled', email: 'omar@example.com', streak: 28, applications: 14 },
        { id: '6', name: 'Layla Ahmed', email: 'layla@example.com', streak: 25, applications: 12 },
        { id: '7', name: 'Yusuf Ibrahim', email: 'yusuf@example.com', streak: 22, applications: 11 },
        { id: '8', name: 'Mariam Said', email: 'mariam@example.com', streak: 19, applications: 10 },
        { id: '9', name: 'Khalid Mohammed', email: 'khalid@example.com', streak: 16, applications: 9 },
        { id: '10', name: 'Noor Abdullah', email: 'noor@example.com', streak: 14, applications: 8 }
      ]
    },
    skills: [
      { skill: 'JavaScript', count: 456, percentage: 18.2 },
      { skill: 'Python', count: 389, percentage: 15.5 },
      { skill: 'React', count: 342, percentage: 13.6 },
      { skill: 'Communication', count: 298, percentage: 11.9 },
      { skill: 'Leadership', count: 267, percentage: 10.6 },
      { skill: 'Project Management', count: 234, percentage: 9.3 },
      { skill: 'Data Analysis', count: 198, percentage: 7.9 },
      { skill: 'Marketing', count: 165, percentage: 6.6 },
      { skill: 'Design', count: 143, percentage: 5.7 },
      { skill: 'Finance', count: 118, percentage: 4.7 }
    ],
    applications: {
      byStatus: [
        { status: 'PENDING', count: 1234 },
        { status: 'SHORTLISTED', count: 567 },
        { status: 'ACCEPTED', count: 234 },
        { status: 'REJECTED', count: 89 },
        { status: 'APPLIED', count: 1332 }
      ],
      overTime: dates.map((date, index) => ({
        date,
        count: Math.floor(Math.random() * 50) + 20 + Math.sin(index / 5) * 15
      }))
    },
    charts: {
      majorDistribution: institutionType === 'university' ? [
        { name: 'Computer Science', value: 342 },
        { name: 'Business Administration', value: 298 },
        { name: 'Engineering', value: 267 },
        { name: 'Marketing', value: 189 },
        { name: 'Finance', value: 151 }
      ] : [
        { name: 'Mathematics', value: 342 },
        { name: 'Science', value: 298 },
        { name: 'English', value: 267 },
        { name: 'Business Studies', value: 189 },
        { name: 'Arts', value: 151 }
      ],
      skillsDistribution: [
        { name: 'JavaScript', value: 456 },
        { name: 'Python', value: 389 },
        { name: 'React', value: 342 },
        { name: 'Communication', value: 298 },
        { name: 'Leadership', value: 267 },
        { name: 'Project Management', value: 234 },
        { name: 'Data Analysis', value: 198 },
        { name: 'Marketing', value: 165 }
      ],
      applicationsOverTime: dates.map((date, index) => ({
        date,
        count: Math.floor(Math.random() * 50) + 20 + Math.sin(index / 5) * 15
      }))
    }
  }
}
