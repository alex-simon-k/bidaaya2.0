import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete the education entry if it belongs to the user
    const education = await prisma.education.findUnique({
      where: { id: params.id }
    })

    if (!education) {
      return NextResponse.json({ error: 'Education not found' }, { status: 404 })
    }

    if (education.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.education.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Education deleted' })
  } catch (error) {
    console.error('Error deleting education:', error)
    return NextResponse.json(
      { error: 'Failed to delete education' },
      { status: 500 }
    )
  }
}

