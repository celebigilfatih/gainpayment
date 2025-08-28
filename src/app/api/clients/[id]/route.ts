import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        investments: true,
        transactions: {
          orderBy: {
            transactionDate: 'desc',
          },
        },
      },
    });

    if (!client) {
      return new NextResponse('Client not found', { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();

    // Verify client belongs to user
    const existingClient = await prisma.client.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingClient) {
      return new NextResponse('Client not found', { status: 404 });
    }

    const updatedClient = await prisma.client.update({
      where: {
        id: params.id,
      },
      data: {
        fullName: body.fullName,
        phoneNumber: body.phoneNumber,
        brokerageFirm: body.brokerageFirm,
        referralSource: body.referralSource,
        notes: body.notes,
        cashPosition: body.cashPosition,
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify client belongs to user
    const existingClient = await prisma.client.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingClient) {
      return new NextResponse('Client not found', { status: 404 });
    }

    await prisma.client.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting client:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}