const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileCompleted: true,
        emailVerified: true,
        createdAt: true
      }
    })

    console.log(`📊 Found ${users.length} users in database:\n`)
    
    if (users.length === 0) {
      console.log('❌ No users found. Make sure someone has registered first.')
      console.log('\n🔗 Register at: http://localhost:3000/auth/login')
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'No name'} (${user.email})`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Verified: ${user.emailVerified ? '✅' : '❌'}`)
        console.log(`   Profile: ${user.profileCompleted ? '✅' : '❌'}`)
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('❌ Error listing users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers() 