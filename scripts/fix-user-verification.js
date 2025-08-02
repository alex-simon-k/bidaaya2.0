const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixUserVerification() {
  try {
    console.log('🔧 Starting user verification fix...')
    
    // Find all users who have emails but emailVerified is null
    const usersToFix = await prisma.user.findMany({
      where: {
        emailVerified: null,
        role: { not: 'ADMIN' } // Don't touch admin accounts
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    console.log(`📊 Found ${usersToFix.length} users to fix`)
    
    if (usersToFix.length === 0) {
      console.log('✅ No users need fixing!')
      return
    }
    
    // Set emailVerified to createdAt (when they first signed up)
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: usersToFix.map(u => u.id) }
      },
      data: {
        emailVerified: new Date() // Mark as verified now
      }
    })
    
    console.log(`✅ Fixed ${updateResult.count} users`)
    
    // Log the fixed users
    usersToFix.forEach(user => {
      console.log(`📧 Fixed: ${user.email} (${user.role})`)
    })
    
    console.log('🎉 User verification fix completed!')
    
  } catch (error) {
    console.error('❌ Error fixing user verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserVerification() 