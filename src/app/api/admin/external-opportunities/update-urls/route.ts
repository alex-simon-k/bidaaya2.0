import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

/**
 * URL Update Endpoint for OctoParse Scraping Workflow - Phase 2
 * 
 * Accepts CSV data with columns:
 * - Title: Job title (for matching)
 * - OldURL: Original listing URL (currently in database)
 * - TrueURL: Actual application URL (from scraping)
 * 
 * Updates existing opportunities with the true application URL
 * Leaves blank if TrueURL is empty (e.g., Glassdoor Easy Apply)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { urlUpdates } = body

    if (!urlUpdates || !Array.isArray(urlUpdates)) {
      return NextResponse.json(
        { error: 'URL updates must be an array of update objects' },
        { status: 400 }
      )
    }

    console.log(`🔗 URL Update: Processing ${urlUpdates.length} URL updates from OctoParse Phase 2`)

    const results = {
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      updates: [] as any[]
    }

    for (const row of urlUpdates) {
      try {
        // Parse CSV columns (case-insensitive)
        const title = row.Title || row.title
        const oldUrl = row.OldURL || row.oldUrl || row.old_url || row.Title_URL || row.title_url
        const trueUrl = row.TrueURL || row.trueUrl || row.true_url || row.newUrl || row.new_url

        // Validation
        if (!title || !oldUrl) {
          results.failed++
          results.errors.push(
            `Missing required fields: Title and OldURL are required`
          )
          continue
        }

        // Skip if no true URL (e.g., Glassdoor Easy Apply)
        if (!trueUrl || trueUrl.trim() === '') {
          results.skipped++
          console.log(`⏭️  Skipping "${title}" - no true URL provided (likely Easy Apply)`)
          continue
        }

        // Find opportunity by title and current URL
        const opportunity = await prisma.externalOpportunity.findFirst({
          where: {
            title: {
              contains: title.trim(),
              mode: 'insensitive'
            },
            applicationUrl: oldUrl.trim()
          }
        })

        if (!opportunity) {
          results.failed++
          results.errors.push(
            `Not found: "${title}" with URL ${oldUrl.substring(0, 50)}...`
          )
          continue
        }

        // Update with true URL
        const updated = await prisma.externalOpportunity.update({
          where: { id: opportunity.id },
          data: {
            applicationUrl: trueUrl.trim(),
            adminNotes: opportunity.adminNotes 
              ? `${opportunity.adminNotes}\n[Auto-updated URL from scraping on ${new Date().toLocaleDateString()}]`
              : `[Auto-updated URL from scraping on ${new Date().toLocaleDateString()}]`
          }
        })

        results.updated++
        results.updates.push({
          id: updated.id,
          title: updated.title,
          company: updated.company,
          oldUrl: oldUrl.substring(0, 80) + '...',
          newUrl: trueUrl.substring(0, 80) + '...'
        })

      } catch (error) {
        results.failed++
        results.errors.push(
          `Error updating "${row.Title || row.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        console.error('URL update error:', error)
      }
    }

    console.log(`✅ URL Update Complete: ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${results.updated} URLs. ${results.skipped} skipped (no true URL). ${results.failed} failed.`,
      updated: results.updated,
      skipped: results.skipped,
      failed: results.failed,
      total: urlUpdates.length,
      errors: results.errors.length > 0 ? results.errors : undefined,
      updates: results.updates
    })

  } catch (error) {
    console.error('URL Update Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process URL updates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

