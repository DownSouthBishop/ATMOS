import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ArbitrationClient from '@/components/ArbitrationClient';

export default async function ArbitrationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const userId = session.user.id;

  const [myDisputes, user, sealedCount, userReceipts] = await Promise.all([
    prisma.dispute.findMany({
      where: { userId },
      include: {
        receipt: { select: { title: true, receiptNumber: true } },
        job: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { o2Balance: true } }),
    prisma.receipt.count({ where: { ownerId: userId, status: 'sealed' } }),
    prisma.receipt.findMany({
      where: {
        OR: [{ ownerId: userId }, { partyAId: userId }, { partyBId: userId }],
        status: { in: ['sealed', 'pending'] },
      },
      select: { id: true, title: true, receiptNumber: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!user) redirect('/login');

  const juryEligible = user.o2Balance >= 100 && sealedCount >= 5;

  let juryDisputes: typeof myDisputes = [];
  if (juryEligible) {
    juryDisputes = await prisma.dispute.findMany({
      where: { status: 'open', userId: { not: userId } },
      include: {
        receipt: { select: { title: true, receiptNumber: true } },
        job: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  const serialize = (d: typeof myDisputes[0]) => ({
    id: d.id,
    reason: d.reason,
    status: d.status,
    resolution: d.resolution,
    votesFor: d.votesFor,
    votesAgainst: d.votesAgainst,
    createdAt: d.createdAt.toISOString(),
    receiptTitle: d.receipt?.title ?? d.job?.title ?? 'Unknown',
    receiptNumber: d.receipt?.receiptNumber ?? null,
  });

  return (
    <ArbitrationClient
      myDisputes={myDisputes.map(serialize)}
      juryDisputes={juryDisputes.map(serialize)}
      juryEligible={juryEligible}
      userReceipts={userReceipts}
    />
  );
}
