/**
 * CV Word Export V3 - Template-Based Approach
 * Uses docxtemplater for reliable, editable CV generation
 */

import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { Document, Paragraph, TextRun, AlignmentType, BorderStyle, Packer, convertInchesToTwip } from 'docx'
import { GeneratedCV } from './cv-generator'
import { TextFormatter } from './text-formatter'

export class CVWordExportV3 {
  
  /**
   * Generate a clean, simple DOCX CV
   * Uses a minimal approach that works reliably across all platforms
   */
  static async generateWordDocument(cv: GeneratedCV): Promise<Document> {
    
    const sections: (Paragraph)[] = []

    // ========================================
    // HEADER - Name
    // ========================================
    sections.push(
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
        spacing: { after: 100 },
      })
    )

    // ========================================
    // HEADER - Contact Info
    // ========================================
    const contactParts = []
    if (cv.profile.phone) contactParts.push(cv.profile.phone)
    if (cv.profile.email) contactParts.push(cv.profile.email)
    if (cv.profile.location) contactParts.push(cv.profile.location)
    
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join('   |   '),
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
      })
    )

    // ========================================
    // EDUCATION SECTION
    // ========================================
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'EDUCATION',
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
      })
    )

    cv.education.forEach((edu, index) => {
      // Institution name - LEFT ALIGNED
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: TextFormatter.formatCompanyName(edu.institution).toUpperCase(),
              bold: true,
              font: 'Arial',
              size: 22,
            })
          ],
          spacing: { before: index === 0 ? 100 : 200, after: 20 },
        })
      )

      // Location - RIGHT ALIGNED (separate paragraph)
      if (edu.location) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: TextFormatter.formatLocation(edu.location),
                bold: true,
                font: 'Arial',
                size: 22,
              })
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 40 },
          })
        )
      }

      // Degree - LEFT ALIGNED
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: TextFormatter.toTitleCase(edu.degree),
              italics: true,
              font: 'Arial',
              size: 22,
            })
          ],
          spacing: { after: 20 },
        })
      )

      // Dates - RIGHT ALIGNED (separate paragraph)
      if (edu.dates) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.dates,
                font: 'Arial',
                size: 22,
              })
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 40 },
          })
        )
      }

      // Grade
      if (edu.grade) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Predicted Grade: ${edu.grade}`,
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { after: 40 },
          })
        )
      }

      // Modules/Coursework
      if (edu.modules && edu.modules.length > 0) {
        sections.push(
          new Paragraph({
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
          })
        )
      }

      if (edu.coursework && edu.coursework.length > 0) {
        sections.push(
          new Paragraph({
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
          })
        )
      }
    })

    // ========================================
    // EXPERIENCE SECTION
    // ========================================
    if (cv.experience && cv.experience.length > 0) {
      sections.push(
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
        })
      )

      cv.experience.forEach((exp, index) => {
        // Company - LEFT ALIGNED
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: TextFormatter.formatCompanyName(exp.company).toUpperCase(),
                bold: true,
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { before: index === 0 ? 100 : 200, after: 20 },
          })
        )

        // Location - RIGHT ALIGNED
        if (exp.location) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: TextFormatter.formatLocation(exp.location),
                  bold: true,
                  font: 'Arial',
                  size: 22,
                })
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 40 },
            })
          )
        }

        // Role - LEFT ALIGNED
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: TextFormatter.toTitleCase(exp.role),
                italics: true,
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { after: 20 },
          })
        )

        // Dates - RIGHT ALIGNED
        if (exp.dates) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.dates,
                  font: 'Arial',
                  size: 22,
                })
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 60 },
            })
          )
        }

        // Description
        if (exp.description) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.description,
                  font: 'Arial',
                  size: 22,
                })
              ],
              spacing: { after: 60 },
            })
          )
        }

        // Bullet points
        if (exp.impacts && exp.impacts.length > 0) {
          exp.impacts.forEach((impact: any) => {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: '• ' + impact.statement,
                    font: 'Arial',
                    size: 22,
                  })
                ],
                spacing: { after: 40 },
              })
            )
          })
        }
      })
    }

    // ========================================
    // EXTRACURRICULARS SECTION
    // ========================================
    if (cv.achievements && cv.achievements.length > 0) {
      sections.push(
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
        })
      )

      cv.achievements.forEach((ach, index) => {
        // Organization - LEFT ALIGNED
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: TextFormatter.formatCompanyName(ach.organization || ach.title).toUpperCase(),
                bold: true,
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { before: index === 0 ? 100 : 200, after: 20 },
          })
        )

        // Location - RIGHT ALIGNED
        if (ach.location) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: TextFormatter.formatLocation(ach.location),
                  bold: true,
                  font: 'Arial',
                  size: 22,
                })
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 40 },
            })
          )
        }

        // Role - LEFT ALIGNED
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: TextFormatter.toTitleCase(ach.role || ach.category || 'Member'),
                italics: true,
                font: 'Arial',
                size: 22,
              })
            ],
            spacing: { after: 20 },
          })
        )

        // Dates - RIGHT ALIGNED
        if (ach.dates || ach.date) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: ach.dates || ach.date || '',
                  font: 'Arial',
                  size: 22,
                })
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 60 },
            })
          )
        }

        // Description
        if (ach.description) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: ach.description,
                  font: 'Arial',
                  size: 22,
                })
              ],
              spacing: { after: 40 },
            })
          )
        }
      })
    }

    // ========================================
    // SKILLS SECTION
    // ========================================
    sections.push(
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
      })
    )

    // Technical Skills
    if (cv.skills && cv.skills.length > 0) {
      const skillNames = cv.skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean)
      
      if (skillNames.length > 0) {
        sections.push(
          new Paragraph({
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
          })
        )
      }
    }

    // Languages
    if (cv.languages && cv.languages.length > 0) {
      const languageNames = cv.languages.map(l => typeof l === 'string' ? l : l.language).filter(Boolean)
      
      if (languageNames.length > 0) {
        sections.push(
          new Paragraph({
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
          })
        )
      }
    }

    // ========================================
    // CREATE DOCUMENT
    // ========================================
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Arial',
              size: 22,
            },
            paragraph: {
              spacing: {
                line: 276,
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
        children: sections,
      }],
    })

    return doc
  }
}

