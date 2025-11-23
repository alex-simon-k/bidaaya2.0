/**
 * Text Formatting Utilities
 * Capitalizes and formats text properly for CVs
 */

export class TextFormatter {
  
  /**
   * Capitalize first letter of each word (Title Case)
   */
  static toTitleCase(text: string): string {
    if (!text) return ''
    
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']
    
    return text
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        // Always capitalize first word
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1)
        }
        // Don't capitalize small words unless they're at the start
        if (smallWords.includes(word)) {
          return word
        }
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(' ')
  }

  /**
   * Format course/module names properly
   */
  static formatCourseNames(courses: string[]): string[] {
    return courses.map(course => this.toTitleCase(course.trim()))
  }

  /**
   * Ensure proper punctuation at end of bullet points
   */
  static formatBulletPoint(text: string): string {
    if (!text) return ''
    
    const trimmed = text.trim()
    
    // Don't add period if it already ends with punctuation
    if (/[.!?]$/.test(trimmed)) {
      return trimmed
    }
    
    // Add period
    return trimmed + '.'
  }

  /**
   * Format company name (Title Case)
   */
  static formatCompanyName(name: string): string {
    return this.toTitleCase(name)
  }

  /**
   * Format role/title (Title Case)
   */
  static formatRoleTitle(title: string): string {
    return this.toTitleCase(title)
  }

  /**
   * Format location (Title Case)
   */
  static formatLocation(location: string): string {
    return this.toTitleCase(location)
  }

  /**
   * Clean and capitalize multiple items in a list
   */
  static formatList(items: string[]): string[] {
    return items.map(item => {
      const trimmed = item.trim()
      return this.toTitleCase(trimmed)
    })
  }
}

