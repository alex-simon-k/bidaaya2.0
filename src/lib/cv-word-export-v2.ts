/**
 * CV Word Export Service V2
 * Simple, reliable DOCX generation without tables
 */

import { 
  Document, 
  Paragraph, 
  TextRun, 
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  TabStopType,
  TabStopPosition,
} from 'docx'
import { GeneratedCV } from './cv-generator'
import { TextFormatter } from './text-formatter'

export class CVWordExportV2 {
  
  /**
   * Generate a Word document from CV data
   */
  static async generateWordDocument(cv: GeneratedCV): Promise<Document> {
    
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Arial',
              size: 22, // 11pt
            },
            paragraph: {
              spacing: {
                line: 276, // 1.15 line spacing
              },
            },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        children: [
          // Header - Name (centered, larger, bold)
          new Paragraph({
            children: [
              new TextRun({
                text: cv.profile.name.toUpperCase(),
                bold: true,
                font: 'Arial',
                size: 32, // 16pt
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          
          // Contact Info (centered, one line)
          new Paragraph({
            children: [
              new TextRun({
                text: this.formatContactLine(cv.profile),
                font: 'Arial',
                size: 20, // 10pt
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            border: {
              bottom: {
                color: '000000',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          
          // EDUCATION Section
          ...this.createEducationSection(cv.education),
          
          // EXPERIENCE Section (if exists)
          ...(cv.experience && cv.experience.length > 0 ? 
            this.createExperienceSection(cv.experience) : []),
          
          // EXTRACURRICULARS Section (achievements/projects)
          ...(cv.achievements && cv.achievements.length > 0 ?
            this.createExtracurricularsSection(cv.achievements) : []),
          
          // SKILLS Section
          ...this.createSkillsSection(cv.skills, cv.languages),
        ],
      }],
    })

    return doc
  }

  /**
   * Format contact line: phone | email | location
   */
  private static formatContactLine(profile: any): string {
    const parts = []
    if (profile.phone) parts.push(profile.phone)
    if (profile.email) parts.push(profile.email)
    if (profile.location) parts.push(profile.location)
    return parts.join('   |   ')
  }

  /**
   * Create EDUCATION section
   */
  private static createEducationSection(education: any[]): Paragraph[] {
    const elements: Paragraph[] = [
      // Section Header
      new Paragraph({
        children: [
          new TextRun({
            text: 'EDUCATION',
            bold: true,
            font: 'Arial',
            size: 24, // 12pt
          })
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      }),
    ]

    education.forEach((edu, index) => {
      // Institution and Location (on same line with tab)
      elements.push(new Paragraph({
        children: [
          new TextRun({
            text: TextFormatter.formatCompanyName(edu.institution).toUpperCase(),
            bold: true,
            font: 'Arial',
            size: 22,
          }),
          new TextRun({
            text: '\t' + TextFormatter.formatLocation(edu.location || ''),
            bold: true,
            font: 'Arial',
            size: 22,
          }),
        ],
        spacing: { before: index === 0 ? 100 : 200, after: 40 },
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
      }))

      // Degree and Dates (on same line with tab)
      elements.push(new Paragraph({
        children: [
          new TextRun({
            text: TextFormatter.toTitleCase(edu.degree),
            italics: true,
            font: 'Arial',
            size: 22,
          }),
          new TextRun({
            text: '\t' + edu.dates,
            font: 'Arial',
            size: 22,
          }),
        ],
        spacing: { after: 40 },
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
      }))

      // Grade (if exists)
      if (edu.grade) {
        elements.push(new Paragraph({
          children: [
            new TextRun({
              text: `Predicted Grade: ${edu.grade}`,
              font: 'Arial',
              size: 22,
            })
          ],
          spacing: { after: 40 },
        }))
      }

      // Relevant Modules
      if (edu.modules && edu.modules.length > 0) {
        elements.push(new Paragraph({
          children: [
            new TextRun({
              text: 'Relevant Modules: ',
              bold: true,
              italics: true,
              font: 'Arial',
              size: 22,
            }),
            new TextRun({
              text: edu.modules.join(', '),
              font: 'Arial',
              size: 22,
            })
          ],
          spacing: { after: 40 },
        }))
      }

      // Relevant Coursework (alternative to modules)
      if (edu.coursework && edu.coursework.length > 0) {
        elements.push(new Paragraph({
          children: [
            new TextRun({
              text: 'Relevant Coursework: ',
              bold: true,
              italics: true,
              font: 'Arial',
              size: 22,
            }),
            new TextRun({
              text: edu.coursework.join(', '),
              font: 'Arial',
              size: 22,
            })
          ],
          spacing: { after: 40 },
        }))
      }
    })

    return elements
  }

  /**
   * Create EXPERIENCE section
   */
  private static createExperienceSection(experience: any[]): Paragraph[] {
    const elements: Paragraph[] = [
      // Section Header
      new Paragraph({
        children: [
          new TextRun({
            text: 'EXPERIENCE',
            bold: true,
            font: 'Arial',
            size: 24,
          })
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      }),
    ]

    experience.forEach((exp, index) => {
      // Company and Location
      elements.push(new Paragraph({
        children: [
          new TextRun({
            text: TextFormatter.formatCompanyName(exp.company).toUpperCase(),
            bold: true,
            font: 'Arial',
            size: 22,
          }),
          new TextRun({
            text: '\t' + TextFormatter.formatLocation(exp.location || ''),
            bold: true,
            font: 'Arial',
            size: 22,
          }),
        ],
        spacing: { before: index === 0 ? 100 : 200, after: 40 },
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
      }))

      // Role and Dates
      elements.push(new Paragraph({
        children: [
          new TextRun({
            text: TextFormatter.toTitleCase(exp.role),
            italics: true,
            font: 'Arial',
            size: 22,
          }),
          new TextRun({
            text: '\t' + exp.dates,
            font: 'Arial',
            size: 22,
          }),
        ],
        spacing: { after: 60 },
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
      }))

      // Description
      if (exp.description) {
        elements.push(new Paragraph({
          children: [
            new TextRun({
              text: exp.description,
              font: 'Arial',
              size: 22,
            })
          ],
          spacing: { after: 60 },
        }))
      }

      // Bullet points (impacts/achievements)
      if (exp.impacts && exp.impacts.length > 0) {
        exp.impacts.forEach((impact: any) => {
          elements.push(new Paragraph({
            children: [
              new TextRun({
                text: '• ' + impact.statement,
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { after: 40 },
          }))
        })
      }
    })

    return elements
  }

  /**
   * Create EXTRACURRICULARS section
   */
  private static createExtracurricularsSection(achievements: any[]): Paragraph[] {
    const elements: Paragraph[] = [
      // Section Header
      new Paragraph({
        children: [
          new TextRun({
            text: 'EXTRACURRICULARS',
            bold: true,
            font: 'Arial',
            size: 24,
          })
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      }),
    ]

    achievements.forEach((ach, index) => {
      // Organization and Location
      elements.push(new Paragraph({
        children: [
          new TextRun({
            text: TextFormatter.formatCompanyName(ach.organization || ach.title).toUpperCase(),
            bold: true,
            font: 'Arial',
            size: 22,
          }),
          new TextRun({
            text: '\t' + TextFormatter.formatLocation(ach.location || ''),
            bold: true,
            font: 'Arial',
            size: 22,
          }),
        ],
        spacing: { before: index === 0 ? 100 : 200, after: 40 },
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
      }))

      // Role and Dates
      elements.push(new Paragraph({
        children: [
          new TextRun({
            text: TextFormatter.toTitleCase(ach.role || ach.category || 'Member'),
            italics: true,
            font: 'Arial',
            size: 22,
          }),
          new TextRun({
            text: '\t' + (ach.dates || ach.date || ''),
            font: 'Arial',
            size: 22,
          }),
        ],
        spacing: { after: 60 },
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
      }))

      // Description
      if (ach.description) {
        elements.push(new Paragraph({
          children: [
            new TextRun({
              text: ach.description,
              font: 'Arial',
              size: 22,
            })
          ],
          spacing: { after: 40 },
        }))
      }
    })

    return elements
  }

  /**
   * Create SKILLS section
   */
  private static createSkillsSection(skills: any[], languages?: any[]): Paragraph[] {
    const elements: Paragraph[] = [
      // Section Header
      new Paragraph({
        children: [
          new TextRun({
            text: 'SKILLS',
            bold: true,
            font: 'Arial',
            size: 24,
          })
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      }),
    ]

    // Technical Skills
    if (skills && skills.length > 0) {
      const skillNames = skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean)
      
      if (skillNames.length > 0) {
        elements.push(new Paragraph({
          children: [
            new TextRun({
              text: 'Technical Skills: ',
              bold: true,
              italics: true,
              font: 'Arial',
              size: 22,
            }),
            new TextRun({
              text: skillNames.join(', '),
              font: 'Arial',
              size: 22,
            })
          ],
          spacing: { before: 100, after: 40 },
        }))
      }
    }

    // Languages
    if (languages && languages.length > 0) {
      const languageNames = languages.map(l => typeof l === 'string' ? l : l.language).filter(Boolean)
      
      if (languageNames.length > 0) {
        elements.push(new Paragraph({
          children: [
            new TextRun({
              text: 'Languages: ',
              bold: true,
              italics: true,
              font: 'Arial',
              size: 22,
            }),
            new TextRun({
              text: languageNames.join(', '),
              font: 'Arial',
              size: 22,
            })
          ],
          spacing: { after: 40 },
        }))
      }
    }

    return elements
  }
}
