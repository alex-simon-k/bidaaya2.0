const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Initializing early access unlocks for paid users...\n');

  try {
    // STUDENT_PREMIUM gets 5 free unlocks per month
    const premiumUpdated = await prisma.user.updateMany({
      where: {
        subscriptionPlan: 'STUDENT_PREMIUM',
        earlyAccessUnlocksRemaining: 0
      },
      data: {
        earlyAccessUnlocksRemaining: 5,
        earlyAccessUnlocksResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    console.log(`✅ Updated ${premiumUpdated.count} Premium tier (STUDENT_PREMIUM) users - 5 free unlocks/month`);

    // STUDENT_PRO gets unlimited early access
    const proUpdated = await prisma.user.updateMany({
      where: {
        subscriptionPlan: 'STUDENT_PRO',
        earlyAccessUnlocksRemaining: 0
      },
      data: {
        earlyAccessUnlocksRemaining: 999, // Effectively unlimited
        earlyAccessUnlocksResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    console.log(`✅ Updated ${proUpdated.count} Pro tier (STUDENT_PRO) users - Unlimited early access`);

    // Also update Company tiers if they exist
    const companyBasicUpdated = await prisma.user.updateMany({
      where: {
        subscriptionPlan: 'COMPANY_BASIC',
        earlyAccessUnlocksRemaining: 0
      },
      data: {
        earlyAccessUnlocksRemaining: 10,
        earlyAccessUnlocksResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    console.log(`✅ Updated ${companyBasicUpdated.count} Company Basic tier users`);

    const companyPremiumUpdated = await prisma.user.updateMany({
      where: {
        subscriptionPlan: 'COMPANY_PREMIUM',
        earlyAccessUnlocksRemaining: 0
      },
      data: {
        earlyAccessUnlocksRemaining: 15,
        earlyAccessUnlocksResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    console.log(`✅ Updated ${companyPremiumUpdated.count} Company Premium tier users`);

    const companyProUpdated = await prisma.user.updateMany({
      where: {
        subscriptionPlan: 'COMPANY_PRO',
        earlyAccessUnlocksRemaining: 0
      },
      data: {
        earlyAccessUnlocksRemaining: 20,
        earlyAccessUnlocksResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    console.log(`✅ Updated ${companyProUpdated.count} Company Pro tier users`);

    // Summary
    const totalUpdated = premiumUpdated.count + proUpdated.count + 
                        companyBasicUpdated.count + companyPremiumUpdated.count + 
                        companyProUpdated.count;

    console.log(`\n🎉 Early access initialization complete!`);
    console.log(`📊 Total users updated: ${totalUpdated}`);
    console.log(`\n💡 Early Access System:`);
    console.log(`   - FREE users: Must use 5 credits per unlock`);
    console.log(`   - STUDENT_PREMIUM users: 5 free unlocks/month, then 5 credits each`);
    console.log(`   - STUDENT_PRO users: Unlimited early access (free)`);

    // Show current stats
    const stats = await prisma.user.groupBy({
      by: ['subscriptionPlan'],
      _count: true,
      where: {
        subscriptionPlan: {
          not: 'FREE'
        }
      }
    });

    console.log('\n📈 Current paid user distribution:');
    stats.forEach(stat => {
      console.log(`   ${stat.subscriptionPlan}: ${stat._count} users`);
    });

  } catch (error) {
    console.error('❌ Error initializing early access:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

