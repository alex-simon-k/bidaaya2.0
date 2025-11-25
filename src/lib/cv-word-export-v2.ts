/**
 * CV Word Export Service V2
 * Matches the exact template format provided by user
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
   * Generate a Word document from CV data - EXACT template match
   */
  static async generateWordDocument(cv: GeneratedCV): Promise<Document> {
    
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Times New Roman',
              size: 21, // 10.5pt
            },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: [
          // Header - Name (centered, larger, bold)
          new Paragraph({
            children: [
              new TextRun({
                text: cv.profile.name,
                bold: true,
                font: 'Times New Roman',
                size: 29, // 14.5pt
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          
          // Contact Info (centered, one line with |)
          new Paragraph({
            children: [
              new TextRun({
                text: this.formatContactLine(cv.profile),
                font: 'Times New Roman',
                size: 21, // 10.5pt
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          
          // EDUCATION Section
          ...this.createEducationSection(cv.education),
          
          // EXPERIENCE Section (if exists)
          ...(cv.experience && cv.experience.length > 0 ? 
            this.createExperienceSection(cv.experience) : []),
          
          // EXTRACURRICULARS Section (achievements/projects)
          ...(cv.achievements && cv.achievements.length > 0 ?
            this.createExtracurricularsSection(cv.achievements) : []),
          
          // SKILLS, ACTIVITIES & INTERESTS Section
          ...this.createSkillsSection(cv.skills, cv.languages),
        ],
      }],
    })

    return doc
  }

  /**
   * Format contact line: +44number | email@gmail.com
   */
  private static formatContactLine(profile: GeneratedCV['profile']): string {
    const parts: string[] = []
    
    if (profile.phone) parts.push(profile.phone)
    if (profile.email) parts.push(profile.email)
    
    return parts.join('  |  ')
  }

  /**
   * Create EDUCATION section - EXACT template format
   */
  private static createEducationSection(education: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      // Section Header: EDUCATION with underline
      new Paragraph({
        children: [
          new TextRun({
            text: 'EDUCATION',
            bold: true,
            font: 'Times New Roman',
            size: 21, // 10.5pt
          })
        ],
        spacing: { before: 0, after: 50 },
        border: {
          bottom: {
            color: '000000',
            space: 3,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      }),
      
      // Empty line
      new Paragraph({ text: '', spacing: { after: 100 } }),
    ]

    education.forEach((edu, index) => {
      // University	Location (on same line, location right-aligned using tab) - BOTH BOLD
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: TextFormatter.formatCompanyName(edu.institution),
              font: 'Times New Roman',
              size: 21,
              bold: true,  // BOLD
            }),
            new TextRun({
              text: `\t${TextFormatter.formatLocation(edu.location || '')}`,
              font: 'Times New Roman',
              size: 21,
              bold: true,  // BOLD
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { after: 50 },
        })
      )

      // Course	Sep 2023 – Jun 2026 (on same line, dates right-aligned) - BOTH ITALIC
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: TextFormatter.toTitleCase(edu.degree),
              font: 'Times New Roman',
              size: 21,
              italics: true,  // ITALIC
            }),
            new TextRun({
              text: `\t${edu.dates}`,
              font: 'Times New Roman',
              size: 21,
              italics: true,  // ITALIC
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { after: 50 },
        })
      )

      // Predicted Grade (if exists)
      if (edu.grade) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Predicted Grade: ${edu.grade}`,
                font: 'Times New Roman',
                size: 21,
              })
            ],
            spacing: { after: 50 },
          })
        )
      }

      // Relevant Modules: x, y, z (capitalized properly)
      if (edu.highlights && edu.highlights.length > 0) {
        const formattedModules = TextFormatter.formatCourseNames(edu.highlights)
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Relevant Modules: ${formattedModules.join(', ')}`,
                font: 'Times New Roman',
                size: 21,
              })
            ],
            spacing: { after: index < education.length - 1 ? 100 : 200 },
          })
        )
      }
    })

    return paragraphs
  }

  /**
   * Create EXPERIENCE section - EXACT template format
   */
  private static createExperienceSection(experiences: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      // Section Header
      new Paragraph({
        children: [
          new TextRun({
            text: 'EXPERIENCE',
            bold: true,
            font: 'Times New Roman',
            size: 21,
          })
        ],
        spacing: { before: 0, after: 50 },
        border: {
          bottom: {
            color: '000000',
            space: 3,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      }),
      
      // Empty line
      new Paragraph({ text: '', spacing: { after: 100 } }),
    ]

    experiences.forEach((exp, index) => {
      // Company Name	Location - BOTH BOLD
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: TextFormatter.formatCompanyName(exp.employer),
              font: 'Times New Roman',
              size: 21,
              bold: true,
            }),
            new TextRun({
              text: `\t${TextFormatter.formatLocation(exp.location || '')}`,
              font: 'Times New Roman',
              size: 21,
              bold: true,  // BOLD
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { after: 50 },
        })
      )

      // Role - Team	Jun 2025 – Aug 2025 - BOTH ITALIC
      const roleText = exp.summary ? `${exp.title} - ${exp.summary}` : exp.title
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: TextFormatter.formatRoleTitle(roleText),
              font: 'Times New Roman',
              size: 21,
              italics: true, // ITALIC
            }),
            new TextRun({
              text: `\t${exp.dates}`,
              font: 'Times New Roman',
              size: 21,
              italics: true,  // ITALIC
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { after: 100 }, // More space before bullets
        })
      )

      // Bullet points with • symbol
      exp.achievements.forEach((achievement: string, achIndex: number) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `•   ${TextFormatter.formatBulletPoint(achievement)}`,
                font: 'Times New Roman',
                size: 21,
              })
            ],
            spacing: { after: achIndex === exp.achievements.length - 1 ? 200 : 75 },
          })
        )
      })
    })

    return paragraphs
  }

  /**
   * Create EXTRACURRICULARS section
   */
  private static createExtracurricularsSection(achievements: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      // Section Header
      new Paragraph({
        children: [
          new TextRun({
            text: 'EXTRACURRICULARS',
            bold: true,
            font: 'Times New Roman',
            size: 21,
          })
        ],
        spacing: { before: 0, after: 50 },
        border: {
          bottom: {
            color: '000000',
            space: 3,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      }),
      
      // Empty line
      new Paragraph({ text: '', spacing: { after: 100 } }),
    ]

    achievements.forEach((ach, index) => {
      // Organization Name	Location (if available) - BOTH BOLD
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: TextFormatter.toTitleCase(ach.name),
              font: 'Times New Roman',
              size: 21,
              bold: true,
            }),
            ...(ach.location ? [
              new TextRun({
                text: `\t${TextFormatter.formatLocation(ach.location)}`,
                font: 'Times New Roman',
                size: 21,
                bold: true,  // BOLD
              })
            ] : []),
          ],
          tabStops: ach.location ? [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ] : [],
          spacing: { after: 50 },
        })
      )

      // Role	Date range - BOTH ITALIC
      if (ach.role || ach.date) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: ach.role || 'Role',
                font: 'Times New Roman',
                size: 21,
                italics: true,
              }),
              ...(ach.date ? [
                new TextRun({
                  text: `\t${ach.date}`,
                  font: 'Times New Roman',
                  size: 21,
                  italics: true,  // ITALIC
                })
              ] : []),
            ],
            tabStops: ach.date ? [
              {
                type: TabStopType.RIGHT,
                position: TabStopPosition.MAX,
              },
            ] : [],
            spacing: { after: 100 },
          })
        )
      }

      // Description as bullet point
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `•   ${TextFormatter.formatBulletPoint(ach.description)}`,
              font: 'Times New Roman',
              size: 21,
            })
          ],
          spacing: { after: index === achievements.length - 1 ? 200 : 150 },
        })
      )
    })

    return paragraphs
  }

  /**
   * Create SKILLS, ACTIVITIES & INTERESTS section
   */
  private static createSkillsSection(skills: any[], languages?: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      // Section Header
      new Paragraph({
        children: [
          new TextRun({
            text: 'SKILLS, ACTIVITIES & INTERESTS',
            bold: true,
            font: 'Times New Roman',
            size: 21,
          })
        ],
        spacing: { before: 0, after: 50 },
        border: {
          bottom: {
            color: '000000',
            space: 3,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      }),
      
      // Empty line
      new Paragraph({ text: '', spacing: { after: 100 } }),
    ]

    // Languages (bold + italic label)
    const langList = languages && languages.length > 0 
      ? languages.map(l => TextFormatter.toTitleCase(l.language)).join(', ')
      : ''
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Languages: ',
            font: 'Times New Roman',
            size: 21,
            bold: true,
            italics: true,
          }),
          new TextRun({
            text: langList,
            font: 'Times New Roman',
            size: 21,
          })
        ],
        spacing: { after: 75 },
      })
    )

    // Activities (bold + italic label)
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Activities: ',
            font: 'Times New Roman',
            size: 21,
            bold: true,
            italics: true,
          })
        ],
        spacing: { after: 75 },
      })
    )

    // Technical Skills (bold + italic label)
    const technicalSkills = skills.filter(s => s.category === 'hard_skill' || s.category === 'tool')
    const techList = technicalSkills.length > 0
      ? TextFormatter.formatList(technicalSkills.map(s => s.name)).join(', ')
      : ''
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Technical Skills: ',
            font: 'Times New Roman',
            size: 21,
            bold: true,
            italics: true,
          }),
          new TextRun({
            text: techList,
            font: 'Times New Roman',
            size: 21,
          })
        ],
        spacing: { after: 75 },
      })
    )

    // Interests (bold + italic label)
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Interests: ',
            font: 'Times New Roman',
            size: 21,
            bold: true,
            italics: true,
          })
        ],
        spacing: { after: 0 },
      })
    )

    // Activities (from soft skills or general skills)
    const activitySkills = skills.filter(s => s.category === 'soft_skill').slice(0, 3)
    if (activitySkills.length > 0) {
      const actList = TextFormatter.formatList(activitySkills.map(s => s.name)).join(', ')
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Activities: ${actList}`,
              font: 'Times New Roman',
              size: 21,
            })
          ],
          spacing: { after: 50 },
        })
      )
    }

    // Interests (placeholder - can be populated from user data later)
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Interests: ',
            font: 'Times New Roman',
            size: 21,
          })
        ],
        spacing: { after: 50 },
      })
    )

    return paragraphs
  }
}

