import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Toplam Yatırım</h3>
            <div className="text-2xl font-bold">{investments.length}</div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Toplam Değer</h3>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestmentValue)}</div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Toplam Kar/Zarar</h3>
            <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfitLoss)}
            </div>
          </div>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
          <h3 className="text-lg font-medium">Yatırım bulunamadı</h3>
          <p className="mt-2 text-muted-foreground">
            Henüz hiç yatırım eklemediniz. İlk yatırımınızı bir müşteri profili üzerinden ekleyin.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Müşteri
                  </th>
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
                    Kar/Zarar
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {investments.map((investment) => {
                  const currentValue = investment.currentValue || investment.acquisitionCost;
                  const profitLoss = (currentValue * investment.quantityLots) - (investment.acquisitionCost * investment.quantityLots);
                  const profitLossPercentage = (profitLoss / (investment.acquisitionCost * investment.quantityLots)) * 100;
                  
                  return (
                    <tr
                      key={investment.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">
                        <Link 
                          href={`/clients/${investment.client.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {investment.client.fullName}
                        </Link>
                      </td>
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
                        <div className="flex flex-col">
                          <span className={`${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profitLoss)}
                          </span>
                          <span className={`text-xs ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profitLossPercentage.toFixed(2)}%
                          </span>
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}