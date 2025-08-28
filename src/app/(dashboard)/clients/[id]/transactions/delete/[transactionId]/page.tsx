import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DeleteTransactionPageProps {
  params: {
    id: string;
    transactionId: string;
  };
}

export default async function DeleteTransactionPage({ params }: DeleteTransactionPageProps) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">İşlem Sil</h1>
        <p className="text-muted-foreground">
          Bu işlemi silmek istediğinizden emin misiniz?
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İşlem Bilgileri</CardTitle>
          <CardDescription>
            Bu işlemi silmek geri alınamaz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hisse Senedi</p>
              <p>{transaction.investment.stockName} ({transaction.investment.stockSymbol})</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">İşlem Tarihi</p>
              <p>{formatDate(transaction.transactionDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">İşlem Tipi</p>
              <p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${transaction.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {transaction.type === 'BUY' ? 'ALIŞ' : 'SATIŞ'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Miktar (Lot)</p>
              <p>{transaction.quantityLots}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lot Başına Fiyat</p>
              <p>{formatCurrency(transaction.pricePerLot)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toplam Tutar</p>
              <p>{formatCurrency(transaction.totalAmount)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/clients/${clientId}`}>
            <Button variant="outline">İptal</Button>
          </Link>
          <form action={`/api/transactions/${transactionId}/delete`} method="post">
            <input type="hidden" name="clientId" value={clientId} />
            <Button type="submit" variant="destructive">İşlemi Sil</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}