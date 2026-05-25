import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function generateReceiptNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ATMOS-${date}-${suffix}`;
}

function generateShareToken(): string {
  return [0, 0, 0].map(() => Math.random().toString(36).slice(2, 8)).join('');
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    const body = await req.json() as {
      type: string;
      title: string;
      description?: string;
      partyBName: string;
      partyBEmail?: string;
      settlementCurrency: string;
      settlementAmount?: string;
      paymentMethod?: string;
      paymentNotes?: string;
    };

    if (!body.type || !body.title?.trim() || !body.partyBName?.trim()) {
      return NextResponse.json({ data: null, error: 'Missing required fields' }, { status: 400 });
    }

    let partyBId: string | undefined;
    if (body.partyBEmail?.trim()) {
      const partyB = await prisma.user.findUnique({
        where: { email: body.partyBEmail.trim().toLowerCase() },
        select: { id: true },
      });
      partyBId = partyB?.id;
    }

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber: generateReceiptNumber(),
        shareToken: generateShareToken(),
        type: body.type,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        partyAId: session.user.id,
        partyAName: user?.name || user?.email || session.user.email || 'Party A',
        partyBId: partyBId ?? null,
        partyBName: body.partyBName.trim(),
        settlementCurrency: body.settlementCurrency,
        settlementAmount: body.settlementAmount?.trim() || null,
        paymentMethod: body.paymentMethod || null,
        paymentNotes: body.paymentNotes?.trim() || null,
        status: 'pending',
        sigA: true,
        sigAAt: new Date(),
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({
      data: {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        shareToken: receipt.shareToken,
      },
      error: null,
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 });
  }
}
