import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Find all duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count
      FROM "User"
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    console.log('🔍 Found duplicate emails:', duplicateEmails);

    const results = [];

    for (const duplicate of duplicateEmails as any[]) {
      const email = duplicate.email;
      const users = await prisma.user.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          profileCompleted: true,
          createdAt: true,
        }
      });

      results.push({
        email,
        count: duplicate.count,
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          profileCompleted: user.profileCompleted,
          createdAt: user.createdAt,
        }))
      });
    }

    return NextResponse.json({
      success: true,
      duplicates: results
    });

  } catch (error) {
    console.error('❌ Error finding duplicate users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find all users with this email
    const users = await prisma.user.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length <= 1) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found for this email'
      });
    }

    // Keep the most recent user (first in the array due to desc order)
    const keepUser = users[0];
    const deleteUsers = users.slice(1);

    console.log(`🧹 Keeping user ${keepUser.id} (most recent), deleting ${deleteUsers.length} duplicates`);

    // Delete the older users
    for (const user of deleteUsers) {
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log(`🗑️ Deleted duplicate user: ${user.id}`);
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleteUsers.length} duplicate users for ${email}`,
      keptUser: {
        id: keepUser.id,
        email: keepUser.email,
        role: keepUser.role,
        emailVerified: keepUser.emailVerified,
        profileCompleted: keepUser.profileCompleted,
      }
    });

  } catch (error) {
    console.error('❌ Error cleaning up duplicate users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
