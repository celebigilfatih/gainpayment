import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';

interface InvestmentPageProps {
  params: {
    id: string;
  };
}

export default async function InvestmentPage({ params }: InvestmentPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const investment = await prisma.investment.findUnique({
    where: {
      id: params.id,
    },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          userId: true,
        },
      },
      transactions: {
        orderBy: {
          transactionDate: 'desc',
        },
      },
    },
  });

  if (!investment || investment.client.userId !== session.user.id) {
    notFound();
  }

  // Kar/zarar hesaplama
  const profitLoss = investment.currentValue
    ? (investment.currentValue * investment.quantityLots) - (investment.acquisitionCost * investment.quantityLots)
    : 0;
  const profitLossPercentage = investment.currentValue
    ? (((investment.currentValue * investment.quantityLots) - (investment.acquisitionCost * investment.quantityLots)) / (investment.acquisitionCost * investment.quantityLots)) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {investment.stockName} ({investment.stockSymbol})
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/investments/${investment.id}/edit`}>Yatırımı Düzenle</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${investment.client.id}`}>Müşteriye Dön</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yatırım Detayları</CardTitle>
            <CardDescription>Müşteri: {investment.client.fullName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hisse Senedi Adı</p>
                <p>{investment.stockName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hisse Senedi Sembolü</p>
                <p>{investment.stockSymbol}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Miktar (Lot)</p>
                <p>{investment.quantityLots}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Oluşturulma Tarihi</p>
                <p>{formatDate(investment.createdAt)}</p>
              </div>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Finansal Özet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alış Maliyeti</p>
                <p className="text-2xl font-bold">{formatCurrency(investment.acquisitionCost)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Güncel Değer</p>
                <p className="text-2xl font-bold">
                  {investment.currentValue
                    ? formatCurrency(investment.currentValue)
                    : 'Güncellenmemiş'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kar/Zarar</p>
                <p
                  className={`text-2xl font-bold ${profitLoss > 0 ? 'text-green-600' : profitLoss < 0 ? 'text-red-600' : ''}`}
                >
                  {investment.currentValue
                    ? `${formatCurrency(profitLoss)} (${profitLossPercentage.toFixed(2)}%)`
                    : 'Hesaplanamıyor'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">İşlem Sayısı</p>
                <p className="text-2xl font-bold">{investment.transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">İşlemler</h2>
          <Button asChild>
            <Link href={`/clients/${investment.client.id}/transactions/new?investmentId=${investment.id}`}>
              İşlem Ekle
            </Link>
          </Button>
        </div>

        {investment.transactions.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                İşlem bulunamadı. Başlamak için ilk işleminizi ekleyin.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Tarih
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Tür
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Miktar (Lot)
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Lot Başına Fiyat
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Toplam Tutar
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {investment.transactions.map((transaction: { id: string; transactionDate: Date | string; type: string; quantityLots: number; pricePerLot: number; totalAmount: number }) => (
                    <tr
                      key={transaction.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">
                        {formatDate(new Date(transaction.transactionDate))}
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${transaction.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {transaction.type === 'BUY' ? 'ALIŞ' : 'SATIŞ'}
                        </span>
                      </td>
                      <td className="p-4 align-middle">{transaction.quantityLots}</td>
                      <td className="p-4 align-middle">
                        {formatCurrency(transaction.pricePerLot)}
                      </td>
                      <td className="p-4 align-middle">
                        {formatCurrency(transaction.totalAmount)}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex space-x-2">
                          <Link 
                            href={`/clients/${investment.client.id}/transactions/edit/${transaction.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-transparent p-0 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Düzenle</span>
                          </Link>
                          <Link 
                            href={`/clients/${investment.client.id}/transactions/delete/${transaction.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-transparent p-0 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Sil</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}