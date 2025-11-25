/**
 * CV Word Export Service V2
 * Uses invisible borderless tables for reliable cross-platform alignment
 */

import { 
  Document, 
  Paragraph, 
  TextRun, 
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
} from 'docx'
import { GeneratedCV } from './cv-generator'
import { TextFormatter } from './text-formatter'

export class CVWordExportV2 {
  
  /**
   * Generate a Word document from CV data
   * Uses borderless tables for reliable alignment across all platforms
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
   * Create a borderless table for left-right alignment
   */
  private static createAlignmentTable(leftText: string, rightText: string, leftBold = false, leftItalic = false, rightBold = false, spacing = { before: 0, after: 40 }): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: leftText,
                      bold: leftBold,
                      italics: leftItalic,
                      font: 'Arial',
                      size: 22,
                    })
                  ],
                  spacing: spacing,
                })
              ],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: rightText,
                      bold: rightBold,
                      font: 'Arial',
                      size: 22,
                    })
                  ],
                  alignment: AlignmentType.RIGHT,
                  spacing: spacing,
                })
              ],
            }),
          ],
        }),
      ],
    })
  }

  /**
   * Create EDUCATION section
   */
  private static createEducationSection(education: any[]): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [
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
      // Institution (Left) | Location (Right)
      elements.push(
        this.createAlignmentTable(
          TextFormatter.formatCompanyName(edu.institution).toUpperCase(),
          TextFormatter.formatLocation(edu.location || ''),
          true, // left bold
          false, // left italic
          true, // right bold
          { before: index === 0 ? 100 : 200, after: 40 }
        )
      )

      // Degree (Left) | Dates (Right)
      elements.push(
        this.createAlignmentTable(
          TextFormatter.toTitleCase(edu.degree),
          edu.dates,
          false, // left bold
          true, // left italic
          false, // right bold
          { before: 0, after: 40 }
        )
      )

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
  private static createExperienceSection(experience: any[]): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [
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
      // Company (Left) | Location (Right)
      elements.push(
        this.createAlignmentTable(
          TextFormatter.formatCompanyName(exp.company).toUpperCase(),
          TextFormatter.formatLocation(exp.location || ''),
          true, // left bold
          false, // left italic
          true, // right bold
          { before: index === 0 ? 100 : 200, after: 40 }
        )
      )

      // Role (Left) | Dates (Right)
      elements.push(
        this.createAlignmentTable(
          TextFormatter.toTitleCase(exp.role),
          exp.dates,
          false, // left bold
          true, // left italic
          false, // right bold
          { before: 0, after: 60 }
        )
      )

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
  private static createExtracurricularsSection(achievements: any[]): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [
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
      // Organization (Left) | Location (Right)
      elements.push(
        this.createAlignmentTable(
          TextFormatter.formatCompanyName(ach.organization || ach.title).toUpperCase(),
          TextFormatter.formatLocation(ach.location || ''),
          true, // left bold
          false, // left italic
          true, // right bold
          { before: index === 0 ? 100 : 200, after: 40 }
        )
      )

      // Role (Left) | Dates (Right)
      elements.push(
        this.createAlignmentTable(
          TextFormatter.toTitleCase(ach.role || ach.category || 'Member'),
          ach.dates || ach.date || '',
          false, // left bold
          true, // left italic
          false, // right bold
          { before: 0, after: 60 }
        )
      )

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
