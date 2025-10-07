import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface BulkCompanyData {
  companyName: string
  email?: string
  industry?: string
  companySize?: string
  companyWebsite?: string
  location?: string
  companyOneLiner?: string
  image?: string // URL or base64
}

// POST - Bulk upload companies from JSON array
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { companies } = body as { companies: BulkCompanyData[] }

    if (!companies || !Array.isArray(companies)) {
      return NextResponse.json({ 
        error: 'Invalid request. Expected array of companies.' 
      }, { status: 400 })
    }

    if (companies.length === 0) {
      return NextResponse.json({ 
        error: 'No companies provided' 
      }, { status: 400 })
    }

    if (companies.length > 100) {
      return NextResponse.json({ 
        error: 'Cannot upload more than 100 companies at once' 
      }, { status: 400 })
    }

    const results = {
      success: [] as any[],
      failed: [] as any[]
    }

    // Process each company
    for (const companyData of companies) {
      try {
        // Validation
        if (!companyData.companyName) {
          results.failed.push({
            data: companyData,
            error: 'Company name is required'
          })
          continue
        }

        // Generate placeholder email if not provided
        const email = companyData.email || 
          `external+${companyData.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}@bidaaya.ae`

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          results.failed.push({
            data: companyData,
            error: `Email ${email} already exists`
          })
          continue
        }

        // Create company
        const company = await prisma.user.create({
          data: {
            email,
            name: companyData.companyName,
            companyName: companyData.companyName,
            role: 'COMPANY',
            industry: companyData.industry || null,
            companySize: companyData.companySize || null,
            companyWebsite: companyData.companyWebsite || null,
            location: companyData.location || null,
            companyOneLiner: companyData.companyOneLiner || null,
            image: companyData.image || null,
            isExternalCompany: true,
            companySource: 'bulk_upload',
            profileCompleted: false,
            emailVerified: null,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          select: {
            id: true,
            email: true,
            companyName: true,
            industry: true
          }
        })

        results.success.push(company)
        console.log(`✅ Bulk uploaded company: ${companyData.companyName}`)

      } catch (error) {
        results.failed.push({
          data: companyData,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const response = {
      success: true,
      created: results.success.length,
      failed: results.failed.length,
      total: companies.length,
      results: {
        success: results.success,
        failed: results.failed
      }
    }

    console.log(`✅ Bulk upload completed: ${results.success.length} created, ${results.failed.length} failed`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error bulk uploading companies:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to bulk upload companies' 
    }, { status: 500 })
  }
}

