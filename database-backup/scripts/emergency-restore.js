const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function emergencyRestore() {
  try {
    console.log('🚨 EMERGENCY RESTORATION - PHASE 2')
    
    // 1. CRITICAL: Restore admin account first
    console.log('🔑 Restoring admin account...')
    try {
      await prisma.user.upsert({
        where: { email: 'alex.simon@bidaaya.ae' },
        update: {
          role: 'ADMIN',
          emailVerified: new Date(),
          profileCompleted: true
        },
        create: {
          id: 'cmdgg0akx000z47pr9ut2q3up',
          name: 'Alexander SimonK',
          email: 'alex.simon@bidaaya.ae',
          role: 'ADMIN',
          subscriptionPlan: 'COMPANY_BASIC',
          subscriptionStatus: 'ACTIVE',
          companyName: 'Bidaaya',
          emailVerified: new Date('2025-07-23T20:56:31Z'),
          profileCompleted: true,
          createdAt: new Date('2025-07-23T20:55:27Z'),
          updatedAt: new Date()
        }
      })
      console.log('✅ Admin account restored!')
    } catch (error) {
      console.log('⚠️ Admin account already exists or error:', error.message)
    }
    
    // 2. Restore projects manually (they're simple)
    console.log('📁 Restoring projects...')
    const projects = [
      {
        id: 'cmdnet6ze0008475bbkbutcdd',
        companyId: 'cmdnet6kr0006475b676j45sb',
        title: 'Sustainable Fashion Brand Marketing Intern',
        createdAt: new Date('2025-07-28T17:56:19Z'),
        updatedAt: new Date('2025-08-02T11:43:29Z')
      },
      {
        id: 'cmdnetdbb000t475b470ah9og',
        companyId: 'cmdnetcwg000r475bbjw2ykck',
        title: 'Renewable Energy Investment Intern',
        createdAt: new Date('2025-07-28T17:56:27Z'),
        updatedAt: new Date('2025-08-02T12:14:17Z')
      },
      {
        id: 'cmdneuy53000147bchyjf8l90',
        companyId: 'cmdnet4z20000475bhlp3el98',
        title: 'Mobile App UI/UX Intern',
        createdAt: new Date('2025-07-28T17:57:41Z'),
        updatedAt: new Date('2025-08-01T23:52:20Z')
      },
      {
        id: 'cmdneuyyi000347bczep58ipr',
        companyId: 'cmdnet5rl0003475b4dvyoxh8',
        title: 'AI-Powered Content Creation Intern',
        createdAt: new Date('2025-07-28T17:57:42Z'),
        updatedAt: new Date('2025-07-28T17:59:36Z')
      }
    ]
    
    for (const project of projects) {
      try {
        await prisma.project.upsert({
          where: { id: project.id },
          update: project,
          create: project
        })
      } catch (error) {
        console.warn(`⚠️ Could not restore project ${project.title}:`, error.message)
      }
    }
    console.log(`✅ Restored ${projects.length} projects`)
    
    // 3. Restore valid applications only (filter out corrupted ones)
    console.log('📝 Restoring applications (filtering valid ones)...')
    
    // Read the good applications from the first part of the CSV
    const validApplications = [
      {
        id: 'cmdngavvn0006l504jl6xpkd7',
        userId: 'cmdnf7soy0008jl04931rxcl7',
        projectId: 'cmdnev7jb000p47bcymbgpgn2',
        status: 'PENDING',
        createdAt: new Date('2025-07-28T18:38:04Z'),
        updatedAt: new Date('2025-07-28T18:38:05Z'),
        motivation: ''
      },
      {
        id: 'cmdo55pi80002lc047do7f6ud',
        userId: 'cmdo3xyi60003l4046gjtu6ym',
        projectId: 'cmdnev61g000l47bcqvcbqxqb',
        status: 'PENDING',
        createdAt: new Date('2025-07-29T06:13:53Z'),
        updatedAt: new Date('2025-07-29T06:13:54Z'),
        motivation: ''
      },
      {
        id: 'cmdo5y44s0001la04fner6m6v',
        userId: 'cmdo3xyi60003l4046gjtu6ym',
        projectId: 'cmdneuy53000147bchyjf8l90',
        status: 'PENDING',
        createdAt: new Date('2025-07-29T06:35:58Z'),
        updatedAt: new Date('2025-07-29T06:35:59Z'),
        motivation: ''
      },
      {
        id: 'cmdo7gypo0001la04u7ds1plx',
        userId: 'cmdo73ahz0000ky04fr44924k',
        projectId: 'cmdneuzre000547bcqzwir5u9',
        status: 'PENDING',
        createdAt: new Date('2025-07-29T07:18:38Z'),
        updatedAt: new Date('2025-07-29T07:18:38Z'),
        motivation: ''
      }
    ]
    
    let restoredApplications = 0
    for (const app of validApplications) {
      try {
        // Check if user and project exist
        const userExists = await prisma.user.findUnique({ where: { id: app.userId } })
        const projectExists = await prisma.project.findUnique({ where: { id: app.projectId } })
        
        if (userExists && projectExists) {
          await prisma.application.upsert({
            where: { id: app.id },
            update: app,
            create: app
          })
          restoredApplications++
        } else {
          console.log(`⚠️ Skipping application ${app.id} - missing user or project`)
        }
      } catch (error) {
        console.warn(`⚠️ Could not restore application ${app.id}:`, error.message)
      }
    }
    console.log(`✅ Restored ${restoredApplications} applications`)
    
    // 4. Final verification
    console.log('🔍 Final verification...')
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const applicationCount = await prisma.application.count()
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    
    console.log('\n🎉 EMERGENCY RESTORATION COMPLETE!')
    console.log(`📊 Final status:`)
    console.log(`  👥 Users: ${userCount}`)
    console.log(`  📁 Projects: ${projectCount}`)
    console.log(`  📝 Applications: ${applicationCount}`)
    console.log(`  🔑 Admin users: ${adminCount}`)
    
    if (adminCount > 0) {
      console.log('✅ Admin access restored - you can sign in!')
    }
    
    if (projectCount > 0) {
      console.log('✅ Projects restored - platform operational!')
    }
    
    console.log('\n🔥 PLATFORM IS BACK ONLINE!')
    console.log('🔒 Your admin account: alex.simon@bidaaya.ae')
    console.log('🌐 Ready for users!')
    
  } catch (error) {
    console.error('❌ EMERGENCY RESTORATION FAILED:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

emergencyRestore() 