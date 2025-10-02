const fs = require('fs');
const path = require('path');

/**
 * CSV to JSON Converter for External Opportunities
 * 
 * Usage:
 *   node scripts/csv-to-json-opportunities.js input.csv output.json
 * 
 * CSV Format:
 *   title,company,applicationUrl,location,category,experienceLevel,remote,salary,deadline,isPremium,description,source,adminNotes
 * 
 * Example:
 *   node scripts/csv-to-json-opportunities.js external-opportunities.csv opportunities.json
 */

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle quoted fields with commas
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      // Convert to appropriate types
      if (header === 'remote' || header === 'isPremium') {
        row[header] = value.toUpperCase() === 'TRUE' || value === '1' || value.toLowerCase() === 'yes';
      } else if (value) {
        row[header] = value;
      }
    });

    rows.push(row);
  }

  return rows;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node scripts/csv-to-json-opportunities.js <input.csv> [output.json]');
    console.log('');
    console.log('Example: node scripts/csv-to-json-opportunities.js opportunities.csv opportunities.json');
    console.log('');
    console.log('CSV Format:');
    console.log('  title,company,applicationUrl,location,category,experienceLevel,remote,salary,deadline,isPremium,description,source,adminNotes');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || 'opportunities.json';

  try {
    // Read CSV file
    const csvContent = fs.readFileSync(inputFile, 'utf-8');
    
    // Parse CSV to JSON
    const opportunities = parseCSV(csvContent);
    
    // Write JSON file
    fs.writeFileSync(outputFile, JSON.stringify(opportunities, null, 2));
    
    console.log(`✅ Successfully converted ${opportunities.length} opportunities`);
    console.log(`📄 Input:  ${inputFile}`);
    console.log(`📄 Output: ${outputFile}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the generated JSON file');
    console.log('2. Copy the entire JSON content');
    console.log('3. Go to /admin/external-opportunities');
    console.log('4. Click "Bulk Upload"');
    console.log('5. Paste the JSON and click "Upload"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

