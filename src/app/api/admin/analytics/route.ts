import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user?.role?.toUpperCase() !== 'ADMIN') {
      return new NextResponse('Unauthorized - Admin access required', { status: 401 })
    }

    // Get comprehensive analytics data
    const [
      totalUsers,
      totalCompanies,
      totalStudents,
      totalProjects,
      totalApplications,
      liveProjects,
      pendingProjects,
      rejectedProjects,
      shortlistedApplications,
      interviewedApplications,
      selectedApplications,
      paidCompanies,
      recentUsers,
      applicationsByDay,
      usersByRole,
      projectsByStatus,
      subscriptionBreakdown,
      topCompanies,
      topSkills,
      universityBreakdown
    ] = await Promise.all([
      // Basic counts
      prisma.user.count(),
      prisma.user.count({ where: { role: 'COMPANY' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.project.count(),
      prisma.application.count(),
      
      // Project status counts
      prisma.project.count({ where: { status: 'LIVE' } }),
      prisma.project.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.project.count({ where: { status: 'REJECTED' } }),
      
      // Application status counts
      prisma.application.count({ where: { status: 'SHORTLISTED' } }),
      prisma.application.count({ where: { status: 'INTERVIEWED' } }),
      prisma.application.count({ where: { status: 'ACCEPTED' } }),
      
      // Paid companies
      prisma.user.count({ 
        where: { 
          role: 'COMPANY',
          subscriptionPlan: { not: 'FREE' },
          subscriptionStatus: 'ACTIVE'
        } 
      }),
      
      // Recent users (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Applications by day (last 7 days)
      prisma.application.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          createdAt: true
        }
      }),
      
      // User role breakdown
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      
      // Project status breakdown
      prisma.project.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Subscription plan breakdown
      prisma.user.groupBy({
        by: ['subscriptionPlan'],
        where: { role: 'COMPANY' },
        _count: { subscriptionPlan: true }
      }),
      
      // Top companies by projects
      prisma.user.findMany({
        where: { role: 'COMPANY' },
        select: {
          id: true,
          name: true,
          companyName: true,
          subscriptionPlan: true,
          _count: {
            select: {
              projects: true
            }
          }
        },
        orderBy: {
          projects: {
            _count: 'desc'
          }
        },
        take: 10
      }),
      
      // Top skills from projects
      prisma.project.findMany({
        select: {
          skillsRequired: true
        }
      }),
      
      // University breakdown from students
      prisma.user.findMany({
        where: { 
          role: 'STUDENT',
          university: { not: null }
        },
        select: {
          university: true
        }
      })
    ])

    // Process applications by day
    const applicationsByDayMap = new Map()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      applicationsByDayMap.set(dateKey, 0)
    }

    applicationsByDay.forEach(app => {
      const dateKey = app.createdAt.toISOString().split('T')[0]
      if (applicationsByDayMap.has(dateKey)) {
        applicationsByDayMap.set(dateKey, applicationsByDayMap.get(dateKey) + 1)
      }
    })

    // Process top skills
    const skillsMap = new Map()
    topSkills.forEach(project => {
      project.skillsRequired?.forEach(skill => {
        skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1)
      })
    })
    const topSkillsArray = Array.from(skillsMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }))

    // Process university breakdown
    const universityMap = new Map()
    universityBreakdown.forEach(user => {
      if (user.university) {
        universityMap.set(user.university, (universityMap.get(user.university) || 0) + 1)
      }
    })
    const topUniversities = Array.from(universityMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([university, count]) => ({ university, count }))

    // Calculate growth rates (mock data for now - you can implement proper historical tracking)
    const userGrowth = Math.floor(Math.random() * 20) + 5 // 5-25%
    const applicationGrowth = Math.floor(Math.random() * 30) + 10 // 10-40%
    const projectGrowth = Math.floor(Math.random() * 15) + 5 // 5-20%

    // Calculate conversion rates
    const applicationToShortlistRate = totalApplications > 0 ? 
      ((shortlistedApplications / totalApplications) * 100).toFixed(1) : '0'
    const shortlistToInterviewRate = shortlistedApplications > 0 ? 
      ((interviewedApplications / shortlistedApplications) * 100).toFixed(1) : '0'
    const interviewToSelectRate = interviewedApplications > 0 ? 
      ((selectedApplications / interviewedApplications) * 100).toFixed(1) : '0'

    const analytics = {
      overview: {
        totalUsers,
        totalCompanies,
        totalStudents,
        totalProjects,
        totalApplications,
        recentUsers,
        paidCompanies,
        freeCompanies: totalCompanies - paidCompanies
      },
      growth: {
        userGrowth,
        applicationGrowth,
        projectGrowth
      },
      projects: {
        total: totalProjects,
        live: liveProjects,
        pending: pendingProjects,
        rejected: rejectedProjects,
        draft: totalProjects - liveProjects - pendingProjects - rejectedProjects
      },
      applications: {
        total: totalApplications,
        pending: totalApplications - shortlistedApplications - interviewedApplications - selectedApplications,
        shortlisted: shortlistedApplications,
        interviewed: interviewedApplications,
        accepted: selectedApplications
      },
      conversions: {
        applicationToShortlist: parseFloat(applicationToShortlistRate),
        shortlistToInterview: parseFloat(shortlistToInterviewRate),
        interviewToSelect: parseFloat(interviewToSelectRate)
      },
      charts: {
        applicationsByDay: Array.from(applicationsByDayMap.entries()).map(([date, count]) => ({
          date,
          applications: count
        })),
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count.role
        })),
        projectsByStatus: projectsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        subscriptionBreakdown: subscriptionBreakdown.map(item => ({
          plan: item.subscriptionPlan || 'FREE',
          count: item._count.subscriptionPlan
        }))
      },
      insights: {
        topCompanies: topCompanies.map(company => ({
          id: company.id,
          name: company.companyName || company.name,
          projectCount: company._count.projects,
          subscriptionPlan: company.subscriptionPlan
        })),
        topSkills: topSkillsArray,
        topUniversities
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('❌ Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
} 