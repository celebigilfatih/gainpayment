'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/forms/transaction-form';

interface NewTransactionPageProps {
  params: {
    id: string;
  };
}

export default function NewTransactionPage({ params }: NewTransactionPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = params.id;
  const investmentId = searchParams.get('investmentId') || undefined;
  const [investments, setInvestments] = useState<Array<{ id: string; stockName: string; stockSymbol: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}/investments`);
        if (!response.ok) {
          throw new Error('Yatırımlar getirilemedi');
        }
        const data = await response.json();
        setInvestments(data);
      } catch (err) {
        console.error('Yatırımlar yüklenirken hata oluştu:', err);
        setError(err instanceof Error ? err.message : 'Yatırımlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [clientId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yeni İşlem Ekle</h1>
        <Button variant="outline" asChild>
          <Link href={`/clients/${clientId}`}>Müşteriye Dön</Link>
        </Button>
      </div>

      <div className="rounded-md border p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">{error}</div>
        ) : (
          <TransactionForm 
            clientId={clientId} 
            investments={investments}
            preselectedInvestmentId={investmentId}
            onSuccess={() => {
              router.push(`/clients/${clientId}`);
              router.refresh();
            }} 
          />
        )}
      </div>
    </div>
  );
}