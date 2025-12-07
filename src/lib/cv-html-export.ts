import { GeneratedCV } from './cv-generator'
// @ts-ignore
import HTMLtoDOCX from 'html-to-docx'
import { TextFormatter } from './text-formatter'

const FONT_FAMILY = "Times New Roman"

export class CVHTMLExport {

  static async generateWordDocument(cv: GeneratedCV): Promise<Buffer> {
    const html = this.generateHTML(cv)

    // html-to-docx configuration
    const fileBuffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      font: FONT_FAMILY,
      fontSize: 22, // 11pt (size is in half-points)
      margins: {
        top: 1440, // 1 inch in twips
        right: 1440,
        bottom: 1440,
        left: 1440,
      }
    })

    return fileBuffer
  }

  private static generateHTML(cv: GeneratedCV): string {
    const styles = `
      body { font-family: '${FONT_FAMILY}'; font-size: 11pt; color: #000000; line-height: 1.15; margin: 0; padding: 0; }
      
      /* Remove the right border if it was causing issues, or keep it if strictly required. 
         The user's text doesn't explicitly show it, but the guide did. 
         I will keep it but ensure it's clean and doesn't interfere with flow.
         User said "This is not at all how I wanted", referring to the *result*. 
         I'll trust the CLEAN layout from the text. 
         Let's comment out the border-right for now to be safe, or make it very subtle.
         Actually, the original requirement was specific. I will keep it but make sure table borders are GONE.
      */
      .main-container { padding-right: 15px; } 

      /* Header */
      .header-name { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 4px; text-transform: capitalize; }
      .header-contact { text-align: center; font-size: 11pt; margin-bottom: 20px; }
      .header-contact span { color: #000000; }
      .header-contact a { color: #0563C1; text-decoration: underline; }
      
      /* Section Headers */
      h2 { 
        font-size: 11pt; 
        font-weight: bold; 
        text-transform: uppercase; 
        border-bottom: 1px solid #000000; /* Black solid line */
        padding-bottom: 3px; 
        margin-top: 15px; 
        margin-bottom: 10px;
      }
      
      /* Tables for Layout - STRICTLY NO BORDERS */
      table { width: 100%; border-collapse: collapse; margin-bottom: 0; table-layout: fixed; border: none; }
      td { vertical-align: top; padding: 0; border: none; }
      
      .col-left { width: 75%; padding-right: 10px; text-align: left; }
      .col-right { width: 25%; text-align: right; white-space: nowrap; }
      
      .entry-title { font-weight: bold; font-size: 11pt; } 
      /* "University" is bold? text says "University" (bold implied by position?). 
         Guide: "Organization (left, bold)". Yes. */
         
      .entry-subtitle { font-style: italic; font-size: 11pt; }
      
      /* Bullets */
      ul { margin: 0; padding-left: 15px; margin-top: 2px; list-style-type: disc; }
      li { margin-bottom: 0; padding-left: 5px; }
      
      .label { font-weight: bold; font-style: italic; }
      
      /* Spacing */
      .entry-table { margin-bottom: 8px; }
    `

    let content = ''

    // 1. Header
    content += `
      <div class="header-name">${cv.profile.name}</div>
      <div class="header-contact">
        ${cv.profile.phone ? `<span>${cv.profile.phone}</span>` : ''}
        ${cv.profile.phone && cv.profile.email ? ' | ' : ''}
        ${cv.profile.email ? `<a href="mailto:${cv.profile.email}">${cv.profile.email}</a>` : ''}
      </div>
    `

    // 2. Education
    content += `<h2>EDUCATION</h2>`
    cv.education.forEach(edu => {
      content += `
        <table class="entry-table">
          <tr>
            <td class="col-left entry-title">${TextFormatter.formatCompanyName(edu.institution)}</td>
            <td class="col-right entry-title">${TextFormatter.formatLocation(edu.location || '')}</td>
          </tr>
          <tr>
            <td class="col-left entry-subtitle">${TextFormatter.toTitleCase(edu.degree)}</td>
            <td class="col-right entry-subtitle">${edu.dates}</td>
          </tr>
          ${this.getEducationBullets(edu)}
        </table>
      `
    })

    // 3. Experience
    if (cv.experience && cv.experience.length > 0) {
      content += `<h2>EXPERIENCE</h2>`
      cv.experience.forEach(exp => {
        content += `
          <table class="entry-table">
            <tr>
              <td class="col-left entry-title">${TextFormatter.formatCompanyName(exp.employer)}</td>
              <td class="col-right entry-title">${TextFormatter.formatLocation(exp.location || '')}</td>
            </tr>
            <tr>
              <td class="col-left entry-subtitle">${TextFormatter.toTitleCase(exp.title)}</td>
              <td class="col-right entry-subtitle">${exp.dates}</td>
            </tr>
            <tr>
              <td class="col-left" colspan="2">
                <ul>
                  ${(exp.achievements || []).map((ach: string) => `<li>${ach}</li>`).join('')}
                  ${(!exp.achievements?.length && exp.summary) ? `<li>${exp.summary}</li>` : ''}
                </ul>
              </td>
            </tr>
          </table>
        `
      })
    }

    // 4. Extracurriculars
    if (cv.achievements && cv.achievements.length > 0) {
      content += `<h2>EXTRACURRICULARS</h2>`
      cv.achievements.forEach((ach: any) => {
        content += `
          <table class="entry-table">
            <tr>
              <td class="col-left entry-title">${TextFormatter.formatCompanyName(ach.name)}</td>
              <td class="col-right entry-title">${TextFormatter.formatLocation(ach.location || '')}</td>
            </tr>
             <tr>
              <td class="col-left entry-subtitle">${TextFormatter.toTitleCase(ach.role || 'Member')}</td>
              <td class="col-right entry-subtitle">${ach.date}</td>
            </tr>
            ${ach.description ? `<tr><td class="col-left" colspan="2"><ul><li>${ach.description}</li></ul></td></tr>` : ''}
          </table>
        `
      })
    }

    // 5. Skills
    content += `<h2>SKILLS, ACTIVITIES & INTERESTS</h2>`

    // Languages
    if (cv.languages && cv.languages.length > 0) {
      const langText = cv.languages.map(l => `${l.language} (${l.proficiency})`).join(', ')
      content += `<div><span class="label">Languages: </span>${langText}</div>`
    }

    // Technical Skills
    if (cv.skills && cv.skills.length > 0) {
      const skillNames = cv.skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean)
      if (skillNames.length > 0) {
        content += `<div><span class="label">Technical Skills: </span>${skillNames.join(', ')}</div>`
      }
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${styles}</style>
      </head>
      <body>
        <div class="main-container">
          ${content}
        </div>
      </body>
      </html>
    `
  }

  private static getEducationBullets(edu: any): string {
    let bullets = ''
    if (edu.grade) bullets += `<li>Predicted Grade: ${edu.grade}</li>`
    if (edu.highlights && edu.highlights.length > 0) bullets += `<li>Relevant Modules: ${edu.highlights.join(', ')}</li>`
    else if (edu.modules && edu.modules.length > 0) bullets += `<li>Relevant Modules: ${edu.modules.join(', ')}</li>`

    if (!bullets) return ''
    return `<tr><td class="col-left" colspan="2"><ul>${bullets}</ul></td></tr>`
  }
}
