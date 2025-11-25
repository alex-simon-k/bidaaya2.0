/**
 * CV Text Enhancement Service
 * Uses DeepSeek AI to clean up and format CV text data
 * - Fixes capitalization
 * - Corrects spelling errors
 * - Formats bullet points consistently
 * - Ensures professional tone
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

interface CVTextEnhancementInput {
  // Education
  modules?: string[]
  degreeTitle?: string
  fieldOfStudy?: string
  institution?: string
  
  // Experience
  jobTitle?: string
  companyName?: string
  jobDescription?: string
  achievements?: string[]
  
  // Skills
  skills?: string[]
  
  // Projects
  projectTitle?: string
  projectDescription?: string
  technologies?: string[]
}

interface CVTextEnhancementOutput {
  modules?: string[]
  degreeTitle?: string
  fieldOfStudy?: string
  institution?: string
  jobTitle?: string
  companyName?: string
  jobDescription?: string
  achievements?: string[]
  skills?: string[]
  projectTitle?: string
  projectDescription?: string
  technologies?: string[]
}

export class CVTextEnhancer {
  /**
   * Enhance all CV text fields using DeepSeek AI
   */
  static async enhanceAll(input: CVTextEnhancementInput): Promise<CVTextEnhancementOutput> {
    // Quick fallback if API key not configured
    if (!DEEPSEEK_API_KEY) {
      console.warn('⚠️ DeepSeek API key not configured, using basic formatting only')
      return this.basicFormatting(input)
    }

    try {
      const prompt = this.buildEnhancementPrompt(input)
      const response = await this.callDeepSeek(prompt)
      
      console.log('✅ AI enhancement successful')
      return response
    } catch (error: any) {
      // Log but don't block - fallback to basic formatting
      const errorMsg = error?.message || String(error)
      if (errorMsg.includes('timeout')) {
        console.warn('⏱️ AI enhancement timeout, using basic formatting')
      } else {
        console.warn('⚠️ AI enhancement failed, using basic formatting:', errorMsg)
      }
      return this.basicFormatting(input)
    }
  }

  /**
   * Build enhancement prompt for DeepSeek
   */
  private static buildEnhancementPrompt(input: CVTextEnhancementInput): string {
    return `You are a professional CV formatter. Your task is to clean up and format CV text data to make it look professional and polished.

**Your responsibilities:**
1. Fix capitalization (e.g., "microeconomics" → "Microeconomics", "python" → "Python")
2. Correct spelling errors
3. Ensure consistent formatting
4. Keep technical terms and proper nouns capitalized correctly
5. Format company names, job titles, and institutions properly
6. Clean up bullet points and descriptions
7. Do NOT add extra information - only format what's provided
8. Do NOT change the meaning or content - only fix formatting

**Input CV Data:**
${JSON.stringify(input, null, 2)}

**Instructions:**
- Return ONLY a JSON object with the same structure as the input
- Fix all capitalization issues
- Correct any spelling mistakes
- Ensure professional formatting
- Preserve all original information
- Do not add new information

**Example fixes:**
- "microeconomics" → "Microeconomics"
- "early modern philosophy" → "Early Modern Philosophy"
- "python" → "Python"
- "revolut" → "Revolut"
- "ucl" → "UCL"
- "worked in the acquiring division" → "Worked in the Acquiring division"

Return the enhanced JSON now:`
  }

  /**
   * Call DeepSeek API with timeout protection
   */
  private static async callDeepSeek(prompt: string): Promise<CVTextEnhancementOutput> {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('DeepSeek API timeout after 8 seconds')), 8000)
    })

    // Race between API call and timeout
    const response = await Promise.race([
      fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a professional CV formatter. Return ONLY valid JSON responses with no additional text or markdown formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent formatting
          max_tokens: 2000,
        }),
      }),
      timeoutPromise
    ])

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Invalid DeepSeek response structure')
    }

    // Parse JSON from response (may have markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in DeepSeek response')
    }

    return JSON.parse(jsonMatch[0])
  }

  /**
   * Basic formatting fallback (when AI is unavailable)
   */
  private static basicFormatting(input: CVTextEnhancementInput): CVTextEnhancementOutput {
    const capitalizeWords = (text: string): string => {
      // Capitalize first letter of each word, preserving acronyms
      return text
        .split(' ')
        .map(word => {
          // If all caps and > 1 char, likely an acronym - preserve it
          if (word.length > 1 && word === word.toUpperCase()) {
            return word
          }
          // Otherwise capitalize first letter
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(' ')
    }

    const enhanceArray = (arr?: string[]): string[] | undefined => {
      return arr?.map(item => capitalizeWords(item.trim()))
    }

    return {
      modules: enhanceArray(input.modules),
      degreeTitle: input.degreeTitle ? capitalizeWords(input.degreeTitle) : undefined,
      fieldOfStudy: input.fieldOfStudy ? capitalizeWords(input.fieldOfStudy) : undefined,
      institution: input.institution ? input.institution.toUpperCase() : undefined, // Institutions often use caps
      jobTitle: input.jobTitle ? capitalizeWords(input.jobTitle) : undefined,
      companyName: input.companyName ? capitalizeWords(input.companyName) : undefined,
      jobDescription: input.jobDescription ? 
        input.jobDescription.charAt(0).toUpperCase() + input.jobDescription.slice(1) : 
        undefined,
      achievements: enhanceArray(input.achievements),
      skills: enhanceArray(input.skills),
      projectTitle: input.projectTitle ? capitalizeWords(input.projectTitle) : undefined,
      projectDescription: input.projectDescription ? 
        input.projectDescription.charAt(0).toUpperCase() + input.projectDescription.slice(1) : 
        undefined,
      technologies: enhanceArray(input.technologies),
    }
  }

  /**
   * Enhance a single education entry
   */
  static async enhanceEducation(education: {
    degreeType?: string
    degreeTitle?: string
    fieldOfStudy?: string
    institution?: string
    modules?: string[]
  }) {
    return await this.enhanceAll({
      degreeTitle: education.degreeTitle,
      fieldOfStudy: education.fieldOfStudy,
      institution: education.institution,
      modules: education.modules,
    })
  }

  /**
   * Enhance a single experience entry
   */
  static async enhanceExperience(experience: {
    title?: string
    employer?: string
    summary?: string
    achievements?: string[]
  }) {
    return await this.enhanceAll({
      jobTitle: experience.title,
      companyName: experience.employer,
      jobDescription: experience.summary,
      achievements: experience.achievements,
    })
  }

  /**
   * Enhance skills list
   */
  static async enhanceSkills(skills: string[]) {
    const result = await this.enhanceAll({ skills })
    return result.skills || skills
  }

  /**
   * Enhance a project entry
   */
  static async enhanceProject(project: {
    title?: string
    description?: string
    technologies?: string[]
  }) {
    return await this.enhanceAll({
      projectTitle: project.title,
      projectDescription: project.description,
      technologies: project.technologies,
    })
  }
}

