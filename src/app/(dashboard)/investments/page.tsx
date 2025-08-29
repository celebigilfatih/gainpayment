import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function InvestmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const investments = await prisma.investment.findMany({
    where: {
      client: {
        userId: session.user.id,
      },
    },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [
      {
        client: {
          fullName: 'asc',
        },
      },
      {
        stockName: 'asc',
      },
    ],
  });

  const totalInvestmentValue = investments.reduce(
    (acc, investment) => acc + ((investment.currentValue || investment.acquisitionCost) * investment.quantityLots),
    0
  );

  const totalAcquisitionCost = investments.reduce(
    (acc, investment) => acc + investment.acquisitionCost,
    0
  );

  const totalProfitLoss = investments.reduce(
    (acc, investment) => acc + (((investment.currentValue || 0) * investment.quantityLots) - (investment.acquisitionCost * investment.quantityLots)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yatırımlar</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Yatırım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Değer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestmentValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kar/Zarar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfitLoss)}
            </div>
          </CardContent>
        </Card>
      </div>

      {investments.length === 0 ? (
        <Card className="text-center">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium">Yatırım bulunamadı</h3>
            <p className="mt-2 text-muted-foreground">
              Henüz hiç yatırım eklemediniz. İlk yatırımınızı bir müşteri profili üzerinden ekleyin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {investments.map((investment) => {
            const currentValue = investment.currentValue || investment.acquisitionCost;
            const profitLoss = (currentValue * investment.quantityLots) - (investment.acquisitionCost * investment.quantityLots);
            const profitLossPercentage = (profitLoss / (investment.acquisitionCost * investment.quantityLots)) * 100;
            const isProfitable = profitLoss >= 0;
            
            return (
              <Card key={investment.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{investment.stockName}</CardTitle>
                      <CardDescription>{investment.stockSymbol}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{investment.quantityLots} Lot</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Müşteri:</span>
                      <Link 
                        href={`/clients/${investment.client.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {investment.client.fullName}
                      </Link>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Alış Maliyeti:</span>
                      <span className="text-sm font-medium">{formatCurrency(investment.acquisitionCost)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Güncel Değer:</span>
                      <span className="text-sm font-medium">
                        {investment.currentValue
                          ? formatCurrency(investment.currentValue)
                          : 'Güncellenmemiş'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Kar/Zarar:</span>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(profitLoss)}
                        </span>
                        <div className={`text-xs ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                          {profitLossPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/investments/${investment.id}`}>Görüntüle</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/investments/${investment.id}/edit`}>Düzenle</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}