import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth-config'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only students should be browsing companies for proposals
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can browse companies for proposals' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry')
    const size = searchParams.get('size')
    const searchTerm = searchParams.get('search')

    // Build where clause for filtering
    const whereClause: any = {
      role: 'COMPANY',
      companyName: { not: null },
      profileCompleted: true
    }

    if (industry) {
      whereClause.industry = { contains: industry, mode: 'insensitive' }
    }

    if (size) {
      whereClause.companySize = size
    }

    if (searchTerm) {
      whereClause.OR = [
        { companyName: { contains: searchTerm, mode: 'insensitive' } },
        { industry: { contains: searchTerm, mode: 'insensitive' } },
        { companyOneLiner: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    const companies = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        companyName: true,
        industry: true,
        companySize: true,
        companyOneLiner: true,
        location: true,
        companyWebsite: true,
        companyGoals: true,
        createdAt: true,
        projects: {
          where: { status: 'LIVE' },
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit results for performance
    })

    // Transform data for frontend consumption
    const transformedCompanies = companies.map(company => ({
      id: company.id,
      name: company.companyName || 'Company',
      industry: company.industry || 'Technology',
      size: company.companySize || 'Unknown',
      description: company.companyOneLiner || 'Exciting company looking for talented individuals',
      location: company.location || 'Remote',
      website: company.companyWebsite,
      goals: company.companyGoals || [],
      activeProjects: company.projects.length,
      projectCategories: [...new Set(company.projects.map(p => p.category).filter(Boolean))],
      acceptingProposals: true, // Companies are accepting proposals by default
      createdAt: company.createdAt
    }))

    return NextResponse.json({ companies: transformedCompanies })

  } catch (error) {
    console.error('❌ Error fetching companies for browsing:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch companies' 
    }, { status: 500 })
  }
}
