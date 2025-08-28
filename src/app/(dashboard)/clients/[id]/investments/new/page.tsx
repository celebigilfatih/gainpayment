'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { InvestmentForm } from '@/components/forms/investment-form';

interface NewInvestmentPageProps {
  params: {
    id: string;
  };
}

export default function NewInvestmentPage({ params }: NewInvestmentPageProps) {
  const router = useRouter();
  const clientId = params.id;

  // Hata ayıklama için clientId'yi kontrol edelim
  useEffect(() => {
    console.log('New Investment Page - Client ID:', clientId);
  }, [clientId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yeni Yatırım Ekle</h1>
        <Button variant="outline" asChild>
          <Link href={`/clients/${clientId}`}>Müşteriye Dön</Link>
        </Button>
      </div>

      <div className="rounded-md border p-6">
        <InvestmentForm 
          clientId={clientId} 
          onSuccess={() => router.push(`/clients/${clientId}`)} 
        />
      </div>
    </div>
  );
}