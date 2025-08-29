import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
      include: {
        investments: true,
      },
    });

    if (!existingClient) {
      return new NextResponse('Client not found', { status: 404 });
    }

    // Delete client and all related data (cascade delete will handle investments and transactions)
    await prisma.client.delete({
      where: {
        id: params.id,
      },
    });

    // Revalidate paths
    revalidatePath('/clients');
    revalidatePath('/dashboard');

    // Return success response instead of redirect
    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}