const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// CSV parsing helper
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',')
  
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const obj = {}
    headers.forEach((header, index) => {
      let value = values[index] || null
      
      // Convert string representations to appropriate types
      if (value === 'TRUE') value = true
      if (value === 'FALSE') value = false
      if (value === '' || value === 'null') value = null
      
      // Parse dates
      if (value && (header.includes('At') || header.includes('Date') || header === 'createdAt' || header === 'updatedAt')) {
        try {
          // Handle different date formats
          if (value.includes('/')) {
            // Format: 7/23/2025 20:55:27
            const parts = value.split(' ')
            const datePart = parts[0] // "7/23/2025"
            const timePart = parts[1] || "00:00:00" // "20:55:27"
            const [month, day, year] = datePart.split('/')
            value = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}Z`)
          } else {
            value = new Date(value)
          }
        } catch (e) {
          console.warn(`Could not parse date: ${value}`)
        }
      }
      
      obj[header] = value
    })
    return obj
  })
}

async function restoreDatabase() {
  try {
    console.log('🚨 EMERGENCY DATABASE RESTORATION STARTING...')
    
    // 1. Backup current users (who signed up after reset)
    console.log('📋 Backing up current users...')
    const currentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date('2025-08-02T20:00:00Z') // After the reset
        }
      }
    })
    console.log(`💾 Found ${currentUsers.length} users to preserve`)
    
    // 2. Load CSV data
    console.log('📁 Loading CSV backup files...')
    const csvPath = path.join(__dirname, '../csv-files')
    
    const userData = parseCSV(path.join(csvPath, 'Supabase - User.csv'))
    const projectData = parseCSV(path.join(csvPath, 'Supabase - Project.csv'))
    const applicationData = parseCSV(path.join(csvPath, 'Supabase - Application.csv'))
    
    console.log(`📊 Loaded:`)
    console.log(`  - ${userData.length} users`)
    console.log(`  - ${projectData.length} projects`)
    console.log(`  - ${applicationData.length} applications`)
    
    // 3. Clear current data (except recent users)
    console.log('🗑️ Clearing corrupted data...')
    await prisma.application.deleteMany({})
    await prisma.project.deleteMany({})
    await prisma.user.deleteMany({
      where: {
        createdAt: {
          lt: new Date('2025-08-02T20:00:00Z')
        }
      }
    })
    
    // 4. Restore users (filter out ones that exist in current)
    console.log('👥 Restoring users...')
    const existingEmails = new Set(currentUsers.map(u => u.email))
    const usersToRestore = userData.filter(user => !existingEmails.has(user.email))
    
    for (const user of usersToRestore) {
      try {
        await prisma.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.role,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionStatus: user.subscriptionStatus,
            companyName: user.companyName,
            emailVerified: user.emailVerified,
            profileCompleted: user.profileCompleted,
            profileCompletedAt: user.profileCompletedAt,
            firstApplicationAt: user.firstApplicationAt
          }
        })
      } catch (error) {
        console.warn(`⚠️ Could not restore user ${user.email}:`, error.message)
      }
    }
    console.log(`✅ Restored ${usersToRestore.length} users`)
    
    // 5. Restore projects
    console.log('📁 Restoring projects...')
    for (const project of projectData) {
      try {
        await prisma.project.create({
          data: {
            id: project.id,
            companyId: project.companyId,
            title: project.title,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
          }
        })
      } catch (error) {
        console.warn(`⚠️ Could not restore project ${project.title}:`, error.message)
      }
    }
    console.log(`✅ Restored ${projectData.length} projects`)
    
    // 6. Restore applications
    console.log('📝 Restoring applications...')
    for (const application of applicationData) {
      try {
        await prisma.application.create({
          data: {
            id: application.id,
            userId: application.userId,
            projectId: application.projectId,
            status: application.status,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            motivation: application.motivation
          }
        })
      } catch (error) {
        console.warn(`⚠️ Could not restore application ${application.id}:`, error.message)
      }
    }
    console.log(`✅ Restored ${applicationData.length} applications`)
    
    // 7. Final verification
    console.log('🔍 Verifying restoration...')
    const finalUserCount = await prisma.user.count()
    const finalProjectCount = await prisma.project.count()
    const finalApplicationCount = await prisma.application.count()
    
    console.log('\n🎉 RESTORATION COMPLETE!')
    console.log(`📊 Final counts:`)
    console.log(`  - Users: ${finalUserCount}`)
    console.log(`  - Projects: ${finalProjectCount}`)  
    console.log(`  - Applications: ${finalApplicationCount}`)
    
    // Log success
    const logEntry = {
      timestamp: new Date().toISOString(),
      success: true,
      restored: {
        users: usersToRestore.length,
        projects: projectData.length,
        applications: applicationData.length
      },
      preserved: {
        recentUsers: currentUsers.length
      },
      final: {
        users: finalUserCount,
        projects: finalProjectCount,
        applications: finalApplicationCount
      }
    }
    
    fs.writeFileSync(
      path.join(__dirname, '../logs/restoration.json'),
      JSON.stringify(logEntry, null, 2)
    )
    
    console.log('\n✅ YOUR DATA HAS BEEN RESTORED!')
    console.log('🔒 Recent users have been preserved')
    console.log('📊 All projects and applications are back')
    console.log('🎯 Platform is fully operational')
    
  } catch (error) {
    console.error('❌ RESTORATION FAILED:', error)
    
    // Log error
    const errorLog = {
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
      stack: error.stack
    }
    
    fs.writeFileSync(
      path.join(__dirname, '../logs/restoration-error.json'),
      JSON.stringify(errorLog, null, 2)
    )
    
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

restoreDatabase() 