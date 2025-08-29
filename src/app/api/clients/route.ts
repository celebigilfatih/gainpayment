import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const clients = await prisma.client.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();

    // Ensure brokerageFirms is properly formatted
    let brokerageFirmsValue = '[]';
    if (body.brokerageFirms) {
      if (Array.isArray(body.brokerageFirms)) {
        brokerageFirmsValue = JSON.stringify(body.brokerageFirms);
      } else if (typeof body.brokerageFirms === 'string') {
        // If it's already a string, check if it's a valid JSON string
        try {
          JSON.parse(body.brokerageFirms);
          brokerageFirmsValue = body.brokerageFirms;
        } catch {
          // If not a valid JSON string, assume it's a single value and wrap it
          brokerageFirmsValue = '[]';
        }
      }
    }

    const client = await prisma.client.create({
      data: {
        fullName: body.fullName,
        phoneNumber: body.phoneNumber,
        city: body.city,
        brokerageFirms: brokerageFirmsValue,
        referralSource: body.referralSource,
        notes: body.notes,
        cashPosition: body.cashPosition || 0,
        userId: session.user.id,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    // Daha detaylı hata mesajı
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(errorMessage, { status: 500 });
  }
}