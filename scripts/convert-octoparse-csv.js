/**
 * Convert OctoParse CSV to JSON for Bidaaya Upload
 * 
 * Usage:
 *   node scripts/convert-octoparse-csv.js input.csv output.json
 * 
 * Or for URL updates:
 *   node scripts/convert-octoparse-csv.js --urls input.csv output.json
 */

const fs = require('fs')
const path = require('path')

function parseCSV(content) {
  const lines = content.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  // Parse header
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine)
  
  console.log('📋 Found columns:', headers)

  // Parse data rows
  const data = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue // Skip empty lines
    
    const values = parseCSVLine(lines[i])
    const row = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    data.push(row)
  }

  return data
}

function parseCSVLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current.trim())
  return values
}

function convertToOpportunities(csvData) {
  const opportunities = []

  for (const row of csvData) {
    // Map OctoParse columns to our format
    const opportunity = {
      Title: row.Title || row.title,
      Title_URL: row.Title_URL || row.url || row.URL,
      Image: row.Image || row.image || row.logo,
      Name: row.Name || row.name || row.Company || row.company,
      Location: row.Location || row.location,
      Description: row.Description || row.description
    }

    // Only include if we have minimum required fields
    if (opportunity.Title && opportunity.Title_URL && opportunity.Name) {
      opportunities.push(opportunity)
    }
  }

  return opportunities
}

function convertToURLUpdates(csvData) {
  const updates = []

  for (const row of csvData) {
    // Map columns for URL updates
    const update = {
      Title: row.Title || row.title,
      OldURL: row.Title_URL || row.OldURL || row.old_url || row.url,
      TrueURL: row.TrueURL || row.true_url || row.TrueUrl || row.RealURL || row.real_url
    }

    // Only include if we have minimum required fields
    if (update.Title && update.OldURL) {
      updates.push(update)
    }
  }

  return updates
}

// Main execution
const args = process.argv.slice(2)

if (args.length < 2) {
  console.error('❌ Usage: node convert-octoparse-csv.js [--urls] <input.csv> <output.json>')
  console.error('')
  console.error('Examples:')
  console.error('  Initial upload:  node convert-octoparse-csv.js opportunities.csv output.json')
  console.error('  URL updates:     node convert-octoparse-csv.js --urls url-updates.csv output.json')
  process.exit(1)
}

const isURLMode = args[0] === '--urls'
const inputFile = isURLMode ? args[1] : args[0]
const outputFile = isURLMode ? args[2] : args[1]

if (!inputFile || !outputFile) {
  console.error('❌ Please provide both input and output file paths')
  process.exit(1)
}

try {
  console.log('📂 Reading CSV:', inputFile)
  
  const csvContent = fs.readFileSync(inputFile, 'utf-8')
  const csvData = parseCSV(csvContent)
  
  console.log(`📊 Parsed ${csvData.length} rows from CSV`)
  
  let result
  if (isURLMode) {
    console.log('🔗 Converting to URL update format...')
    result = convertToURLUpdates(csvData)
    console.log(`✅ Converted ${result.length} URL updates`)
  } else {
    console.log('💼 Converting to opportunities format...')
    result = convertToOpportunities(csvData)
    console.log(`✅ Converted ${result.length} opportunities`)
  }
  
  // Write JSON output
  fs.writeFileSync(
    outputFile,
    JSON.stringify(result, null, 2),
    'utf-8'
  )
  
  console.log('📄 Output written to:', outputFile)
  console.log('')
  console.log('🎉 Success! You can now:')
  if (isURLMode) {
    console.log('   1. Open the admin panel: /admin/external-opportunities')
    console.log('   2. Click "Update URLs" tab')
    console.log('   3. Paste the JSON content')
    console.log('   4. Click "Update URLs"')
  } else {
    console.log('   1. Open the admin panel: /admin/external-opportunities')
    console.log('   2. Click "CSV Upload" tab')
    console.log('   3. Paste the JSON content')
    console.log('   4. Click "Upload"')
  }

} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

