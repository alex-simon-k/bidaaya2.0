import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

/**
 * Smart Daily CSV Upload - Compares with existing opportunities
 * 
 * Workflow:
 * 1. Upload CSV/JSON with current opportunities
 * 2. Compare with existing active opportunities in DB
 * 3. Mark opportunities as CLOSED (isActive=false) if they're NOT in the new CSV
 * 4. Add NEW opportunities that are in CSV but not in DB
 * 5. Leave existing opportunities that are in both unchanged
 * 
 * Accepts CSV file or JSON data
 * Compares by title (case-insensitive, fuzzy matching)
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

    // Get all existing ACTIVE opportunities for comparison
    const existingOpps = await prisma.externalOpportunity.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        company: true,
        applicationUrl: true,
      }
    })

    console.log(`   Found ${existingOpps.length} active opportunities in database`)

    // Create normalized title set from uploaded CSV for comparison
    const uploadedTitleSet = new Set<string>()
    const uploadedTitleCompanyMap = new Map<string, Set<string>>() // normalized title -> companies
    const uploadedUrlSet = new Set<string>()

    for (const row of opportunities) {
      const title = row.Title || row.title || row.jobTitle || row['Job Title']
      const companyName = row.Name || row.name || row.company || row.Company || row.employer
      const applicationUrl = row.Title_URL || row.title_url || row.titleUrl || row.url || row.applicationUrl || row.link

      if (title && companyName) {
        const normalizedTitle = normalizeTitle(title)
        const normalizedCompany = companyName.toLowerCase().trim()
        uploadedTitleSet.add(normalizedTitle)
        
        if (!uploadedTitleCompanyMap.has(normalizedTitle)) {
          uploadedTitleCompanyMap.set(normalizedTitle, new Set())
        }
        uploadedTitleCompanyMap.get(normalizedTitle)!.add(normalizedCompany)
      }

      if (applicationUrl) {
        uploadedUrlSet.add(normalizeUrl(applicationUrl))
      }
    }

    // Create lookup maps for existing opportunities
    const existingTitleLookup = new Map<string, Set<string>>() // normalized title -> companies
    const existingUrlLookup = new Set<string>()
    const existingOppsByTitle = new Map<string, any[]>() // normalized title -> opportunity objects

    for (const opp of existingOpps) {
      const normalizedTitle = normalizeTitle(opp.title)
      const normalizedCompany = opp.company.toLowerCase().trim()
      
      if (!existingTitleLookup.has(normalizedTitle)) {
        existingTitleLookup.set(normalizedTitle, new Set())
        existingOppsByTitle.set(normalizedTitle, [])
      }
      existingTitleLookup.get(normalizedTitle)!.add(normalizedCompany)
      existingOppsByTitle.get(normalizedTitle)!.push(opp)
      
      if (opp.applicationUrl) {
        existingUrlLookup.add(normalizeUrl(opp.applicationUrl))
      }
    }

    const results = {
      created: 0,
      closed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      newOpportunities: [] as any[],
      closedOpportunities: [] as any[],
      skippedOpportunities: [] as any[]
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Mark new opportunities as new for early access (48 hours)
    const publishedAt = now
    const earlyAccessUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hours

    // STEP 1: Mark opportunities as CLOSED if they're NOT in the new CSV
    console.log(`   Step 1: Checking for opportunities to close...`)
    const opportunitiesToClose: any[] = []

    for (const opp of existingOpps) {
      const normalizedTitle = normalizeTitle(opp.title)
      const normalizedCompany = opp.company.toLowerCase().trim()
      
      // Check if this opportunity exists in the uploaded CSV
      // Priority: Title match (90%+) -> then check company if multiple matches
      let foundInUpload = false
      
      // First: Check by exact normalized title match
      if (uploadedTitleSet.has(normalizedTitle)) {
        const uploadedCompanies = uploadedTitleCompanyMap.get(normalizedTitle)
        if (uploadedCompanies && uploadedCompanies.has(normalizedCompany)) {
          foundInUpload = true
        }
      }
      
      // Second: Check by fuzzy title match (90%+ similarity)
      if (!foundInUpload) {
        for (const uploadedTitle of uploadedTitleSet) {
          const similarity = calculateSimilarity(normalizedTitle, uploadedTitle)
          if (similarity >= 0.90) { // 90% threshold
            const uploadedCompanies = uploadedTitleCompanyMap.get(uploadedTitle)
            // If high confidence match (>95%), accept even without company match
            // Otherwise, require company match for 90-95% similarity
            if (similarity >= 0.95 || (uploadedCompanies && uploadedCompanies.has(normalizedCompany))) {
              foundInUpload = true
              break
            }
          }
        }
      }
      
      // Third: Check by URL (fallback)
      if (!foundInUpload && opp.applicationUrl && uploadedUrlSet.has(normalizeUrl(opp.applicationUrl))) {
        foundInUpload = true
      }
      
      // If not found in upload, mark as closed
      if (!foundInUpload) {
        opportunitiesToClose.push(opp)
      }
    }

    // Close opportunities that are no longer in the CSV
    for (const opp of opportunitiesToClose) {
      try {
        await prisma.externalOpportunity.update({
          where: { id: opp.id },
          data: {
            isActive: false,
            updatedAt: now
          }
        })
        results.closed++
        results.closedOpportunities.push({
          id: opp.id,
          title: opp.title,
          company: opp.company,
        })
      } catch (error) {
        results.failed++
        results.errors.push(
          `Failed to close "${opp.title}" at ${opp.company}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    console.log(`   Closed ${results.closed} opportunities that are no longer in CSV`)

    // STEP 2: Add new opportunities from CSV
    console.log(`   Step 2: Checking for new opportunities to add...`)

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

        // Check if already exists - Priority: Title match (90%+) -> Company -> URL
        let isDuplicate = false
        let duplicateReason = ''

        // First: Check by exact normalized title match
        if (existingTitleLookup.has(normalizedTitle)) {
          const existingCompanies = existingTitleLookup.get(normalizedTitle)!
          if (existingCompanies.has(normalizedCompany)) {
            isDuplicate = true
            duplicateReason = 'Exact title + company match'
          }
        }

        // Second: Check by fuzzy title match (90%+ similarity)
        if (!isDuplicate) {
          for (const [existingTitle, companies] of existingTitleLookup.entries()) {
            const similarity = calculateSimilarity(normalizedTitle, existingTitle)
            if (similarity >= 0.90) { // 90% threshold
              // If high confidence match (>95%), accept even without company match
              // Otherwise, require company match for 90-95% similarity
              if (similarity >= 0.95 || companies.has(normalizedCompany)) {
                isDuplicate = true
                duplicateReason = `Similar title match (${Math.round(similarity * 100)}%)${similarity < 0.95 ? ' + company' : ''}`
                break
              }
            }
          }
        }

        // Third: Check by URL (fallback)
        if (!isDuplicate && existingUrlLookup.has(normalizedUrl)) {
          isDuplicate = true
          duplicateReason = 'URL already exists'
        }

        if (isDuplicate) {
          // Opportunity already exists - skip (don't modify)
          results.skipped++
          results.skippedOpportunities.push({
            title: title.trim(),
            company: companyName.trim(),
            reason: duplicateReason
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

        // Update lookup maps for future comparisons
        if (!existingTitleLookup.has(normalizedTitle)) {
          existingTitleLookup.set(normalizedTitle, new Set())
        }
        existingTitleLookup.get(normalizedTitle)!.add(normalizedCompany)
        existingUrlLookup.add(normalizedUrl)

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

    console.log(`✅ Daily Upload Complete: ${results.created} new, ${results.closed} closed, ${results.skipped} skipped, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Daily upload complete: ${results.created} new opportunities added, ${results.closed} opportunities closed (no longer in CSV), ${results.skipped} skipped (already exist), ${results.failed} failed`,
      created: results.created,
      closed: results.closed,
      skipped: results.skipped,
      failed: results.failed,
      total: opportunities.length,
      existingTotal: existingOpps.length,
      newOpportunities: results.newOpportunities,
      closedOpportunities: results.closedOpportunities.slice(0, 50), // Limit to first 50
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
 * Check if two titles are similar (fuzzy matching) - uses 90% threshold
 */
function areTitlesSimilar(title1: string, title2: string): boolean {
  const similarity = calculateSimilarity(title1, title2)
  return similarity >= 0.90 // 90% similarity threshold
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

