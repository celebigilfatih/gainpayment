import { getServerSession } from 'next-auth/next';
import Link from 'next/link';

import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const clients = await prisma.client.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      investments: true,
    },
    orderBy: {
      fullName: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Müşteriler</h1>
        <Button asChild className="bg-black text-white hover:bg-gray-800">
          <Link href="/clients/new">Yeni Müşteri Ekle</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Müşteri Listesi</CardTitle>
          <CardDescription>Portföyünüzdeki tüm müşteriler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  İsim
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Telefon
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Şehir
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Aracı Kurum
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Yatırımlar
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Lot
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    Müşteri bulunamadı. Başlamak için ilk müşterinizi ekleyin.
                  </td>
                </tr>
              ) : (
                clients.map((client: { 
                  id: string; 
                  fullName: string; 
                  phoneNumber: string | null; 
                  city: string | null; 
                  brokerageFirm: string | null; 
                  cashPosition: number; 
                  investments: { 
                    id: string; 
                    createdAt: Date; 
                    updatedAt: Date; 
                    stockName: string; 
                    stockSymbol: string; 
                    quantityLots: number; 
                    acquisitionCost: number; 
                    currentValue: number | null; 
                    clientId: string; 
                  }[] 
                }) => (
                  <tr
                    key={client.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.fullName}
                      </Link>
                    </td>
                    <td className="p-4 align-middle">{client.phoneNumber || '-'}</td>
                    <td className="p-4 align-middle">{client.city || '-'}</td>
                    <td className="p-4 align-middle">
                      {(() => {
                        try {
                          // Eğer brokerageFirms varsa onu kullan, yoksa brokerageFirm'i dene
                          const brokerageData = client.brokerageFirms || client.brokerageFirm;
                          const brokerageFirms = brokerageData ? JSON.parse(brokerageData.toString() || '[]') : [];
                          return Array.isArray(brokerageFirms) && brokerageFirms.length > 0 
                            ? brokerageFirms.join(', ')
                            : brokerageData || '-';
                        } catch (e) {
                          return client.brokerageFirm || '-';
                        }
                      })()}
                    </td>
                    <td className="p-4 align-middle">{client.investments.length}</td>
                    <td className="p-4 align-middle">
                      {client.investments.reduce((total, investment) => total + investment.quantityLots, 0)}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/clients/${client.id}`}>Görüntüle</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/clients/${client.id}/edit`}>Düzenle</Link>
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" asChild>
                          <Link href={`/clients/${client.id}/delete`}>Sil</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}