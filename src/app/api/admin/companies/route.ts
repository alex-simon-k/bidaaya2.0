import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch all companies with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'all', 'self-serve', 'external', 'external-active', 'external-inactive'
    const search = searchParams.get('search') // Search by name, email
    const industry = searchParams.get('industry') // Filter by industry

    // Build where clause
    const where: any = {
      role: 'COMPANY'
    }

    // Apply filter
    if (filter === 'self-serve') {
      where.isExternalCompany = false
    } else if (filter === 'external') {
      where.isExternalCompany = true
    } else if (filter === 'external-active') {
      where.isExternalCompany = true
      where.profileCompleted = true
    } else if (filter === 'external-inactive') {
      where.isExternalCompany = true
      where.profileCompleted = false
    }

    // Apply search
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Apply industry filter
    if (industry && industry !== 'all') {
      where.industry = industry
    }

    // Fetch companies
    const companies = await prisma.user.findMany({
      where,
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
        image: true,
        isExternalCompany: true,
        companySource: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
        subscriptionPlan: true,
        _count: {
          select: {
            projects: true,
            externalOpportunities: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format response
    const formattedCompanies = companies.map(company => ({
      id: company.id,
      email: company.email,
      name: company.name,
      companyName: company.companyName,
      industry: company.industry,
      companySize: company.companySize,
      companyWebsite: company.companyWebsite,
      location: company.location,
      companyOneLiner: company.companyOneLiner,
      image: company.image,
      isExternalCompany: company.isExternalCompany,
      companySource: company.companySource,
      profileCompleted: company.profileCompleted,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      lastActiveAt: company.lastActiveAt,
      subscriptionPlan: company.subscriptionPlan,
      projectsCount: company._count.projects,
      opportunitiesCount: company._count.externalOpportunities,
      // Status for UI
      status: company.isExternalCompany 
        ? (company.profileCompleted ? 'external-active' : 'external-inactive')
        : 'self-serve'
    }))

    return NextResponse.json({
      companies: formattedCompanies,
      total: formattedCompanies.length
    })

  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch companies' 
    }, { status: 500 })
  }
}
