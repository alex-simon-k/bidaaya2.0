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

async function restoreUsersMinimal() {
  console.log('👥 RESTORING USERS (minimal fields only)...')
  const users = parseCSV('Supabase - User.csv')
  
  let successCount = 0
  for (const user of users) {
    try {
      // Only use the absolute minimum fields that exist in current schema
      const userData = {
        id: user.id,
        name: user.name || null,
        email: user.email,
        emailVerified: convertToDate(user.emailVerified),
        role: user.role || 'STUDENT',
        createdAt: convertToDate(user.createdAt) || new Date(),
        updatedAt: convertToDate(user.updatedAt) || new Date(),
        companyName: user.companyName || null
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

async function restoreProjectsMinimal() {
  console.log('📁 RESTORING PROJECTS (minimal fields only)...')
  const projects = parseCSV('Supabase - Project.csv')
  
  let successCount = 0
  for (const project of projects) {
    try {
      const projectData = {
        id: project.id,
        title: project.title,
        companyId: project.companyId,
        status: 'LIVE', // Default to LIVE since current schema doesn't have PENDING_APPROVAL
        createdAt: convertToDate(project.createdAt) || new Date(),
        updatedAt: convertToDate(project.updatedAt) || new Date()
      }
      
      await prisma.project.upsert({
        where: { id: projectData.id },
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

async function restoreApplicationsMinimal() {
  console.log('📝 RESTORING APPLICATIONS (minimal fields only)...')
  const applications = parseCSV('Supabase - Application.csv')
  
  let successCount = 0
  for (const application of applications) {
    try {
      const appData = {
        id: application.id,
        projectId: application.projectId,
        studentId: application.userId, // CSV has userId, schema expects studentId
        status: application.status || 'PENDING',
        createdAt: convertToDate(application.createdAt) || new Date(),
        updatedAt: convertToDate(application.updatedAt) || new Date()
      }
      
      // Check if user and project exist
      const userExists = await prisma.user.findUnique({ where: { id: appData.studentId } })
      const projectExists = await prisma.project.findUnique({ where: { id: appData.projectId } })
      
      if (userExists && projectExists) {
        await prisma.application.upsert({
          where: { id: appData.id },
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

async function main() {
  try {
    console.log('🚀 PHASE 1: RESTORING YOUR EXISTING DATA')
    console.log('⚠️ Using only fields that exist in current simplified schema')
    
    await restoreUsersMinimal()
    await restoreProjectsMinimal() 
    await restoreApplicationsMinimal()
    
    // Final count
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const applicationCount = await prisma.application.count()
    
    console.log('\n✅ PHASE 1 COMPLETE - YOUR DATA RESTORED!')
    console.log(`📊 RESTORED:`)
    console.log(`  👥 Users: ${userCount}`)
    console.log(`  📁 Projects: ${projectCount}`)
    console.log(`  📝 Applications: ${applicationCount}`)
    
    console.log('\n🔥 NEXT: We need to add back all the missing fields for the app to work properly!')
    
  } catch (error) {
    console.error('❌ PHASE 1 FAILED:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('💥 CRITICAL ERROR:', error)
  process.exit(1)
})
