import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface FakeProject {
  title: string
  description: string
  category: string
  subcategory: string
  experienceLevel: string
  skillsRequired: string[]
  requirements: string[]
  deliverables: string[]
  learningOutcomes: string[]
  compensation: string
  durationMonths: number
  teamSize: number
  timeCommitment: string
  location: string
  remote: boolean
  companyName: string
  companyDescription: string
  department: string
  projectType: string
}

const FAKE_PROJECTS: FakeProject[] = [
  {
    title: "Mobile App UI/UX Design for FinTech Startup",
    description: "Join our innovative FinTech startup to design a user-friendly mobile banking app. You'll work with our product team to create intuitive interfaces that make financial management accessible to everyone. This project involves user research, wireframing, prototyping, and creating a comprehensive design system.",
    category: "DESIGN",
    subcategory: "UI/UX Design",
    experienceLevel: "Intermediate",
    skillsRequired: ["Figma", "Adobe XD", "User Research", "Prototyping", "Mobile Design", "Design Systems"],
    requirements: [
      "Portfolio showcasing mobile app designs",
      "Experience with design tools (Figma, Adobe XD)",
      "Understanding of user experience principles",
      "Ability to create interactive prototypes",
      "Knowledge of iOS and Android design guidelines"
    ],
    deliverables: [
      "User journey maps and personas",
      "Low and high-fidelity wireframes",
      "Interactive prototypes",
      "Complete design system",
      "Final UI designs for 15+ screens"
    ],
    learningOutcomes: [
      "Advanced mobile UI/UX design skills",
      "Experience with FinTech industry standards",
      "Collaboration with product and development teams",
      "User research and testing methodologies",
      "Professional design system creation"
    ],
    compensation: "£800-1200",
    durationMonths: 4,
    teamSize: 1,
    timeCommitment: "Part-time (15-20 hours/week)",
    location: "London",
    remote: true,
    companyName: "NeoBank Solutions",
    companyDescription: "A cutting-edge FinTech startup revolutionizing digital banking for the next generation.",
    department: "Product Design",
    projectType: "Design Project"
  },
  {
    title: "AI-Powered Content Creation Tool Development",
    description: "Build an innovative AI content creation platform that helps businesses generate marketing copy, blog posts, and social media content. You'll work with our engineering team to implement machine learning models and create a scalable web application using modern technologies.",
    category: "TECHNOLOGY",
    subcategory: "Software Development",
    experienceLevel: "Advanced",
    skillsRequired: ["Python", "React", "Node.js", "Machine Learning", "TensorFlow", "AWS", "Docker"],
    requirements: [
      "Strong programming skills in Python and JavaScript",
      "Experience with machine learning frameworks",
      "Knowledge of web development (React/Node.js)",
      "Understanding of cloud platforms (AWS/GCP)",
      "Previous AI/ML project experience"
    ],
    deliverables: [
      "AI model for content generation",
      "Web application frontend and backend",
      "API integration and documentation",
      "Cloud deployment and scaling",
      "Testing and quality assurance"
    ],
    learningOutcomes: [
      "Advanced AI/ML implementation skills",
      "Full-stack web development experience",
      "Cloud platform deployment",
      "API design and development",
      "Production-level software engineering"
    ],
    compensation: "£1500-2000",
    durationMonths: 6,
    teamSize: 2,
    timeCommitment: "Full-time (35-40 hours/week)",
    location: "Cambridge",
    remote: true,
    companyName: "ContentAI Labs",
    companyDescription: "An AI research company focused on natural language processing and content automation.",
    department: "Engineering",
    projectType: "Technical Project"
  },
  {
    title: "Sustainable Fashion Brand Marketing Campaign",
    description: "Lead a comprehensive marketing campaign for an eco-friendly fashion brand targeting Gen Z consumers. You'll develop brand messaging, create content across multiple channels, and implement social media strategies to increase brand awareness and drive sales.",
    category: "MARKETING",
    subcategory: "Digital Marketing",
    experienceLevel: "Intermediate",
    skillsRequired: ["Social Media Marketing", "Content Creation", "Adobe Creative Suite", "Analytics", "Brand Strategy"],
    requirements: [
      "Experience with social media platforms",
      "Content creation skills (graphics, video)",
      "Understanding of Gen Z consumer behavior",
      "Knowledge of sustainable fashion industry",
      "Analytics and reporting experience"
    ],
    deliverables: [
      "Comprehensive marketing strategy",
      "Social media content calendar",
      "Video and graphic content assets",
      "Influencer partnership proposals",
      "Campaign performance analytics"
    ],
    learningOutcomes: [
      "Brand strategy and positioning",
      "Multi-channel marketing execution",
      "Sustainability marketing principles",
      "Data-driven campaign optimization",
      "Creative content production"
    ],
    compensation: "£600-900",
    durationMonths: 3,
    teamSize: 1,
    timeCommitment: "Part-time (12-15 hours/week)",
    location: "Manchester",
    remote: true,
    companyName: "EcoThread Fashion",
    companyDescription: "A sustainable fashion brand creating ethical clothing for conscious consumers.",
    department: "Marketing",
    projectType: "Marketing Campaign"
  },
  {
    title: "E-commerce Data Analytics Dashboard",
    description: "Create a comprehensive data analytics dashboard for an online retailer to track sales performance, customer behavior, and inventory management. You'll work with large datasets to provide actionable insights that drive business decisions.",
    category: "DATA_SCIENCE",
    subcategory: "Business Analytics",
    experienceLevel: "Intermediate",
    skillsRequired: ["Python", "SQL", "Tableau", "Power BI", "Excel", "Data Visualization", "Statistics"],
    requirements: [
      "Strong analytical and statistical skills",
      "Experience with data visualization tools",
      "Proficiency in SQL and Python",
      "Understanding of e-commerce metrics",
      "Business intelligence experience"
    ],
    deliverables: [
      "Interactive analytics dashboard",
      "Customer segmentation analysis",
      "Sales forecasting models",
      "Inventory optimization recommendations",
      "Monthly performance reports"
    ],
    learningOutcomes: [
      "Advanced data analysis techniques",
      "Business intelligence tools proficiency",
      "E-commerce analytics expertise",
      "Data-driven decision making",
      "Professional reporting skills"
    ],
    compensation: "£1000-1400",
    durationMonths: 4,
    teamSize: 1,
    timeCommitment: "Part-time (20-25 hours/week)",
    location: "Birmingham",
    remote: true,
    companyName: "RetailMetrics Pro",
    companyDescription: "A data analytics consultancy specializing in e-commerce optimization.",
    department: "Analytics",
    projectType: "Data Project"
  },
  {
    title: "Healthcare App Patient Engagement System",
    description: "Develop a patient engagement platform that helps healthcare providers improve patient communication and treatment adherence. The system will include appointment scheduling, medication reminders, and health tracking features.",
    category: "TECHNOLOGY",
    subcategory: "Healthcare Technology",
    experienceLevel: "Advanced",
    skillsRequired: ["React Native", "Node.js", "MongoDB", "HIPAA Compliance", "Healthcare APIs", "Push Notifications"],
    requirements: [
      "Mobile app development experience",
      "Understanding of healthcare regulations",
      "Backend development skills",
      "Database design experience",
      "Security and compliance knowledge"
    ],
    deliverables: [
      "Mobile application for patients",
      "Web dashboard for healthcare providers",
      "Secure API backend",
      "HIPAA compliance documentation",
      "Integration with existing systems"
    ],
    learningOutcomes: [
      "Healthcare technology expertise",
      "Regulatory compliance implementation",
      "Secure system development",
      "Mobile and web integration",
      "API design and development"
    ],
    compensation: "£1800-2500",
    durationMonths: 6,
    teamSize: 2,
    timeCommitment: "Full-time (35-40 hours/week)",
    location: "Leeds",
    remote: false,
    companyName: "HealthTech Innovations",
    companyDescription: "A digital health company improving patient outcomes through technology.",
    department: "Product Development",
    projectType: "Healthcare Project"
  },
  {
    title: "Social Impact Research on Urban Sustainability",
    description: "Conduct comprehensive research on urban sustainability initiatives and their social impact. You'll analyze existing programs, interview stakeholders, and develop recommendations for improving environmental and social outcomes in cities.",
    category: "RESEARCH",
    subcategory: "Social Impact",
    experienceLevel: "Intermediate",
    skillsRequired: ["Research Methodology", "Data Analysis", "SPSS", "Survey Design", "Report Writing", "Stakeholder Engagement"],
    requirements: [
      "Research methodology experience",
      "Statistical analysis skills",
      "Strong writing and communication",
      "Interest in sustainability and social impact",
      "Interview and survey experience"
    ],
    deliverables: [
      "Comprehensive research report",
      "Stakeholder interview analysis",
      "Policy recommendations",
      "Data visualization and infographics",
      "Presentation to city council"
    ],
    learningOutcomes: [
      "Applied research methodology",
      "Social impact measurement",
      "Policy analysis and development",
      "Stakeholder engagement skills",
      "Professional research presentation"
    ],
    compensation: "£700-1000",
    durationMonths: 4,
    teamSize: 1,
    timeCommitment: "Part-time (15-20 hours/week)",
    location: "Bristol",
    remote: true,
    companyName: "Urban Futures Institute",
    companyDescription: "A research organization focused on sustainable urban development and social innovation.",
    department: "Research",
    projectType: "Research Project"
  },
  {
    title: "Blockchain-Based Supply Chain Solution",
    description: "Develop a blockchain solution to improve supply chain transparency and traceability for food products. You'll create smart contracts, build a web interface, and integrate with existing supply chain systems to ensure food safety and authenticity.",
    category: "TECHNOLOGY",
    subcategory: "Blockchain",
    experienceLevel: "Advanced",
    skillsRequired: ["Solidity", "Ethereum", "Web3.js", "React", "Node.js", "Smart Contracts", "Supply Chain"],
    requirements: [
      "Blockchain development experience",
      "Smart contract programming",
      "Web3 integration skills",
      "Understanding of supply chain processes",
      "Full-stack development experience"
    ],
    deliverables: [
      "Smart contracts for traceability",
      "Web application for stakeholders",
      "Mobile app for consumers",
      "Integration with existing systems",
      "Security audit and testing"
    ],
    learningOutcomes: [
      "Advanced blockchain development",
      "Smart contract security",
      "Supply chain technology",
      "Decentralized application building",
      "Industry-specific solutions"
    ],
    compensation: "£2000-2800",
    durationMonths: 5,
    teamSize: 2,
    timeCommitment: "Full-time (35-40 hours/week)",
    location: "Edinburgh",
    remote: true,
    companyName: "ChainTrace Solutions",
    companyDescription: "A blockchain technology company specializing in supply chain transparency.",
    department: "Blockchain Development",
    projectType: "Blockchain Project"
  },
  {
    title: "Video Content Production for Education Platform",
    description: "Create engaging educational video content for an online learning platform targeting university students. You'll plan, script, film, and edit high-quality educational videos covering various academic subjects.",
    category: "MEDIA",
    subcategory: "Video Production",
    experienceLevel: "Intermediate",
    skillsRequired: ["Video Editing", "Adobe Premiere Pro", "After Effects", "Scriptwriting", "Cinematography", "Audio Production"],
    requirements: [
      "Video production and editing experience",
      "Proficiency with Adobe Creative Suite",
      "Scriptwriting and storytelling skills",
      "Understanding of educational content",
      "Equipment and software access"
    ],
    deliverables: [
      "20+ educational video modules",
      "Interactive video elements",
      "Course introduction trailers",
      "Animation and motion graphics",
      "Optimized content for multiple platforms"
    ],
    learningOutcomes: [
      "Professional video production skills",
      "Educational content creation",
      "Multi-platform content optimization",
      "Project management in media",
      "Collaborative content development"
    ],
    compensation: "£900-1300",
    durationMonths: 4,
    teamSize: 1,
    timeCommitment: "Part-time (18-22 hours/week)",
    location: "Liverpool",
    remote: true,
    companyName: "EduCreate Media",
    companyDescription: "An educational technology company creating engaging learning experiences.",
    department: "Content Production",
    projectType: "Media Project"
  },
  {
    title: "Mental Health Support App Development",
    description: "Build a comprehensive mental health support application that provides resources, mood tracking, and connects users with professional support. The app will include AI-powered insights and crisis intervention features.",
    category: "TECHNOLOGY",
    subcategory: "Mental Health Tech",
    experienceLevel: "Advanced",
    skillsRequired: ["React Native", "Python", "Machine Learning", "Healthcare APIs", "Data Security", "UX Design"],
    requirements: [
      "Mobile app development experience",
      "Understanding of mental health principles",
      "Data privacy and security expertise",
      "Machine learning knowledge",
      "Empathetic design approach"
    ],
    deliverables: [
      "Mobile application with core features",
      "AI mood analysis system",
      "Crisis intervention protocols",
      "Healthcare provider dashboard",
      "Privacy-compliant data handling"
    ],
    learningOutcomes: [
      "Mental health technology development",
      "Ethical AI implementation",
      "Healthcare data security",
      "Crisis intervention systems",
      "Accessible app design"
    ],
    compensation: "£1600-2200",
    durationMonths: 5,
    teamSize: 2,
    timeCommitment: "Full-time (35-40 hours/week)",
    location: "Glasgow",
    remote: true,
    companyName: "MindCare Technologies",
    companyDescription: "A mental health technology company improving access to mental wellness resources.",
    department: "Product Development",
    projectType: "Healthcare Technology"
  },
  {
    title: "Renewable Energy Investment Analysis",
    description: "Conduct comprehensive financial analysis of renewable energy investment opportunities across solar, wind, and battery storage projects. You'll develop financial models, assess risks, and provide investment recommendations for a clean energy fund.",
    category: "FINANCE",
    subcategory: "Investment Analysis",
    experienceLevel: "Advanced",
    skillsRequired: ["Financial Modeling", "Excel", "Python", "Risk Analysis", "Renewable Energy", "Investment Valuation"],
    requirements: [
      "Strong financial analysis background",
      "Advanced Excel and modeling skills",
      "Understanding of renewable energy sector",
      "Risk assessment experience",
      "Investment evaluation knowledge"
    ],
    deliverables: [
      "Comprehensive investment analysis report",
      "Financial models for multiple projects",
      "Risk assessment framework",
      "Investment recommendations",
      "Presentation to investment committee"
    ],
    learningOutcomes: [
      "Renewable energy finance expertise",
      "Advanced financial modeling",
      "Investment decision frameworks",
      "Sector-specific analysis skills",
      "Professional investment presentation"
    ],
    compensation: "£1200-1800",
    durationMonths: 4,
    teamSize: 1,
    timeCommitment: "Part-time (25-30 hours/week)",
    location: "London",
    remote: true,
    companyName: "GreenFuture Capital",
    companyDescription: "An investment fund focused on sustainable energy and environmental solutions.",
    department: "Investment Analysis",
    projectType: "Finance Project"
  },
  {
    title: "AI-Powered Customer Service Chatbot",
    description: "Develop an intelligent customer service chatbot for an e-commerce platform that can handle complex customer inquiries, process returns, and provide personalized product recommendations using natural language processing.",
    category: "TECHNOLOGY",
    subcategory: "AI/Machine Learning",
    experienceLevel: "Advanced",
    skillsRequired: ["Python", "NLP", "TensorFlow", "DialogFlow", "REST APIs", "Customer Service", "Machine Learning"],
    requirements: [
      "Experience with NLP and chatbot development",
      "Machine learning and AI knowledge",
      "API integration experience",
      "Understanding of customer service workflows",
      "Python programming proficiency"
    ],
    deliverables: [
      "Intelligent chatbot system",
      "NLP model for intent recognition",
      "Integration with e-commerce platform",
      "Customer service workflow automation",
      "Performance analytics dashboard"
    ],
    learningOutcomes: [
      "Advanced NLP implementation",
      "Conversational AI development",
      "Customer service automation",
      "AI model training and optimization",
      "Production system deployment"
    ],
    compensation: "£1700-2400",
    durationMonths: 5,
    teamSize: 2,
    timeCommitment: "Full-time (35-40 hours/week)",
    location: "Cardiff",
    remote: true,
    companyName: "SmartCommerce AI",
    companyDescription: "An AI technology company specializing in intelligent e-commerce solutions.",
    department: "AI Development",
    projectType: "AI Project"
  },
  {
    title: "Digital Art Gallery Virtual Experience",
    description: "Create an immersive virtual reality experience for a contemporary art gallery that allows visitors to explore artworks in 3D space, interact with multimedia content, and attend virtual exhibitions from anywhere in the world.",
    category: "TECHNOLOGY",
    subcategory: "Virtual Reality",
    experienceLevel: "Advanced",
    skillsRequired: ["Unity", "C#", "3D Modeling", "VR Development", "Blender", "UX Design", "Art History"],
    requirements: [
      "VR development experience",
      "3D modeling and animation skills",
      "Understanding of art and gallery spaces",
      "Unity and C# proficiency",
      "UX design for VR environments"
    ],
    deliverables: [
      "VR gallery application",
      "3D models of gallery spaces",
      "Interactive artwork experiences",
      "Virtual tour system",
      "Multi-platform compatibility"
    ],
    learningOutcomes: [
      "VR application development",
      "3D environment creation",
      "Interactive media design",
      "Cultural technology applications",
      "Immersive user experience design"
    ],
    compensation: "£1400-2000",
    durationMonths: 5,
    teamSize: 2,
    timeCommitment: "Part-time (25-30 hours/week)",
    location: "Bath",
    remote: true,
    companyName: "ArtSpace Virtual",
    companyDescription: "A digital art platform creating immersive cultural experiences through technology.",
    department: "Creative Technology",
    projectType: "VR Project"
  },
  {
    title: "Food Waste Reduction App for Restaurants",
    description: "Develop a mobile application that helps restaurants track, manage, and reduce food waste through intelligent inventory management, expiration tracking, and donation coordination with local charities.",
    category: "TECHNOLOGY",
    subcategory: "Sustainability Tech",
    experienceLevel: "Intermediate",
    skillsRequired: ["React Native", "Node.js", "PostgreSQL", "Inventory Management", "Sustainability", "API Development"],
    requirements: [
      "Mobile app development experience",
      "Database design and management",
      "Understanding of restaurant operations",
      "Interest in sustainability solutions",
      "API integration skills"
    ],
    deliverables: [
      "Mobile app for restaurant staff",
      "Inventory tracking system",
      "Donation coordination platform",
      "Analytics and reporting dashboard",
      "Integration with POS systems"
    ],
    learningOutcomes: [
      "Sustainability technology development",
      "Restaurant industry insights",
      "Impact measurement and reporting",
      "Stakeholder ecosystem management",
      "Social good application development"
    ],
    compensation: "£1100-1600",
    durationMonths: 4,
    teamSize: 2,
    timeCommitment: "Part-time (20-25 hours/week)",
    location: "Newcastle",
    remote: true,
    companyName: "ZeroWaste Solutions",
    companyDescription: "A sustainability technology company reducing food waste through intelligent systems.",
    department: "Product Development",
    projectType: "Sustainability Project"
  },
  {
    title: "Cybersecurity Awareness Training Platform",
    description: "Build an interactive cybersecurity training platform for small businesses that includes simulated phishing attacks, security assessments, and personalized learning paths to improve employee security awareness.",
    category: "TECHNOLOGY",
    subcategory: "Cybersecurity",
    experienceLevel: "Advanced",
    skillsRequired: ["Cybersecurity", "React", "Node.js", "Security Testing", "Learning Management", "Penetration Testing"],
    requirements: [
      "Strong cybersecurity knowledge",
      "Web application development experience",
      "Understanding of security threats",
      "Educational platform development",
      "Security assessment tools experience"
    ],
    deliverables: [
      "Interactive training platform",
      "Simulated phishing attack system",
      "Security assessment tools",
      "Progress tracking and reporting",
      "Customizable training modules"
    ],
    learningOutcomes: [
      "Cybersecurity education development",
      "Security simulation systems",
      "Risk assessment methodologies",
      "Behavioral security training",
      "Enterprise security solutions"
    ],
    compensation: "£1600-2300",
    durationMonths: 5,
    teamSize: 2,
    timeCommitment: "Full-time (35-40 hours/week)",
    location: "York",
    remote: true,
    companyName: "SecureLearn Systems",
    companyDescription: "A cybersecurity education company helping organizations improve their security posture.",
    department: "Product Security",
    projectType: "Security Project"
  },
  {
    title: "Smart City IoT Data Visualization Platform",
    description: "Create a comprehensive data visualization platform for smart city initiatives that displays real-time data from IoT sensors monitoring air quality, traffic, energy usage, and public safety across urban areas.",
    category: "TECHNOLOGY",
    subcategory: "IoT & Smart Cities",
    experienceLevel: "Advanced",
    skillsRequired: ["IoT", "Data Visualization", "Python", "React", "Time Series Databases", "API Development", "Urban Planning"],
    requirements: [
      "IoT and sensor data experience",
      "Advanced data visualization skills",
      "Real-time data processing knowledge",
      "Understanding of urban systems",
      "Large-scale data handling experience"
    ],
    deliverables: [
      "Real-time data visualization dashboard",
      "IoT sensor integration system",
      "Alert and notification system",
      "Historical data analysis tools",
      "Public-facing information displays"
    ],
    learningOutcomes: [
      "Smart city technology implementation",
      "IoT system architecture",
      "Real-time data processing",
      "Urban data analysis",
      "Public sector technology solutions"
    ],
    compensation: "£1800-2600",
    durationMonths: 6,
    teamSize: 3,
    timeCommitment: "Full-time (35-40 hours/week)",
    location: "Sheffield",
    remote: false,
    companyName: "SmartCity Analytics",
    companyDescription: "A technology company developing IoT solutions for smart urban management.",
    department: "IoT Development",
    projectType: "Smart City Project"
  }
]

export class FakeProjectsGenerator {
  private adminUserId: string

  constructor(adminUserId: string) {
    this.adminUserId = adminUserId
  }

  async generateFakeProjects(): Promise<void> {
    console.log('🎭 Starting fake projects generation...')

    for (const [index, projectData] of FAKE_PROJECTS.entries()) {
      try {
        // Create fake company user
        const companyEmail = `${projectData.companyName.toLowerCase().replace(/\s+/g, '.')}@company.com`
        
        let companyUser = await prisma.user.findUnique({
          where: { email: companyEmail }
        })

        if (!companyUser) {
          companyUser = await prisma.user.create({
            data: {
              email: companyEmail,
              name: projectData.companyName,
              role: 'COMPANY',
              companyName: projectData.companyName,
              bio: projectData.companyDescription,
              emailVerified: true,
              profileCompleted: true,
              subscriptionPlan: index % 3 === 0 ? 'COMPANY_BASIC' : 
                               index % 3 === 1 ? 'COMPANY_PREMIUM' : 'COMPANY_PRO'
            }
          })
        }

        // Create the project
        const project = await prisma.project.create({
          data: {
            title: projectData.title,
            description: projectData.description,
            companyId: companyUser.id,
            status: index < 8 ? 'LIVE' : 'PENDING_APPROVAL', // First 8 are live, rest pending
            category: projectData.category as any,
            subcategory: projectData.subcategory,
            experienceLevel: projectData.experienceLevel,
            skillsRequired: projectData.skillsRequired,
            requirements: projectData.requirements,
            deliverables: projectData.deliverables,
            learningOutcomes: projectData.learningOutcomes,
            compensation: projectData.compensation,
            durationMonths: projectData.durationMonths,
            teamSize: projectData.teamSize,
            timeCommitment: projectData.timeCommitment,
            location: projectData.location,
            remote: projectData.remote,
            department: projectData.department,
            projectType: projectData.projectType,
            applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            maxApplications: 50,
            featured: index < 5, // First 5 are featured
            isPremium: index % 4 === 0 // Every 4th project is premium
          }
        })

        console.log(`✅ Created project: ${project.title}`)

        // Create some fake applications for live projects
        if (project.status === 'LIVE' && index < 6) {
          await this.createFakeApplications(project.id)
        }

      } catch (error) {
        console.error(`❌ Error creating project ${projectData.title}:`, error)
      }
    }

    console.log('🎉 Fake projects generation completed!')
  }

  private async createFakeApplications(projectId: string): Promise<void> {
    const fakeStudents = [
      { name: 'Alex Johnson', email: 'alex.johnson@university.ac.uk', university: 'University of Cambridge', major: 'Computer Science' },
      { name: 'Sarah Chen', email: 'sarah.chen@uni.ac.uk', university: 'Imperial College London', major: 'Design Engineering' },
      { name: 'Mohammed Hassan', email: 'mohammed.hassan@student.ac.uk', university: 'University of Oxford', major: 'Economics' },
      { name: 'Emily Rodriguez', email: 'emily.rodriguez@college.ac.uk', university: 'London School of Economics', major: 'Data Science' },
      { name: 'James Smith', email: 'james.smith@students.ac.uk', university: 'University of Edinburgh', major: 'Business' }
    ]

    for (const [index, studentData] of fakeStudents.entries()) {
      try {
        let student = await prisma.user.findUnique({
          where: { email: studentData.email }
        })

        if (!student) {
          student = await prisma.user.create({
            data: {
              email: studentData.email,
              name: studentData.name,
              role: 'STUDENT',
              university: studentData.university,
              major: studentData.major,
              emailVerified: true,
              profileCompleted: true
            }
          })
        }

        // Create application with varied statuses
        const statuses = ['PENDING', 'SHORTLISTED', 'INTERVIEWED', 'ACCEPTED', 'REJECTED']
        const status = statuses[index % statuses.length]

        await prisma.application.create({
          data: {
            userId: student.id,
            projectId: projectId,
            status: status as any,
            coverLetter: `I am very interested in this opportunity and believe my background in ${studentData.major} makes me a strong candidate. I have relevant experience and am excited to contribute to this project.`,
            motivation: 'Looking to gain real-world experience and contribute to meaningful projects.',
            adminNotes: index === 1 ? 'Strong candidate with relevant experience' : undefined,
            compatibilityScore: Math.random() * 40 + 60 // Random score between 60-100
          }
        })

      } catch (error) {
        console.error(`❌ Error creating application for ${studentData.name}:`, error)
      }
    }
  }

  async cleanupFakeProjects(): Promise<void> {
    console.log('🧹 Cleaning up fake projects...')
    
    // Delete fake companies and their projects
    const fakeEmails = FAKE_PROJECTS.map(p => 
      `${p.companyName.toLowerCase().replace(/\s+/g, '.')}@company.com`
    )

    for (const email of fakeEmails) {
      try {
        const company = await prisma.user.findUnique({
          where: { email }
        })

        if (company) {
          // Delete all related data
          await prisma.application.deleteMany({
            where: { project: { companyId: company.id } }
          })
          await prisma.project.deleteMany({
            where: { companyId: company.id }
          })
          await prisma.user.delete({
            where: { id: company.id }
          })
        }
      } catch (error) {
        console.error(`❌ Error cleaning up ${email}:`, error)
      }
    }

    console.log('✅ Fake projects cleanup completed!')
  }
}

export const createFakeProjects = async (adminUserId: string) => {
  const generator = new FakeProjectsGenerator(adminUserId)
  await generator.generateFakeProjects()
}

export const cleanupFakeProjects = async (adminUserId: string) => {
  const generator = new FakeProjectsGenerator(adminUserId)
  await generator.cleanupFakeProjects()
} 