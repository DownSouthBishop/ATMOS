import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PublicReceiptView from '@/components/PublicReceiptView';

export default async function PublicReceiptPage({ params }: { params: { token: string } }) {
  const receipt = await prisma.receipt.findUnique({
    where: { shareToken: params.token },
    select: {
      id: true,
      receiptNumber: true,
      type: true,
      title: true,
      description: true,
      partyAName: true,
      partyBName: true,
      settlementCurrency: true,
      settlementAmount: true,
      paymentMethod: true,
      paymentNotes: true,
      status: true,
      sigA: true,
      sigAAt: true,
      sigB: true,
      sigBAt: true,
      sealedAt: true,
      createdAt: true,
    },
  });

  if (!receipt) notFound();

  const serialized = {
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    type: receipt.type,
    title: receipt.title,
    description: receipt.description,
    partyAName: receipt.partyAName,
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
    createdAt: receipt.createdAt.toISOString(),
  };

  return <PublicReceiptView receipt={serialized} token={params.token} />;
}
