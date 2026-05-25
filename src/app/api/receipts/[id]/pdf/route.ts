import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { ReceiptPDFDocument } from '@/lib/pdf/receipt-pdf';
import React from 'react';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const receipt = await prisma.receipt.findUnique({ where: { id: params.id } });
    if (!receipt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const authorized =
      receipt.ownerId === session.user.id ||
      receipt.partyAId === session.user.id ||
      receipt.partyBId === session.user.id;
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = {
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
      shareToken: receipt.shareToken,
    };

    const element = React.createElement(
      ReceiptPDFDocument,
      { receipt: data }
    ) as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);

    const filename = `${receipt.receiptNumber}.pdf`;
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
