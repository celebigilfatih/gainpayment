import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Pencil, Trash2 } from 'lucide-react';

interface ClientPageProps {
  params: {
    id: string;
  };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
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
        take: 5,
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Tip tanımlaması ile reduce fonksiyonunu düzeltme
  const totalInvestmentValue = client.investments.reduce(
    (acc: number, investment: { currentValue: number | null, quantityLots: number }) => {
      const value = investment.currentValue || 0;
      return acc + (value * investment.quantityLots);
    },
    0
  );

  // Toplam lot sayısını hesaplama
  const totalLots = client.investments.reduce(
    (acc: number, investment: { quantityLots: number }) => acc + investment.quantityLots,
    0
  );
  
  // Hisse senedi bazlı lot sayılarını hesaplama
  const stockLots = client.investments.reduce(
    (acc: Record<string, { symbol: string, name: string, lots: number }>, investment) => {
      const key = investment.stockSymbol;
      if (!acc[key]) {
        acc[key] = {
          symbol: investment.stockSymbol,
          name: investment.stockName,
          lots: 0
        };
      }
      acc[key].lots += investment.quantityLots;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{client.fullName}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${client.id}/edit`}>Müşteriyi Düzenle</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/clients">Müşterilere Dön</Link>
          </Button>
        </div>
      </div>

      {/* İlk satır - Müşteri Bilgileri, Toplam Lot Sayısı, Finansal Özet */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Müşteri Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefon Numarası</p>
                <p>{client.phoneNumber || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aracı Kurum</p>
                <p>{client.brokerageFirm || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Referans Kaynağı</p>
                <p>{client.referralSource || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Müşteri Olma Tarihi</p>
                <p>{formatDate(client.createdAt)}</p>
              </div>
            </div>
            {client.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notlar</p>
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Toplam Lot Sayısı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toplam Lot</p>
              <p className="text-2xl font-bold">{totalLots}</p>
            </div>
            
            {/* Hisse senedi bazlı toplam lot sayıları */}
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">Hisse Senedi Bazlı</h3>
              <div className="space-y-2">
                {Object.values(stockLots).map((stock) => (
                  <div key={stock.symbol} className="flex justify-between items-center">
                    <div className="font-medium">{stock.name} ({stock.symbol})</div>
                    <div className="text-lg font-semibold">{stock.lots} Lot</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Finansal Özet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nakit Pozisyonu</p>
                <p className="text-2xl font-bold">{formatCurrency(client.cashPosition)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yatırım Değeri</p>
                <p className="text-2xl font-bold">{formatCurrency(totalInvestmentValue)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Portföy</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(client.cashPosition + totalInvestmentValue)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yatırım Sayısı</p>
                <p className="text-2xl font-bold">{client.investments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Yatırımlar</h2>
          <Button asChild>
            <Link href={`/clients/${client.id}/investments/new`}>Yatırım Ekle</Link>
          </Button>
        </div>

        {client.investments.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Yatırım bulunamadı. Başlamak için ilk yatırımınızı ekleyin.
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
                      Hisse Senedi
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Sembol
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Miktar (Lot)
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Alış Maliyeti
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Güncel Değer
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {client.investments.map((investment: { id: string; stockName: string; stockSymbol: string; quantityLots: number; acquisitionCost: number; currentValue: number | null }) => (
                    <tr
                      key={investment.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">{investment.stockName}</td>
                      <td className="p-4 align-middle">{investment.stockSymbol}</td>
                      <td className="p-4 align-middle">{investment.quantityLots}</td>
                      <td className="p-4 align-middle">
                        {formatCurrency(investment.acquisitionCost)}
                      </td>
                      <td className="p-4 align-middle">
                        {investment.currentValue
                          ? formatCurrency(investment.currentValue)
                          : 'Güncellenmemiş'}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/investments/${investment.id}`}>Görüntüle</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/investments/${investment.id}/edit`}>Düzenle</Link>
                          </Button>
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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Son İşlemler</h2>
          <Button asChild>
            <Link href={`/clients/${client.id}/transactions/new`}>İşlem Ekle</Link>
          </Button>
        </div>

        {client.transactions.length === 0 ? (
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
                      Hisse Senedi
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
                  {client.transactions.map((transaction: { id: string; transactionDate: Date | string; type: string; investmentId: string; quantityLots: number; pricePerLot: number; totalAmount: number }) => (
                    <tr
                      key={transaction.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">
                        {formatDate(new Date(transaction.transactionDate))}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={transaction.type === 'BUY' ? 'default' : 'sell'}>
                          {transaction.type === 'BUY' ? 'ALIŞ' : 'SATIŞ'}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        {client.investments.find(
                          (inv: { id: string; stockName: string }) => inv.id === transaction.investmentId
                        )?.stockName || 'Bilinmiyor'}
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
                            href={`/clients/${client.id}/transactions/edit/${transaction.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-transparent p-0 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Düzenle</span>
                          </Link>
                          <Link 
                            href={`/clients/${client.id}/transactions/delete/${transaction.id}`}
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
            {client.transactions.length > 5 && (
              <div className="p-4 text-center">
                <Button variant="outline" asChild>
                  <Link href={`/clients/${client.id}/transactions`}>Tüm İşlemleri Görüntüle</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}