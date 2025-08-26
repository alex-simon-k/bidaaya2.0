/**
 * Script to enhance existing projects with better descriptions and deliverables
 * This addresses the issue where restored projects have generic descriptions
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Enhanced project data based on titles
const projectEnhancements = {
  'Sustainable Fashion Brand Marketing Intern': {
    description: `Join our sustainable fashion brand as a Marketing Intern and help us revolutionize the fashion industry. You'll work on digital marketing campaigns, social media strategy, and content creation to promote eco-friendly fashion choices.

Key Responsibilities:
- Develop and execute social media marketing campaigns
- Create engaging content for various platforms
- Analyze market trends in sustainable fashion
- Support influencer outreach and partnerships
- Assist in brand positioning and messaging

Definition of Done: Launch 3 successful marketing campaigns with measurable engagement metrics, create a comprehensive social media strategy document, and establish partnerships with 5+ eco-conscious influencers.`,
    requirements: [
      'Marketing, Communications, or related field student',
      'Strong social media presence and understanding of platforms',
      'Creative content creation skills',
      'Interest in sustainability and fashion',
      'Basic knowledge of marketing analytics tools'
    ],
    deliverables: [
      'Social media strategy document',
      '3 executed marketing campaigns',
      'Content calendar for 3 months',
      'Influencer partnership agreements',
      'Performance analytics report'
    ]
  },
  'Renewable Energy Investment Intern': {
    description: `Work with our renewable energy investment team to analyze market opportunities and support investment decisions in clean energy projects. This role offers exposure to financial modeling, market research, and sustainable investment strategies.

Key Responsibilities:
- Conduct market research on renewable energy sectors
- Support financial modeling for investment opportunities
- Analyze regulatory frameworks and policy impacts
- Prepare investment memorandums and presentations
- Monitor portfolio performance and industry trends

Definition of Done: Complete financial analysis of 5+ renewable energy projects, create a comprehensive market report, and present investment recommendations to the investment committee.`,
    requirements: [
      'Finance, Economics, or Engineering student',
      'Strong analytical and quantitative skills',
      'Knowledge of Excel and financial modeling',
      'Interest in renewable energy and sustainability',
      'Excellent research and presentation skills'
    ],
    deliverables: [
      'Market analysis report on renewable energy trends',
      'Financial models for 5 investment opportunities',
      'Investment recommendation presentations',
      'Regulatory landscape analysis',
      'Portfolio monitoring dashboard'
    ]
  },
  'Mobile App UI/UX Intern': {
    description: `Join our product team to design intuitive and engaging mobile app experiences. You'll work on user research, wireframing, prototyping, and collaborating with developers to bring designs to life.

Key Responsibilities:
- Conduct user research and usability testing
- Create wireframes, mockups, and interactive prototypes
- Collaborate with product managers and developers
- Design user-friendly interfaces following best practices
- Analyze user feedback and iterate on designs

Definition of Done: Complete UX research study with actionable insights, design and prototype 3 major app features, and deliver design system documentation for consistent UI implementation.`,
    requirements: [
      'Design, HCI, or related field student',
      'Proficiency in design tools (Figma, Sketch, Adobe XD)',
      'Understanding of mobile design principles',
      'Portfolio showcasing UI/UX work',
      'Strong attention to detail and user empathy'
    ],
    deliverables: [
      'User research report with personas and journey maps',
      'Interactive prototypes for 3 app features',
      'Design system documentation',
      'Usability testing results and recommendations',
      'Final UI designs ready for development'
    ]
  }
};

async function enhanceProjects() {
  try {
    console.log('🚀 Starting project enhancement...');
    
    // Get all projects that have generic descriptions
    const projectsToEnhance = await prisma.project.findMany({
      where: {
        description: 'Project imported from backup data'
      },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        deliverables: true
      }
    });

    console.log(`Found ${projectsToEnhance.length} projects to enhance`);

    let enhancedCount = 0;

    for (const project of projectsToEnhance) {
      const enhancement = projectEnhancements[project.title];
      
      if (enhancement) {
        console.log(`Enhancing: ${project.title}`);
        
        await prisma.project.update({
          where: { id: project.id },
          data: {
            description: enhancement.description,
            requirements: enhancement.requirements,
            deliverables: enhancement.deliverables
          }
        });
        
        enhancedCount++;
        console.log(`✅ Enhanced: ${project.title}`);
      } else {
        console.log(`⚠️ No enhancement data for: ${project.title}`);
      }
    }

    console.log(`🎉 Enhanced ${enhancedCount} projects successfully!`);
    
  } catch (error) {
    console.error('❌ Error enhancing projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enhancement
if (require.main === module) {
  enhanceProjects();
}

module.exports = { enhanceProjects };
