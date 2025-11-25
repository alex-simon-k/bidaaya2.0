import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'
import { CVHistoryClient } from './cv-history-client'
import { StudentLayoutWrapper } from '@/components/student-layout-wrapper'

const prisma = new PrismaClient()

export default async function CVHistoryPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // @ts-ignore - GeneratedCV might not be in types yet
  const cvs = await prisma.generatedCV.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      opportunity: {
        select: {
          company: true,
          companyLogoUrl: true,
        }
      }
    }
  })

  return (
    <StudentLayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bidaaya-light">My Generated CVs</h1>
          <p className="text-bidaaya-light/60 mt-2">
            Manage your custom CVs. Download active CVs or extend expired ones.
          </p>
        </div>
        
        <CVHistoryClient initialCvs={cvs} />
      </div>
    </StudentLayoutWrapper>
  )
}

