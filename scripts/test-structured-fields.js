const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env' })

const prisma = new PrismaClient()

async function testStructuredFields() {
  console.log('🧪 Testing structured application fields...\n')
  
  try {
    // Test: Create a sample application with structured data
    console.log('📝 Creating test application with structured fields...')
    
    const testApplication = await prisma.application.create({
      data: {
        projectId: 'test-project-id',
        userId: 'test-user-id', 
        status: 'PENDING',
        whyInterested: 'I am passionate about this project because...',
        personalStatement: 'I am a dedicated student with experience in...',
        relevantExperience: 'I have worked on similar projects including...',
        projectUnderstanding: 'This project aims to solve the problem of...',
        proposedApproach: 'My approach would involve the following steps...',
        weeklyAvailability: '15-20 hours',
        startDate: '2024-08-01',
        commitmentLevel: 'dedicated',
        // Legacy fields
        coverLetter: 'Traditional cover letter content...',
        motivation: 'Combined motivation text...'
      }
    })
    
    console.log('✅ Test application created successfully!')
    console.log('Application ID:', testApplication.id)
    
    // Test: Read back the structured data
    console.log('\n📖 Reading back structured data...')
    
    const retrievedApplication = await prisma.application.findUnique({
      where: { id: testApplication.id },
      select: {
        whyInterested: true,
        personalStatement: true,
        relevantExperience: true,
        projectUnderstanding: true,
        proposedApproach: true,
        weeklyAvailability: true,
        startDate: true,
        commitmentLevel: true
      }
    })
    
    console.log('✅ Structured data retrieved successfully:')
    console.log(JSON.stringify(retrievedApplication, null, 2))
    
    // Cleanup: Delete test application
    console.log('\n🧹 Cleaning up test data...')
    await prisma.application.delete({
      where: { id: testApplication.id }
    })
    
    console.log('✅ Test completed successfully!')
    console.log('\n🎉 Structured application fields are working correctly!')
    console.log('You can now enable them in the application API.')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.code === 'P2002') {
      console.log('💡 Note: This might be due to unique constraints. Try with real project/user IDs.')
    }
    
    if (error.code === 'P2003') {
      console.log('💡 Note: Foreign key constraint - projectId and userId must exist.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testStructuredFields() 