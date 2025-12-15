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
    'demo': { name: 'UOBD', shortName: 'UOBD', region: 'UAE', logoUrl: '/images/university-logos/demo.png' }
  }

  const institutionInfo = institutionNames[slug] || institutionNames['demo']

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
      ],
      byOpportunity: [
        { opportunity: 'Software Engineering Intern - Tech Corp', count: 89 },
        { opportunity: 'Marketing Assistant - Marketing Agency', count: 67 },
        { opportunity: 'Data Analyst Position - Data Solutions', count: 54 },
        { opportunity: 'Business Development Intern - Startup Hub', count: 43 },
        { opportunity: 'Graphic Designer - Creative Studio', count: 38 },
        { opportunity: 'Finance Analyst - Finance Group', count: 32 },
        { opportunity: 'Product Manager - Product Co', count: 28 },
        { opportunity: 'Content Writer - Media House', count: 25 },
        { opportunity: 'HR Coordinator - HR Solutions', count: 21 },
        { opportunity: 'Sales Representative - Sales Corp', count: 19 }
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
      ],
      byStage: [
        { stage: 'Year 10', count: 450 },
        { stage: 'Year 11', count: 380 },
        { stage: 'Year 12', count: 320 },
        { stage: 'Year 13', count: 280 },
        { stage: 'First Year Uni', count: 220 },
        { stage: 'Second Year Uni', count: 180 },
        { stage: 'Third Year Uni', count: 150 },
        { stage: 'Workforce', count: 120 }
      ],
      byAgeGroup: [
        { ageGroup: '16-18', count: 234 },
        { ageGroup: '19-21', count: 456 },
        { ageGroup: '22-24', count: 389 },
        { ageGroup: '25+', count: 168 }
      ],
      byYearGroup: institutionType === 'school' ? [
        { yearGroup: 'Year 12', count: 320 },
        { yearGroup: 'Year 13', count: 280 },
        { yearGroup: 'Other', count: 647 }
      ] : [
        { yearGroup: 'University Year 1', count: 342 },
        { yearGroup: 'University Year 2', count: 298 },
        { yearGroup: 'University Year 3', count: 267 },
        { yearGroup: 'University Year 4', count: 189 },
        { yearGroup: 'Masters', count: 98 },
        { yearGroup: 'Graduated', count: 53 }
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
    courses: {
      distribution: institutionType === 'university' ? [
        { course: 'Computer Science', count: 892 },
        { course: 'Business Administration', count: 756 },
        { course: 'Engineering', count: 634 },
        { course: 'Marketing', count: 523 },
        { course: 'Finance', count: 451 }
      ] : [
        { course: 'Mathematics', count: 456 },
        { course: 'Science', count: 389 },
        { course: 'English', count: 342 },
        { course: 'Business Studies', count: 298 },
        { course: 'Arts', count: 267 }
      ],
      successRates: institutionType === 'university' ? [
        { course: 'Computer Science', rate: 18.5, total: 892, accepted: 165 },
        { course: 'Engineering', rate: 16.2, total: 634, accepted: 103 },
        { course: 'Business Administration', rate: 14.8, total: 756, accepted: 112 },
        { course: 'Finance', rate: 13.5, total: 451, accepted: 61 },
        { course: 'Marketing', rate: 12.3, total: 523, accepted: 64 }
      ] : [
        { course: 'Mathematics', rate: 15.2, total: 456, accepted: 69 },
        { course: 'Science', rate: 14.1, total: 389, accepted: 55 },
        { course: 'Business Studies', rate: 13.4, total: 298, accepted: 40 },
        { course: 'English', rate: 12.8, total: 342, accepted: 44 },
        { course: 'Arts', rate: 11.6, total: 267, accepted: 31 }
      ],
      interviewRates: institutionType === 'university' ? [
        { course: 'Computer Science', rate: 42.3, total: 892, interviewed: 377 },
        { course: 'Engineering', rate: 38.7, total: 634, interviewed: 245 },
        { course: 'Business Administration', rate: 35.2, total: 756, interviewed: 266 },
        { course: 'Finance', rate: 33.1, total: 451, interviewed: 149 },
        { course: 'Marketing', rate: 31.5, total: 523, interviewed: 165 }
      ] : [
        { course: 'Mathematics', rate: 36.8, total: 456, interviewed: 168 },
        { course: 'Science', rate: 34.2, total: 389, interviewed: 133 },
        { course: 'Business Studies', rate: 32.9, total: 298, interviewed: 98 },
        { course: 'English', rate: 31.6, total: 342, interviewed: 108 },
        { course: 'Arts', rate: 29.2, total: 267, interviewed: 78 }
      ],
      activity: institutionType === 'university' ? [
        { course: 'Computer Science', applications: 892 },
        { course: 'Business Administration', applications: 756 },
        { course: 'Engineering', applications: 634 },
        { course: 'Marketing', applications: 523 },
        { course: 'Finance', applications: 451 }
      ] : [
        { course: 'Mathematics', applications: 456 },
        { course: 'Science', applications: 389 },
        { course: 'English', applications: 342 },
        { course: 'Business Studies', applications: 298 },
        { course: 'Arts', applications: 267 }
      ]
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
