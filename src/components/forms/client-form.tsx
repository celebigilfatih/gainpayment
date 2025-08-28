'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const clientSchema = z.object({
  fullName: z.string().min(2, { message: 'İsim soyisim gereklidir' }),
  phoneNumber: z.string().optional(),
  brokerageFirm: z.string().optional(),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
  cashPosition: z.coerce.number().default(0),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: ClientFormValues & { id: string };
  clientData?: ClientFormValues & { id: string };
  onSuccess?: () => void;
}

export function ClientForm({ client, clientData, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use clientData as fallback for client for backward compatibility
  const clientInfo = client || clientData;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as any, // Type assertion to fix resolver compatibility
    defaultValues: clientInfo || {
      fullName: '',
      phoneNumber: '',
      brokerageFirm: '',
      referralSource: '',
      notes: '',
      cashPosition: 0,
    },
  });

  async function onSubmit(data: ClientFormValues) {
    setIsLoading(true);
    try {
      const url = clientInfo ? `/api/clients/${clientInfo.id}` : '/api/clients';
      const method = clientInfo ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save client');
      }

      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">İsim Soyisim *</Label>
        <Input
          id="fullName"
          {...form.register('fullName')}
          disabled={isLoading}
        />
        {form.formState.errors.fullName && (
          <p className="text-sm text-red-500">
            {form.formState.errors.fullName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Telefon Numarası</Label>
        <Input
          id="phoneNumber"
          {...form.register('phoneNumber')}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brokerageFirm">Aracı Kurum</Label>
        <Input
          id="brokerageFirm"
          {...form.register('brokerageFirm')}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referralSource">Referans Kaynağı</Label>
        <Input
          id="referralSource"
          {...form.register('referralSource')}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cashPosition">Nakit Pozisyonu (TRY)</Label>
        <Input
          id="cashPosition"
          type="number"
          step="0.01"
          {...form.register('cashPosition')}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notlar</Label>
        <textarea
          id="notes"
          className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register('notes')}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Kaydediliyor...' : clientInfo ? 'Müşteriyi Güncelle' : 'Müşteri Ekle'}
      </Button>
    </form>
  );
}