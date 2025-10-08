import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { opportunities } = body

    if (!Array.isArray(opportunities) || opportunities.length === 0) {
      return NextResponse.json(
        { error: 'Invalid opportunities array' },
        { status: 400 }
      )
    }

    let created = 0
    let failed = 0
    let autoLinked = 0
    let newCompanies = 0
    const errors: string[] = []

    // Fetch all existing companies for matching
    const existingCompanies = await prisma.user.findMany({
      where: { role: 'COMPANY' },
      select: { id: true, companyName: true }
    })

    // Create a map for fast lookup (case-insensitive)
    const companyMap = new Map(
      existingCompanies.map(c => [
        c.companyName?.toLowerCase().trim() || '', 
        c.id
      ])
    )

    for (const opp of opportunities) {
      try {
        // Validate required fields
        if (!opp.title || !opp.company || !opp.applicationUrl) {
          errors.push(`Skipped: Missing required fields (title, company, or applicationUrl)`)
          failed++
          continue
        }

        const companyNameLower = opp.company.toLowerCase().trim()
        let companyId = companyMap.get(companyNameLower)

        // If company doesn't exist, create a minimal company profile
        if (!companyId) {
          try {
            const newCompany = await prisma.user.create({
              data: {
                email: `external-${Date.now()}-${Math.random().toString(36).substring(7)}@bidaaya-external.placeholder`,
                name: opp.company,
                companyName: opp.company,
                role: 'COMPANY',
                emailVerified: false,
                profileCompleted: false,
                isExternalCompany: true,
                companySource: 'bulk_upload',
                // Extract website if provided in opportunity data
                companyWebsite: opp.companyWebsite || null
              }
            })
            
            companyId = newCompany.id
            companyMap.set(companyNameLower, companyId) // Add to map for subsequent matches
            newCompanies++
          } catch (companyError) {
            console.error('Failed to create company:', opp.company, companyError)
            errors.push(`Failed to create company: ${opp.company}`)
            failed++
            continue
          }
        } else {
          autoLinked++
        }

        // Create the opportunity
        await prisma.externalOpportunity.create({
          data: {
            title: opp.title,
            company: opp.company, // Keep for backward compatibility
            companyId: companyId, // Link to company
            description: opp.description || null,
            location: opp.location || null,
            applicationUrl: opp.applicationUrl,
            source: opp.source || 'Admin Upload',
            category: opp.category || null,
            experienceLevel: opp.experienceLevel || null,
            remote: opp.remote || false,
            salary: opp.salary || null,
            deadline: opp.deadline ? new Date(opp.deadline) : null,
            isActive: opp.isActive !== undefined ? opp.isActive : true,
            isPremium: opp.isPremium || false,
            adminNotes: opp.adminNotes || null,
            addedBy: session.user.id
          }
        })

        created++
      } catch (error) {
        console.error('Failed to create opportunity:', opp.title, error)
        errors.push(`Failed: ${opp.title}`)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      created,
      failed,
      autoLinked,
      newCompanies,
      total: opportunities.length,
      message: `✅ Successfully created ${created} opportunities. ${autoLinked} auto-linked to existing companies, ${newCompanies} new companies created.`,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Bulk smart upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
