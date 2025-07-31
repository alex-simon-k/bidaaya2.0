const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeUserBehavior() {
  console.log('🔍 ============= USER BEHAVIOR ANALYSIS =============');
  
  try {
    // 1. Basic User Stats
    const [totalUsers, students, companies, verifiedUsers, completedProfiles] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'COMPANY' } }),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({ where: { profileCompleted: true } })
    ]);

    console.log('\n📊 USER STATISTICS:');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Students: ${students}`);
    console.log(`Companies: ${companies}`);
    console.log(`Email Verified: ${verifiedUsers} (${((verifiedUsers/totalUsers)*100).toFixed(1)}%)`);
    console.log(`Profile Completed: ${completedProfiles} (${((completedProfiles/totalUsers)*100).toFixed(1)}%)`);

    // 2. Student Analysis
    const studentAnalysis = await prisma.user.groupBy({
      by: ['subscriptionPlan'],
      where: { role: 'STUDENT' },
      _count: { id: true }
    });

    console.log('\n👨‍🎓 STUDENT SUBSCRIPTION BREAKDOWN:');
    studentAnalysis.forEach(plan => {
      console.log(`${plan.subscriptionPlan}: ${plan._count.id} students`);
    });

    // 3. Application Limits Analysis
    const studentsWithLimits = await prisma.user.findMany({
      where: { 
        role: 'STUDENT',
        applicationsThisMonth: { gte: 1 }
      },
      select: {
        id: true,
        email: true,
        applicationsThisMonth: true,
        subscriptionPlan: true,
        emailVerified: true,
        profileCompleted: true
      },
      orderBy: { applicationsThisMonth: 'desc' }
    });

    console.log('\n📋 STUDENTS WHO HAVE USED APPLICATIONS:');
    console.log(`Count: ${studentsWithLimits.length}`);
    if (studentsWithLimits.length > 0) {
      console.log('Top users by applications:');
      studentsWithLimits.slice(0, 10).forEach(user => {
        console.log(`- ${user.email}: ${user.applicationsThisMonth} apps (${user.subscriptionPlan}, verified: ${!!user.emailVerified}, profile: ${user.profileCompleted})`);
      });
    }

    // 4. Students at Application Limit
    const freeStudentsAtLimit = await prisma.user.count({
      where: { 
        role: 'STUDENT',
        subscriptionPlan: 'FREE',
        applicationsThisMonth: { gte: 4 }
      }
    });

    console.log(`\n🚫 FREE STUDENTS AT LIMIT (4+ apps): ${freeStudentsAtLimit}`);

    // 5. Project Analysis
    const [totalProjects, liveProjects, pendingProjects] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'LIVE' } }),
      prisma.project.count({ where: { status: 'PENDING_APPROVAL' } })
    ]);

    console.log('\n🏢 PROJECT STATISTICS:');
    console.log(`Total Projects: ${totalProjects}`);
    console.log(`Live Projects: ${liveProjects}`);
    console.log(`Pending Approval: ${pendingProjects}`);

    // 6. Application Analysis
    const [totalApplications, recentApplications, applicationsByStatus] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.application.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    console.log('\n📨 APPLICATION STATISTICS:');
    console.log(`Total Applications: ${totalApplications}`);
    console.log(`Applications This Week: ${recentApplications}`);
    console.log('Applications by Status:');
    applicationsByStatus.forEach(status => {
      console.log(`- ${status.status}: ${status._count.id}`);
    });

    // 7. User Journey Analysis
    const userJourneyStats = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        profileCompleted: true,
        applicationsThisMonth: true,
        createdAt: true,
        subscriptionPlan: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    console.log('\n🛤️ USER JOURNEY ANALYSIS (Last 50 students):');
    
    let registeredButNotVerified = 0;
    let verifiedButNoProfile = 0;
    let profileButNoApplications = 0;
    let fullyEngaged = 0;

    userJourneyStats.forEach(user => {
      if (!user.emailVerified) {
        registeredButNotVerified++;
      } else if (!user.profileCompleted) {
        verifiedButNoProfile++;
      } else if (user.applicationsThisMonth === 0) {
        profileButNoApplications++;
      } else {
        fullyEngaged++;
      }
    });

    console.log(`Stage 1 - Registered but NOT verified: ${registeredButNotVerified}`);
    console.log(`Stage 2 - Verified but NO profile: ${verifiedButNoProfile}`);
    console.log(`Stage 3 - Profile completed but NO applications: ${profileButNoApplications}`);
    console.log(`Stage 4 - Fully engaged (applied): ${fullyEngaged}`);

    // 8. Recent Registration vs Application Rate
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = await prisma.user.count({
      where: {
        role: 'STUDENT',
        createdAt: { gte: last30Days }
      }
    });

    const recentApps = await prisma.application.count({
      where: {
        createdAt: { gte: last30Days }
      }
    });

    console.log('\n📈 RECENT ACTIVITY (Last 30 days):');
    console.log(`New Students: ${recentUsers}`);
    console.log(`New Applications: ${recentApps}`);
    console.log(`Conversion Rate: ${recentUsers > 0 ? ((recentApps/recentUsers)*100).toFixed(1) : 0}%`);

    // 9. Top Blockers Identification
    console.log('\n🔍 TOP CONVERSION BLOCKERS:');
    console.log(`1. Email Verification: ${((registeredButNotVerified/userJourneyStats.length)*100).toFixed(1)}% stuck`);
    console.log(`2. Profile Completion: ${((verifiedButNoProfile/userJourneyStats.length)*100).toFixed(1)}% stuck`);
    console.log(`3. First Application: ${((profileButNoApplications/userJourneyStats.length)*100).toFixed(1)}% stuck`);
    console.log(`4. Application Limits: ${freeStudentsAtLimit} students at FREE limit`);

    console.log('\n✅ Analysis Complete!');

  } catch (error) {
    console.error('❌ Analysis Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUserBehavior(); 