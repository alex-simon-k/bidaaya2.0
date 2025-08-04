const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function analyzeProjects() {
  console.log('🔍 Analyzing existing projects...\n')
  
  try {
    const projects = await prisma.project.findMany({
      include: {
        company: {
          select: {
            name: true,
            companyName: true,
            industry: true,
            companyOneLiner: true
          }
        }
      }
    })

    console.log(`📊 Total projects found: ${projects.length}`)
    
    const missingDescriptions = projects.filter(project => 
      !project.description || 
      project.description.trim() === '' || 
      project.description.length < 50
    )

    console.log(`❌ Projects missing/poor descriptions: ${missingDescriptions.length}`)
    console.log('\n📋 Projects needing description updates:')
    
    missingDescriptions.forEach((project, index) => {
      console.log(`\n${index + 1}. "${project.title}"`)
      console.log(`   Company: ${project.company?.companyName || project.company?.name || 'Unknown'}`)
      console.log(`   Category: ${project.category || 'Not specified'}`)
      console.log(`   Type: ${project.projectType || 'Not specified'}`)
      console.log(`   Duration: ${project.duration || 'Not specified'}`)
      console.log(`   Skills: ${project.skillsRequired?.join(', ') || 'None listed'}`)
      console.log(`   Current description: "${project.description || 'EMPTY'}"`)
    })

    return { allProjects: projects, missingDescriptions }

  } catch (error) {
    console.error('❌ Error analyzing projects:', error)
    throw error
  }
}

function generateProjectDescription(project) {
  const company = project.company?.companyName || project.company?.name || 'Our company'
  const industry = project.company?.industry || 'technology'
  const companyOneLiner = project.company?.companyOneLiner || ''
  
  // Base description structure
  let description = `Join ${company} for an exciting ${project.experienceLevel?.toLowerCase() || 'entry-level'} opportunity in ${project.category?.toLowerCase() || 'technology'}. `
  
  // Add company context if available
  if (companyOneLiner) {
    description += `${companyOneLiner} `
  } else {
    description += `We are a ${industry} company looking for motivated students to contribute to meaningful projects. `
  }

  // Add project-specific details
  if (project.projectType) {
    description += `This ${project.projectType.toLowerCase()} project will give you hands-on experience in ${project.category?.toLowerCase() || 'your field of interest'}. `
  }

  // Add duration and commitment
  if (project.duration) {
    description += `The project runs for ${project.duration} `
    if (project.timeCommitment) {
      description += `on a ${project.timeCommitment.toLowerCase()} basis. `
    } else {
      description += `providing flexible learning opportunities. `
    }
  }

  // Add skills and learning outcomes
  if (project.skillsRequired?.length > 0) {
    const skills = project.skillsRequired.slice(0, 4).join(', ')
    description += `You'll develop skills in ${skills} while working on real-world challenges. `
  }

  if (project.learningOutcomes?.length > 0) {
    description += `Key learning outcomes include: ${project.learningOutcomes.slice(0, 3).join(', ')}. `
  }

  // Add location/remote info
  if (project.remote) {
    description += `This is a remote opportunity, perfect for students anywhere. `
  } else if (project.location) {
    description += `Based in ${project.location}, this role offers local networking opportunities. `
  }

  // Add deliverables
  if (project.deliverables?.length > 0) {
    description += `You'll work on ${project.deliverables.slice(0, 2).join(' and ')}, contributing directly to our business goals. `
  }

  // Add closing
  if (project.compensation && project.compensation !== 'Unpaid') {
    description += `This paid opportunity offers ${project.compensation} compensation while you gain valuable industry experience.`
  } else {
    description += `This internship provides invaluable industry experience and mentorship to kickstart your career.`
  }

  return description
}

async function regenerateDescriptions() {
  console.log('\n🚀 Starting description regeneration...\n')
  
  try {
    const { missingDescriptions } = await analyzeProjects()
    
    if (missingDescriptions.length === 0) {
      console.log('✅ All projects already have good descriptions!')
      return
    }

    console.log(`\n📝 Generating descriptions for ${missingDescriptions.length} projects...\n`)
    
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < missingDescriptions.length; i++) {
      const project = missingDescriptions[i]
      
      try {
        const newDescription = generateProjectDescription(project)
        
        await prisma.project.update({
          where: { id: project.id },
          data: { description: newDescription }
        })
        
        successCount++
        console.log(`✅ ${i + 1}/${missingDescriptions.length} Updated: "${project.title}"`)
        console.log(`   New description (${newDescription.length} chars): ${newDescription.substring(0, 100)}...\n`)
        
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to update "${project.title}":`, error.message)
      }
    }

    console.log('\n🎉 Regeneration complete!')
    console.log(`✅ Successfully updated: ${successCount} projects`)
    console.log(`❌ Failed updates: ${errorCount} projects`)

  } catch (error) {
    console.error('❌ Error during regeneration:', error)
    throw error
  }
}

async function main() {
  console.log('🔧 Project Description Regenerator\n')
  console.log('This tool will generate descriptions for projects missing them.\n')
  
  try {
    await regenerateDescriptions()
  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { analyzeProjects, generateProjectDescription, regenerateDescriptions } 