import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth-config'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

// GET /api/companies/[id]
// Returns minimal public company info for proposal flow
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const raw = decodeURIComponent(params.id)

    // Try by ID first, then by case-insensitive companyName (support slug fallback)
    const company = await prisma.user.findFirst({
      where: {
        role: 'COMPANY',
        OR: [
          { id: raw },
          { companyName: { equals: raw.replace(/-/g, ' '), mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        companyName: true,
        industry: true,
        companySize: true,
        companyOneLiner: true,
        contactEmail: true,
        email: true
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: company.id,
      name: company.companyName || 'Company',
      industry: company.industry || 'Various',
      size: company.companySize || 'Unknown',
      description: company.companyOneLiner || 'Exciting company looking for talented individuals.',
      email: company.contactEmail || company.email || null
    })
  } catch (error) {
    console.error('❌ Error fetching company info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


