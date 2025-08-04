const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Enhanced description generator with title-based intelligence
function generateEnhancedDescription(project) {
  const company = project.company?.companyName || project.company?.name || 'Our company'
  const title = project.title.toLowerCase()
  
  // Infer project details from title
  const projectInsights = analyzeProjectTitle(title)
  
  let description = ''

  // Start with engaging hook based on project type
  if (projectInsights.isAI) {
    description = `🤖 Join ${company} in revolutionizing ${projectInsights.domain} with cutting-edge AI technology. `
  } else if (projectInsights.isApp) {
    description = `📱 Help ${company} build the next generation of ${projectInsights.domain} applications. `
  } else if (projectInsights.isMarketing) {
    description = `📈 Drive growth at ${company} through innovative marketing strategies in ${projectInsights.domain}. `
  } else if (projectInsights.isData) {
    description = `📊 Unlock insights at ${company} by diving deep into ${projectInsights.domain} data analytics. `
  } else if (projectInsights.isCybersecurity) {
    description = `🔒 Protect digital assets at ${company} while mastering cybersecurity fundamentals. `
  } else if (projectInsights.isDesign) {
    description = `🎨 Shape user experiences at ${company} through innovative ${projectInsights.domain} design. `
  } else if (projectInsights.isBlockchain) {
    description = `⛓️ Pioneer blockchain solutions at ${company} in the ${projectInsights.domain} space. `
  } else if (projectInsights.isSustainability) {
    description = `🌱 Make a positive impact at ${company} by driving sustainability initiatives in ${projectInsights.domain}. `
  } else {
    description = `🚀 Launch your career at ${company} with hands-on experience in ${projectInsights.domain}. `
  }

  // Add project-specific context
  description += getProjectContext(projectInsights, company)
  
  // Add learning and development section
  description += getLearningOutcomes(projectInsights)
  
  // Add skills and technologies
  description += getSkillsSection(projectInsights)
  
  // Add impact and growth potential
  description += getImpactSection(projectInsights, company)
  
  // Add closing with compensation hint
  description += getClosingSection(projectInsights)

  return description
}

function analyzeProjectTitle(title) {
  const insights = {
    domain: 'technology',
    isAI: false,
    isApp: false,
    isMarketing: false,
    isData: false,
    isCybersecurity: false,
    isDesign: false,
    isBlockchain: false,
    isSustainability: false,
    technologies: [],
    skills: []
  }

  // AI/Machine Learning projects
  if (title.includes('ai') || title.includes('machine learning') || title.includes('artificial intelligence')) {
    insights.isAI = true
    insights.technologies.push('Python', 'TensorFlow', 'Machine Learning')
    insights.skills.push('Data Analysis', 'Algorithm Development', 'AI Research')
  }

  // App development
  if (title.includes('app') || title.includes('mobile') || title.includes('ui/ux')) {
    insights.isApp = true
    insights.technologies.push('React Native', 'Flutter', 'Figma')
    insights.skills.push('User Interface Design', 'Mobile Development', 'User Experience')
  }

  // Marketing
  if (title.includes('marketing') || title.includes('social media') || title.includes('campaigns')) {
    insights.isMarketing = true
    insights.technologies.push('Google Analytics', 'Social Media Platforms', 'Content Management')
    insights.skills.push('Digital Marketing', 'Content Creation', 'Campaign Management')
  }

  // Data analytics
  if (title.includes('data') || title.includes('analytics') || title.includes('insights')) {
    insights.isData = true
    insights.technologies.push('SQL', 'Excel', 'Power BI', 'Python')
    insights.skills.push('Data Analysis', 'Statistical Analysis', 'Data Visualization')
  }

  // Cybersecurity
  if (title.includes('cyber') || title.includes('security') || title.includes('secure')) {
    insights.isCybersecurity = true
    insights.technologies.push('Security Tools', 'Network Analysis', 'Penetration Testing')
    insights.skills.push('Security Analysis', 'Risk Assessment', 'Incident Response')
  }

  // Design/Creative
  if (title.includes('design') || title.includes('art') || title.includes('creative') || title.includes('video')) {
    insights.isDesign = true
    insights.technologies.push('Adobe Creative Suite', 'Figma', 'Sketch')
    insights.skills.push('Visual Design', 'Creative Thinking', 'Brand Development')
  }

  // Blockchain
  if (title.includes('blockchain') || title.includes('crypto') || title.includes('chain')) {
    insights.isBlockchain = true
    insights.technologies.push('Blockchain', 'Smart Contracts', 'Web3')
    insights.skills.push('Blockchain Development', 'Cryptocurrency', 'Decentralized Systems')
  }

  // Sustainability
  if (title.includes('sustainable') || title.includes('green') || title.includes('renewable') || title.includes('eco')) {
    insights.isSustainability = true
    insights.technologies.push('Renewable Energy Systems', 'Environmental Analysis')
    insights.skills.push('Sustainability Planning', 'Environmental Impact', 'Green Technology')
  }

  // Domain detection
  if (title.includes('fashion')) insights.domain = 'fashion and retail'
  else if (title.includes('health') || title.includes('medical')) insights.domain = 'healthcare and wellness'
  else if (title.includes('finance') || title.includes('bank')) insights.domain = 'financial services'
  else if (title.includes('education') || title.includes('learn')) insights.domain = 'education technology'
  else if (title.includes('food') || title.includes('restaurant')) insights.domain = 'food and hospitality'
  else if (title.includes('energy') || title.includes('renewable')) insights.domain = 'renewable energy'
  else if (title.includes('city') || title.includes('urban')) insights.domain = 'smart city development'
  else if (title.includes('social') && title.includes('impact')) insights.domain = 'social impact'

  return insights
}

function getProjectContext(insights, company) {
  if (insights.isAI) {
    return `This role offers hands-on experience with artificial intelligence and machine learning technologies. You'll work alongside experienced data scientists and engineers to develop AI solutions that solve real-world problems. `
  } else if (insights.isApp) {
    return `As part of our development team, you'll contribute to building user-friendly applications that reach thousands of users. This role combines technical skills with creative problem-solving. `
  } else if (insights.isMarketing) {
    return `Join our dynamic marketing team to create compelling campaigns that drive user engagement and brand awareness. You'll learn digital marketing strategies while contributing to measurable business results. `
  } else if (insights.isData) {
    return `Dive into data-driven decision making by analyzing complex datasets and creating actionable insights. You'll learn industry-standard tools while working on projects that directly impact business strategy. `
  } else if (insights.isCybersecurity) {
    return `Protect digital infrastructure while learning cutting-edge security practices. This role provides exposure to real security challenges and the latest cybersecurity technologies. `
  } else if (insights.isDesign) {
    return `Shape user experiences through thoughtful design and creative solutions. You'll work with cross-functional teams to bring innovative ideas to life. `
  } else if (insights.isBlockchain) {
    return `Explore the future of decentralized technology while building practical blockchain solutions. This emerging field offers unique learning opportunities and career growth potential. `
  } else if (insights.isSustainability) {
    return `Make a meaningful impact on environmental challenges while developing sustainable business solutions. This role combines purpose-driven work with practical skills development. `
  } else {
    return `Gain practical experience in a collaborative environment where innovation meets real-world application. You'll work on meaningful projects that contribute to our company's mission. `
  }
}

function getLearningOutcomes(insights) {
  let outcomes = `You'll develop valuable skills in `
  
  if (insights.skills.length > 0) {
    outcomes += `${insights.skills.slice(0, 3).join(', ')}, while also building `
  }
  
  outcomes += `professional communication, project management, and analytical thinking capabilities. `
  return outcomes
}

function getSkillsSection(insights) {
  if (insights.technologies.length > 0) {
    return `Working with tools like ${insights.technologies.slice(0, 3).join(', ')}, you'll gain hands-on experience with industry-standard technologies. `
  }
  return `You'll gain exposure to industry-standard tools and technologies relevant to your field of study. `
}

function getImpactSection(insights, company) {
  if (insights.isSustainability) {
    return `Your contributions will directly support environmental sustainability goals and help create a positive impact for future generations. `
  } else if (insights.domain === 'healthcare and wellness') {
    return `Your work will contribute to improving healthcare outcomes and helping people live healthier lives. `
  } else if (insights.domain === 'education technology') {
    return `You'll help enhance educational experiences and make learning more accessible to students worldwide. `
  } else {
    return `Your projects will have real-world impact, contributing to ${company}'s growth while building your professional portfolio. `
  }
}

function getClosingSection(insights) {
  return `This internship offers mentorship, networking opportunities, and the chance to work on projects that matter. Perfect for students looking to gain practical experience while making meaningful contributions to innovative solutions.`
}

async function enhanceAllDescriptions() {
  console.log('🎨 Enhanced Project Description Generator\n')
  
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

    console.log(`📊 Found ${projects.length} projects to enhance...\n`)
    
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      
      try {
        const enhancedDescription = generateEnhancedDescription(project)
        
        await prisma.project.update({
          where: { id: project.id },
          data: { description: enhancedDescription }
        })
        
        successCount++
        console.log(`✅ ${i + 1}/${projects.length} Enhanced: "${project.title}"`)
        console.log(`   Company: ${project.company?.companyName || 'Unknown'}`)
        console.log(`   Length: ${enhancedDescription.length} characters`)
        console.log(`   Preview: ${enhancedDescription.substring(0, 120)}...\n`)
        
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to enhance "${project.title}":`, error.message)
      }
    }

    console.log('\n🎉 Enhancement complete!')
    console.log(`✅ Successfully enhanced: ${successCount} projects`)
    console.log(`❌ Failed enhancements: ${errorCount} projects`)

  } catch (error) {
    console.error('❌ Error during enhancement:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the enhancement
enhanceAllDescriptions()

module.exports = { generateEnhancedDescription, analyzeProjectTitle } 