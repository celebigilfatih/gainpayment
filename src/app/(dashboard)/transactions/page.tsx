import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

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
        <h1 className="text-3xl font-bold">Transactions</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Total Transactions</h3>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Total Buy Amount</h3>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalBuyAmount)}</div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Total Sell Amount</h3>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSellAmount)}</div>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
          <h3 className="text-lg font-medium">No transactions found</h3>
          <p className="mt-2 text-muted-foreground">
            You haven't recorded any transactions yet. Add your first transaction through a client's investment.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Stock
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Quantity (Lots)
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Price Per Lot
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Total Amount
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="p-4 align-middle">
                      <Link 
                        href={`/clients/${transaction.investment.client.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {transaction.investment.client.fullName}
                      </Link>
                    </td>
                    <td className="p-4 align-middle">
                      <Link 
                        href={`/investments/${transaction.investment.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {transaction.investment.stockName} ({transaction.investment.stockSymbol})
                      </Link>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={transaction.type === 'BUY' ? 'default' : 'sell'}>
                        {transaction.type}
                      </Badge>
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
                          href={`/clients/${transaction.investment.client.id}/transactions/edit/${transaction.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-transparent p-0 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                        <Link 
                          href={`/clients/${transaction.investment.client.id}/transactions/delete/${transaction.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-transparent p-0 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
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
  );
}