import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json() as { name?: unknown };
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ data: null, error: 'Name is required' }, { status: 400 });
    }

    const receipt = await prisma.receipt.findUnique({
      where: { shareToken: params.token },
    });

    if (!receipt) {
      return NextResponse.json({ data: null, error: 'Receipt not found' }, { status: 404 });
    }

    if (receipt.sigB) {
      return NextResponse.json({ data: null, error: 'Already signed' }, { status: 400 });
    }

    const now = new Date();
    const willSeal = receipt.sigA;

    const updated = await prisma.receipt.update({
      where: { shareToken: params.token },
      data: {
        sigB: true,
        sigBAt: now,
        partyBName: name,
        status: willSeal ? 'sealed' : 'pending',
        ...(willSeal ? { sealedAt: now } : {}),
      },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        sealedAt: updated.sealedAt?.toISOString() ?? null,
      },
      error: null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 });
  }
}
