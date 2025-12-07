/**
 * CV Word Export Service V4
 * Implements the specific "Standard Guidelines" layout:
 * - Times New Roman
 * - Right vertical grey line
 * - 2-column grid for entries (Left 75% | Right 25%)
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
    TabStopType,
    TabStopPosition,
    HeadingLevel,
    TableLayoutType,
} from 'docx'
import { GeneratedCV } from './cv-generator'
import { TextFormatter } from './text-formatter'

// Layout constants
const FONT_FAMILY = "Times New Roman"
const FONT_SIZE_BODY = 22 // 11pt
const FONT_SIZE_NAME = 28 // 14pt
const FONT_SIZE_SECTION = 22 // 11pt (Uppercase Bold)

// Colors
const COLOR_BLACK = "000000"
const COLOR_GREY_LINE = "BFBFBF" // Thin grey line
const COLOR_BLUE_LINK = "0563C1"

export class CVWordExportV4 {

    static async generateWordDocument(cv: GeneratedCV): Promise<Document> {

        // Create the main content
        // We'll use a single-column layout but wrap the content in a way that allows the right border.
        // However, DOCX page borders are around the page. 
        // The requirement: "Content appears inside an invisible block... On the right edge of this block there is a thin vertical grey line... text ends just before".
        // We can achieve this by having a right border on all paragraphs or using a main 1-cell table with a right border.
        // A main table is safer for the "vertical line running from top to bottom" look.

        const sections: (Paragraph | Table)[] = []

        // ========================================
        // HEADER
        // ========================================

        // 2.1 Name
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: cv.profile.name, // "Bold, slightly larger"
                        bold: true,
                        font: FONT_FAMILY,
                        size: FONT_SIZE_NAME,
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 }, // Small gap
            })
        )

        // 2.2 Contact Line
        const contactParts = []
        if (cv.profile.phone) contactParts.push(cv.profile.phone)
        if (cv.profile.email) contactParts.push(cv.profile.email)
        // The guide says: "+44number | mail@gmail.com". Location is not explicitly requested in contact line but usually good. 
        // V2/V3 included location. I'll include it if present, or stick strictly to guide ? 
        // Guide says: "+44number | mail@gmail.com". Let's stick to that pattern plus location if available as it's standard.
        // Actually guide specifically says: "Phone: regular black text. Separator: | . Email: blue, underlined".

        const contactParagraph = new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 }, // "Space before first section"
            children: []
        })

        if (cv.profile.phone) {
            contactParagraph.addChildElement(
                new TextRun({
                    text: cv.profile.phone,
                    font: FONT_FAMILY,
                    size: FONT_SIZE_BODY,
                    color: COLOR_BLACK,
                })
            )
        }

        if (cv.profile.email) {
            if (cv.profile.phone) {
                contactParagraph.addChildElement(
                    new TextRun({
                        text: " | ",
                        font: FONT_FAMILY,
                        size: FONT_SIZE_BODY,
                        color: COLOR_BLACK,
                    })
                )
            }
            contactParagraph.addChildElement(
                new TextRun({
                    text: cv.profile.email,
                    font: FONT_FAMILY,
                    size: FONT_SIZE_BODY,
                    color: COLOR_BLUE_LINK,
                    underline: { type: "single" }, // "Standard hyperlink style"
                })
            )
        }

        sections.push(contactParagraph)

        // ========================================
        // SECTIONS
        // ========================================

        // EDUCATION
        sections.push(...this.createSectionHeader("EDUCATION"))
        sections.push(...this.createEducationSection(cv.education))

        // EXPERIENCE
        if (cv.experience && cv.experience.length > 0) {
            sections.push(...this.createSectionHeader("EXPERIENCE"))
            sections.push(...this.createExperienceSection(cv.experience))
        }

        // EXTRACURRICULARS
        if (cv.achievements && cv.achievements.length > 0) {
            sections.push(...this.createSectionHeader("EXTRACURRICULARS"))
            sections.push(...this.createExtracurricularsSection(cv.achievements))
        }

        // SKILLS, ACTIVITIES & INTERESTS
        // Combined section as per guide
        sections.push(...this.createSectionHeader("SKILLS, ACTIVITIES & INTERESTS"))
        sections.push(...this.createSkillsSection(cv.skills, cv.languages || [], cv.profile))


        // ========================================
        // MAIN LAYOUT WRAPPER
        // ========================================
        // To achieve the "Right edge... thin vertical grey line" effect:
        // We will place all the content inside a 1-column table that has a RIGHT BORDER.

        const mainContainerTable = new Table({
            width: { size: 10000, type: WidthType.DXA }, // Fixed width ~7 inches (10000 twips)
            borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 }, // REMOVED VERTICAL LINE
                insideHorizontal: { style: BorderStyle.NONE, size: 0 },
                insideVertical: { style: BorderStyle.NONE, size: 0 },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 10000, type: WidthType.DXA },
                            children: sections,
                            margins: {
                                right: convertInchesToTwip(0.2), // "Text ends just before the vertical line"
                            },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE }, // The table handles the border
                            },
                        })
                    ]
                })
            ]
        })

        return new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: FONT_FAMILY,
                            size: FONT_SIZE_BODY,
                            color: COLOR_BLACK,
                        },
                        paragraph: {
                            spacing: {
                                line: 240, // Single line spacing
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
                children: [mainContainerTable],
            }],
        })
    }

    // Helper: Create Section Header
    private static createSectionHeader(title: string): Paragraph[] {
        return [
            new Paragraph({
                children: [
                    new TextRun({
                        text: title,
                        bold: true,
                        font: FONT_FAMILY,
                        size: FONT_SIZE_SECTION,
                    })
                ],
                spacing: { before: 120, after: 0 }, // Gap before header
                border: {
                    bottom: {
                        color: COLOR_GREY_LINE,
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                    },
                },
            })
        ]
    }

    // Helper: Create 2-Column Row (Left 75%, Right 25%)
    private static createEntryRow(
        leftText: string,
        rightText: string,
        styles: {
            leftBold?: boolean,
            leftItalic?: boolean,
            rightBold?: boolean,
            rightItalic?: boolean
        }
    ): Table {
        // We use a nested table for the row to ensure perfect alignment
        return new Table({
            width: { size: 10000, type: WidthType.DXA },
            borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 },
                insideHorizontal: { style: BorderStyle.NONE, size: 0 },
                insideVertical: { style: BorderStyle.NONE, size: 0 },
            },
            rows: [
                new TableRow({
                    children: [
                        // Left Column (~75%)
                        new TableCell({
                            width: { size: 7500, type: WidthType.DXA },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: leftText,
                                            bold: styles.leftBold,
                                            italics: styles.leftItalic,
                                            font: FONT_FAMILY,
                                            size: FONT_SIZE_BODY,
                                        })
                                    ],
                                    spacing: { after: 0 },
                                })
                            ],
                        }),
                        // Right Column (~25%) - Right Aligned
                        new TableCell({
                            width: { size: 2500, type: WidthType.DXA },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: rightText,
                                            bold: styles.rightBold,
                                            italics: styles.rightItalic,
                                            font: FONT_FAMILY,
                                            size: FONT_SIZE_BODY,
                                        })
                                    ],
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { after: 0 },
                                })
                            ],
                        })
                    ]
                })
            ]
        })
    }

    // EDUCATION
    private static createEducationSection(education: any[]): (Paragraph | Table)[] {
        const elements: (Paragraph | Table)[] = []

        education.forEach((edu, index) => {
            // Wrapper paragraph for spacing between entries
            if (index > 0) {
                elements.push(new Paragraph({ spacing: { before: 120 } })) // "Small vertical gap between entries"
            } else {
                elements.push(new Paragraph({ spacing: { before: 60 } })) // Gap after line
            }

            // Row 1: Uni (Bold) | Location (Bold)
            elements.push(
                this.createEntryRow(
                    TextFormatter.formatCompanyName(edu.institution),
                    TextFormatter.formatLocation(edu.location || ''),
                    { leftBold: true, rightBold: true }
                )
            )

            // Row 2: Degree (Italic) | Dates (Italic)
            elements.push(
                this.createEntryRow(
                    TextFormatter.toTitleCase(edu.degree),
                    edu.dates,
                    { leftItalic: true, rightItalic: true }
                )
            )

            // Rows 3+: Bullets
            // "Both bullets exist only in the left column... Bullet text starts a bit further right"

            // Predicted Grade
            if (edu.grade) {
                elements.push(this.createBullet(`Predicted Grade: ${edu.grade}`))
            }

            // Modules / Coursework
            // Guide: "Relevant Modules: x, y, z"
            if (edu.highlights && edu.highlights.length > 0) {
                elements.push(this.createBullet(`Relevant Modules: ${edu.highlights.join(', ')}`))
            }

            // If we have "modules" field specifically (from raw data), check that too
            if (edu.modules && edu.modules.length > 0 && !edu.highlights) {
                elements.push(this.createBullet(`Relevant Modules: ${edu.modules.join(', ')}`))
            }
        })

        // "After the last bullet, there is a small vertical gap"
        elements.push(new Paragraph({ spacing: { after: 120 } }))

        return elements
    }

    // EXPERIENCE
    private static createExperienceSection(experience: any[]): (Paragraph | Table)[] {
        const elements: (Paragraph | Table)[] = []

        experience.forEach((exp, index) => {
            if (index > 0) {
                elements.push(new Paragraph({ spacing: { before: 120 } }))
            } else {
                elements.push(new Paragraph({ spacing: { before: 60 } }))
            }

            // Row 1: Employer (Bold) | Location (Bold)
            elements.push(
                this.createEntryRow(
                    TextFormatter.formatCompanyName(exp.employer),
                    TextFormatter.formatLocation(exp.location || ''),
                    { leftBold: true, rightBold: true }
                )
            )

            // Row 2: Role (Italic) | Dates (Italic)
            // "Role - Team" logic from guide? current data is just title
            elements.push(
                this.createEntryRow(
                    TextFormatter.toTitleCase(exp.title),
                    exp.dates,
                    { leftItalic: true, rightItalic: true }
                )
            )

            // Row 3+: Bullets
            if (exp.achievements && exp.achievements.length > 0) {
                exp.achievements.forEach((ach: string) => {
                    elements.push(this.createBullet(ach))
                })
            } else if (exp.summary) {
                // Fallback to summary as bullet if no achievements
                elements.push(this.createBullet(exp.summary))
            }
        })

        elements.push(new Paragraph({ spacing: { after: 120 } }))
        return elements
    }

    // EXTRACURRICULARS
    private static createExtracurricularsSection(achievements: any[]): (Paragraph | Table)[] {
        const elements: (Paragraph | Table)[] = []

        achievements.forEach((ach, index) => {
            if (index > 0) {
                elements.push(new Paragraph({ spacing: { before: 120 } }))
            } else {
                elements.push(new Paragraph({ spacing: { before: 60 } }))
            }

            // Row 1: Org (Bold) | Location
            elements.push(
                this.createEntryRow(
                    TextFormatter.formatCompanyName(ach.name),
                    TextFormatter.formatLocation(ach.location || ''),
                    { leftBold: true, rightBold: true } // Guide implies location is bold right
                )
            )

            // Row 2: Role (Italic) | Dates (Italic)
            elements.push(
                this.createEntryRow(
                    TextFormatter.toTitleCase(ach.role || 'Member'),
                    ach.date,
                    { leftItalic: true, rightItalic: true }
                )
            )

            // Bullets
            if (ach.description) {
                elements.push(this.createBullet(ach.description))
            }
        })

        elements.push(new Paragraph({ spacing: { after: 120 } }))
        return elements
    }

    // SKILLS & INTERESTS
    private static createSkillsSection(skills: any[], languages: any[], profile: any): Paragraph[] {
        const elements: Paragraph[] = []

        elements.push(new Paragraph({ spacing: { before: 60 } }))

        // 1. Languages
        // "Languages: English (Native), Arabic (Fluent)..."
        // Label bold italic
        if (languages && languages.length > 0) {
            const langText = languages.map(l => {
                // l.language and l.proficiency
                return `${l.language} (${l.proficiency})`
            }).join(', ')

            elements.push(this.createLabeledLine("Languages", langText))
        }

        // 2. Activities (missing in standard CV object usually, but might be in profile)
        // Placeholder or use interests?
        // Guide: "Activities: ..."

        // 3. Technical Skills
        if (skills && skills.length > 0) {
            const skillNames = skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean)
            if (skillNames.length > 0) {
                elements.push(this.createLabeledLine("Technical Skills", skillNames.join(', ')))
            }
        }

        // 4. Interests
        // Standard CV object doesn't always have interests field.
        // If we have it in profile?
        // "Interests: ..."

        return elements
    }

    // Helper: Bullet point
    private static createBullet(text: string): Paragraph {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    font: FONT_FAMILY,
                    size: FONT_SIZE_BODY,
                })
            ],
            bullet: {
                level: 0,
            },
            spacing: { after: 40 }, // "Small vertical gap"
            // Indentation to match "Left column only" (~75% width implied but practically it just needs to not cross line)
            // Actually guide says: "Both bullets exist only in the left column (no corresponding right-column text)."
            // Since we are NOT in a table for bullets (to save complexity?), we should assume single column behavior.
            // But guide says: "Left column (~70–75% width)... Row 3+: Bullet points describing content (left column only)."
            // So bullets should NOT span full width. They should be constrained to 75%.
            // We can use right indentation on the paragraph.
            indent: {
                left: convertInchesToTwip(0.25), // Bullet indent
                hanging: convertInchesToTwip(0.15),
                right: convertInchesToTwip(1.8), // Approx 25% of ~7 inches
            }
        })
    }

    // Helper: Labeled Line (Skills etc)
    // "Label part is bold and italic... content regular"
    private static createLabeledLine(label: string, content: string): Paragraph {
        return new Paragraph({
            children: [
                new TextRun({
                    text: `${label}: `,
                    bold: true,
                    italics: true,
                    font: FONT_FAMILY,
                    size: FONT_SIZE_BODY,
                }),
                new TextRun({
                    text: content,
                    font: FONT_FAMILY,
                    size: FONT_SIZE_BODY,
                })
            ],
            spacing: { after: 60 }
        })
    }

}
