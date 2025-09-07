// Script to trigger bulk vector generation via API
const DOMAIN = 'https://bidaaya.ae'; // Replace with your domain

async function triggerBulkVectorGeneration() {
  console.log('🚀 Starting bulk vector generation for all completed profiles...');
  
  let totalProcessed = 0;
  let remainingStudents = 0;
  let batchCount = 0;
  
  try {
    do {
      batchCount++;
      console.log(`\n📦 Batch ${batchCount}:`);
      
      // Call the bulk generation API
      const response = await fetch(`${DOMAIN}/api/admin/generate-vectors-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize: 50 // Process 50 students per batch
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      // Log batch results
      console.log(`  ✅ Processed: ${result.processed} students`);
      console.log(`  📊 Successful: ${result.successful}`);
      console.log(`  ❌ Failed: ${result.failed}`);
      console.log(`  📋 Remaining: ${result.remaining}`);
      
      totalProcessed += result.processed;
      remainingStudents = result.remaining;
      
      // Show overall progress
      const coverage = result.summary?.completedProfileCoverage || 0;
      console.log(`  📈 Overall coverage: ${coverage}%`);
      
      // Small delay between batches to be nice to the API
      if (remainingStudents > 0) {
        console.log('  ⏸️  Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } while (remainingStudents > 0);
    
    console.log(`\n🏁 Bulk vector generation completed!`);
    console.log(`📊 Total students processed: ${totalProcessed}`);
    console.log(`📦 Total batches: ${batchCount}`);
    console.log('\n🎯 All students with completed profiles now have vectors!');
    console.log('🚀 AI-powered search will now be much faster and more accurate.');
    
  } catch (error) {
    console.error('\n❌ Error during bulk generation:', error.message);
    console.log(`📊 Progress so far: ${totalProcessed} students processed`);
    console.log('💡 You can resume by running this script again.');
  }
}

// Run the bulk generation
triggerBulkVectorGeneration();
