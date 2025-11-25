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
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx'
import { GeneratedCV } from './cv-generator'
import { TextFormatter } from './text-formatter'

export class CVWordExportV2 {
  
  /**
   * Generate a Word document from CV data - Modern "Bronzor" Style
   * Uses Table-based layout for perfect alignment across Pages/Word/Docs
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
                line: 240, // 1.0 line spacing
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
                size: 36, // 18pt
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
                font: 'Arial',
                size: 20, // 10pt
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            border: {
              bottom: {
                color: '000000',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
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
   * Format contact line: +44number | email@gmail.com
   */
  private static formatContactLine(profile: GeneratedCV['profile']): string {
    const parts: string[] = []
    
    if (profile.phone) parts.push(profile.phone)
    if (profile.email) parts.push(profile.email)
    if (profile.location) parts.push(profile.location)
    if (profile.linkedin) parts.push('LinkedIn')
    
    return parts.join('  |  ')
  }

  /**
   * Create EDUCATION section - Modern Format (Table-based)
   */
  private static createEducationSection(education: any[]): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [
      // Section Header: EDUCATION
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
            size: 6,
          },
        },
      }),
    ]

    education.forEach((edu, index) => {
      // Institution (Left) | Location (Right) - Using Table
      elements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: TextFormatter.formatCompanyName(edu.institution).toUpperCase(),
                          bold: true,
                          font: 'Arial',
                          size: 22,
                        })
                      ],
                    })
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: TextFormatter.formatLocation(edu.location || ''),
                          bold: true,
                          font: 'Arial',
                          size: 22,
                        })
                      ],
                    })
                  ],
                }),
              ],
            }),
          ],
        })
      )

      // Degree (Left) | Dates (Right) - Using Table
      elements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: TextFormatter.toTitleCase(edu.degree),
                          font: 'Arial',
                          size: 22,
                        })
                      ],
                    })
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: edu.dates,
                          font: 'Arial',
                          size: 22,
                        })
                      ],
                    })
                  ],
                }),
              ],
            }),
          ],
        })
      )

      // Predicted Grade (if exists)
      if (edu.grade) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Grade: ${edu.grade}`,
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { after: 50 },
          })
        )
      }

      // Relevant Modules
      if (edu.highlights && edu.highlights.length > 0) {
        const formattedModules = TextFormatter.formatCourseNames(edu.highlights)
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Relevant Coursework: ',
                font: 'Arial',
                size: 22,
                bold: true,
              }),
              new TextRun({
                text: formattedModules.join(', '),
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { after: index < education.length - 1 ? 200 : 0 },
          })
        )
      }
    })

    return elements
  }

  /**
   * Create EXPERIENCE section - Modern Format (Table-based)
   */
  private static createExperienceSection(experiences: any[]): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [
      // Section Header
      new Paragraph({
        children: [
          new TextRun({
            text: 'EXPERIENCE',
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
            size: 6,
          },
        },
      }),
    ]

    experiences.forEach((exp, index) => {
      // Employer (Left) | Location (Right) - Using Table
      elements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: TextFormatter.formatCompanyName(exp.employer).toUpperCase(),
                          bold: true,
                          font: 'Arial',
                          size: 22,
                        })
                      ],
                    })
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: TextFormatter.formatLocation(exp.location || ''),
                          bold: true,
                          font: 'Arial',
                          size: 22,
                        })
                      ],
                    })
                  ],
                }),
              ],
            }),
          ],
        })
      )

      // Title (Left) | Dates (Right) - Using Table
      elements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: TextFormatter.formatRoleTitle(exp.title),
                          font: 'Arial',
                          size: 22,
                          italics: true,
                        })
                      ],
                    })
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: exp.dates,
                          font: 'Arial',
                          size: 22,
                          italics: true,
                        })
                      ],
                    })
                  ],
                }),
              ],
            }),
          ],
        })
      )

      // Summary (if present)
      if (exp.summary) {
         elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.summary,
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { after: 50 },
          })
        )
      }

      // Bullet points
      exp.achievements.forEach((achievement: string, achIndex: number) => {
        elements.push(
          new Paragraph({
            text: TextFormatter.formatBulletPoint(achievement),
            bullet: {
              level: 0,
            },
            style: 'ListParagraph', // Use built-in list style
            spacing: { after: 0 },
          })
        )
      })
      
      // Add spacing after experience item
      elements.push(new Paragraph({ text: "", spacing: { after: 100 } }))
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
            text: 'EXTRACURRICULARS & PROJECTS',
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
            size: 6,
          },
        },
      }),
    ]

    achievements.forEach((ach, index) => {
      // Organization/Project Name (Left) | Location/Date (Right) - Using Table
      elements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: TextFormatter.toTitleCase(ach.name).toUpperCase(),
                          bold: true,
                          font: 'Arial',
                          size: 22,
                        })
                      ],
                    })
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        ...(ach.date ? [
                          new TextRun({
                            text: ach.date,
                            bold: true,
                            font: 'Arial',
                            size: 22,
                          })
                        ] : [])
                      ],
                    })
                  ],
                }),
              ],
            }),
          ],
        })
      )

      // Role (if exists)
      if (ach.role) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: ach.role,
                font: 'Arial',
                size: 22,
                italics: true,
              }),
            ],
            spacing: { after: 50 },
          })
        )
      }

      // Description
      elements.push(
        new Paragraph({
          text: TextFormatter.formatBulletPoint(ach.description),
          bullet: {
            level: 0,
          },
          spacing: { after: index === achievements.length - 1 ? 0 : 100 },
        })
      )
    })

    return elements
  }

  /**
   * Create SKILLS section
   */
  private static createSkillsSection(skills: any[], languages?: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
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
            size: 6,
          },
        },
      }),
    ]

    // Helper to add skill line
    const addSkillLine = (label: string, items: string[]) => {
      if (items.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${label}: `,
                font: 'Arial',
                size: 22,
                bold: true,
              }),
              new TextRun({
                text: items.join(', '),
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { after: 50 },
          })
        )
      }
    }

    // Languages
    if (languages && languages.length > 0) {
      addSkillLine('Languages', languages.map(l => TextFormatter.toTitleCase(l.language)))
    }

    // Technical Skills
    const technicalSkills = skills
      .filter(s => s.category === 'hard_skill' || s.category === 'tool')
      .map(s => s.name)
    addSkillLine('Technical Skills', TextFormatter.formatList(technicalSkills))

    // Soft Skills / Activities
    const softSkills = skills
      .filter(s => s.category === 'soft_skill')
      .map(s => s.name)
    addSkillLine('Interests & Activities', TextFormatter.formatList(softSkills))

    return paragraphs
  }
}

