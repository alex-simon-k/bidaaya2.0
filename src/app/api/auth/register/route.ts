import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { slackAutomation } from '@/lib/slack-service'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, password, role } = body

    if (!email || !name || !password || !role) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return new NextResponse('Email already exists', { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
      },
    })

    // Note: Slack notification moved to profile completion for better user data
    // This prevents duplicate notifications and ensures we have meaningful user info

    return NextResponse.json(user)
  } catch (error) {
    console.error('Registration error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 