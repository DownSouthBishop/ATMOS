import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import WalletClient from '@/components/WalletClient';

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [user, transactions, earnedAgg, spentAgg, weeklyAgg, earnedCount, spentCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { o2Balance: true } }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: 'earned' },
      _sum: { o2Amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: { in: ['escrow', 'spend'] } },
      _sum: { o2Amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: 'earned', createdAt: { gte: oneWeekAgo } },
      _sum: { o2Amount: true },
    }),
    prisma.transaction.count({ where: { userId: session.user.id, type: 'earned' } }),
    prisma.transaction.count({ where: { userId: session.user.id, type: { in: ['escrow', 'spend'] } } }),
  ]);

  if (!user) redirect('/login');

  const serializedTxs = transactions.map(tx => ({
    ...tx,
    createdAt: tx.createdAt.toISOString(),
  }));

  return (
    <WalletClient
      balance={user.o2Balance}
      transactions={serializedTxs}
      totalEarned={earnedAgg._sum.o2Amount ?? 0}
      earnedJobs={earnedCount}
      totalSpent={spentAgg._sum.o2Amount ?? 0}
      spentJobs={spentCount}
      weeklyEarned={weeklyAgg._sum.o2Amount ?? 0}
    />
  );
}
