import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type PreviousMessage = { role: 'user' | 'assistant', content: string }

interface StudentAIResponse {
  content: string
  projects?: Array<{ id: string; title: string; companyId: string; companyName: string; location?: string | null; description: string }>
  proposals?: Array<{ companyId?: string; companyName: string; proposal: string }>
}

export class StudentAIService {
  private static DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
  private static DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

  async generateResponse(userId: string, userQuery: string, previousMessages: PreviousMessage[] = []): Promise<StudentAIResponse> {
    try {
      const [profile, projects] = await Promise.all([
        this.fetchStudentProfile(userId),
        this.fetchMatchingProjects(userId, userQuery)
      ])

      const shouldFocusOnProposals = /\bproposal(s)?\b/i.test(userQuery)

      // Build DeepSeek prompt
      const systemRulebook = this.buildRulebook(shouldFocusOnProposals)
      const contextPrompt = this.buildContextPrompt(profile, projects, userQuery, previousMessages, shouldFocusOnProposals)

      if (!StudentAIService.DEEPSEEK_API_KEY) {
        // Fallback: no AI key configured
        return this.basicResponse(projects, shouldFocusOnProposals)
      }

      // Race DeepSeek with a fast timeout to keep UX snappy
      const ai = await Promise.race([
        this.callDeepSeek(systemRulebook, contextPrompt),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ])

      // Parse with safety and merge with retrieved projects if needed
      const content = ai.content || 'Here are tailored opportunities and a suggested proposal for you.'
      const projectsOut = Array.isArray(ai.projects) && ai.projects.length > 0
        ? ai.projects.slice(0, 3)
        : projects.slice(0, 3)

      // Ensure proposals are populated and have company names; fill from top projects if missing
      let proposalsOut: StudentAIResponse['proposals'] = []
      if (Array.isArray(ai.proposals) && ai.proposals.length > 0) {
        proposalsOut = ai.proposals.slice(0, shouldFocusOnProposals ? 3 : 1).map((p: any, idx: number) => ({
          companyId: p.companyId || projects[idx]?.companyId,
          companyName: p.companyName || projects[idx]?.companyName || 'Company',
          proposal: p.proposal || `Hi ${projects[idx]?.companyName || 'there'}, I'm excited about ${projects[idx]?.title}. My skills align well; could we discuss opportunities?`
        }))
      } else {
        proposalsOut = this.buildDefaultProposals(projects, shouldFocusOnProposals)
      }

      return { content, projects: projectsOut, proposals: proposalsOut }
    } catch (error) {
      console.error('❌ StudentAIService.generateResponse failed:', error)
      // Final fallback
      const projects = await this.fetchMatchingProjects(userId, userQuery)
      return this.basicResponse(projects, /\bproposal(s)?\b/i.test(userQuery))
    }
  }

  private async fetchStudentProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, university: true, major: true, skills: true, interests: true, goal: true, location: true }
    })
  }

  private async fetchMatchingProjects(userId: string, userQuery: string) {
    // Simple matching heuristic: show LIVE projects, prioritize by skills keywords
    const lower = userQuery.toLowerCase()
    const projects = await prisma.project.findMany({
      where: { status: 'LIVE' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { company: { select: { id: true, companyName: true } } }
    })

    const scored = projects.map(p => {
      const hay = [p.title, p.description, ...(p.skillsRequired || []), p.category || '', p.subcategory || '']
        .join(' ').toLowerCase()
      let score = 0
      if (/marketing|social|brand/.test(lower)) score += /marketing|social|brand/.test(hay) ? 2 : 0
      if (/software|developer|engineer|tech|react|python|data/.test(lower)) score += /software|developer|engineer|react|python|data/.test(hay) ? 2 : 0
      if (/finance|bank|account|investment/.test(lower)) score += /finance|bank|account|investment/.test(hay) ? 2 : 0
      if (/remote/.test(lower)) score += (p.remote ? 1 : 0)
      return { project: p, score }
    }).sort((a, b) => b.score - a.score)

    return scored.map(({ project }) => ({
      id: project.id,
      title: project.title,
      companyId: project.company.id,
      companyName: project.company.companyName || 'Company',
      location: project.location || (project.remote ? 'Remote' : null),
      description: project.description
    }))
  }

  private buildRulebook(shouldFocusOnProposals: boolean): string {
    return `You are Bidaaya's AI Student Career Assistant.
RULES:
- Never repeat the same response twice; incorporate the user's latest input and conversation context.
- Default strategy per prompt: suggest exactly 3 relevant internships/projects to apply to PLUS 1 tailored proposal to a company.
- If the user explicitly asks for proposals, instead suggest exactly 3 tailored proposals (and omit projects).
- Be concise, friendly, and actionable. Include titles and company names.
- Avoid generic filler text. Always give concrete next steps.
- Personalize suggestions using provided profile and prior messages.
- Output MUST be valid JSON.
SCHEMA:
{
  "content": "short conversational guidance",
  "projects": [{ "id": "string", "title": "string", "companyName": "string", "location": "string|null", "description": "string" }],
  "proposals": [{ "companyName": "string", "proposal": "string" }]
}
CONSTRAINTS:
- When proposals requested: projects must be an empty array and proposals length must be 3.
- Otherwise: projects length must be 3 and proposals length must be 1.`
  }

  private buildContextPrompt(profile: any, projects: any[], userQuery: string, previous: PreviousMessage[], proposalsMode: boolean): string {
    const prev = previous.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
    const safeProjects = projects.slice(0, 6).map(p => ({ id: p.id, title: p.title, companyName: p.companyName, location: p.location || null }))
    return `USER_PROFILE:
name: ${profile?.name || 'Student'}
university: ${profile?.university || 'n/a'}
major: ${profile?.major || 'n/a'}
skills: ${(profile?.skills || []).join(', ') || 'n/a'}
interests: ${(profile?.interests || []).join(', ') || 'n/a'}
goals: ${(profile?.goal || []).join(', ') || 'n/a'}
location: ${profile?.location || 'n/a'}

CONVERSATION_CONTEXT:
${prev || 'None'}

USER_QUERY:
${userQuery}

RELEVANT_PROJECTS:
${JSON.stringify(safeProjects)}

MODE: ${proposalsMode ? 'PROPOSALS_ONLY' : 'PROJECTS_PLUS_ONE_PROPOSAL'}
Please respond in the required JSON schema.`
  }

  private async callDeepSeek(system: string, user: string): Promise<any> {
    const res = await fetch(StudentAIService.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${StudentAIService.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.6,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`DeepSeek error ${res.status}: ${text}`)
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('Invalid DeepSeek response')
    return JSON.parse(content)
  }

  private basicResponse(projects: any[], proposalsOnly: boolean): StudentAIResponse {
    const top = projects.slice(0, 3)
    const content = proposalsOnly
      ? 'Here are three tailored proposals you can send now.'
      : 'Here are three opportunities to apply to, plus a tailored proposal you can send.'

    const proposals = [
      { companyId: top[0]?.companyId, companyName: top[0]?.companyName || 'Company', proposal: `Hi ${top[0]?.companyName || 'there'}, I'm interested in ${top[0]?.title}. I have relevant skills and would love to contribute. Could we connect?` }
    ]

    if (proposalsOnly) {
      const three = [0,1,2].map(i => ({ companyId: top[i]?.companyId, companyName: top[i]?.companyName || 'Company', proposal: `Hi ${top[i]?.companyName || 'there'}, I'm excited about ${top[i]?.title}. My skills align well; could we discuss opportunities?` }))
      return { content, proposals: three }
    }

    return { content, projects: top, proposals }
  }
}

export const studentAIService = new StudentAIService()


