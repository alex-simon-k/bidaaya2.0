const { PrismaClient } = require('@prisma/client');

async function testMarketingSearch() {
  console.log('🧪 Testing marketing search logic directly...\n');
  
  try {
    const prisma = new PrismaClient();
    
    // Test the keyword-specific search that should be triggered
    console.log('🔍 Testing keyword-specific search for "marketing interns"...');
    
    const lowerPrompt = "i want marketing interns".toLowerCase();
    let whereConditions = {
      role: 'STUDENT',
      profileCompleted: true
    };
    
    // This is the logic from getKeywordSpecificCandidates
    if (lowerPrompt.includes('marketing')) {
      whereConditions.OR = [
        { major: { contains: 'marketing', mode: 'insensitive' } },
        { major: { contains: 'business', mode: 'insensitive' } },
        { bio: { contains: 'marketing', mode: 'insensitive' } },
        { interests: { hasSome: ['Marketing & Digital Media'] } }
      ];
    }
    
    console.log('🎯 Using WHERE conditions:', JSON.stringify(whereConditions, null, 2));
    
    const candidates = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        major: true,
        bio: true,
        interests: true,
        goal: true,
        location: true,
        graduationYear: true,
        profileCompleted: true,
        updatedAt: true
      },
      take: 10,
      orderBy: [
        { updatedAt: 'desc' }
      ]
    });
    
    console.log(`✅ Found ${candidates.length} marketing candidates:`);
    candidates.forEach((candidate, i) => {
      console.log(`\n${i+1}. ${candidate.name}`);
      console.log(`   Email: ${candidate.email}`);
      console.log(`   Major: ${candidate.major || 'Not specified'}`);
      console.log(`   University: ${candidate.university || 'Not specified'}`);
      console.log(`   Bio: ${candidate.bio?.slice(0, 100) || 'No bio'}...`);
      console.log(`   Interests: ${candidate.interests?.slice(0, 3).join(', ') || 'None'}`);
      console.log(`   Profile Completed: ${candidate.profileCompleted}`);
      console.log(`   Updated: ${candidate.updatedAt}`);
    });
    
    if (candidates.length === 0) {
      console.log('\n❌ No candidates found. Let me check the data...');
      
      // Check total students
      const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
      const completedProfiles = await prisma.user.count({ 
        where: { role: 'STUDENT', profileCompleted: true } 
      });
      console.log(`📊 Total students: ${totalStudents}`);
      console.log(`📊 Completed profiles: ${completedProfiles}`);
      
      // Check for any business/marketing interests
      const anyMarketing = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          OR: [
            { interests: { hasSome: ['Marketing & Digital Media'] } },
            { bio: { contains: 'marketing', mode: 'insensitive' } }
          ]
        },
        select: { name: true, interests: true, bio: true, profileCompleted: true },
        take: 5
      });
      
      console.log(`\n📋 Any students with marketing interests (${anyMarketing.length}):`);
      anyMarketing.forEach((student, i) => {
        console.log(`${i+1}. ${student.name} (Profile: ${student.profileCompleted})`);
        console.log(`   Interests: ${student.interests?.join(', ') || 'None'}`);
        console.log(`   Bio contains marketing: ${student.bio?.toLowerCase().includes('marketing') || false}`);
      });
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testMarketingSearch();
