const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Checking database data...')
    
    const userCount = await prisma.user.count()
    console.log(`📊 Users in database: ${userCount}`)
    
    const projectCount = await prisma.project.count()
    console.log(`📊 Projects in database: ${projectCount}`)
    
    const applicationCount = await prisma.application.count()
    console.log(`📊 Applications in database: ${applicationCount}`)
    
    if (userCount > 0) {
      console.log('✅ Your data is SAFE! The database still contains your users and data.')
      
      // Get some sample data to confirm
      const sampleUsers = await prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      })
      
      console.log('📋 Sample users:')
      sampleUsers.forEach(user => {
        console.log(`  - ${user.name || 'No name'} (${user.email}) - ${user.role}`)
      })
    } else {
      console.log('❌ No users found in database')
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
