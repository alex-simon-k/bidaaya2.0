const { PrismaClient } = require('@prisma/client');
const { VectorEmbeddingService } = require('../src/lib/vector-embedding-service');

const prisma = new PrismaClient();

/**
 * Generate vector embeddings for all students
 * This enables AI-powered talent matching using semantic search
 */
async function generateStudentVectors() {
  console.log('🔮 Starting student vector generation process...');
  
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured. Vector generation requires OpenAI API access.');
      console.log('💡 Please add OPENAI_API_KEY to your .env file');
      return;
    }
    
    // Get all students who don't have vectors yet
    const studentsWithoutVectors = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        studentVector: null // Students without existing vectors
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 50 // Process in batches to avoid rate limits
    });
    
    console.log(`📊 Found ${studentsWithoutVectors.length} students without vectors`);
    
    if (studentsWithoutVectors.length === 0) {
      console.log('✅ All students already have vectors!');
      return;
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process students one by one to respect API rate limits
    for (const student of studentsWithoutVectors) {
      try {
        console.log(`\n🎓 Processing: ${student.name} (${student.email})`);
        
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
          console.log(`✅ Vector generated and stored for ${student.name}`);
        } else {
          failureCount++;
          console.log(`❌ Failed to generate vector for ${student.name}`);
        }
        
        // Add delay to respect OpenAI rate limits (60 requests per minute)
        await new Promise(resolve => setTimeout(resolve, 1100));
        
      } catch (error) {
        failureCount++;
        console.error(`❌ Error processing ${student.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Vector generation complete:`);
    console.log(`✅ Success: ${successCount} students`);
    console.log(`❌ Failed: ${failureCount} students`);
    
    if (successCount > 0) {
      console.log('\n🎯 Vector-powered talent search is now enabled!');
      console.log('Companies can now find students using semantic AI matching.');
    }
    
  } catch (error) {
    console.error('❌ Error in vector generation process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  generateStudentVectors()
    .then(() => {
      console.log('\n🏁 Vector generation script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateStudentVectors };
