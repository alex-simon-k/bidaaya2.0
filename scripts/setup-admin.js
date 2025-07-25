const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupAdmin() {
  const email = process.argv[2]
  
  if (!email) {
    console.log('❌ Please provide an email address')
    console.log('Usage: node scripts/setup-admin.js your.email@example.com')
    process.exit(1)
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email }
    })

    if (!user) {
      console.log(`❌ User with email ${email} not found`)
      console.log('Make sure the user has registered first')
      process.exit(1)
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' }
    })

    console.log('🎉 Admin access granted!')
    console.log(`✅ ${updatedUser.name} (${updatedUser.email}) is now an ADMIN`)
    console.log('')
    console.log('🔗 Access the admin dashboard at: http://localhost:3000/admin/projects')
    console.log('')
    console.log('Admin capabilities:')
    console.log('  • Review and approve/reject projects')
    console.log('  • View company information and Calendly links')
    console.log('  • Monitor application statistics')
    console.log('  • Add feedback for project decisions')

  } catch (error) {
    console.error('❌ Error setting up admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin() 