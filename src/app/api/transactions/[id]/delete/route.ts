import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;
    const formData = await req.formData();
    const clientId = formData.get('clientId') as string;

    if (!clientId) {
      return new NextResponse('Client ID is required', { status: 400 });
    }

    // Verify the transaction exists and belongs to the user
    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
      },
      include: {
        investment: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!transaction) {
      return new NextResponse('Transaction not found', { status: 404 });
    }

    if (transaction.investment.client.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // İşlem tipine göre yatırım miktarını güncelle
    let updatedQuantity = transaction.investment.quantityLots;
    
    if (transaction.type === 'BUY') {
      updatedQuantity -= transaction.quantityLots;
    } else if (transaction.type === 'SELL') {
      updatedQuantity += transaction.quantityLots;
    }
    
    // Önce işlemi sil
    await prisma.transaction.delete({
      where: {
        id,
      },
    });
    
    // Sonra yatırım miktarını güncelle
    await prisma.investment.update({
      where: { id: transaction.investmentId },
      data: { quantityLots: updatedQuantity },
    });

    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/investments/${transaction.investmentId}`);
    revalidatePath('/transactions');

    return NextResponse.redirect(new URL(`/clients/${clientId}`, req.url));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return new NextResponse('Error deleting transaction', { status: 500 });
  }
}