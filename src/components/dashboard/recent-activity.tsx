import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Transaction = {
  id: string;
  type: 'BUY' | 'SELL';
  date: Date;
  quantity: number;
  price: number;
  amount: number;
  investment: {
    id: string;
    stockName: string;
    stockSymbol: string;
    client: {
      id: string;
      fullName: string;
    };
  };
};

interface RecentActivityProps {
  transactions: Transaction[];
}

export function RecentActivity({ transactions }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Son İşlemler</CardTitle>
        <CardDescription>Son yapılan alım/satım işlemleri</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div className="flex items-center space-x-3">
                  <Badge variant={transaction.type === 'BUY' ? 'default' : 'sell'}>
                    {transaction.type === 'BUY' ? 'ALIM' : 'SATIM'}
                  </Badge>
                  <div>
                    <Link
                      href={`/investments/${transaction.investment.id}`}
                      className="font-medium hover:underline"
                    >
                      {transaction.investment.stockName} ({transaction.investment.stockSymbol})
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      <Link 
                        href={`/clients/${transaction.investment.client.id}`}
                        className="hover:underline"
                      >
                        {transaction.investment.client.fullName}
                      </Link>
                      {' '}- {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(transaction.amount)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {transaction.quantity} lot x {formatCurrency(transaction.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            Henüz işlem bulunmuyor
          </div>
        )}
      </CardContent>
    </Card>
  );
}