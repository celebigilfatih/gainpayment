'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { InvestmentForm } from '@/components/forms/investment-form';

interface EditInvestmentPageProps {
  params: {
    id: string;
  };
}

export default function EditInvestmentPage({ params }: EditInvestmentPageProps) {
  const router = useRouter();
  const [investment, setInvestment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        const response = await fetch(`/api/investments/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch investment');
        }
        
        const data = await response.json();
        setInvestment(data);
      } catch (err) {
        setError('Yatırım verisi yüklenirken hata oluştu. Lütfen tekrar deneyin.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestment();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4">Yatırım verisi yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/dashboard">Panoya Dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Yatırımı Düzenle: {investment?.stockName} ({investment?.stockSymbol})
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/investments/${params.id}`}>Yatırımı Görüntüle</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${investment?.client?.id}`}>Müşteriye Dön</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border p-6">
        {investment && (
          <InvestmentForm 
            clientId={investment.client.id} 
            investmentData={{
              id: investment.id,
              stockName: investment.stockName,
              stockSymbol: investment.stockSymbol,
              quantityLots: investment.quantityLots,
              acquisitionCost: investment.acquisitionCost,
              currentValue: investment.currentValue,
              notes: investment.notes,
            }} 
            onSuccess={() => router.push(`/investments/${params.id}`)} 
          />
        )}
      </div>
    </div>
  );
}