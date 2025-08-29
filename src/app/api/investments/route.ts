import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const investments = await prisma.investment.findMany({
      where: {
        client: {
          userId: session.user.id,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        stockName: 'asc',
      },
    });

    return NextResponse.json(investments);
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json(
      { message: 'Error fetching investments' },
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
    const { clientId, stockName, stockSymbol, brokerageFirm, acquisitionDate, quantityLots, acquisitionCost, currentValue } = data;

    console.log('API received data:', data);

    // Validate required fields
    if (!clientId || !stockName || !brokerageFirm || !acquisitionDate || quantityLots === undefined || acquisitionCost === undefined) {
      console.log('Missing required fields:', { clientId, stockName, brokerageFirm, acquisitionDate, quantityLots, acquisitionCost });
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify client belongs to the current user
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      console.log('Client not found or unauthorized:', clientId);
      return NextResponse.json(
        { message: 'Client not found or unauthorized' },
        { status: 404 }
      );
    }

    // Ensure numeric values are properly formatted
    const investmentData = {
      clientId,
      stockName,
      brokerageFirm,
      acquisitionDate: new Date(acquisitionDate),
      quantityLots: parseFloat(quantityLots.toString()),
      acquisitionCost: parseFloat(acquisitionCost.toString()),
      currentValue: currentValue !== undefined ? parseFloat(currentValue.toString()) : undefined,
    };

    console.log('Creating investment with data:', investmentData);

    const investment = await prisma.investment.create({
      data: investmentData,
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error('Error creating investment:', error);
    return NextResponse.json(
      { message: `Error creating investment: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}