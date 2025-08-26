const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parse/sync')

const prisma = new PrismaClient()

function parseCSV(filename) {
  try {
    const filePath = path.join(__dirname, 'csv-files-new', filename)
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filename}`)
      return []
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
      cast_date: true
    })
    
    console.log(`📄 Loaded ${records.length} records from ${filename}`)
    return records
  } catch (error) {
    console.error(`❌ Error parsing ${filename}:`, error.message)
    return []
  }
}

function convertToBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
  }
  return null
}

function convertToDate(value) {
  if (!value || value === '') return null
  if (value instanceof Date) return value
  
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return null
    return date
  } catch {
    return null
  }
}

function convertToArray(value) {
  if (Array.isArray(value)) return value
  if (!value || value === '') return []
  
  try {
    // Try to parse as JSON array first
    if (typeof value === 'string' && value.startsWith('[')) {
      return JSON.parse(value)
    }
    // Split by comma if it looks like a comma-separated list
    return value.toString().split(',').map(s => s.trim()).filter(s => s)
  } catch {
    return []
  }
}

function convertToNumber(value) {
  if (typeof value === 'number') return value
  if (!value || value === '') return null
  
  const num = Number(value)
  return isNaN(num) ? null : num
}

async function restoreUsers() {
  console.log('👥 RESTORING USERS (using simple schema)...')
  const users = parseCSV('Supabase - User.csv')
  
  let successCount = 0
  for (const user of users) {
    try {
      // Only use fields that exist in the current simplified schema
      const userData = {
        id: user.id || undefined,
        name: user.name || null,
        email: user.email,
        emailVerified: convertToDate(user.emailVerified),
        image: user.image || null,
        role: user.role || 'STUDENT',
        createdAt: convertToDate(user.createdAt) || new Date(),
        updatedAt: convertToDate(user.updatedAt) || new Date(),
        university: user.university || null,
        major: user.major || null,
        graduationYear: convertToNumber(user.graduationYear),
        skills: convertToArray(user.skills),
        companyName: user.companyName || null,
        companySize: user.companySize || null,
        industry: user.industry || null
      }
      
      await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData
      })
      
      successCount++
      if (successCount % 10 === 0) {
        console.log(`  ✅ Restored ${successCount} users...`)
      }
    } catch (error) {
      console.error(`❌ Error restoring user ${user.email}:`, error.message)
    }
  }
  
  console.log(`✅ USERS RESTORED: ${successCount}/${users.length}`)
}

async function restoreProjects() {
  console.log('📁 RESTORING PROJECTS (using simple schema)...')
  const projects = parseCSV('Supabase - Project.csv')
  
  let successCount = 0
  for (const project of projects) {
    try {
      // Only use fields that exist in the current simplified schema
      const projectData = {
        id: project.id || undefined,
        title: project.title,
        description: project.description || '',
        companyId: project.companyId,
        status: project.status === 'PENDING_APPROVAL' ? 'PENDING' : (project.status || 'PENDING'),
        createdAt: convertToDate(project.createdAt) || new Date(),
        updatedAt: convertToDate(project.updatedAt) || new Date()
      }
      
      await prisma.project.upsert({
        where: { id: projectData.id || 'dummy-id' },
        update: projectData,
        create: projectData
      })
      
      successCount++
    } catch (error) {
      console.error(`❌ Error restoring project ${project.title}:`, error.message)
    }
  }
  
  console.log(`✅ PROJECTS RESTORED: ${successCount}/${projects.length}`)
}

async function restoreApplications() {
  console.log('📝 RESTORING APPLICATIONS (using simple schema)...')
  const applications = parseCSV('Supabase - Application.csv')
  
  let successCount = 0
  for (const application of applications) {
    try {
      // Only use fields that exist in the current simplified schema
      const appData = {
        id: application.id || undefined,
        projectId: application.projectId,
        studentId: application.userId, // Note: using userId from CSV as studentId
        status: application.status || 'PENDING',
        createdAt: convertToDate(application.createdAt) || new Date(),
        updatedAt: convertToDate(application.updatedAt) || new Date()
      }
      
      // Check if user and project exist first
      const userExists = await prisma.user.findUnique({ where: { id: appData.studentId } })
      const projectExists = await prisma.project.findUnique({ where: { id: appData.projectId } })
      
      if (userExists && projectExists) {
        await prisma.application.upsert({
          where: { id: appData.id || 'dummy-id' },
          update: appData,
          create: appData
        })
        successCount++
      } else {
        console.log(`⚠️ Skipping application ${appData.id} - missing user or project`)
      }
    } catch (error) {
      console.error(`❌ Error restoring application ${application.id}:`, error.message)
    }
  }
  
  console.log(`✅ APPLICATIONS RESTORED: ${successCount}/${applications.length}`)
}

async function restoreAccounts() {
  console.log('🔑 RESTORING ACCOUNTS...')
  const accounts = parseCSV('Supabase - Account.csv')
  
  let successCount = 0
  for (const account of accounts) {
    try {
      const accountData = {
        id: account.id || undefined,
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token || null,
        access_token: account.access_token || null,
        expires_at: convertToNumber(account.expires_at),
        token_type: account.token_type || null,
        scope: account.scope || null,
        id_token: account.id_token || null,
        session_state: account.session_state || null
      }
      
      await prisma.account.upsert({
        where: { 
          provider_providerAccountId: {
            provider: accountData.provider,
            providerAccountId: accountData.providerAccountId
          }
        },
        update: accountData,
        create: accountData
      })
      successCount++
    } catch (error) {
      console.error(`❌ Error restoring account:`, error.message)
    }
  }
  console.log(`✅ ACCOUNTS RESTORED: ${successCount}/${accounts.length}`)
}

async function main() {
  try {
    console.log('🚀 STARTING FIXED DATABASE RESTORATION')
    console.log('📁 Looking for CSV files in: database-restore/csv-files-new/')
    
    // Check if csv-files-new directory exists and has files
    const csvDir = path.join(__dirname, 'csv-files-new')
    if (!fs.existsSync(csvDir)) {
      console.log('❌ CSV directory not found. Please put your CSV files in: database-restore/csv-files-new/')
      return
    }
    
    const files = fs.readdirSync(csvDir)
    console.log(`📄 Found ${files.length} files:`, files)
    
    if (files.length === 0) {
      console.log('❌ No CSV files found. Please put your CSV files in: database-restore/csv-files-new/')
      return
    }
    
    // Restore in order: Users first, then Projects, then Applications, then Accounts
    await restoreUsers()
    await restoreProjects()
    await restoreApplications()
    await restoreAccounts()
    
    // Final verification
    console.log('🔍 FINAL VERIFICATION...')
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const applicationCount = await prisma.application.count()
    const accountCount = await prisma.account.count()
    
    console.log('\n🎉 FIXED RESTORATION COMPLETE!')
    console.log(`📊 FINAL COUNTS:`)
    console.log(`  👥 Users: ${userCount}`)
    console.log(`  📁 Projects: ${projectCount}`)
    console.log(`  📝 Applications: ${applicationCount}`)
    console.log(`  🔑 Accounts: ${accountCount}`)
    
    if (userCount > 0) {
      console.log('\n✅ YOUR DATA HAS BEEN SUCCESSFULLY RESTORED!')
      console.log('🔍 You can view your data at: http://localhost:5555 (Prisma Studio)')
    } else {
      console.log('\n⚠️ No data was restored. Please check your CSV files.')
    }
    
  } catch (error) {
    console.error('❌ RESTORATION FAILED:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('💥 CRITICAL ERROR:', error)
  process.exit(1)
})
