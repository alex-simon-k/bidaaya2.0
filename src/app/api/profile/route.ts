import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        name: true,
        email: true,
        university: true,
        major: true,
        graduationYear: true,
        bio: true,
        skills: true,
        companyName: true,
        companySize: true,
        industry: true,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      university,
      major,
      graduationYear,
      bio,
      skills,
      companyName,
      companySize,
      industry,
    } = body

    const updateData: any = {
      name,
      email,
    }

    if (session.user.role === 'STUDENT') {
      updateData.university = university
      updateData.major = major
      updateData.graduationYear = graduationYear
      updateData.bio = bio
      updateData.skills = skills
    }

    if (session.user.role === 'COMPANY') {
      updateData.companyName = companyName
      updateData.companySize = companySize
      updateData.industry = industry
    }

    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: updateData,
      select: {
        name: true,
        email: true,
        university: true,
        major: true,
        graduationYear: true,
        bio: true,
        skills: true,
        companyName: true,
        companySize: true,
        industry: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating profile:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 