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
    const investment = await prisma.investment.findUnique({
      where: {
        id: params.id,
      },
      include: {
        client: true,
        transactions: {
          orderBy: {
            transactionDate: 'desc',
          },
        },
      },
    });

    if (!investment) {
      return NextResponse.json({ message: 'Investment not found' }, { status: 404 });
    }

    // Check if the investment belongs to a client owned by the current user
    if (investment.client.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(investment);
  } catch (error) {
    console.error('Error fetching investment:', error);
    return NextResponse.json(
      { message: 'Error fetching investment' },
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
    // First check if the investment exists and belongs to the user
    const existingInvestment = await prisma.investment.findUnique({
      where: {
        id: params.id,
      },
      include: {
        client: true,
      },
    });

    if (!existingInvestment) {
      return NextResponse.json({ message: 'Investment not found' }, { status: 404 });
    }

    if (existingInvestment.client.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { stockName, stockSymbol, quantityLots, acquisitionCost, currentValue, notes } = data;

    const updatedInvestment = await prisma.investment.update({
      where: {
        id: params.id,
      },
      data: {
        stockName,
        stockSymbol,
        quantityLots,
        acquisitionCost,
        currentValue,
        notes,
      },
    });

    return NextResponse.json(updatedInvestment);
  } catch (error) {
    console.error('Error updating investment:', error);
    return NextResponse.json(
      { message: 'Error updating investment' },
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
    // First check if the investment exists and belongs to the user
    const existingInvestment = await prisma.investment.findUnique({
      where: {
        id: params.id,
      },
      include: {
        client: true,
      },
    });

    if (!existingInvestment) {
      return NextResponse.json({ message: 'Investment not found' }, { status: 404 });
    }

    if (existingInvestment.client.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Delete the investment
    await prisma.investment.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('Error deleting investment:', error);
    return NextResponse.json(
      { message: 'Error deleting investment' },
      { status: 500 }
    );
  }
}