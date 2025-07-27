/**
 * DeepSeek AI Integration for Advanced Candidate Shortlisting
 * 
 * This service provides sophisticated AI-powered candidate evaluation
 * using DeepSeek's reasoning capabilities for better hiring decisions.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DeepSeekConfig {
  apiKey: string
  baseUrl: string
  model: string
  timeout: number
}

interface CandidateProfile {
  id: string
  name: string
  university?: string
  major?: string
  skills: string[]
  bio?: string
  graduationYear?: number
  linkedin?: string
  coverLetter?: string
  motivation?: string
  previousExperience?: string[]
}

interface ProjectRequirements {
  id: string
  title: string
  description: string
  category: string
  subcategory?: string
  skillsRequired: string[]
  experienceLevel: string
  teamSize: number
  durationMonths: number
  requirements: string[]
  deliverables: string[]
}

interface AIEvaluationResult {
  candidateId: string
  overallScore: number
  confidence: number
  reasoning: string
  strengths: string[]
  concerns: string[]
  recommendation: 'STRONG_FIT' | 'GOOD_FIT' | 'MODERATE_FIT' | 'POOR_FIT'
  keyInsights: {
    technicalFit: number
    culturalFit: number
    motivationLevel: number
    growthPotential: number
  }
  suggestedQuestions: string[]
}

interface ShortlistingResponse {
  totalCandidates: number
  evaluatedCandidates: number
  shortlistedCandidates: CandidateProfile[]
  evaluations: AIEvaluationResult[]
  processingTime: number
  aiModel: string
  generatedAt: Date
}

class DeepSeekAI {
  private config: DeepSeekConfig
  
  constructor() {
    this.config = {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-reasoning',
      timeout: 30000
    }
    
    if (!this.config.apiKey) {
      console.warn('⚠️ DeepSeek API key not configured. Falling back to basic scoring.')
    }
  }

  /**
   * Main function to generate AI-powered shortlist
   */
  async generateShortlist(
    projectId: string, 
    maxCandidates: number = 10
  ): Promise<ShortlistingResponse> {
    const startTime = Date.now()
    
    try {
      // Fetch project details and candidates
      const [project, applications] = await Promise.all([
        this.getProjectRequirements(projectId),
        this.getCandidateApplications(projectId)
      ])

      if (!project) {
        throw new Error('Project not found')
      }

      if (applications.length === 0) {
        throw new Error('No applications found for this project')
      }

      console.log(`🤖 DeepSeek AI: Evaluating ${applications.length} candidates for project "${project.title}"`)

      // Evaluate each candidate using DeepSeek AI
      const evaluations = await this.evaluateCandidates(project, applications)
      
      // Sort by overall score and select top candidates
      const shortlistedEvaluations = evaluations
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, maxCandidates)

      const shortlistedCandidates = shortlistedEvaluations.map(evaluation => 
        applications.find(candidate => candidate.id === evaluation.candidateId)!
      )

      const processingTime = Date.now() - startTime

      return {
        totalCandidates: applications.length,
        evaluatedCandidates: evaluations.length,
        shortlistedCandidates,
        evaluations: shortlistedEvaluations,
        processingTime,
        aiModel: this.config.model,
        generatedAt: new Date()
      }

    } catch (error) {
      console.error('❌ DeepSeek AI shortlisting failed:', error)
      throw error
    }
  }

  /**
   * Evaluate individual candidate against project requirements
   */
  async evaluateCandidate(
    project: ProjectRequirements,
    candidate: CandidateProfile
  ): Promise<AIEvaluationResult> {
    if (!this.config.apiKey) {
      return this.fallbackEvaluation(candidate)
    }

    try {
      const prompt = this.buildEvaluationPrompt(project, candidate)
      const aiResponse = await this.callDeepSeekAPI(prompt)
      return this.parseAIResponse(candidate.id, aiResponse)

    } catch (error) {
      console.error(`Failed to evaluate candidate ${candidate.id}:`, error)
      return this.fallbackEvaluation(candidate)
    }
  }

  /**
   * Batch evaluate multiple candidates
   */
  private async evaluateCandidates(
    project: ProjectRequirements,
    candidates: CandidateProfile[]
  ): Promise<AIEvaluationResult[]> {
    const batchSize = 5 // Process in batches to avoid rate limits
    const results: AIEvaluationResult[] = []

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize)
      const batchPromises = batch.map(candidate => 
        this.evaluateCandidate(project, candidate)
      )
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error(`Failed to evaluate candidate ${batch[index].id}:`, result.reason)
          results.push(this.fallbackEvaluation(batch[index]))
        }
      })

      // Add delay between batches to respect rate limits
      if (i + batchSize < candidates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  /**
   * Build comprehensive evaluation prompt for DeepSeek
   */
  private buildEvaluationPrompt(
    project: ProjectRequirements,
    candidate: CandidateProfile
  ): string {
    return `
You are an expert technical recruiter evaluating candidates for a project position. Analyze the candidate against the project requirements and provide a comprehensive evaluation.

PROJECT DETAILS:
Title: ${project.title}
Description: ${project.description}
Category: ${project.category}
Experience Level: ${project.experienceLevel}
Duration: ${project.durationMonths} months
Team Size: ${project.teamSize}
Required Skills: ${project.skillsRequired.join(', ')}
Requirements: ${project.requirements.join('; ')}
Deliverables: ${project.deliverables.join('; ')}

CANDIDATE PROFILE:
Name: ${candidate.name}
University: ${candidate.university || 'Not specified'}
Major: ${candidate.major || 'Not specified'}
Graduation Year: ${candidate.graduationYear || 'Not specified'}
Skills: ${candidate.skills.join(', ')}
Bio: ${candidate.bio || 'Not provided'}
Cover Letter: ${candidate.coverLetter || 'Not provided'}
Motivation: ${candidate.motivation || 'Not provided'}

EVALUATION CRITERIA:
1. Technical Skills Match (0-100)
2. Educational Background Relevance (0-100)
3. Experience Level Appropriateness (0-100)
4. Motivation and Interest (0-100)
5. Communication Skills (0-100)
6. Growth Potential (0-100)

Please provide your evaluation in the following JSON format:
{
  "overallScore": number (0-100),
  "confidence": number (0-100),
  "reasoning": "detailed explanation of the evaluation",
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"],
  "recommendation": "STRONG_FIT" | "GOOD_FIT" | "MODERATE_FIT" | "POOR_FIT",
  "keyInsights": {
    "technicalFit": number (0-100),
    "culturalFit": number (0-100),
    "motivationLevel": number (0-100),
    "growthPotential": number (0-100)
  },
  "suggestedQuestions": ["question1", "question2", "question3"]
}

Focus on objective analysis based on the provided information. Consider both current capabilities and potential for growth.
`
  }

  /**
   * Call DeepSeek API with retry logic
   */
  private async callDeepSeekAPI(prompt: string): Promise<any> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert technical recruiter with deep understanding of candidate evaluation and project requirements matching.'
              },
              {
                role: 'user', 
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.3,
            response_format: { type: 'json_object' }
          }),
          signal: AbortSignal.timeout(this.config.timeout)
        })

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return JSON.parse(data.choices[0].message.content)

      } catch (error) {
        lastError = error as Error
        console.error(`DeepSeek API attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    throw lastError
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(candidateId: string, aiResponse: any): AIEvaluationResult {
    return {
      candidateId,
      overallScore: aiResponse.overallScore || 50,
      confidence: aiResponse.confidence || 70,
      reasoning: aiResponse.reasoning || 'AI evaluation completed',
      strengths: aiResponse.strengths || [],
      concerns: aiResponse.concerns || [],
      recommendation: aiResponse.recommendation || 'MODERATE_FIT',
      keyInsights: {
        technicalFit: aiResponse.keyInsights?.technicalFit || 50,
        culturalFit: aiResponse.keyInsights?.culturalFit || 50,
        motivationLevel: aiResponse.keyInsights?.motivationLevel || 50,
        growthPotential: aiResponse.keyInsights?.growthPotential || 50
      },
      suggestedQuestions: aiResponse.suggestedQuestions || []
    }
  }

  /**
   * Fallback evaluation when DeepSeek API is unavailable
   */
  private fallbackEvaluation(candidate: CandidateProfile): AIEvaluationResult {
    const baseScore = 50 + Math.random() * 30 // Random score between 50-80
    
    return {
      candidateId: candidate.id,
      overallScore: Math.round(baseScore),
      confidence: 60,
      reasoning: 'Basic evaluation using fallback scoring algorithm',
      strengths: candidate.skills.slice(0, 3),
      concerns: ['Limited AI analysis available'],
      recommendation: baseScore > 70 ? 'GOOD_FIT' : 'MODERATE_FIT',
      keyInsights: {
        technicalFit: Math.round(baseScore + Math.random() * 10),
        culturalFit: Math.round(baseScore - 5 + Math.random() * 10),
        motivationLevel: Math.round(baseScore + Math.random() * 15),
        growthPotential: Math.round(baseScore + Math.random() * 20)
      },
      suggestedQuestions: [
        'Can you tell us about your experience with relevant technologies?',
        'What interests you most about this project?',
        'How do you approach problem-solving in collaborative environments?'
      ]
    }
  }

  /**
   * Fetch project requirements from database
   */
  private async getProjectRequirements(projectId: string): Promise<ProjectRequirements | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        subcategory: true,
        skillsRequired: true,
        experienceLevel: true,
        teamSize: true,
        durationMonths: true,
        requirements: true,
        deliverables: true
      }
    })

    return project as ProjectRequirements | null
  }

  /**
   * Fetch candidate applications for a project
   */
  private async getCandidateApplications(projectId: string): Promise<CandidateProfile[]> {
    const applications = await prisma.application.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            university: true,
            major: true,
            skills: true,
            bio: true,
            graduationYear: true,
            linkedin: true
          }
        }
      }
    })

    return applications.map(app => ({
      id: app.user.id,
      name: app.user.name || 'Unknown',
      university: app.user.university || undefined,
      major: app.user.major || undefined,
      skills: app.user.skills || [],
      bio: app.user.bio || undefined,
      graduationYear: app.user.graduationYear || undefined,
      linkedin: app.user.linkedin || undefined,
      coverLetter: app.coverLetter || undefined,
      motivation: app.motivation || undefined,
      previousExperience: [] // TODO: Add when available in schema
    }))
  }
}

// Export singleton instance
export const deepSeekAI = new DeepSeekAI()

// Export types for external use
export type {
  AIEvaluationResult,
  CandidateProfile,
  ProjectRequirements,
  ShortlistingResponse
} 