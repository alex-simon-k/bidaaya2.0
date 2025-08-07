/**
 * Script to create diverse test company accounts
 * Run with: node scripts/create-test-companies.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const TEST_COMPANIES = [
  // Technology Companies
  {
    name: 'TechFlow Solutions',
    email: 'contact@techflow.dev',
    companyName: 'TechFlow Solutions',
    industry: 'Financial Technology',
    companySize: '50-100',
    companyOneLiner: 'Innovative fintech startup building next-generation payment solutions',
    companyGoals: ['Growing our team', 'Actively hiring right now'],
    companyWebsite: 'https://techflow.dev',
    contactEmail: 'hr@techflow.dev',
    contactPersonName: 'Sarah Chen',
    contactPersonType: 'HR Manager',
    contactWhatsapp: '+971501234567',
    subscriptionPlan: 'COMPANY_PRO',
    subscriptionStatus: 'ACTIVE'
  },
  {
    name: 'AI Dynamics',
    email: 'hello@aidynamics.ai',
    companyName: 'AI Dynamics',
    industry: 'Artificial Intelligence',
    companySize: '100-200',
    companyOneLiner: 'Leading AI company developing machine learning solutions for enterprises',
    companyGoals: ['Growing our team', 'Generating new ideas / innovation support'],
    companyWebsite: 'https://aidynamics.ai',
    contactEmail: 'careers@aidynamics.ai',
    contactPersonName: 'Dr. Ahmed Hassan',
    contactPersonType: 'CTO',
    contactWhatsapp: '+971501234568',
    subscriptionPlan: 'COMPANY_PREMIUM',
    subscriptionStatus: 'ACTIVE'
  },
  {
    name: 'CloudScale Systems',
    email: 'info@cloudscale.io',
    companyName: 'CloudScale Systems',
    industry: 'Cloud Computing',
    companySize: '500+',
    companyOneLiner: 'Enterprise cloud infrastructure provider with global presence',
    companyGoals: ['Growing our team', 'Exploring extra hands / contractors'],
    companyWebsite: 'https://cloudscale.io',
    contactEmail: 'talent@cloudscale.io',
    contactPersonName: 'Maria Rodriguez',
    contactPersonType: 'Talent Acquisition',
    contactWhatsapp: '+971501234569',
    subscriptionPlan: 'COMPANY_PREMIUM',
    subscriptionStatus: 'ACTIVE'
  },

  // Healthcare & Biotech
  {
    name: 'HealthTech Innovations',
    email: 'contact@healthtech.ae',
    companyName: 'HealthTech Innovations',
    industry: 'Healthcare Technology',
    companySize: '20-50',
    companyOneLiner: 'Digital health startup revolutionizing patient care through AI',
    companyGoals: ['Growing our team', 'Generating new ideas / innovation support'],
    companyWebsite: 'https://healthtech.ae',
    contactEmail: 'join@healthtech.ae',
    contactPersonName: 'Dr. Fatima Al-Zahra',
    contactPersonType: 'Founder & CEO',
    contactWhatsapp: '+971501234570',
    subscriptionPlan: 'COMPANY_BASIC',
    subscriptionStatus: 'ACTIVE'
  },
  {
    name: 'MediCore Research',
    email: 'info@medicore.com',
    companyName: 'MediCore Research',
    industry: 'Biotechnology',
    companySize: '200-500',
    companyOneLiner: 'Biotechnology research company developing breakthrough treatments',
    companyGoals: ['Growing our team', 'Actively hiring right now'],
    companyWebsite: 'https://medicore.com',
    contactEmail: 'hr@medicore.com',
    contactPersonName: 'James Wilson',
    contactPersonType: 'Head of HR',
    contactWhatsapp: '+971501234571',
    subscriptionPlan: 'COMPANY_PRO',
    subscriptionStatus: 'ACTIVE'
  },

  // Consulting & Professional Services
  {
    name: 'Strategy Plus Consulting',
    email: 'hello@strategyplus.ae',
    companyName: 'Strategy Plus Consulting',
    industry: 'Management Consulting',
    companySize: '200-500',
    companyOneLiner: 'Management consulting firm specializing in digital transformation',
    companyGoals: ['Growing our team', 'Exploring extra hands / contractors'],
    companyWebsite: 'https://strategyplus.ae',
    contactEmail: 'careers@strategyplus.ae',
    contactPersonName: 'Omar Al-Mansouri',
    contactPersonType: 'Partner',
    contactWhatsapp: '+971501234572',
    subscriptionPlan: 'COMPANY_PRO',
    subscriptionStatus: 'ACTIVE'
  },
  {
    name: 'Deloitte Middle East',
    email: 'talent@deloitte.me',
    companyName: 'Deloitte Middle East',
    industry: 'Professional Services',
    companySize: '500+',
    companyOneLiner: 'Global professional services firm providing audit, tax, and consulting',
    companyGoals: ['Growing our team', 'Actively hiring right now'],
    companyWebsite: 'https://deloitte.me',
    contactEmail: 'recruitment@deloitte.me',
    contactPersonName: 'Lisa Thompson',
    contactPersonType: 'Senior Manager - Talent',
    contactWhatsapp: '+971501234573',
    subscriptionPlan: 'COMPANY_PREMIUM',
    subscriptionStatus: 'ACTIVE'
  },

  // Finance & Banking
  {
    name: 'Emirates Investment Bank',
    email: 'careers@eib.ae',
    companyName: 'Emirates Investment Bank',
    industry: 'Investment Banking',
    companySize: '200-500',
    companyOneLiner: 'Leading regional investment bank and financial services provider',
    companyGoals: ['Growing our team', 'Actively hiring right now'],
    companyWebsite: 'https://eib.ae',
    contactEmail: 'hr@eib.ae',
    contactPersonName: 'Khalid Al-Rashid',
    contactPersonType: 'HR Director',
    contactWhatsapp: '+971501234574',
    subscriptionPlan: 'COMPANY_PRO',
    subscriptionStatus: 'ACTIVE'
  },
  {
    name: 'FinTech Ventures',
    email: 'hello@fintechventures.ae',
    companyName: 'FinTech Ventures',
    industry: 'Financial Technology',
    companySize: '50-100',
    companyOneLiner: 'Venture capital firm investing in fintech startups across MENA',
    companyGoals: ['Growing our team', 'Generating new ideas / innovation support'],
    companyWebsite: 'https://fintechventures.ae',
    contactEmail: 'team@fintechventures.ae',
    contactPersonName: 'Rania Khoury',
    contactPersonType: 'Managing Partner',
    contactWhatsapp: '+971501234575',
    subscriptionPlan: 'COMPANY_BASIC',
    subscriptionStatus: 'ACTIVE'
  },

  // E-commerce & Retail
  {
    name: 'Noon Academy',
    email: 'careers@noon.academy',
    companyName: 'Noon Academy',
    industry: 'E-learning & Education',
    companySize: '100-200',
    companyOneLiner: 'Leading online education platform transforming learning in the Middle East',
    companyGoals: ['Growing our team', 'Actively hiring right now'],
    companyWebsite: 'https://noon.academy',
    contactEmail: 'talent@noon.academy',
    contactPersonName: 'Yasmin Ahmed',
    contactPersonType: 'Head of People',
    contactWhatsapp: '+971501234576',
    subscriptionPlan: 'COMPANY_PRO',
    subscriptionStatus: 'ACTIVE'
  },
  {
    name: 'Talabat Tech',
    email: 'tech@talabat.com',
    companyName: 'Talabat Tech',
    industry: 'Food Delivery & Tech',
    companySize: '500+',
    companyOneLiner: 'Technology arm of the leading food delivery platform in the Middle East',
    companyGoals: ['Growing our team', 'Exploring extra hands / contractors'],
    companyWebsite: 'https://talabat.com',
    contactEmail: 'techcareers@talabat.com',
    contactPersonName: 'Priya Sharma',
    contactPersonType: 'Engineering Manager',
    contactWhatsapp: '+971501234577',
    subscriptionPlan: 'COMPANY_PREMIUM',
    subscriptionStatus: 'ACTIVE'
  },

  // Real Estate & Construction
  {
    name: 'Emaar Digital',
    email: 'digital@emaar.ae',
    companyName: 'Emaar Digital',
    industry: 'Real Estate Technology',
    companySize: '100-200',
    companyOneLiner: 'Digital innovation arm of Emaar, reimagining real estate experiences',
    companyGoals: ['Growing our team', 'Generating new ideas / innovation support'],
    companyWebsite: 'https://emaar.ae/digital',
    contactEmail: 'innovation@emaar.ae',
    contactPersonName: 'Hassan Al-Maktoum',
    contactPersonType: 'Innovation Director',
    contactWhatsapp: '+971501234578',
    subscriptionPlan: 'COMPANY_PRO',
    subscriptionStatus: 'ACTIVE'
  },

  // Startups & Innovation
  {
    name: 'Hub71 Ventures',
    email: 'hello@hub71.com',
    companyName: 'Hub71 Ventures',
    industry: 'Venture Capital',
    companySize: '20-50',
    companyOneLiner: 'Abu Dhabi global tech ecosystem supporting startups and scale-ups',
    companyGoals: ['Growing our team', 'Generating new ideas / innovation support'],
    companyWebsite: 'https://hub71.com',
    contactEmail: 'talent@hub71.com',
    contactPersonName: 'Sofia Petrov',
    contactPersonType: 'Ecosystem Development',
    contactWhatsapp: '+971501234579',
    subscriptionPlan: 'COMPANY_BASIC',
    subscriptionStatus: 'ACTIVE'
  },
  {
    name: 'DIFC Innovation Hub',
    email: 'innovation@difc.ae',
    companyName: 'DIFC Innovation Hub',
    industry: 'Financial Innovation',
    companySize: '50-100',
    companyOneLiner: 'Dubai International Financial Centre driving fintech innovation',
    companyGoals: ['Growing our team', 'Exploring extra hands / contractors'],
    companyWebsite: 'https://difc.ae/innovation',
    contactEmail: 'partnerships@difc.ae',
    contactPersonName: 'Mohammed Al-Gergawi',
    contactPersonType: 'Head of Innovation',
    contactWhatsapp: '+971501234580',
    subscriptionPlan: 'COMPANY_PRO',
    subscriptionStatus: 'ACTIVE'
  }
]

async function createTestCompanies() {
  console.log('🏢 Creating test company accounts...')

  try {
    for (const company of TEST_COMPANIES) {
      // Check if company already exists
      const existingCompany = await prisma.user.findUnique({
        where: { email: company.email }
      })

      if (existingCompany) {
        console.log(`⚠️  Company ${company.companyName} already exists (${company.email})`)
        continue
      }

      // Create company account
      const hashedPassword = await bcrypt.hash('TestCompany123!', 10)
      
      const newCompany = await prisma.user.create({
        data: {
          name: company.name,
          email: company.email,
          password: hashedPassword,
          role: 'COMPANY',
          emailVerified: new Date(),
          profileCompleted: true,
          
          // Company-specific fields
          companyName: company.companyName,
          industry: company.industry,
          companySize: company.companySize,
          companyOneLiner: company.companyOneLiner,
          companyGoals: company.companyGoals,
          companyWebsite: company.companyWebsite,
          contactEmail: company.contactEmail,
          contactPersonName: company.contactPersonName,
          contactPersonType: company.contactPersonType,
          contactWhatsapp: company.contactWhatsapp,
          
          // Subscription
          subscriptionPlan: company.subscriptionPlan,
          subscriptionStatus: company.subscriptionStatus,
          
          // Metadata
          createdAt: new Date(),
          updatedAt: new Date(),
          profileCompletedAt: new Date(),
          emailVerifiedAt: new Date(),
          roleSelectedAt: new Date(),
          firstLoginAt: new Date(),
          lastActiveAt: new Date()
        }
      })

      console.log(`✅ Created company: ${company.companyName} (${company.email})`)
    }

    console.log(`\n🎉 Successfully created ${TEST_COMPANIES.length} test companies!`)
    console.log('\n📋 Test Company Login Details:')
    console.log('Password for all test companies: TestCompany123!')
    console.log('\n🏢 Created Companies by Industry:')
    
    const industriesCounts = TEST_COMPANIES.reduce((acc, company) => {
      acc[company.industry] = (acc[company.industry] || 0) + 1
      return acc
    }, {})
    
    Object.entries(industriesCounts).forEach(([industry, count]) => {
      console.log(`   ${industry}: ${count} companies`)
    })

  } catch (error) {
    console.error('❌ Error creating test companies:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createTestCompanies() 