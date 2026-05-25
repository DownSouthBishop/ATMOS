import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ReceiptDetailClient from '@/components/ReceiptDetailClient';

export default async function ReceiptDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const receipt = await prisma.receipt.findUnique({
    where: { id: params.id },
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
  });

  if (!receipt) notFound();

  const userId = session.user.id;
  const authorized =
    receipt.ownerId === userId ||
    receipt.partyAId === userId ||
    receipt.partyBId === userId;

  if (!authorized) notFound();

  const serialized = {
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    type: receipt.type,
    title: receipt.title,
    description: receipt.description,
    partyAId: receipt.partyAId,
    partyAName: receipt.partyAName,
    partyBId: receipt.partyBId,
    partyBName: receipt.partyBName,
    settlementCurrency: receipt.settlementCurrency,
    settlementAmount: receipt.settlementAmount,
    paymentMethod: receipt.paymentMethod,
    paymentNotes: receipt.paymentNotes,
    status: receipt.status,
    sigA: receipt.sigA,
    sigAAt: receipt.sigAAt?.toISOString() ?? null,
    sigB: receipt.sigB,
    sigBAt: receipt.sigBAt?.toISOString() ?? null,
    sealedAt: receipt.sealedAt?.toISOString() ?? null,
    shareToken: receipt.shareToken,
    jobId: receipt.jobId,
    ownerId: receipt.ownerId,
    createdAt: receipt.createdAt.toISOString(),
    job: receipt.job,
  };

  return <ReceiptDetailClient receipt={serialized} userId={userId} />;
}
