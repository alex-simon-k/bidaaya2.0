import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role } = body

    console.log('🔐 Set-role API - Request body:', { email, role });

    // Validate required fields
    if (!email) {
      console.log('❌ Set-role API - No email provided');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!role || !['STUDENT', 'COMPANY'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be STUDENT or COMPANY' },
        { status: 400 }
      )
    }

    console.log(`🎯 Setting role for ${email}: ${role}`)

    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!existingUser) {
      console.log(`❌ User not found in database: ${email}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update the user's role in the database and ensure profileCompleted is false
    const updatedUser = await prisma.user.update({
      where: {
        email: email
      },
      data: {
        role: role,
        profileCompleted: false // Explicitly set to false to ensure onboarding flow
      }
    })

    console.log(`✅ User role updated successfully: ${updatedUser.email} -> ${updatedUser.role}, profileCompleted set to false`)

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      }
    })

  } catch (error) {
    console.error('❌ Error setting user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
