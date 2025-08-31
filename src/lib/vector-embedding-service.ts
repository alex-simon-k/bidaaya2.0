import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface StudentVector {
  userId: string
  profileVector: number[]      // Main profile embedding (bio + skills + academic info)
  skillsVector: number[]       // Skills-focused embedding
  academicVector: number[]     // University + major + academic focus
  lastUpdated: Date
  vectorVersion: string
}

export interface SearchVector {
  searchQuery: string
  queryVector: number[]
  companyId: string
  timestamp: Date
}

export class VectorEmbeddingService {
  private static readonly EMBEDDING_MODEL = 'text-embedding-3-small'
  private static readonly VECTOR_VERSION = 'v1.0'
  private static readonly MAX_TOKENS = 8000

  /**
   * Generate comprehensive embeddings for a student profile
   */
  static async generateStudentEmbeddings(userId: string): Promise<StudentVector | null> {
    try {
      console.log(`🔮 Generating embeddings for student: ${userId}`)

      // Fetch student data
      const student = await prisma.user.findUnique({
        where: { id: userId, role: 'STUDENT' },
        select: {
          id: true,
          name: true,
          bio: true,
          skills: true,
          university: true,
          major: true,
          interests: true,
          goal: true,
          location: true,
          graduationYear: true,
          education: true,
          highSchool: true,
          applications: {
            select: {
              project: {
                select: {
                  title: true,
                  category: true,
                  description: true,
                }
              }
            },
            take: 10 // Recent applications for context
          }
        },
      })

      if (!student) {
        console.log(`❌ Student not found: ${userId}`)
        return null
      }

      // Create different text representations for different vector types
      const profileText = this.createProfileText(student)
      const skillsText = this.createSkillsText(student)
      const academicText = this.createAcademicText(student)

      console.log(`📝 Generated text for ${student.name}:`)
      console.log(`Profile: ${profileText.substring(0, 100)}...`)
      console.log(`Skills: ${skillsText.substring(0, 100)}...`)
      console.log(`Academic: ${academicText.substring(0, 100)}...`)

      // Generate embeddings in parallel
      const [profileEmbedding, skillsEmbedding, academicEmbedding] = await Promise.all([
        this.generateEmbedding(profileText),
        this.generateEmbedding(skillsText),
        this.generateEmbedding(academicText),
      ])

      const studentVector: StudentVector = {
        userId: student.id,
        profileVector: profileEmbedding,
        skillsVector: skillsEmbedding,
        academicVector: academicEmbedding,
        lastUpdated: new Date(),
        vectorVersion: this.VECTOR_VERSION,
      }

      console.log(`✅ Generated embeddings for ${student.name} (${profileEmbedding.length} dimensions)`)
      return studentVector

    } catch (error) {
      console.error(`❌ Error generating student embeddings for ${userId}:`, error)
      return null
    }
  }

  /**
   * Generate embedding for a company search query
   */
  static async generateSearchEmbedding(searchQuery: string, companyId: string): Promise<SearchVector | null> {
    try {
      console.log(`🔍 Generating search embedding for: "${searchQuery}"`)

      // Enhance the search query with context
      const enhancedQuery = this.enhanceSearchQuery(searchQuery)
      const queryVector = await this.generateEmbedding(enhancedQuery)

      const searchVector: SearchVector = {
        searchQuery,
        queryVector,
        companyId,
        timestamp: new Date(),
      }

      console.log(`✅ Generated search embedding (${queryVector.length} dimensions)`)
      return searchVector

    } catch (error) {
      console.error(`❌ Error generating search embedding:`, error)
      return null
    }
  }

  /**
   * Batch generate embeddings for all students
   */
  static async generateAllStudentEmbeddings(batchSize: number = 10): Promise<{
    processed: number
    successful: number
    failed: number
  }> {
    console.log(`🚀 Starting batch embedding generation...`)

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`👥 Found ${students.length} students to process`)

    let processed = 0
    let successful = 0
    let failed = 0

    // Process in batches to avoid rate limits
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize)
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(students.length / batchSize)}`)

      const batchPromises = batch.map(async (student) => {
        try {
          const vector = await this.generateStudentEmbeddings(student.id)
          if (vector) {
            // Store in database (we'll create the table structure later)
            await this.storeStudentVector(vector)
            successful++
          } else {
            failed++
          }
          processed++
        } catch (error) {
          console.error(`❌ Failed to process student ${student.name}:`, error)
          failed++
          processed++
        }
      })

      await Promise.all(batchPromises)

      // Add delay between batches to respect rate limits
      if (i + batchSize < students.length) {
        console.log(`⏳ Waiting 2 seconds before next batch...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log(`✅ Batch processing complete: ${successful} successful, ${failed} failed, ${processed} total`)
    
    return { processed, successful, failed }
  }

  /**
   * Find similar students using vector similarity
   */
  static async findSimilarStudents(
    queryVector: number[], 
    limit: number = 20,
    threshold: number = 0.7
  ): Promise<Array<{ userId: string; similarity: number }>> {
    try {
      // This will be implemented once we have the vector storage in place
      // For now, we'll use a placeholder that integrates with existing matching
      console.log(`🔍 Finding similar students (limit: ${limit}, threshold: ${threshold})`)
      
      // TODO: Implement actual vector similarity search
      // This would typically use a vector database like Pinecone, Chroma, or PostgreSQL with pgvector
      
      return []
    } catch (error) {
      console.error(`❌ Error finding similar students:`, error)
      return []
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i]
      normA += vectorA[i] * vectorA[i]
      normB += vectorB[i] * vectorB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  /**
   * Generate OpenAI embedding for text
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Truncate text if too long
      const truncatedText = text.length > this.MAX_TOKENS * 4 
        ? text.substring(0, this.MAX_TOKENS * 4) 
        : text

      const response = await openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: truncatedText,
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('❌ Error generating OpenAI embedding:', error)
      throw error
    }
  }

  /**
   * Create comprehensive profile text for embedding
   */
  private static createProfileText(student: any): string {
    const parts: string[] = []

    // Basic info
    if (student.name) parts.push(`Name: ${student.name}`)
    if (student.bio) parts.push(`Bio: ${student.bio}`)
    
    // Academic background
    if (student.university) parts.push(`University: ${student.university}`)
    if (student.major) parts.push(`Major: ${student.major}`)
    if (student.education) parts.push(`Education Level: ${student.education}`)
    if (student.graduationYear) parts.push(`Graduation Year: ${student.graduationYear}`)
    
    // Skills and interests
    if (student.skills && student.skills.length > 0) {
      parts.push(`Skills: ${student.skills.join(', ')}`)
    }
    if (student.interests && student.interests.length > 0) {
      parts.push(`Interests: ${student.interests.join(', ')}`)
    }
    if (student.goal && student.goal.length > 0) {
      parts.push(`Career Goals: ${student.goal.join(', ')}`)
    }
    
    // Location
    if (student.location) parts.push(`Location: ${student.location}`)
    
    // Application history context
    if (student.applications && student.applications.length > 0) {
      const projectTypes = student.applications.map(app => 
        `${app.project.title} (${app.project.category})`
      ).join(', ')
      parts.push(`Previously Applied To: ${projectTypes}`)
    }

    return parts.join('. ')
  }

  /**
   * Create skills-focused text for embedding
   */
  private static createSkillsText(student: any): string {
    const parts: string[] = []

    if (student.skills && student.skills.length > 0) {
      parts.push(`Technical Skills: ${student.skills.join(', ')}`)
    }
    
    if (student.major) {
      parts.push(`Academic Specialization: ${student.major}`)
    }
    
    if (student.interests && student.interests.length > 0) {
      parts.push(`Professional Interests: ${student.interests.join(', ')}`)
    }
    
    if (student.goal && student.goal.length > 0) {
      parts.push(`Career Aspirations: ${student.goal.join(', ')}`)
    }

    // Add skill-related keywords based on major
    if (student.major) {
      const skillKeywords = this.getSkillKeywordsForMajor(student.major)
      if (skillKeywords.length > 0) {
        parts.push(`Related Skills: ${skillKeywords.join(', ')}`)
      }
    }

    return parts.join('. ')
  }

  /**
   * Create academic-focused text for embedding
   */
  private static createAcademicText(student: any): string {
    const parts: string[] = []

    if (student.university) parts.push(`University: ${student.university}`)
    if (student.major) parts.push(`Field of Study: ${student.major}`)
    if (student.education) parts.push(`Education Level: ${student.education}`)
    if (student.highSchool) parts.push(`High School: ${student.highSchool}`)
    if (student.graduationYear) parts.push(`Graduation Year: ${student.graduationYear}`)
    
    // Add academic context
    if (student.major) {
      const academicContext = this.getAcademicContextForMajor(student.major)
      parts.push(academicContext)
    }

    return parts.join('. ')
  }

  /**
   * Enhance search query with context
   */
  private static enhanceSearchQuery(query: string): string {
    const lowerQuery = query.toLowerCase()
    const enhancements: string[] = [query]

    // Add context based on keywords
    if (lowerQuery.includes('marketing')) {
      enhancements.push('digital marketing, social media, content creation, brand management, advertising')
    }
    if (lowerQuery.includes('software') || lowerQuery.includes('developer')) {
      enhancements.push('programming, coding, web development, mobile apps, software engineering')
    }
    if (lowerQuery.includes('finance')) {
      enhancements.push('financial analysis, accounting, investment, banking, economics')
    }
    if (lowerQuery.includes('design')) {
      enhancements.push('graphic design, UI/UX, creative, visual design, user experience')
    }
    if (lowerQuery.includes('business')) {
      enhancements.push('business development, strategy, management, consulting, entrepreneurship')
    }

    return enhancements.join('. ')
  }

  /**
   * Get skill keywords for a major
   */
  private static getSkillKeywordsForMajor(major: string): string[] {
    const majorLower = major.toLowerCase()
    
    if (majorLower.includes('computer') || majorLower.includes('software')) {
      return ['programming', 'coding', 'algorithms', 'software development', 'debugging']
    }
    if (majorLower.includes('business')) {
      return ['management', 'strategy', 'analysis', 'leadership', 'communication']
    }
    if (majorLower.includes('marketing')) {
      return ['branding', 'social media', 'content creation', 'advertising', 'analytics']
    }
    if (majorLower.includes('finance') || majorLower.includes('economics')) {
      return ['financial analysis', 'modeling', 'accounting', 'investment', 'risk management']
    }
    if (majorLower.includes('engineering')) {
      return ['problem solving', 'technical design', 'project management', 'innovation']
    }
    
    return []
  }

  /**
   * Get academic context for a major
   */
  private static getAcademicContextForMajor(major: string): string {
    const majorLower = major.toLowerCase()
    
    if (majorLower.includes('computer')) {
      return 'Computer Science, Technology, Programming, Software Development, Data Structures'
    }
    if (majorLower.includes('business')) {
      return 'Business Administration, Management, Strategy, Operations, Marketing'
    }
    if (majorLower.includes('engineering')) {
      return 'Engineering, Technical Problem Solving, Design, Innovation, Mathematics'
    }
    if (majorLower.includes('economics') || majorLower.includes('finance')) {
      return 'Economics, Finance, Quantitative Analysis, Markets, Investment'
    }
    
    return `Academic specialization in ${major}`
  }

  /**
   * Store student vector in database
   */
  private static async storeStudentVector(vector: StudentVector): Promise<void> {
    try {
      console.log(`💾 Storing vector for student: ${vector.userId}`)
      
      await prisma.studentVector.upsert({
        where: { userId: vector.userId },
        update: {
          profileVector: vector.profileVector,
          skillsVector: vector.skillsVector,
          academicVector: vector.academicVector,
          vectorVersion: vector.vectorVersion,
          lastUpdated: vector.lastUpdated,
        },
        create: {
          userId: vector.userId,
          profileVector: vector.profileVector,
          skillsVector: vector.skillsVector,
          academicVector: vector.academicVector,
          vectorVersion: vector.vectorVersion,
          lastUpdated: vector.lastUpdated,
        },
      })
      
      console.log(`✅ Vector stored successfully for student: ${vector.userId}`)
      
    } catch (error) {
      console.error(`❌ Error storing student vector:`, error)
      throw error
    }
  }
}
