import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: params.id,
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
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Check if the transaction belongs to a client owned by the current user
    if (transaction.investment.client.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { message: 'Error fetching transaction' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First check if the transaction exists and belongs to the user
    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id: params.id,
      },
      include: {
        investment: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    if (existingTransaction.investment.client.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { type, transactionDate, quantityLots, pricePerLot, totalAmount, notes } = data;
    
    // Yatırım bilgilerini al
    const investment = await prisma.investment.findUnique({
      where: { id: existingTransaction.investmentId },
    });
    
    if (!investment) {
      return NextResponse.json({ message: 'Investment not found' }, { status: 404 });
    }
    
    // Eski işlem etkisini geri al
    let updatedQuantity = investment.quantityLots;
    if (existingTransaction.type === 'BUY') {
      updatedQuantity -= existingTransaction.quantityLots;
    } else if (existingTransaction.type === 'SELL') {
      updatedQuantity += existingTransaction.quantityLots;
    }
    
    // Yeni işlem etkisini uygula
    if (type === 'BUY') {
      updatedQuantity += parseFloat(quantityLots.toString());
    } else if (type === 'SELL') {
      updatedQuantity -= parseFloat(quantityLots.toString());
      
      // Satış miktarı mevcut yatırım miktarından fazla olamaz
      if (updatedQuantity < 0) {
        return NextResponse.json(
          { message: 'Satış miktarı mevcut yatırım miktarından fazla olamaz' },
          { status: 400 }
        );
      }
    }
    
    // Önce işlemi güncelle
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: params.id,
      },
      data: {
        type,
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        quantityLots,
        pricePerLot,
        totalAmount,
        notes,
      },
    });
    
    // Sonra yatırım miktarını güncelle
    await prisma.investment.update({
      where: { id: existingTransaction.investmentId },
      data: { quantityLots: updatedQuantity },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { message: 'Error updating transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First check if the transaction exists and belongs to the user
    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id: params.id,
      },
      include: {
        investment: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    if (existingTransaction.investment.client.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // İşlem tipine göre yatırım miktarını güncelle
    let updatedQuantity = existingTransaction.investment.quantityLots;
    
    if (existingTransaction.type === 'BUY') {
      updatedQuantity -= existingTransaction.quantityLots;
    } else if (existingTransaction.type === 'SELL') {
      updatedQuantity += existingTransaction.quantityLots;
    }
    
    // Önce işlemi sil
    await prisma.transaction.delete({
      where: {
        id: params.id,
      },
    });
    
    // Sonra yatırım miktarını güncelle
    await prisma.investment.update({
      where: { id: existingTransaction.investmentId },
      data: { quantityLots: updatedQuantity },
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { message: 'Error deleting transaction' },
      { status: 500 }
    );
  }
}