const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Import the VectorEmbeddingService using dynamic import
async function getVectorService() {
  const modulePath = path.join(__dirname, '../src/lib/vector-embedding-service.ts');
  return await import(modulePath);
}

const prisma = new PrismaClient();

/**
 * Generate vector embeddings for ALL students with completed profiles
 * This will process ~2,076 students in batches
 */
async function generateVectorsForCompletedProfiles() {
  console.log('🔮 Starting vector generation for students with completed profiles...');
  
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured. Please set it in your environment.');
      return;
    }
    
    console.log('✅ OpenAI API key found');
    
    // Get students with completed profiles who don't have vectors
    const studentsToProcess = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        profileCompleted: true,
        studentVector: null // Only students without existing vectors
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    console.log(`📊 Found ${studentsToProcess.length} students with completed profiles needing vectors`);
    
    if (studentsToProcess.length === 0) {
      console.log('✅ All students with completed profiles already have vectors!');
      return;
    }
    
    let successCount = 0;
    let failureCount = 0;
    const batchSize = 10;
    const totalBatches = Math.ceil(studentsToProcess.length / batchSize);
    
    console.log(`🚀 Processing ${studentsToProcess.length} students in ${totalBatches} batches of ${batchSize}`);
    console.log(`⏱️  Estimated time: ${Math.round((studentsToProcess.length * 1.2) / 60)} minutes`);
    
    // Process in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, studentsToProcess.length);
      const batch = studentsToProcess.slice(batchStart, batchEnd);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} students)`);
      
      // Process each student in the batch
      for (const student of batch) {
        try {
          console.log(`  🎓 ${student.name} (${student.email})`);
          
          const { VectorEmbeddingService } = await getVectorService();
          const vector = await VectorEmbeddingService.generateStudentEmbeddings(student.id);
          
          if (vector) {
            // Store the vector in database
            await prisma.studentVector.create({
              data: {
                userId: vector.userId,
                profileVector: vector.profileVector,
                skillsVector: vector.skillsVector,
                academicVector: vector.academicVector,
                vectorVersion: vector.vectorVersion,
                lastUpdated: vector.lastUpdated
              }
            });
            
            successCount++;
            console.log(`    ✅ Success`);
          } else {
            failureCount++;
            console.log(`    ❌ Failed to generate vector`);
          }
          
          // Respect OpenAI rate limits (60 requests per minute = 1 per second)
          await new Promise(resolve => setTimeout(resolve, 1100));
          
        } catch (error) {
          failureCount++;
          console.error(`    ❌ Error: ${error.message}`);
        }
      }
      
      // Show progress
      const completed = successCount + failureCount;
      const progressPercent = Math.round((completed / studentsToProcess.length) * 100);
      console.log(`📊 Progress: ${completed}/${studentsToProcess.length} (${progressPercent}%)`);
      console.log(`✅ Success: ${successCount} | ❌ Failed: ${failureCount}`);
      
      // Small break between batches
      if (batchIndex < totalBatches - 1) {
        console.log('⏸️  Brief pause between batches...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n🏁 Vector generation completed!`);
    console.log(`📊 Final results:`);
    console.log(`   ✅ Successfully processed: ${successCount} students`);
    console.log(`   ❌ Failed: ${failureCount} students`);
    console.log(`   📈 Success rate: ${Math.round((successCount / (successCount + failureCount)) * 100)}%`);
    
    // Final status check
    const finalVectorCount = await prisma.studentVector.count();
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    
    console.log(`\n🎯 Vector database status:`);
    console.log(`   📊 Total students: ${totalStudents}`);
    console.log(`   🔮 Students with vectors: ${finalVectorCount}`);
    console.log(`   📈 Coverage: ${Math.round((finalVectorCount / totalStudents) * 100)}%`);
    
    if (finalVectorCount > 0) {
      console.log(`\n🚀 AI-powered semantic talent search is now enabled!`);
      console.log(`Companies can now find students using intelligent matching.`);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  generateVectorsForCompletedProfiles()
    .then(() => {
      console.log('\n✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateVectorsForCompletedProfiles };
