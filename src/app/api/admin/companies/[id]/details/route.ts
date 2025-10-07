import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch company with all projects and external opportunities
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch company with all related data
    const company = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'COMPANY'
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        industry: true,
        companySize: true,
        companyWebsite: true,
        location: true,
        companyOneLiner: true,
        companyGoals: true,
        contactPersonName: true,
        contactPersonType: true,
        contactEmail: true,
        contactWhatsapp: true,
        calendlyLink: true,
        image: true,
        isExternalCompany: true,
        companySource: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
        subscriptionPlan: true,
        
        // Include projects (internal projects posted by company)
        projects: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            category: true,
            customCategory: true,
            location: true,
            remote: true,
            compensation: true,
            paymentAmount: true,
            duration: true,
            experienceLevel: true,
            currentApplications: true,
            maxApplications: true,
            createdAt: true,
            updatedAt: true,
            approvedAt: true,
            applicationDeadline: true,
            _count: {
              select: {
                applications: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        
        // Include external opportunities (admin-added opportunities)
        externalOpportunities: {
          select: {
            id: true,
            title: true,
            company: true,
            description: true,
            location: true,
            applicationUrl: true,
            source: true,
            category: true,
            experienceLevel: true,
            remote: true,
            salary: true,
            deadline: true,
            isActive: true,
            isPremium: true,
            viewCount: true,
            clickCount: true,
            addedAt: true,
            updatedAt: true,
            adminNotes: true,
            _count: {
              select: {
                applications: true
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        }
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Calculate statistics
    const stats = {
      totalProjects: company.projects.length,
      totalOpportunities: company.externalOpportunities.length,
      totalApplications: company.projects.reduce((sum, p) => sum + (p._count?.applications || 0), 0) +
                        company.externalOpportunities.reduce((sum, o) => sum + (o._count?.applications || 0), 0),
      liveProjects: company.projects.filter(p => p.status === 'LIVE').length,
      activeOpportunities: company.externalOpportunities.filter(o => o.isActive).length,
      totalViews: company.externalOpportunities.reduce((sum, o) => sum + o.viewCount, 0),
      totalClicks: company.externalOpportunities.reduce((sum, o) => sum + o.clickCount, 0)
    }

    // Format projects for frontend
    const internalProjects = company.projects.map(project => ({
      ...project,
      applicationCount: project._count?.applications || 0
    }))

    // Format opportunities for frontend
    const externalOpportunities = company.externalOpportunities.map(opp => ({
      ...opp,
      applicationCount: opp._count?.applications || 0
    }))

    return NextResponse.json({
      company: {
        id: company.id,
        email: company.email,
        name: company.name,
        companyName: company.companyName,
        industry: company.industry,
        companySize: company.companySize,
        companyWebsite: company.companyWebsite,
        location: company.location,
        companyOneLiner: company.companyOneLiner,
        companyGoals: company.companyGoals,
        contactPersonName: company.contactPersonName,
        contactPersonType: company.contactPersonType,
        contactEmail: company.contactEmail,
        contactWhatsapp: company.contactWhatsapp,
        calendlyLink: company.calendlyLink,
        image: company.image,
        isExternalCompany: company.isExternalCompany,
        companySource: company.companySource,
        profileCompleted: company.profileCompleted,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        lastActiveAt: company.lastActiveAt,
        subscriptionPlan: company.subscriptionPlan
      },
      internalProjects,
      externalOpportunities,
      stats
    })

  } catch (error) {
    console.error('Error fetching company details:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch company details' 
    }, { status: 500 })
  }
}

