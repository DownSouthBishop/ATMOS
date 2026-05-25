import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const receipt = await prisma.receipt.findUnique({ where: { id: params.id } });
  if (!receipt) {
    return NextResponse.json({ data: null, error: 'Receipt not found' }, { status: 404 });
  }

  const userId = session.user.id;
  const isPartyA = receipt.partyAId === userId;
  const isPartyB = receipt.partyBId === userId || receipt.ownerId === userId;

  if (!isPartyA && !isPartyB) {
    return NextResponse.json({ data: null, error: 'Not authorized to sign this receipt' }, { status: 403 });
  }

  const sigA = receipt.sigA || isPartyA;
  const sigB = receipt.sigB || isPartyB;
  const sealed = sigA && sigB;
  const now = new Date();

  const updated = await prisma.receipt.update({
    where: { id: params.id },
    data: {
      sigA,
      sigB,
      ...(isPartyA && !receipt.sigA ? { sigAAt: now } : {}),
      ...(isPartyB && !receipt.sigB ? { sigBAt: now } : {}),
      status: sealed ? 'sealed' : receipt.status,
      ...(sealed && !receipt.sealedAt ? { sealedAt: now } : {}),
    },
  });

  return NextResponse.json({ data: updated, error: null });
}
