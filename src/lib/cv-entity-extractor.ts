/**
 * CV Entity Extractor Service
 * 
 * Extracts structured CV data from natural language conversations
 * using OpenAI's function calling API
 */

import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Initialize OpenAI client
const getOpenAIClient = () => {
  const openaiKey = process.env.OPENAI_API_KEY
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  
  if (openaiKey) {
    return new OpenAI({ apiKey: openaiKey })
  }
  
  if (deepseekKey) {
    return new OpenAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com',
    })
  }
  
  return null
}

// ============================================
// TYPE DEFINITIONS
// ============================================

interface ExtractedExperience {
  employer: string
  title: string
  start_date?: string  // ISO format YYYY-MM-DD
  end_date?: string
  is_current?: boolean
  location?: string
  employment_type?: 'internship' | 'full_time' | 'part_time' | 'contract' | 'freelance'
  summary?: string
  impact?: Array<{
    statement: string
    metrics?: Array<{ value: number; unit: string }>
    skills_used?: string[]
  }>
}

interface ExtractedEducation {
  institution: string
  degree_type: string
  degree_title?: string
  field_of_study: string
  start_date?: string
  end_date?: string
  is_current?: boolean
  location?: string
  predicted_grade?: string
  final_grade?: string
  gpa?: number
  modules?: string[]
  honors_awards?: string[]
}

interface ExtractedProject {
  name: string
  role?: string
  summary?: string
  tech_stack?: string[]
  start_date?: string
  end_date?: string
  is_current?: boolean
  project_url?: string
  github_url?: string
  impact?: Array<{
    statement: string
    metrics?: Array<{ value: number; unit: string }>
  }>
}

interface ExtractedCertification {
  name: string
  issuer: string
  issue_date?: string
  expiry_date?: string
  credential_id?: string
  credential_url?: string
  skills_gained?: string[]
}

interface ExtractedSkill {
  skill_name: string
  category: 'hard_skill' | 'soft_skill' | 'tool'
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years_of_experience?: number
}

interface ExtractedLanguage {
  language: string
  proficiency_level: 'native' | 'fluent' | 'professional' | 'intermediate' | 'basic'
}

interface ExtractedAchievement {
  type: 'leadership' | 'volunteering' | 'award' | 'competition' | 'extracurricular'
  name: string
  organization?: string
  date?: string
  description?: string
}

export type EntityType = 'experience' | 'education' | 'project' | 'certification' | 'skill' | 'language' | 'achievement' | 'profile' | 'unknown'

export interface ExtractionResult {
  entityType: EntityType
  confidence: number
  data: any
}

// ============================================
// CV ENTITY EXTRACTOR CLASS
// ============================================

export class CVEntityExtractor {
  
  /**
   * Detect what type of CV entity the user is describing
   */
  static async detectEntityType(
    userMessage: string,
    conversationContext?: string[]
  ): Promise<EntityType> {
    
    const lowerMessage = userMessage.toLowerCase()
    
    // Priority-based detection (work experience is most common)
    
    // Work experience keywords
    if (lowerMessage.match(/\b(work|job|internship|intern|position|role|employed|company|worked at|working at)\b/)) {
      return 'experience'
    }
    
    // Education keywords
    if (lowerMessage.match(/\b(university|college|degree|studied|studying|major|bachelor|master|diploma|graduated|graduating)\b/)) {
      return 'education'
    }
    
    // Project keywords
    if (lowerMessage.match(/\b(project|built|created|developed|app|website|platform|side hustle|startup|founded)\b/)) {
      return 'project'
    }
    
    // Certification keywords
    if (lowerMessage.match(/\b(certificate|certification|certified|course|completed|credential)\b/)) {
      return 'certification'
    }
    
    // Skills keywords
    if (lowerMessage.match(/\b(skill|proficient|experienced with|know|can|good at|familiar with|expertise)\b/)) {
      return 'skill'
    }
    
    // Language keywords
    if (lowerMessage.match(/\b(speak|language|fluent|native)\b/)) {
      return 'language'
    }
    
    // Achievement keywords
    if (lowerMessage.match(/\b(award|won|achievement|competition|volunteer|leadership|led team|captain)\b/)) {
      return 'achievement'
    }
    
    // Profile/bio keywords
    if (lowerMessage.match(/\b(about me|introduce myself|background|summary|bio)\b/)) {
      return 'profile'
    }
    
    return 'unknown'
  }

  /**
   * Extract work experience from natural language
   */
  static async extractExperience(
    userMessage: string,
    conversationContext: string[] = []
  ): Promise<ExtractedExperience | null> {
    
    const openai = getOpenAIClient()
    if (!openai) {
      console.warn('⚠️ OpenAI not configured, using fallback extraction')
      return this.fallbackExtractExperience(userMessage)
    }

    try {
      console.log('🔍 Extracting work experience from message...')
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a CV data extraction assistant. Extract structured work experience information from the user's natural language description.

Consider the conversation context to understand dates, names, and other details that might be mentioned across multiple messages.

If specific information is missing or unclear, leave those fields as null. Focus on extracting what's explicitly stated.

Dates should be in YYYY-MM-DD format. If only month/year is mentioned, use the first day of that month.`
          },
          {
            role: 'user',
            content: `Previous context: ${conversationContext.slice(-3).join(' | ') || 'None'}

Current message: ${userMessage}

Extract work experience details.`
          }
        ],
        functions: [
          {
            name: 'save_work_experience',
            description: 'Save structured work experience data from the conversation',
            parameters: {
              type: 'object',
              properties: {
                employer: {
                  type: 'string',
                  description: 'Company or organization name'
                },
                title: {
                  type: 'string',
                  description: 'Job title or role'
                },
                start_date: {
                  type: 'string',
                  description: 'Start date in YYYY-MM-DD format'
                },
                end_date: {
                  type: 'string',
                  description: 'End date in YYYY-MM-DD format, or null if current'
                },
                is_current: {
                  type: 'boolean',
                  description: 'Whether this is their current role'
                },
                location: {
                  type: 'string',
                  description: 'Work location (city, country) or "Remote"'
                },
                employment_type: {
                  type: 'string',
                  enum: ['internship', 'full_time', 'part_time', 'contract', 'freelance'],
                  description: 'Type of employment'
                },
                summary: {
                  type: 'string',
                  description: '1-2 sentence summary of the role and responsibilities'
                },
                impact: {
                  type: 'array',
                  description: 'List of achievements or impact statements',
                  items: {
                    type: 'object',
                    properties: {
                      statement: {
                        type: 'string',
                        description: 'Achievement description'
                      },
                      metrics: {
                        type: 'array',
                        description: 'Quantified metrics if available (e.g., percentages, numbers)',
                        items: {
                          type: 'object',
                          properties: {
                            value: { 
                              type: 'number',
                              description: 'Numeric value (e.g., 40 for 40%)'
                            },
                            unit: { 
                              type: 'string',
                              description: 'Unit (e.g., %, users, hours, dollars)'
                            }
                          },
                          required: ['value', 'unit']
                        }
                      },
                      skills_used: {
                        type: 'array',
                        description: 'Skills demonstrated in this achievement',
                        items: { type: 'string' }
                      }
                    },
                    required: ['statement']
                  }
                }
              },
              required: ['employer', 'title']
            }
          }
        ],
        function_call: { name: 'save_work_experience' },
        temperature: 0.1,
      })

      const functionCall = completion.choices[0]?.message?.function_call
      
      if (functionCall && functionCall.arguments) {
        const extracted = JSON.parse(functionCall.arguments)
        console.log('✅ Extracted experience:', extracted.employer, extracted.title)
        return extracted
      }

      return null

    } catch (error) {
      console.error('❌ Entity extraction error:', error)
      return this.fallbackExtractExperience(userMessage)
    }
  }

  /**
   * Extract education from natural language
   */
  static async extractEducation(
    userMessage: string,
    conversationContext: string[] = []
  ): Promise<ExtractedEducation | null> {
    
    const openai = getOpenAIClient()
    if (!openai) {
      console.warn('⚠️ OpenAI not configured, using fallback extraction')
      return this.fallbackExtractEducation(userMessage)
    }

    try {
      console.log('🔍 Extracting education from message...')
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract education details from the user's message. Focus on institution, degree, field of study, dates, and academic performance.`
          },
          {
            role: 'user',
            content: `Context: ${conversationContext.slice(-3).join(' | ') || 'None'}\n\nMessage: ${userMessage}`
          }
        ],
        functions: [
          {
            name: 'save_education',
            description: 'Save education details',
            parameters: {
              type: 'object',
              properties: {
                institution: { type: 'string', description: 'University or school name' },
                degree_type: { 
                  type: 'string',
                  description: 'Type of degree',
                  enum: ['bsc', 'msc', 'ba', 'ma', 'phd', 'a_levels', 'diploma', 'bootcamp', 'short_course', 'other']
                },
                degree_title: { type: 'string', description: 'Full degree title' },
                field_of_study: { type: 'string', description: 'Major or field of study' },
                start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
                end_date: { type: 'string', description: 'End date YYYY-MM-DD or null' },
                is_current: { type: 'boolean', description: 'Currently enrolled' },
                location: { type: 'string', description: 'City, country' },
                predicted_grade: { type: 'string', description: 'Expected grade if current' },
                final_grade: { type: 'string', description: 'Final grade if completed' },
                gpa: { type: 'number', description: 'GPA if mentioned' },
                modules: { 
                  type: 'array',
                  description: 'Course modules or subjects',
                  items: { type: 'string' }
                },
                honors_awards: { 
                  type: 'array',
                  description: 'Academic honors or awards',
                  items: { type: 'string' }
                }
              },
              required: ['institution', 'field_of_study']
            }
          }
        ],
        function_call: { name: 'save_education' },
        temperature: 0.1,
      })

      const functionCall = completion.choices[0]?.message?.function_call
      
      if (functionCall && functionCall.arguments) {
        const extracted = JSON.parse(functionCall.arguments)
        console.log('✅ Extracted education:', extracted.institution, extracted.field_of_study)
        return extracted
      }

      return null

    } catch (error) {
      console.error('❌ Education extraction error:', error)
      return this.fallbackExtractEducation(userMessage)
    }
  }

  /**
   * Extract project from natural language
   */
  static async extractProject(
    userMessage: string,
    conversationContext: string[] = []
  ): Promise<ExtractedProject | null> {
    
    const openai = getOpenAIClient()
    if (!openai) {
      return this.fallbackExtractProject(userMessage)
    }

    try {
      console.log('🔍 Extracting project from message...')
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract project details including name, role, technologies used, and impact/outcomes.`
          },
          {
            role: 'user',
            content: `Context: ${conversationContext.slice(-3).join(' | ') || 'None'}\n\nMessage: ${userMessage}`
          }
        ],
        functions: [
          {
            name: 'save_project',
            description: 'Save project details',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Project name' },
                role: { type: 'string', description: 'Your role in the project' },
                summary: { type: 'string', description: 'Project description' },
                tech_stack: { 
                  type: 'array',
                  description: 'Technologies/tools used',
                  items: { type: 'string' }
                },
                start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
                end_date: { type: 'string', description: 'End date YYYY-MM-DD or null' },
                is_current: { type: 'boolean', description: 'Still working on it' },
                project_url: { type: 'string', description: 'Project website/demo URL' },
                github_url: { type: 'string', description: 'GitHub repository URL' },
                impact: {
                  type: 'array',
                  description: 'Project outcomes and achievements',
                  items: {
                    type: 'object',
                    properties: {
                      statement: { type: 'string' },
                      metrics: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            value: { type: 'number' },
                            unit: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              },
              required: ['name']
            }
          }
        ],
        function_call: { name: 'save_project' },
        temperature: 0.1,
      })

      const functionCall = completion.choices[0]?.message?.function_call
      
      if (functionCall && functionCall.arguments) {
        const extracted = JSON.parse(functionCall.arguments)
        console.log('✅ Extracted project:', extracted.name)
        return extracted
      }

      return null

    } catch (error) {
      console.error('❌ Project extraction error:', error)
      return this.fallbackExtractProject(userMessage)
    }
  }

  /**
   * Save extracted experience to database
   */
  static async saveExperience(
    userId: string,
    experience: ExtractedExperience
  ): Promise<boolean> {
    try {
      console.log('💾 Saving experience to database:', experience.employer)
      
      // Parse dates
      const startDate = experience.start_date ? new Date(experience.start_date) : new Date()
      const endDate = experience.end_date ? new Date(experience.end_date) : null
      
      // Create main experience entry
      const created = await prisma.cVExperience.create({
        data: {
          userId,
          title: experience.title,
          employer: experience.employer,
          employmentType: experience.employment_type || 'internship',
          location: experience.location || null,
          startDate,
          endDate,
          isCurrent: experience.is_current || false,
          summary: experience.summary || null,
        },
      })

      // Create impact entries if provided
      if (experience.impact && experience.impact.length > 0) {
        await Promise.all(
          experience.impact.map(impact =>
            prisma.cVExperienceImpact.create({
              data: {
                experienceId: created.id,
                statement: impact.statement,
                metrics: impact.metrics || undefined,
                skillsUsed: impact.skills_used || [],
                evidenceLinks: [],
              },
            })
          )
        )
      }

      console.log('✅ Experience saved successfully')
      return true

    } catch (error) {
      console.error('❌ Error saving experience:', error)
      return false
    }
  }

  /**
   * Save extracted education to database
   */
  static async saveEducation(
    userId: string,
    education: ExtractedEducation
  ): Promise<boolean> {
    try {
      console.log('💾 Saving education to database:', education.institution)
      
      const startDate = education.start_date ? new Date(education.start_date) : new Date()
      const endDate = education.end_date ? new Date(education.end_date) : null
      
      await prisma.cVEducation.create({
        data: {
          userId,
          institution: education.institution,
          degreeType: education.degree_type,
          degreeTitle: education.degree_title || education.field_of_study,
          fieldOfStudy: education.field_of_study,
          institutionLocation: education.location || null,
          startDate,
          endDate,
          isCurrent: education.is_current || false,
          predictedGrade: education.predicted_grade || null,
          finalGrade: education.final_grade || null,
          gpa: education.gpa || null,
          modules: education.modules || [],
          honorsAwards: education.honors_awards || [],
        },
      })

      console.log('✅ Education saved successfully')
      return true

    } catch (error) {
      console.error('❌ Error saving education:', error)
      return false
    }
  }

  /**
   * Save extracted project to database
   */
  static async saveProject(
    userId: string,
    project: ExtractedProject
  ): Promise<boolean> {
    try {
      console.log('💾 Saving project to database:', project.name)
      
      const startDate = project.start_date ? new Date(project.start_date) : null
      const endDate = project.end_date ? new Date(project.end_date) : null
      
      const created = await prisma.cVProject.create({
        data: {
          userId,
          name: project.name,
          role: project.role || null,
          summary: project.summary || null,
          techStack: project.tech_stack || [],
          startDate,
          endDate,
          isCurrent: project.is_current || false,
          projectUrl: project.project_url || null,
          githubUrl: project.github_url || null,
        },
      })

      // Save impact if provided
      if (project.impact && project.impact.length > 0) {
        await Promise.all(
          project.impact.map(impact =>
            prisma.cVProjectImpact.create({
              data: {
                projectId: created.id,
                statement: impact.statement,
                metrics: impact.metrics || undefined,
                skillsUsed: [],
              },
            })
          )
        )
      }

      console.log('✅ Project saved successfully')
      return true

    } catch (error) {
      console.error('❌ Error saving project:', error)
      return false
    }
  }

  // ============================================
  // FALLBACK EXTRACTORS (when OpenAI unavailable)
  // ============================================

  private static fallbackExtractExperience(message: string): ExtractedExperience | null {
    // Simple regex-based extraction
    const companyMatch = message.match(/(?:at|@|for)\s+([A-Z][a-zA-Z\s&]+?)(?:\s+as|\s+in|\s+from|\.|\,|$)/i)
    const titleMatch = message.match(/(?:as|role|position|job)\s+(?:a|an)?\s*([a-zA-Z\s]+?)(?:\s+at|\s+in|\.|\,|$)/i)
    
    if (companyMatch || titleMatch) {
      return {
        employer: companyMatch ? companyMatch[1].trim() : 'Unknown Company',
        title: titleMatch ? titleMatch[1].trim() : 'Unknown Role',
      }
    }
    
    return null
  }

  private static fallbackExtractEducation(message: string): ExtractedEducation | null {
    const uniMatch = message.match(/(?:at|studying at|study at)\s+([A-Z][a-zA-Z\s]+?)(?:\s+studying|\s+in|\.|\,|$)/i)
    const majorMatch = message.match(/(?:studying|major in|degree in)\s+([a-zA-Z\s]+?)(?:\s+at|\.|\,|$)/i)
    
    if (uniMatch || majorMatch) {
      return {
        institution: uniMatch ? uniMatch[1].trim() : 'Unknown University',
        field_of_study: majorMatch ? majorMatch[1].trim() : 'Unknown Field',
        degree_type: 'bsc',
      }
    }
    
    return null
  }

  private static fallbackExtractProject(message: string): ExtractedProject | null {
    const projectMatch = message.match(/(?:project|built|created|developed)\s+(?:a|an)?\s*([a-zA-Z\s]+?)(?:\s+using|\.|\,|$)/i)
    
    if (projectMatch) {
      return {
        name: projectMatch[1].trim(),
      }
    }
    
    return null
  }
}

