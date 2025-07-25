import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return new NextResponse('Missing token', { status: 400 })
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return new NextResponse('Invalid token', { status: 400 })
    }

    if (verificationToken.expires < new Date()) {
      return new NextResponse('Token expired', { status: 400 })
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    })

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    })

    return new NextResponse('Email verified successfully')
  } catch (error) {
    console.error('Error verifying email:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 