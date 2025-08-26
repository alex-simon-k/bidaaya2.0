const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// Function to parse CSV file and get headers
function getCSVHeaders(filePath) {
  return new Promise((resolve, reject) => {
    const headers = [];
    let isFirstRow = true;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headerList) => {
        resolve(headerList);
      })
      .on('data', (data) => {
        if (isFirstRow) {
          resolve(Object.keys(data));
          isFirstRow = false;
        }
      })
      .on('error', reject);
  });
}

async function analyzeSchemaGaps() {
  console.log('🔍 Analyzing CSV fields vs Prisma schema...\n');
  
  const csvFiles = [
    { name: 'User', file: 'Supabase - User.csv', model: 'User' },
    { name: 'Project', file: 'Supabase - Project.csv', model: 'Project' },
    { name: 'Application', file: 'Supabase - Application.csv', model: 'Application' },
    { name: 'ApplicationSession', file: 'Supabase - ApplicationSession.csv', model: 'ApplicationSession' },
    { name: 'ApplicationAnalytics', file: 'Supabase - ApplicationAnalytics.csv', model: 'ApplicationAnalytics' }
  ];

  // Get Prisma schema information - this will show current database structure
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Parse Prisma models from schema
  const parseSchemaFields = (modelName) => {
    const modelRegex = new RegExp(`model ${modelName} \\{([^}]+)\\}`, 's');
    const match = schemaContent.match(modelRegex);
    
    if (!match) return [];
    
    const modelContent = match[1];
    const fieldRegex = /^\s*(\w+)\s+/gm;
    const fields = [];
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(modelContent)) !== null) {
      const fieldName = fieldMatch[1];
      // Skip relations and special keywords
      if (!['@@', 'id', 'createdAt', 'updatedAt'].includes(fieldName) && 
          !fieldName.includes('@@') && 
          !schemaContent.includes(`${fieldName}[]`)) {
        fields.push(fieldName);
      }
    }
    
    return fields;
  };

  const results = {};

  for (const csvInfo of csvFiles) {
    try {
      console.log(`📊 Analyzing ${csvInfo.name}...`);
      
      const csvPath = path.join(__dirname, 'csv-files-new', csvInfo.file);
      const csvHeaders = await getCSVHeaders(csvPath);
      const schemaFields = parseSchemaFields(csvInfo.model);
      
      // Find missing fields in schema
      const missingInSchema = csvHeaders.filter(header => 
        !schemaFields.includes(header) && 
        header !== 'id' && 
        header !== 'createdAt' && 
        header !== 'updatedAt'
      );
      
      // Find fields in schema but not in CSV
      const missingInCSV = schemaFields.filter(field => 
        !csvHeaders.includes(field) &&
        field !== 'id' &&
        field !== 'createdAt' &&
        field !== 'updatedAt'
      );
      
      results[csvInfo.name] = {
        csvHeaders,
        schemaFields,
        missingInSchema,
        missingInCSV,
        csvPath
      };
      
      console.log(`  📝 CSV Headers (${csvHeaders.length}):`, csvHeaders);
      console.log(`  🏗️  Schema Fields (${schemaFields.length}):`, schemaFields);
      
      if (missingInSchema.length > 0) {
        console.log(`  ❌ Missing in Schema (${missingInSchema.length}):`, missingInSchema);
      } else {
        console.log(`  ✅ All CSV fields exist in schema`);
      }
      
      if (missingInCSV.length > 0) {
        console.log(`  ⚠️  Missing in CSV (${missingInCSV.length}):`, missingInCSV);
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error analyzing ${csvInfo.name}:`, error.message);
    }
  }
  
  // Generate migration script for missing fields
  console.log('🛠️  GENERATING SCHEMA UPDATES...\n');
  
  let migrationSQL = '-- Auto-generated migration to add missing CSV fields\n\n';
  let schemaUpdates = '';
  
  for (const [modelName, analysis] of Object.entries(results)) {
    if (analysis.missingInSchema.length > 0) {
      console.log(`🔧 ${modelName} needs these fields added to schema:`);
      
      migrationSQL += `-- Add missing fields to ${modelName}\n`;
      migrationSQL += `ALTER TABLE "${modelName}" \n`;
      
      schemaUpdates += `\n// Add these fields to ${modelName} model:\n`;
      
      analysis.missingInSchema.forEach((field, index) => {
        // Guess field type based on field name and sample data
        let fieldType = 'String?'; // Default to optional string
        
        // Special field type mappings
        if (field.includes('Date') || field.includes('At') || field === 'date') {
          fieldType = 'DateTime?';
        } else if (field.includes('Count') || field.includes('Minutes') || field.includes('applications') || field === 'step' || field === 'save') {
          fieldType = 'Int?';
        } else if (field.includes('Completed') || field.includes('Saved') || field.includes('Restored')) {
          fieldType = 'Boolean?';
        } else if (field.includes('Steps') || field.includes('Array') || field.includes('List')) {
          fieldType = 'String[]';
        }
        
        console.log(`  - ${field}: ${fieldType}`);
        
        // SQL migration
        const sqlType = fieldType.includes('DateTime') ? 'TIMESTAMP' : 
                       fieldType.includes('Int') ? 'INTEGER' : 
                       fieldType.includes('Boolean') ? 'BOOLEAN' :
                       fieldType.includes('[]') ? 'TEXT[]' : 'TEXT';
        
        migrationSQL += `  ADD COLUMN "${field}" ${sqlType}`;
        if (index < analysis.missingInSchema.length - 1) {
          migrationSQL += ',\n';
        } else {
          migrationSQL += ';\n\n';
        }
        
        // Schema update
        schemaUpdates += `  ${field}  ${fieldType}\n`;
      });
      
      console.log('');
    }
  }
  
  // Write migration files
  const migrationPath = path.join(__dirname, 'add-missing-csv-fields.sql');
  fs.writeFileSync(migrationPath, migrationSQL);
  
  const schemaUpdatePath = path.join(__dirname, 'schema-updates-needed.txt');
  fs.writeFileSync(schemaUpdatePath, schemaUpdates);
  
  console.log('📄 Files generated:');
  console.log(`  - ${migrationPath}`);
  console.log(`  - ${schemaUpdatePath}`);
  
  console.log('\n🎯 SUMMARY:');
  for (const [modelName, analysis] of Object.entries(results)) {
    console.log(`${modelName}: ${analysis.missingInSchema.length} missing fields, ${analysis.csvHeaders.length} total CSV fields`);
  }
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Review the generated migration SQL');
  console.log('2. Update your Prisma schema with missing fields');
  console.log('3. Run the migration');
  console.log('4. Re-run the upload script');
  
  return results;
}

async function main() {
  try {
    await analyzeSchemaGaps();
  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
