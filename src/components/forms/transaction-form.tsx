'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const transactionSchema = z.object({
  investmentId: z.string().min(1, { message: 'Yatırım seçimi gereklidir' }),
  type: z.enum(['BUY', 'SELL']).refine(val => !!val, {
    message: 'İşlem tipi gereklidir',
  }),
  transactionDate: z.string().min(1, { message: 'İşlem tarihi gereklidir' }),
  quantityLots: z.coerce
    .number()
    .min(0.01, { message: 'Miktar 0\'dan büyük olmalıdır' }),
  pricePerLot: z.coerce
    .number()
    .min(0, { message: 'Lot başına fiyat pozitif bir sayı olmalıdır' }),
  totalAmount: z.coerce
    .number()
    .min(0, { message: 'Toplam tutar pozitif bir sayı olmalıdır' }),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  clientId: string;
  investments: Array<{ id: string; stockName: string; brokerageFirm: string }>;
  preselectedInvestmentId?: string;
  transaction?: {
    id: string;
    investmentId: string;
    type: string;
    transactionDate: Date;
    quantityLots: number;
    pricePerLot: number;
    totalAmount: number;
    notes?: string;
  };
  onSuccess?: () => void;
}

export function TransactionForm({
  clientId,
  investments,
  preselectedInvestmentId,
  transaction,
  onSuccess,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: transaction ? {
      investmentId: transaction.investmentId,
      type: transaction.type as 'BUY' | 'SELL',
      transactionDate: new Date(transaction.transactionDate).toISOString().split('T')[0],
      quantityLots: transaction.quantityLots,
      pricePerLot: transaction.pricePerLot,
      totalAmount: transaction.totalAmount,
      notes: transaction.notes || '',
    } : {
      investmentId: preselectedInvestmentId || '',
      type: 'BUY',
      transactionDate: new Date().toISOString().split('T')[0],
      quantityLots: undefined,
      pricePerLot: undefined,
      totalAmount: undefined,
      notes: '',
    },
  });

  // Toplam tutarı hesaplamak için değişiklikleri izle
  const quantityLots = watch('quantityLots');
  const pricePerLot = watch('pricePerLot');

  // Miktar veya fiyat değiştiğinde toplam tutarı hesapla
  useEffect(() => {
    if (quantityLots && pricePerLot) {
      const total = quantityLots * pricePerLot;
      setValue('totalAmount', total);
    }
  }, [quantityLots, pricePerLot, setValue]);

  const onSubmit = async (data: TransactionFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = transaction
        ? `/api/transactions/${transaction.id}`
        : '/api/transactions';
      const method = transaction ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          clientId: clientId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'İşlem kaydedilemedi');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/clients/${clientId}`);
        router.refresh();
      }
    } catch (err) {
      console.error('İşlem kaydedilirken hata oluştu:', err);
      setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="investmentId">Yatırım *</Label>
          <select
            id="investmentId"
            {...register('investmentId')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Yatırım seçin</option>
            {investments && investments.map((investment) => (
              <option key={investment.id} value={investment.id}>
                {investment.stockName} ({investment.brokerageFirm})
              </option>
            ))}
          </select>
          {errors.investmentId && (
            <p className="text-sm text-red-500">{errors.investmentId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">İşlem Tipi *</Label>
          <select
            id="type"
            {...register('type')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="BUY">Alış</option>
            <option value="SELL">Satış</option>
          </select>
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="transactionDate">İşlem Tarihi *</Label>
          <Input
            id="transactionDate"
            type="date"
            {...register('transactionDate')}
          />
          {errors.transactionDate && (
            <p className="text-sm text-red-500">{errors.transactionDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantityLots">Miktar (Lot) *</Label>
          <Input
            id="quantityLots"
            type="number"
            step="0.01"
            {...register('quantityLots')}
            placeholder="örn., 100"
          />
          {errors.quantityLots && (
            <p className="text-sm text-red-500">{errors.quantityLots.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePerLot">Lot Başına Fiyat (TL) *</Label>
          <Input
            id="pricePerLot"
            type="number"
            step="0.01"
            {...register('pricePerLot')}
            placeholder="örn., 50"
          />
          {errors.pricePerLot && (
            <p className="text-sm text-red-500">{errors.pricePerLot.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalAmount">Toplam Tutar (TL) *</Label>
          <Input
            id="totalAmount"
            type="number"
            step="0.01"
            {...register('totalAmount')}
            placeholder="Otomatik hesaplanır"
            readOnly
          />
          {errors.totalAmount && (
            <p className="text-sm text-red-500">{errors.totalAmount.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notlar</Label>
          <Input
            id="notes"
            {...register('notes')}
            placeholder="Bu işlem hakkında ek bilgiler"
          />
          {errors.notes && (
            <p className="text-sm text-red-500">{errors.notes.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
              Kaydediliyor...
            </>
          ) : transaction ? (
            'İşlemi Güncelle'
          ) : (
            'İşlem Ekle'
          )}
        </Button>
      </div>
    </form>
  );
}