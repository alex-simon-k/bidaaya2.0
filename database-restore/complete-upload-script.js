const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// Function to parse CSV file
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Function to parse date strings
function parseDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  
  // Handle different date formats
  if (dateStr.includes('/')) {
    // Format: M/D/YYYY or MM/DD/YYYY HH:MM:SS
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Function to parse boolean values
function parseBoolean(value) {
  if (value === 'TRUE' || value === 'true' || value === '1') return true;
  if (value === 'FALSE' || value === 'false' || value === '0') return false;
  return null;
}

// Function to parse integer values
function parseInt(value) {
  if (!value || value === '') return null;
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}

// Function to parse arrays (comma-separated values)
function parseArray(value) {
  if (!value || value === '') return [];
  return value.split(',').map(item => item.trim()).filter(item => item !== '');
}

async function uploadUsers() {
  console.log('📤 Starting User upload...');
  
  try {
    const csvPath = path.join(__dirname, 'csv-files-new', 'Supabase - User.csv');
    const users = await parseCSV(csvPath);
    
    console.log(`Found ${users.length} users to upload`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // ONLY use fields that exist in CSV - nothing else!
        const userData = {};
        
        if (user.id) userData.id = user.id;
        if (user.name) userData.name = user.name;
        if (user.email) userData.email = user.email;
        if (user.role) userData.role = user.role;
        if (user.createdAt) userData.createdAt = parseDate(user.createdAt);
        if (user.updatedAt) userData.updatedAt = parseDate(user.updatedAt);
        if (user.companyName) userData.companyName = user.companyName;
        if (user.emailVerified) userData.emailVerified = parseDate(user.emailVerified);
        if (user.profileCompleted) userData.profileCompleted = parseBoolean(user.profileCompleted);
        if (user.profileCompletedAt) userData.profileCompletedAt = parseDate(user.profileCompletedAt);
        if (user.firstApplicationAt) userData.firstApplicationAt = parseDate(user.firstApplicationAt);
        if (user.linkedin) userData.linkedin = user.linkedin;
        if (user.contactWhatsapp) userData.contactWhatsapp = user.contactWhatsapp;
        if (user.onboardingStepsCompleted) userData.onboardingStepsCompleted = parseArray(user.onboardingStepsCompleted);
        if (user.phase1CompletedAt) userData.phase1CompletedAt = parseDate(user.phase1CompletedAt);
        if (user.phase2CompletedAt) userData.phase2CompletedAt = parseDate(user.phase2CompletedAt);
        if (user.dateOfBirth) userData.dateOfBirth = parseDate(user.dateOfBirth);
        if (user.education) userData.education = user.education;
        if (user.subscriptionPlan) userData.subscriptionPlan = user.subscriptionPlan;
        if (user.subscriptionStatus) userData.subscriptionStatus = user.subscriptionStatus;

        await prisma.user.create({
          data: userData
        });
        
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`✅ Uploaded ${successCount} users...`);
        }
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Error uploading user ${user.email}: ${error.message}`);
      }
    }
    
    console.log(`🎉 User upload complete! Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('💥 Fatal error in user upload:', error);
    throw error;
  }
}

async function uploadProjects() {
  console.log('📤 Starting Project upload...');
  
  try {
    const csvPath = path.join(__dirname, 'csv-files-new', 'Supabase - Project.csv');
    const projects = await parseCSV(csvPath);
    
    console.log(`Found ${projects.length} projects to upload`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const project of projects) {
      try {
        const projectData = {};
        
        if (project.id) projectData.id = project.id;
        if (project.title) projectData.title = project.title;
        if (project.companyId) projectData.companyId = project.companyId;
        if (project.createdAt) projectData.createdAt = parseDate(project.createdAt);
        if (project.updatedAt) projectData.updatedAt = parseDate(project.updatedAt);
        
        // Required fields
        if (!projectData.title) projectData.title = 'Untitled Project';
        if (!projectData.description) projectData.description = 'Project imported from backup data';
        if (!projectData.status) projectData.status = 'LIVE';

        await prisma.project.create({
          data: projectData
        });
        
        successCount++;
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Error uploading project ${project.id}: ${error.message}`);
      }
    }
    
    console.log(`🎉 Project upload complete! Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('💥 Fatal error in project upload:', error);
    throw error;
  }
}

async function uploadApplications() {
  console.log('📤 Starting Application upload...');
  
  try {
    const csvPath = path.join(__dirname, 'csv-files-new', 'Supabase - Application.csv');
    const applications = await parseCSV(csvPath);
    
    console.log(`Found ${applications.length} applications to upload`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const app of applications) {
      try {
        const applicationData = {};
        
        if (app.id) applicationData.id = app.id;
        if (app.userId) applicationData.userId = app.userId;
        if (app.projectId) applicationData.projectId = app.projectId;
        if (app.status) applicationData.status = app.status;
        if (app.createdAt) applicationData.createdAt = parseDate(app.createdAt);
        if (app.updatedAt) applicationData.updatedAt = parseDate(app.updatedAt);
        if (app.motivation) applicationData.motivation = app.motivation;

        await prisma.application.create({
          data: applicationData
        });
        
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`✅ Uploaded ${successCount} applications...`);
        }
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Error uploading application ${app.id}: ${error.message}`);
      }
    }
    
    console.log(`🎉 Application upload complete! Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('💥 Fatal error in application upload:', error);
    throw error;
  }
}

async function uploadApplicationSessions() {
  console.log('📤 Starting ApplicationSession upload...');
  
  try {
    const csvPath = path.join(__dirname, 'csv-files-new', 'Supabase - ApplicationSession.csv');
    const sessions = await parseCSV(csvPath);
    
    console.log(`Found ${sessions.length} application sessions to upload`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const session of sessions) {
      try {
        const sessionData = {};
        
        if (session.id) sessionData.id = session.id;
        if (session.userId) sessionData.userId = session.userId;
        if (session.projectId) sessionData.projectId = session.projectId;
        if (session.sessionId) sessionData.sessionId = session.sessionId;
        if (session.startedAt) sessionData.startedAt = parseDate(session.startedAt);
        if (session.completedAt) sessionData.completedAt = parseDate(session.completedAt);
        if (session.abandonedAt) sessionData.abandonedAt = parseDate(session.abandonedAt);
        if (session.timeSpentMinutes) sessionData.timeSpentMinutes = parseInt(session.timeSpentMinutes);
        if (session.stepReached) sessionData.stepReached = parseInt(session.stepReached);
        if (session.status) sessionData.status = session.status;
        if (session.step1Completed) sessionData.step1Completed = parseBoolean(session.step1Completed);
        if (session.step2Completed) sessionData.step2Completed = parseBoolean(session.step2Completed);
        if (session.step3Completed) sessionData.step3Completed = parseBoolean(session.step3Completed);
        if (session.step4Completed) sessionData.step4Completed = parseBoolean(session.step4Completed);
        if (session.wasSaved) sessionData.wasSaved = parseBoolean(session.wasSaved);
        if (session.wasRestored) sessionData.wasRestored = parseBoolean(session.wasRestored);
        if (session.saveCount) sessionData.saveCount = parseInt(session.saveCount);
        if (session.deviceType) sessionData.deviceType = session.deviceType;
        if (session.browserInfo) sessionData.browserInfo = session.browserInfo;
        if (session.userAgent) sessionData.userAgent = session.userAgent;
        if (session.createdAt) sessionData.createdAt = parseDate(session.createdAt);
        if (session.updatedAt) sessionData.updatedAt = parseDate(session.updatedAt);

        await prisma.applicationSession.create({
          data: sessionData
        });
        
        successCount++;
        if (successCount % 200 === 0) {
          console.log(`✅ Uploaded ${successCount} application sessions...`);
        }
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Error uploading session ${session.id}: ${error.message}`);
      }
    }
    
    console.log(`🎉 ApplicationSession upload complete! Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('💥 Fatal error in application session upload:', error);
    throw error;
  }
}

async function uploadApplicationAnalytics() {
  console.log('📤 Starting ApplicationAnalytics upload...');
  
  try {
    const csvPath = path.join(__dirname, 'csv-files-new', 'Supabase - ApplicationAnalytics.csv');
    const analytics = await parseCSV(csvPath);
    
    console.log(`Found ${analytics.length} analytics records to upload`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const analytic of analytics) {
      try {
        // Skip if no actual data
        if (!analytic.userId || analytic.userId === '') continue;
        
        const analyticData = {};
        
        if (analytic.id) analyticData.id = analytic.id;
        if (analytic.userId) analyticData.userId = analytic.userId;
        
        // Handle the weird date:createdAt field from CSV
        if (analytic['date:createdAt']) {
          analyticData.date = parseDate(analytic['date:createdAt']);
        } else if (analytic.createdAt) {
          analyticData.date = parseDate(analytic.createdAt);
        } else {
          // Default to today if no date found
          analyticData.date = new Date();
        }
        
        if (analytic.bidaayaApplications !== undefined && analytic.bidaayaApplications !== '') {
          analyticData.bidaayaApplications = parseInt(analytic.bidaayaApplications) || 0;
        }
        if (analytic.externalApplications !== undefined && analytic.externalApplications !== '') {
          analyticData.externalApplications = parseInt(analytic.externalApplications) || 0;
        }
        if (analytic.interviewsScheduled !== undefined && analytic.interviewsScheduled !== '') {
          analyticData.interviewsScheduled = parseInt(analytic.interviewsScheduled) || 0;
        }
        if (analytic.createdAt) analyticData.createdAt = parseDate(analytic.createdAt);
        if (analytic.updatedAt) analyticData.updatedAt = parseDate(analytic.updatedAt);

        await prisma.applicationAnalytics.create({
          data: analyticData
        });
        
        successCount++;
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Error uploading analytics ${analytic.id}: ${error.message}`);
      }
    }
    
    console.log(`🎉 ApplicationAnalytics upload complete! Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('💥 Fatal error in analytics upload:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting complete database upload...');
  console.log('⚠️  This will upload ALL CSV data to your database!');
  
  try {
    // Upload in order to maintain referential integrity
    await uploadUsers();
    await uploadProjects();
    await uploadApplications();
    await uploadApplicationSessions();
    await uploadApplicationAnalytics();
    
    console.log('🎉 ALL DATA UPLOADED SUCCESSFULLY!');
    console.log('📊 Checking final counts...');
    
    // Get final counts
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const applicationCount = await prisma.application.count();
    const sessionCount = await prisma.applicationSession.count();
    const analyticsCount = await prisma.applicationAnalytics.count();
    
    console.log(`📈 Final Database Counts:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Applications: ${applicationCount}`);
    console.log(`   Application Sessions: ${sessionCount}`);
    console.log(`   Analytics Records: ${analyticsCount}`);
    
  } catch (error) {
    console.error('💥 Upload failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the upload
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
