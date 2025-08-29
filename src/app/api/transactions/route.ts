import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        investment: {
          client: {
            userId: session.user.id,
          },
        },
      },
      include: {
        investment: {
          select: {
            id: true,
            stockName: true,
            brokerageFirm: true,
            acquisitionDate: true,
            client: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        transactionDate: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { message: 'Error fetching transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { investmentId, type, transactionDate, quantityLots, pricePerLot, totalAmount, notes, clientId } = data;

    // Validate required fields
    if (!investmentId || !type || !transactionDate || !quantityLots || pricePerLot === undefined || totalAmount === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify investment belongs to a client owned by the current user
    const investment = await prisma.investment.findUnique({
      where: {
        id: investmentId,
      },
      include: {
        client: true,
      },
    });

    if (!investment) {
      return NextResponse.json(
        { message: 'Investment not found' },
        { status: 404 }
      );
    }

    if (investment.client.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // İşlem tipine göre yatırım miktarını güncelle
    let updatedQuantity = investment.quantityLots;
    
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
    
    // Önce işlemi oluştur
    const transaction = await prisma.transaction.create({
      data: {
        investmentId,
        type,
        transactionDate: new Date(transactionDate),
        quantityLots,
        pricePerLot,
        totalAmount,
        notes,
        clientId: investment.clientId, // Yatırımın bağlı olduğu müşteri ID'sini kullan
      },
    });
    
    // Sonra yatırım miktarını güncelle
    await prisma.investment.update({
      where: { id: investmentId },
      data: { quantityLots: updatedQuantity },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { message: 'Error creating transaction' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, investmentId, type, transactionDate, quantityLots, pricePerLot, totalAmount, notes } = data;

    // Validate required fields
    if (!id || !investmentId || !type || !transactionDate || !quantityLots || pricePerLot === undefined || totalAmount === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify transaction exists and belongs to the current user
    const existingTransaction = await prisma.transaction.findUnique({
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

    if (!existingTransaction) {
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (existingTransaction.investment.client.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Eski işlem bilgilerini kullanarak yatırım miktarını geri al
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
    });
    
    if (!investment) {
      return NextResponse.json(
        { message: 'Investment not found' },
        { status: 404 }
      );
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
        id,
      },
      data: {
        type,
        transactionDate: new Date(transactionDate),
        quantityLots,
        pricePerLot,
        totalAmount,
        notes,
      },
    });
    
    // Sonra yatırım miktarını güncelle
    await prisma.investment.update({
      where: { id: investmentId },
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

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // İşlemi bul ve yatırım bilgilerini al
    const existingTransaction = await prisma.transaction.findUnique({
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

    if (!existingTransaction) {
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (existingTransaction.investment.client.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
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
        id,
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