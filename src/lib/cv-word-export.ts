/**
 * CV Word Export Service
 * 
 * Generates professional CVs as editable Word documents (.docx)
 * Students can download and tweak before applying
 */

import { 
  Document, 
  Paragraph, 
  TextRun, 
  HeadingLevel,
  AlignmentType,
  UnderlineType,
  BorderStyle,
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx'
import { GeneratedCV } from './cv-generator'

export class CVWordExport {
  
  /**
   * Generate a Word document from CV data
   */
  static async generateWordDocument(cv: GeneratedCV): Promise<Document> {
    
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        children: [
          // Header - Name and Contact
          ...this.createHeader(cv.profile),
          
          // Spacing
          new Paragraph({ text: '' }),
          
          // Education Section (FIRST - like Sasha's CV)
          ...this.createEducationSection(cv.education, cv.certifications),
          
          // Work Experience Section
          ...(cv.experience && cv.experience.length > 0 ? 
            this.createExperienceSection(cv.experience) : []),
          
          // Leadership & Volunteering (if exists)
          ...(cv.achievements && cv.achievements.filter(a => a.name.toLowerCase().includes('lead') || a.name.toLowerCase().includes('team')).length > 0 ?
            this.createLeadershipSection(cv.achievements.filter(a => a.name.toLowerCase().includes('lead') || a.name.toLowerCase().includes('team'))) : []),
          
          // Extracurriculars (other achievements)
          ...(cv.achievements && cv.achievements.filter(a => !a.name.toLowerCase().includes('lead') && !a.name.toLowerCase().includes('team')).length > 0 ?
            this.createExtracurricularsSection(cv.achievements.filter(a => !a.name.toLowerCase().includes('lead') && !a.name.toLowerCase().includes('team'))) : []),
          
          // Additional Skills / Information (LAST - like Sasha's CV)
          ...this.createAdditionalSkillsSection(cv.skills, cv.languages),
        ],
      }],
    })

    return doc
  }

  /**
   * Create header with name and contact information
   * Based on Sasha's CV format: Name + LinkedIn on first line, then contact details
   */
  private static createHeader(profile: GeneratedCV['profile']): Paragraph[] {
    // First line: Name and LinkedIn
    const firstLine: TextRun[] = [
      new TextRun({
        text: profile.name,
        bold: true,
        size: 28, // 14pt
      })
    ]
    
    if (profile.linkedin) {
      firstLine.push(
        new TextRun({
          text: profile.linkedin,
          size: 20, // 10pt
          // Link will be added if needed
        })
      )
    }

    // Second line: Contact details
    const contactInfo: string[] = []
    if (profile.location) contactInfo.push(profile.location)
    if (profile.phone) contactInfo.push(profile.phone)
    if (profile.email) contactInfo.push(profile.email)

    return [
      // Name + LinkedIn
      new Paragraph({
        children: firstLine,
        spacing: { after: 50 },
      }),
      
      // Contact Info
      new Paragraph({
        children: [
          new TextRun({
            text: contactInfo.join(' | '),
            size: 20, // 10pt
          })
        ],
        spacing: { after: 150 },
      }),
    ]
  }

  /**
   * Create professional summary section
   */
  private static createProfessionalSummary(summary: string): Paragraph[] {
    return [
      new Paragraph({
        text: 'PROFESSIONAL SUMMARY',
        heading: HeadingLevel.HEADING_1,
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
      new Paragraph({
        text: summary,
        spacing: { after: 200 },
      }),
    ]
  }

  /**
   * Create education section
   * Format matches Sasha's CV: Degree title first, then institution, then details
   * Includes online courses/certifications at the end
   */
  private static createEducationSection(education: any[], certifications?: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Education',
            bold: true,
            size: 24, // 12pt
          })
        ],
        spacing: { before: 200, after: 100 },
      }),
    ]

    education.forEach((edu, index) => {
      // Degree title and dates (right-aligned)
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
            }),
            new TextRun({
              text: `\t\t\t\t${edu.dates}`,
            }),
          ],
          spacing: { before: index > 0 ? 100 : 0, after: 20 },
        })
      )

      // Institution name
      paragraphs.push(
        new Paragraph({
          text: edu.institution,
          spacing: { after: 20 },
        })
      )

      // Grade (if exists)
      if (edu.grade) {
        paragraphs.push(
          new Paragraph({
            text: edu.grade,
            spacing: { after: 20 },
          })
        )
      }

      // Location (if provided)
      if (edu.location) {
        paragraphs.push(
          new Paragraph({
            text: edu.location,
            spacing: { after: 20 },
          })
        )
      }

      // Modules as bullet points with "o" prefix (like Sasha's CV)
      if (edu.highlights && edu.highlights.length > 0) {
        const moduleText = `o ${edu.highlights.join(', ')}`
        paragraphs.push(
          new Paragraph({
            text: moduleText,
            spacing: { after: 50 },
            indent: { left: convertInchesToTwip(0.2) },
          })
        )
      }
    })

    // Add online courses/certifications (like Sasha's Coursera & Udemy section)
    if (certifications && certifications.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Coursera & Udemy:',
              bold: true,
            })
          ],
          spacing: { before: 100, after: 20 },
        })
      )

      certifications.forEach((cert) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cert.name,
              }),
              ...(cert.issuer !== 'Coursera' && cert.issuer !== 'Udemy' ? [
                new TextRun({
                  text: ` – ${cert.issuer}`,
                })
              ] : []),
              new TextRun({
                text: `\t\t\t\t${cert.date}`,
              }),
            ],
            spacing: { after: 20 },
          })
        )
      })
    }

    return paragraphs
  }

  /**
   * Create experience section
   * Matches Sasha's format: Title | Subtitle on one line, company below, then description
   */
  private static createExperienceSection(experiences: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Work Experience',
            bold: true,
            size: 24, // 12pt
          })
        ],
        spacing: { before: 200, after: 100 },
      }),
    ]

    experiences.forEach((exp, index) => {
      // Title and dates (like Sasha's: "Operations Manager Intern | Acquiring Department")
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.title,
              bold: true,
            }),
            new TextRun({
              text: `\t\t\t\t${exp.dates}`,
            }),
          ],
          spacing: { before: index > 0 ? 100 : 0, after: 20 },
        })
      )

      // Company name
      paragraphs.push(
        new Paragraph({
          text: exp.employer + (exp.location ? ` (${exp.location})` : ''),
          spacing: { after: 20 },
        })
      )

      // Summary/description (as continuous text like Sasha's format)
      if (exp.summary) {
        paragraphs.push(
          new Paragraph({
            text: exp.summary,
            spacing: { after: 20 },
          })
        )
      }

      // Achievements as continuous text or bullet points
      if (exp.achievements && exp.achievements.length > 0) {
        if (exp.achievements.length === 1) {
          // Single achievement - put as paragraph
          paragraphs.push(
            new Paragraph({
              text: exp.achievements[0],
              spacing: { after: 50 },
            })
          )
        } else {
          // Multiple achievements - use bullet points
          exp.achievements.forEach((achievement: string) => {
            paragraphs.push(
              new Paragraph({
                text: `• ${achievement}`,
                spacing: { after: 20 },
                indent: { left: convertInchesToTwip(0.15) },
              })
            )
          })
          paragraphs.push(new Paragraph({ text: '', spacing: { after: 30 } }))
        }
      }
    })

    return paragraphs
  }

  /**
   * Create projects section
   */
  private static createProjectsSection(projects: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        text: 'PROJECTS',
        heading: HeadingLevel.HEADING_1,
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

    projects.forEach((proj, index) => {
      // Project name and role
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proj.name,
              bold: true,
              size: 24,
            }),
            ...(proj.role ? [
              new TextRun({
                text: ` | ${proj.role}`,
                italics: true,
              })
            ] : []),
            ...(proj.dates ? [
              new TextRun({
                text: `\t\t${proj.dates}`,
                italics: true,
              })
            ] : []),
          ],
          spacing: { before: index > 0 ? 150 : 0, after: 50 },
        })
      )

      // Technologies
      if (proj.technologies && proj.technologies.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Technologies: ${proj.technologies.join(', ')}`,
                italics: true,
              })
            ],
            spacing: { after: 50 },
          })
        )
      }

      // Description
      if (proj.description) {
        paragraphs.push(
          new Paragraph({
            text: proj.description,
            spacing: { after: 50 },
          })
        )
      }

      // Outcomes
      if (proj.outcomes && proj.outcomes.length > 0) {
        proj.outcomes.forEach((outcome: string) => {
          paragraphs.push(
            new Paragraph({
              text: `• ${outcome}`,
              spacing: { after: 50 },
              indent: { left: convertInchesToTwip(0.25) },
            })
          )
        })
      }
    })

    paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }))
    return paragraphs
  }

  /**
   * Create Leadership & Volunteering section (like Sasha's CV)
   */
  private static createLeadershipSection(achievements: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Leadership & Volunteering Experiences',
            bold: true,
            size: 24, // 12pt
          })
        ],
        spacing: { before: 200, after: 100 },
      }),
    ]

    achievements.forEach((ach) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ach.name,
              bold: true,
            })
          ],
          spacing: { after: 20 },
        })
      )

      if (ach.description) {
        paragraphs.push(
          new Paragraph({
            text: ach.description,
            spacing: { after: 50 },
          })
        )
      }
    })

    return paragraphs
  }

  /**
   * Create Extracurriculars section (like Sasha's CV)
   */
  private static createExtracurricularsSection(achievements: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Extracurriculars',
            bold: true,
            size: 24, // 12pt
          })
        ],
        spacing: { before: 200, after: 100 },
      }),
    ]

    achievements.forEach((ach) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ach.name,
              bold: true,
            })
          ],
          spacing: { after: 20 },
        })
      )

      if (ach.description) {
        paragraphs.push(
          new Paragraph({
            text: ach.description,
            spacing: { after: 50 },
          })
        )
      }
    })

    return paragraphs
  }

  /**
   * Create "Additional Skills / Information" section (like Sasha's CV)
   * Includes Languages and Coding Languages
   */
  private static createAdditionalSkillsSection(skills: any[], languages?: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Additional Skills / Information',
            bold: true,
            size: 24, // 12pt
          })
        ],
        spacing: { before: 200, after: 100 },
      }),
    ]

    // Languages section
    if (languages && languages.length > 0) {
      const spokenLangs = languages.filter(l => l.language !== 'Code')
      if (spokenLangs.length > 0) {
        const languageText = spokenLangs
          .map(lang => `${lang.language}`)
          .join(', ')

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Languages :',
                bold: true,
              }),
              new TextRun({
                text: `\n${languageText}`,
              }),
            ],
            spacing: { after: 100 },
          })
        )
      }
    }

    // Coding Languages (technical skills)
    const codingSkills = skills.filter(s => 
      s.category === 'hard_skill' || s.category === 'tool'
    )
    
    if (codingSkills.length > 0) {
      const codingText = codingSkills.map(s => s.name).join(', ')

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Coding Languages:',
              bold: true,
            }),
            new TextRun({
              text: `\n${codingText}`,
            }),
          ],
          spacing: { after: 100 },
        })
      )
    }

    return paragraphs
  }

  /**
   * Helper: Capitalize first letter
   */
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * Generate filename for CV
   */
  static generateFilename(name: string, opportunityTitle?: string): string {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_')
    const cleanOpportunity = opportunityTitle ? 
      `_${opportunityTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}` : 
      ''
    
    return `CV_${cleanName}${cleanOpportunity}.docx`
  }
}

