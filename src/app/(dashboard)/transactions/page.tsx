import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

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
          stockSymbol: true,
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

  const totalBuyAmount = transactions
    .filter((t) => t.type === 'BUY')
    .reduce((acc, t) => acc + t.totalAmount, 0);

  const totalSellAmount = transactions
    .filter((t) => t.type === 'SELL')
    .reduce((acc, t) => acc + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">İşlemler</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-medium text-muted-foreground">Toplam İşlem</h3>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-medium text-muted-foreground">Toplam Alış Tutarı</h3>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalBuyAmount)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-medium text-muted-foreground">Toplam Satış Tutarı</h3>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSellAmount)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {transactions.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium">İşlem bulunamadı</h3>
            <p className="mt-2 text-muted-foreground">
              Henüz hiç işlem kaydetmediniz. İlk işleminizi bir müşterinin yatırımı üzerinden ekleyin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      <Link 
                        href={`/investments/${transaction.investment.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {transaction.investment.stockName} ({transaction.investment.stockSymbol})
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      <Link 
                        href={`/clients/${transaction.investment.client.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {transaction.investment.client.fullName}
                      </Link>
                    </CardDescription>
                  </div>
                  <Badge variant={transaction.type === 'BUY' ? 'default' : 'sell'} className="ml-2">
                    {transaction.type === 'BUY' ? 'ALIŞ' : 'SATIŞ'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tarih</p>
                    <p>{formatDate(transaction.transactionDate)}</p>
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
                    <p className="font-medium">{formatCurrency(transaction.totalAmount)}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <Link 
                    href={`/clients/${transaction.investment.client.id}/transactions/edit/${transaction.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-gray-200 bg-transparent px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Düzenle
                  </Link>
                  <Link 
                    href={`/clients/${transaction.investment.client.id}/transactions/delete/${transaction.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-gray-200 bg-transparent px-3 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Sil
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}