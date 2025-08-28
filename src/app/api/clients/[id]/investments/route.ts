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
    // First check if the client exists and belongs to the user
    const client = await prisma.client.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    // Get all investments for this client
    const investments = await prisma.investment.findMany({
      where: {
        clientId: params.id,
      },
      orderBy: {
        stockName: 'asc',
      },
    });

    return NextResponse.json(investments);
  } catch (error) {
    console.error('Error fetching client investments:', error);
    return NextResponse.json(
      { message: 'Error fetching client investments' },
      { status: 500 }
    );
  }
}