import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    // Fetch all projects with their applications and user data
    const projects = await prisma.project.findMany({
      include: {
        company: {
          select: {
            name: true,
            companyName: true,
          }
        },
        applications: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                university: true,
                major: true,
                whatsapp: true,
                linkedin: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate total statistics
    const totalApplications = projects.reduce((sum, project) => sum + project.applications.length, 0)
    const totalShortlisted = projects.reduce((sum, project) => 
      sum + project.applications.filter(app => app.status === 'SHORTLISTED').length, 0
    )
    const totalInterviewed = projects.reduce((sum, project) => 
      sum + project.applications.filter(app => app.status === 'INTERVIEWED').length, 0
    )

    return NextResponse.json({
      success: true,
      projects,
      statistics: {
        totalProjects: projects.length,
        totalApplications,
        totalShortlisted,
        totalInterviewed,
        avgApplicationsPerProject: projects.length > 0 ? totalApplications / projects.length : 0
      }
    })

  } catch (error) {
    console.error('❌ Error fetching admin applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
} 