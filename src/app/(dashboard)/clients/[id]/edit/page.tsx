'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ClientForm } from '@/components/forms/client-form';

interface EditClientPageProps {
  params: {
    id: string;
  };
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await fetch(`/api/clients/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch client');
        }
        
        const data = await response.json();
        setClient(data);
      } catch (err) {
        setError('Error loading client data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4">Müşteri bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/clients">Müşterilere Dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Müşteri Düzenle: {client?.fullName}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${params.id}`}>Müşteriyi Görüntüle</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/clients">Müşterilere Dön</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border p-6">
        {client && (
          <ClientForm 
            clientData={client} 
            onSuccess={() => router.push(`/clients/${params.id}`)} 
          />
        )}
      </div>
    </div>
  );
}