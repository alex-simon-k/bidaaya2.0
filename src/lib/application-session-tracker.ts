import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ApplicationSessionData {
  userId: string
  projectId: string
  stepReached?: number
  step1Completed?: boolean
  step2Completed?: boolean
  step3Completed?: boolean
  step4Completed?: boolean
  wasSaved?: boolean
  wasRestored?: boolean
  deviceType?: string
  browserInfo?: string
  userAgent?: string
}

export class ApplicationSessionTracker {
  
  // Start tracking a new application session
  static async startSession(data: ApplicationSessionData): Promise<string> {
    try {
      // Generate unique session ID
      const sessionId = `app_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Detect device type and browser info
      const deviceType = data.deviceType || 'unknown'
      const browserInfo = data.browserInfo || 'unknown'
      const userAgent = data.userAgent || 'unknown'
      
      console.log(`📊 Starting application session tracking: ${sessionId}`)
      
      const session = await prisma.applicationSession.create({
        data: {
          userId: data.userId,
          projectId: data.projectId,
          sessionId,
          stepReached: data.stepReached || 1,
          step1Completed: data.step1Completed || false,
          step2Completed: data.step2Completed || false,
          step3Completed: data.step3Completed || false,
          step4Completed: data.step4Completed || false,
          wasSaved: data.wasSaved || false,
          wasRestored: data.wasRestored || false,
          deviceType,
          browserInfo,
          userAgent,
          status: 'IN_PROGRESS'
        }
      })
      
      console.log(`✅ Application session started: ${sessionId}`)
      return sessionId
    } catch (error) {
      console.error('Error starting application session:', error)
      throw error
    }
  }
  
  // Update session progress (step reached, form completion)
  static async updateProgress(sessionId: string, updates: Partial<ApplicationSessionData> & { saveCount?: number }): Promise<void> {
    try {
      const updateData: any = {}
      
      if (updates.stepReached !== undefined) updateData.stepReached = updates.stepReached
      if (updates.step1Completed !== undefined) updateData.step1Completed = updates.step1Completed
      if (updates.step2Completed !== undefined) updateData.step2Completed = updates.step2Completed
      if (updates.step3Completed !== undefined) updateData.step3Completed = updates.step3Completed
      if (updates.step4Completed !== undefined) updateData.step4Completed = updates.step4Completed
      if (updates.wasSaved !== undefined) updateData.wasSaved = updates.wasSaved
      if (updates.wasRestored !== undefined) updateData.wasRestored = updates.wasRestored
      if (updates.saveCount !== undefined) updateData.saveCount = updates.saveCount
      
      await prisma.applicationSession.update({
        where: { sessionId },
        data: updateData
      })
      
      console.log(`📈 Updated application session progress: ${sessionId}`)
    } catch (error) {
      console.error('Error updating application session:', error)
    }
  }
  
  // Mark session as completed (successful submission)
  static async completeSession(sessionId: string): Promise<void> {
    try {
      const session = await prisma.applicationSession.findUnique({
        where: { sessionId },
        select: { startedAt: true }
      })
      
      if (!session) {
        console.warn(`Session not found: ${sessionId}`)
        return
      }
      
      // Calculate time spent in minutes
      const timeSpentMinutes = Math.round((Date.now() - session.startedAt.getTime()) / (1000 * 60))
      
      await prisma.applicationSession.update({
        where: { sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          timeSpentMinutes,
          // Mark all steps as completed for successful submission
          step1Completed: true,
          step2Completed: true,
          step3Completed: true
        }
      })
      
      console.log(`✅ Application session completed: ${sessionId} (${timeSpentMinutes} minutes)`)
    } catch (error) {
      console.error('Error completing application session:', error)
    }
  }
  
  // Mark session as abandoned (closed without completion)
  static async abandonSession(sessionId: string): Promise<void> {
    try {
      const session = await prisma.applicationSession.findUnique({
        where: { sessionId },
        select: { startedAt: true, status: true }
      })
      
      if (!session || session.status !== 'IN_PROGRESS') {
        return // Already completed or abandoned
      }
      
      // Calculate time spent in minutes
      const timeSpentMinutes = Math.round((Date.now() - session.startedAt.getTime()) / (1000 * 60))
      
      await prisma.applicationSession.update({
        where: { sessionId },
        data: {
          status: 'ABANDONED',
          abandonedAt: new Date(),
          timeSpentMinutes
        }
      })
      
      console.log(`❌ Application session abandoned: ${sessionId} (${timeSpentMinutes} minutes)`)
    } catch (error) {
      console.error('Error abandoning application session:', error)
    }
  }
  
  // Get analytics for application sessions
  static async getSessionAnalytics(filters?: {
    startDate?: Date
    endDate?: Date
    projectId?: string
    userId?: string
  }) {
    try {
      const where: any = {}
      
      if (filters?.startDate || filters?.endDate) {
        where.startedAt = {}
        if (filters.startDate) where.startedAt.gte = filters.startDate
        if (filters.endDate) where.startedAt.lte = filters.endDate
      }
      
      if (filters?.projectId) where.projectId = filters.projectId
      if (filters?.userId) where.userId = filters.userId
      
      const sessions = await prisma.applicationSession.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          },
          project: {
            select: {
              title: true,
              category: true
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      })
      
      // Calculate summary statistics
      const totalSessions = sessions.length
      const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length
      const abandonedSessions = sessions.filter(s => s.status === 'ABANDONED').length
      const inProgressSessions = sessions.filter(s => s.status === 'IN_PROGRESS').length
      
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
      const abandonmentRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0
      
      // Average time to complete
      const completedSessionsWithTime = sessions.filter(s => s.status === 'COMPLETED' && s.timeSpentMinutes)
      const avgTimeToComplete = completedSessionsWithTime.length > 0 
        ? completedSessionsWithTime.reduce((sum, s) => sum + (s.timeSpentMinutes || 0), 0) / completedSessionsWithTime.length
        : 0
      
      // Step completion analysis
      const step1Completions = sessions.filter(s => s.step1Completed).length
      const step2Completions = sessions.filter(s => s.step2Completed).length
      const step3Completions = sessions.filter(s => s.step3Completed).length
      const step4Completions = sessions.filter(s => s.step4Completed).length
      
      return {
        summary: {
          totalSessions,
          completedSessions,
          abandonedSessions,
          inProgressSessions,
          completionRate: Math.round(completionRate * 100) / 100,
          abandonmentRate: Math.round(abandonmentRate * 100) / 100,
          avgTimeToComplete: Math.round(avgTimeToComplete * 100) / 100
        },
        stepAnalysis: {
          step1Completions,
          step2Completions,
          step3Completions,
          step4Completions,
          step1Rate: totalSessions > 0 ? Math.round((step1Completions / totalSessions) * 10000) / 100 : 0,
          step2Rate: totalSessions > 0 ? Math.round((step2Completions / totalSessions) * 10000) / 100 : 0,
          step3Rate: totalSessions > 0 ? Math.round((step3Completions / totalSessions) * 10000) / 100 : 0,
          step4Rate: totalSessions > 0 ? Math.round((step4Completions / totalSessions) * 10000) / 100 : 0
        },
        sessions
      }
    } catch (error) {
      console.error('Error fetching session analytics:', error)
      throw error
    }
  }
  
  // Get session by ID
  static async getSession(sessionId: string) {
    try {
      return await prisma.applicationSession.findUnique({
        where: { sessionId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          },
          project: {
            select: {
              title: true,
              category: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error fetching session:', error)
      return null
    }
  }
} 