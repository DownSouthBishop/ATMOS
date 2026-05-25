import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ReceiptsClient from '@/components/ReceiptsClient';

export default async function ReceiptsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const receipts = await prisma.receipt.findMany({
    where: { ownerId: session.user.id },
    include: {
      job: {
        select: {
          tokensIn: true,
          tokensOut: true,
          computeCostUsd: true,
          platformFeeUsd: true,
          o2Cost: true,
          o2Refund: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalSealed = receipts.filter(r => r.sigA && r.sigB).length;
  const totalUsdValue = receipts
    .filter(r => r.settlementCurrency === 'USD' && r.settlementAmount)
    .reduce((sum, r) => {
      const v = parseFloat((r.settlementAmount ?? '').replace(/[$,]/g, ''));
      return sum + (isNaN(v) ? 0 : v);
    }, 0);

  const serialized = receipts.map(r => ({
    id: r.id,
    receiptNumber: r.receiptNumber,
    type: r.type,
    title: r.title,
    description: r.description,
    partyAId: r.partyAId,
    partyAName: r.partyAName,
    partyBId: r.partyBId,
    partyBName: r.partyBName,
    settlementCurrency: r.settlementCurrency,
    settlementAmount: r.settlementAmount,
    status: r.status,
    sigA: r.sigA,
    sigB: r.sigB,
    createdAt: r.createdAt.toISOString(),
    jobId: r.jobId,
    ownerId: r.ownerId,
    job: r.job,
  }));

  return (
    <ReceiptsClient
      receipts={serialized}
      totalSealed={totalSealed}
      totalUsdValue={Math.round(totalUsdValue)}
    />
  );
}
