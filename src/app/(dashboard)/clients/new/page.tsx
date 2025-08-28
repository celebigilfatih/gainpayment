'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ClientForm } from '@/components/forms/client-form';

export default function NewClientPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yeni Müşteri Ekle</h1>
        <Button variant="outline" asChild>
          <Link href="/clients">Müşterilere Dön</Link>
        </Button>
      </div>

      <div className="rounded-md border p-6">
        <ClientForm onSuccess={() => router.push('/clients')} />
      </div>
    </div>
  );
}