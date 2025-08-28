import { getServerSession } from 'next-auth/next';
import { notFound, redirect } from 'next/navigation';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { TransactionForm } from '@/components/forms/transaction-form';

interface EditTransactionPageProps {
  params: {
    id: string;
    transactionId: string;
  };
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const { id: clientId, transactionId } = params;

  // Verify client exists and belongs to the current user
  const client = await prisma.client.findUnique({
    where: {
      id: clientId,
      userId: session.user.id,
    },
  });

  if (!client) {
    notFound();
  }

  // Fetch the transaction with its investment
  const transaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId,
    },
    include: {
      investment: true,
    },
  });

  if (!transaction || transaction.clientId !== clientId) {
    notFound();
  }

  // Fetch investments for the client
  const investments = await prisma.investment.findMany({
    where: {
      clientId,
    },
    select: {
      id: true,
      stockName: true,
      stockSymbol: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">İşlem Düzenle</h1>
        <p className="text-muted-foreground">
          İşlem bilgilerini düzenleyin.
        </p>
      </div>

      <TransactionForm
        clientId={clientId}
        investments={investments}
        transaction={{
          id: transaction.id,
          investmentId: transaction.investmentId,
          type: transaction.type,
          transactionDate: transaction.transactionDate,
          quantityLots: transaction.quantityLots,
          pricePerLot: transaction.pricePerLot,
          totalAmount: transaction.totalAmount,
          notes: transaction.notes || '',
        }}
      />
    </div>
  );
}