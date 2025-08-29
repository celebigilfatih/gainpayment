import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Overview } from '@/components/dashboard/overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';

// Tip tanımlamaları
type UserWithId = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Investment = {
  id: string;
  stockName: string;
  stockSymbol: string;
  quantityLots: number;
  acquisitionCost: number;
  currentValue?: number | null;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
};

type Client = {
  id: string;
  fullName: string;
  phoneNumber?: string | null;
  brokerageFirm?: string | null;
  referralSource?: string | null;
  notes?: string | null;
  cashPosition: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  investments: Investment[];
};

type Transaction = {
  id: string;
  type: string;
  quantityLots: number;
  pricePerLot: number;
  totalAmount: number;
  transactionDate: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
  investmentId: string;
  investment: {
    client: Client;
  };
};


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }
  
  const user = session.user as UserWithId;
  
  // Kullanıcının müşterilerini getir
  const clients = await prisma.client.findMany({
    where: {
      userId: user.id,
    },
    include: {
      investments: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  // Kullanıcının tüm yatırımlarını getir
  const investments = await prisma.investment.findMany({
    where: {
      client: {
        userId: user.id,
      },
    },
    include: {
      client: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  // Kullanıcının tüm işlemlerini getir
  const transactions = await prisma.transaction.findMany({
    where: {
      investment: {
        client: {
          userId: user.id,
        },
      },
    },
    include: {
      investment: {
        include: {
          client: true,
        },
      },
    },
    orderBy: {
      transactionDate: 'desc',
    },
    take: 5
  });
  
  // Toplam değerleri hesapla
  const totalClients = clients.length;
  const totalInvestments = investments.length;
  const totalTransactions = transactions.length;
  
  // Toplam yatırım değeri ve kar/zarar hesaplama
  const totalInvestmentValue = investments.reduce(
    (acc: number, investment) => acc + ((investment.currentValue || 0) * investment.quantityLots),
    0
  );
  
  const totalAcquisitionCost = investments.reduce(
    (acc: number, investment) => acc + (investment.acquisitionCost * investment.quantityLots),
    0
  );
  
  // Kar/zarar hesaplaması - her bir yatırımın kar/zararını ayrı ayrı hesaplayıp topluyoruz
  const totalProfitLoss = investments.reduce(
    (acc: number, investment) => acc + (((investment.currentValue || 0) * investment.quantityLots) - (investment.acquisitionCost * investment.quantityLots)),
    0
  );
  
  // Toplam nakit pozisyonu
  const totalCashPosition = clients.reduce(
    (acc: number, client) => acc + client.cashPosition,
    0
  );
  
  // Hisse bazlı toplam lot hesaplama
  const stockLots = investments.reduce(
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
  
  // Toplam lot sayısı
  const totalLots = investments.reduce(
    (acc: number, investment) => acc + investment.quantityLots,
    0
  );

  // Son eklenen müşteriler
  const recentClients = clients.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pano</h1>
        <Button asChild className="bg-black text-white hover:bg-gray-800">
          <Link href="/clients/new">Yeni Müşteri Ekle</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <div className="col-span-1">
          <Overview
            totalClients={totalClients}
            totalInvestments={totalInvestments}
            totalTransactions={totalTransactions}
            totalInvestmentValue={totalInvestmentValue}
            totalProfitLoss={totalProfitLoss}
            totalLots={totalLots}
          />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <RecentActivity transactions={transactions.map(t => ({
            id: t.id,
            type: t.type as 'BUY' | 'SELL',
            date: t.transactionDate,
            quantity: t.quantityLots,
            price: t.pricePerLot,
            amount: t.totalAmount,
            investment: {
              id: t.investmentId,
              stockName: investments.find(inv => inv.id === t.investmentId)?.stockName || '',
              stockSymbol: investments.find(inv => inv.id === t.investmentId)?.stockSymbol || '',
              client: {
                id: t.investment.client.id,
                fullName: t.investment.client.fullName
              }
            }
          }))} />
        </div>
        
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Son Eklenen Müşteriler</CardTitle>
              <CardDescription>Portföyünüze son eklenen müşteriler</CardDescription>
            </CardHeader>
            <CardContent>
              {recentClients.length > 0 ? (
                <div className="space-y-4">
                  {recentClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium hover:underline"
                        >
                          {client.fullName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {client.brokerageFirm || 'Aracı kurum belirtilmemiş'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(client.cashPosition)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {client.investments.length} yatırım
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  Henüz müşteri bulunmuyor. Başlamak için ilk müşterinizi ekleyin.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Hisse Bazlı Toplam Lot</CardTitle>
              <CardDescription>
                En çok işlem gören hisseler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.values(stockLots).length > 0 ? (
                <div className="space-y-4">
                  {Object.values(stockLots)
                    .sort((a, b) => b.lots - a.lots)
                    .slice(0, 5)
                    .map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between space-x-4"
                      >
                        <div>
                          <div className="font-medium">
                            {stock.symbol}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {stock.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {stock.lots} lot
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  Henüz hisse işlemi bulunmuyor.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}