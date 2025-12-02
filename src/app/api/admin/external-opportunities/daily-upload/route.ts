import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

/**
 * Smart Daily CSV Upload - Compares with existing opportunities and only uploads new ones
 * 
 * Accepts CSV file or JSON data
 * Compares by title (case-insensitive, fuzzy matching)
 * Only uploads truly new opportunities
 * Auto-marks new ones as isNewOpportunity with today's date
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const jsonData = formData.get('jsonData') as string | null

    let opportunities: any[] = []

    // Handle file upload
    if (file) {
      const text = await file.text()
      opportunities = parseCSV(text)
    } else if (jsonData) {
      try {
        opportunities = JSON.parse(jsonData)
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'No file or JSON data provided' },
        { status: 400 }
      )
    }

    if (!Array.isArray(opportunities) || opportunities.length === 0) {
      return NextResponse.json(
        { error: 'No opportunities found in upload' },
        { status: 400 }
      )
    }

    console.log(`📊 Daily Upload: Processing ${opportunities.length} opportunities`)

    // Get all existing opportunities for comparison
    const existingOpps = await prisma.externalOpportunity.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        company: true,
        applicationUrl: true,
      }
    })

    // Create lookup maps for fast comparison
    const titleLookup = new Map<string, Set<string>>()
    const urlLookup = new Set<string>()

    for (const opp of existingOpps) {
      const normalizedTitle = normalizeTitle(opp.title)
      if (!titleLookup.has(normalizedTitle)) {
        titleLookup.set(normalizedTitle, new Set())
      }
      titleLookup.get(normalizedTitle)!.add(opp.company.toLowerCase())
      if (opp.applicationUrl) {
        urlLookup.add(normalizeUrl(opp.applicationUrl))
      }
    }

    const results = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      newOpportunities: [] as any[],
      skippedOpportunities: [] as any[]
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Mark new opportunities as new for early access (48 hours)
    const publishedAt = now
    const earlyAccessUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hours

    for (const row of opportunities) {
      try {
        // Parse CSV columns (support multiple formats)
        const title = row.Title || row.title || row.jobTitle || row['Job Title']
        const companyName = row.Name || row.name || row.company || row.Company || row.employer
        const applicationUrl = row.Title_URL || row.title_url || row.titleUrl || row.url || row.applicationUrl || row.link
        const companyLogoUrl = row.Image || row.image || row.companyLogo || row.logo || row.logoUrl
        const location = row.Location || row.location || row.city
        const description = row.Description || row.description || row.jobDescription
        const category = row.Category || row.category
        const experienceLevel = row.ExperienceLevel || row.experienceLevel || row.level
        const remote = row.Remote || row.remote
        const salary = row.Salary || row.salary
        const deadline = row.Deadline || row.deadline
        const source = row.Source || row.source || 'Daily Upload'

        // Validation
        if (!title || !companyName || !applicationUrl) {
          results.failed++
          results.errors.push(
            `Missing required fields: ${title || 'Unknown'} - Need title, company, and applicationUrl`
          )
          continue
        }

        const normalizedTitle = normalizeTitle(title)
        const normalizedCompany = companyName.toLowerCase().trim()
        const normalizedUrl = normalizeUrl(applicationUrl)

        // Check if already exists by URL (most reliable)
        if (urlLookup.has(normalizedUrl)) {
          results.skipped++
          results.skippedOpportunities.push({
            title: title.trim(),
            company: companyName.trim(),
            reason: 'URL already exists'
          })
          continue
        }

        // Check if exists by title + company (fuzzy match)
        const titleMatches = titleLookup.get(normalizedTitle)
        if (titleMatches && titleMatches.has(normalizedCompany)) {
          results.skipped++
          results.skippedOpportunities.push({
            title: title.trim(),
            company: companyName.trim(),
            reason: 'Title + Company already exists'
          })
          continue
        }

        // Check for similar titles (fuzzy matching)
        let isDuplicate = false
        for (const [existingTitle, companies] of titleLookup.entries()) {
          if (areTitlesSimilar(normalizedTitle, existingTitle) && companies.has(normalizedCompany)) {
            isDuplicate = true
            break
          }
        }

        if (isDuplicate) {
          results.skipped++
          results.skippedOpportunities.push({
            title: title.trim(),
            company: companyName.trim(),
            reason: 'Similar title + company already exists'
          })
          continue
        }

        // Create new opportunity
        const opportunity = await prisma.externalOpportunity.create({
          data: {
            title: title.trim(),
            company: companyName.trim(),
            companyLogoUrl: companyLogoUrl?.trim() || null,
            description: description?.trim() || null,
            location: location?.trim() || null,
            applicationUrl: applicationUrl.trim(),
            source: source?.trim() || 'Daily Upload',
            category: category?.trim() || null,
            experienceLevel: experienceLevel?.trim() || null,
            remote: remote === true || remote === 'TRUE' || remote === 'true' || remote === 'Yes' || false,
            salary: salary?.trim() || null,
            deadline: deadline ? new Date(deadline) : null,
            isActive: true,
            isPremium: false,
            isNewOpportunity: true, // Mark as new
            publishedAt,
            earlyAccessUntil,
            unlockCredits: 7,
            addedBy: session.user.id,
            addedAt: now, // Set to today
          }
        })

        // Update lookup maps
        if (!titleLookup.has(normalizedTitle)) {
          titleLookup.set(normalizedTitle, new Set())
        }
        titleLookup.get(normalizedTitle)!.add(normalizedCompany)
        urlLookup.add(normalizedUrl)

        results.created++
        results.newOpportunities.push({
          id: opportunity.id,
          title: opportunity.title,
          company: opportunity.company,
          location: opportunity.location,
        })

      } catch (error) {
        results.failed++
        results.errors.push(
          `Error processing "${row.Title || row.title || 'Unknown'}": ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        console.error('Daily upload row processing error:', error)
      }
    }

    console.log(`✅ Daily Upload Complete: ${results.created} new, ${results.skipped} skipped, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Daily upload complete: ${results.created} new opportunities added, ${results.skipped} skipped (already exist), ${results.failed} failed`,
      created: results.created,
      skipped: results.skipped,
      failed: results.failed,
      total: opportunities.length,
      newOpportunities: results.newOpportunities,
      skippedOpportunities: results.skippedOpportunities.slice(0, 20), // Limit to first 20
      errors: results.errors.length > 0 ? results.errors.slice(0, 20) : undefined,
    })

  } catch (error) {
    console.error('Daily Upload Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process daily upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  
  const rows: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue
    
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })
    rows.push(row)
  }
  
  return rows
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)
  
  return values.map(v => v.trim().replace(/^"|"$/g, ''))
}

/**
 * Normalize title for comparison (lowercase, remove extra spaces, remove special chars)
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase()
  } catch {
    return url.toLowerCase().trim()
  }
}

/**
 * Check if two titles are similar (fuzzy matching)
 */
function areTitlesSimilar(title1: string, title2: string): boolean {
  // Exact match after normalization
  if (title1 === title2) return true
  
  // Check if one contains the other (for variations like "Software Engineer" vs "Senior Software Engineer")
  if (title1.includes(title2) || title2.includes(title1)) {
    // But not too different in length (max 30% difference)
    const lengthDiff = Math.abs(title1.length - title2.length) / Math.max(title1.length, title2.length)
    if (lengthDiff < 0.3) return true
  }
  
  // Calculate simple similarity (Levenshtein-like)
  const similarity = calculateSimilarity(title1, title2)
  return similarity > 0.85 // 85% similarity threshold
}

/**
 * Simple similarity calculation (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

