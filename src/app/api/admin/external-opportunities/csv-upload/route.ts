import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

/**
 * CSV Upload Endpoint for OctoParse Scraping Workflow
 * 
 * Accepts CSV data with columns:
 * - Title: Job title
 * - Title_URL: Original listing URL (e.g., Glassdoor link)
 * - Image: Company logo URL
 * - Name: Company name
 * - Location: Job location
 * - Description: Optional job description
 * 
 * This is Phase 1 of the workflow - initial opportunity upload
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { csvData, publishAsEarlyAccess = false } = body

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json(
        { error: 'CSV data must be an array of opportunity objects' },
        { status: 400 }
      )
    }

    console.log(`📊 CSV Upload: Processing ${csvData.length} opportunities from OctoParse`)

    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[],
      opportunities: [] as any[]
    }

    // Set early access times if enabled
    const now = new Date()
    const publishedAt = publishAsEarlyAccess ? now : null
    const earlyAccessUntil = publishAsEarlyAccess 
      ? new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
      : null

    for (const row of csvData) {
      try {
        // Parse CSV columns (case-insensitive)
        const title = row.Title || row.title
        const titleUrl = row.Title_URL || row.title_url || row.titleUrl || row.url
        const companyLogoUrl = row.Image || row.image || row.companyLogo || row.logo
        const companyName = row.Name || row.name || row.company || row.Company
        const location = row.Location || row.location
        const description = row.Description || row.description

        // Validation
        if (!title || !titleUrl || !companyName) {
          results.failed++
          results.errors.push(
            `Missing required fields for: ${title || 'Unknown'} - Title, Title_URL, and Company Name are required`
          )
          continue
        }

        // Check if opportunity already exists (by title + company)
        const existing = await prisma.externalOpportunity.findFirst({
          where: {
            title: title.trim(),
            company: companyName.trim()
          }
        })

        if (existing) {
          results.failed++
          results.errors.push(
            `Duplicate: "${title}" at ${companyName} already exists`
          )
          continue
        }

        // Create opportunity
        const opportunity = await prisma.externalOpportunity.create({
          data: {
            title: title.trim(),
            company: companyName.trim(),
            companyLogoUrl: companyLogoUrl?.trim() || null,
            description: description?.trim() || null,
            location: location?.trim() || null,
            applicationUrl: titleUrl.trim(),
            source: 'OctoParse Scraping',
            isActive: false, // Start as inactive until admin reviews
            isPremium: false,
            isNewOpportunity: publishAsEarlyAccess,
            publishedAt,
            earlyAccessUntil,
            unlockCredits: 5,
            addedBy: session.user.id
          }
        })

        results.created++
        results.opportunities.push({
          id: opportunity.id,
          title: opportunity.title,
          company: opportunity.company
        })

      } catch (error) {
        results.failed++
        results.errors.push(
          `Error processing "${row.Title || row.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        console.error('CSV row processing error:', error)
      }
    }

    console.log(`✅ CSV Upload Complete: ${results.created} created, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${results.created} opportunities. ${results.failed} failed.`,
      created: results.created,
      failed: results.failed,
      total: csvData.length,
      errors: results.errors.length > 0 ? results.errors : undefined,
      opportunities: results.opportunities
    })

  } catch (error) {
    console.error('CSV Upload Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process CSV upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

