import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
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
        status: true,
        sigA: true,
        sigAAt: true,
        sigB: true,
        sigBAt: true,
        sealedAt: true,
        createdAt: true,
      },
    });

    if (!receipt) {
      return NextResponse.json({ data: null, error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...receipt,
        sigAAt: receipt.sigAAt?.toISOString() ?? null,
        sigBAt: receipt.sigBAt?.toISOString() ?? null,
        sealedAt: receipt.sealedAt?.toISOString() ?? null,
        createdAt: receipt.createdAt.toISOString(),
      },
      error: null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 });
  }
}
