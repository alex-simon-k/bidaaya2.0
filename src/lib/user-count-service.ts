import { PrismaClient } from '@prisma/client'

// Service to get dynamic user counts for marketing purposes
export class UserCountService {
  private static cache: {
    count: number
    lastUpdated: number
  } | null = null

  // Cache duration: 1 hour (in milliseconds)
  private static CACHE_DURATION = 60 * 60 * 1000

  /**
   * Get the marketing user count (actual student count + 4500)
   * Uses caching to avoid frequent database queries
   */
  static async getMarketingUserCount(): Promise<string> {
    const now = Date.now()
    
    // Check if we have valid cached data
    if (this.cache && (now - this.cache.lastUpdated) < this.CACHE_DURATION) {
      return `${this.cache.count.toLocaleString()}+`
    }

    try {
      const prisma = new PrismaClient()
      
      // Get actual student count from database
      const actualStudentCount = await prisma.user.count({
        where: { role: 'STUDENT' }
      })
      
      await prisma.$disconnect()
      
      // Marketing count = actual count + 4500
      const marketingCount = actualStudentCount + 4500
      
      // Update cache
      this.cache = {
        count: marketingCount,
        lastUpdated: now
      }
      
      console.log(`📊 User count updated: ${actualStudentCount} actual + 4500 = ${marketingCount} marketing`)
      
      return `${marketingCount.toLocaleString()}+`
      
    } catch (error) {
      console.error('❌ Error getting user count:', error)
      
      // Fallback to cached value or default
      if (this.cache) {
        return `${this.cache.count.toLocaleString()}+`
      }
      
      // Ultimate fallback
      return '7000+'
    }
  }

  /**
   * Force refresh the user count cache
   */
  static async refreshCache(): Promise<void> {
    this.cache = null
    await this.getMarketingUserCount()
  }

  /**
   * Get raw student count (for admin/internal use)
   */
  static async getActualStudentCount(): Promise<number> {
    try {
      const prisma = new PrismaClient()
      const count = await prisma.user.count({
        where: { role: 'STUDENT' }
      })
      await prisma.$disconnect()
      return count
    } catch (error) {
      console.error('❌ Error getting actual student count:', error)
      return 0
    }
  }
}
