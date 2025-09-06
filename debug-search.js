const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugMarketingSearch() {
  console.log('🔍 Debugging marketing search...\n');
  
  try {
    // 1. Check vector database
    const vectorCount = await prisma.studentVector.count();
    console.log(`📊 Total vectors in database: ${vectorCount}`);
    
    // 2. Try to simulate vector search flow
    console.log('\n🔮 Simulating vector search for "marketing interns"...');
    
    // Check if we can import the vector service
    try {
      const vectorPath = './src/lib/vector-matching-service.ts';
      console.log(`📁 Checking if vector service exists at: ${vectorPath}`);
      
      // First check what vector students exist
      const studentsWithVectors = await prisma.studentVector.findMany({
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              major: true,
              bio: true,
              interests: true
            }
          }
        }
      });
      
      console.log('\n📋 Sample students with vectors:');
      studentsWithVectors.forEach((vector, i) => {
        const student = vector.user;
        console.log(`${i+1}. ${student.name} - ${student.major}`);
        console.log(`   Bio: ${student.bio?.slice(0, 80) || 'No bio'}...`);
        console.log(`   Interests: ${student.interests?.slice(0, 3).join(', ') || 'None'}`);
        console.log('');
      });
      
    } catch (error) {
      console.log('❌ Vector service error:', error.message);
    }
    
    // 3. Try manual keyword search simulation
    console.log('\n🔍 Manual keyword search for marketing students...');
    
    const marketingStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        profileCompleted: true,
        OR: [
          { major: { contains: 'marketing', mode: 'insensitive' } },
          { major: { contains: 'business', mode: 'insensitive' } },
          { bio: { contains: 'marketing', mode: 'insensitive' } },
          { interests: { hasSome: ['Marketing & Digital Media'] } },
          { goal: { hasSome: ['marketing'] } }
        ]
      },
      select: {
        id: true,
        name: true,
        major: true,
        bio: true,
        interests: true,
        studentVector: { select: { id: true } }
      },
      take: 5
    });
    
    console.log(`📊 Found ${marketingStudents.length} marketing students through keyword search:`);
    marketingStudents.forEach((student, i) => {
      console.log(`${i+1}. ${student.name} - ${student.major}`);
      console.log(`   Has Vector: ${student.studentVector ? '✅' : '❌'}`);
      console.log(`   Interests: ${student.interests?.slice(0, 2).join(', ') || 'None'}`);
      console.log('');
    });
    
    // 4. Check what happens in the relaxed search
    console.log('\n🔄 Testing relaxed search (emergency fallback)...');
    
    const anyActiveStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        profileCompleted: true,
        lastActiveAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      select: {
        id: true,
        name: true,
        major: true,
        lastActiveAt: true
      },
      take: 5,
      orderBy: { lastActiveAt: 'desc' }
    });
    
    console.log(`📊 Found ${anyActiveStudents.length} recently active students:`);
    anyActiveStudents.forEach((student, i) => {
      console.log(`${i+1}. ${student.name} - ${student.major} (Last active: ${student.lastActiveAt})`);
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMarketingSearch();
