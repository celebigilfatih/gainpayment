'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const investmentSchema = z.object({
  stockName: z.string().min(1, { message: 'Hisse senedi adı gereklidir' }),
  stockSymbol: z.string().min(1, { message: 'Hisse senedi sembolü gereklidir' }),
  quantityLots: z.coerce
    .number()
    .min(0.01, { message: 'Miktar 0\'dan büyük olmalıdır' }),
  acquisitionCost: z.coerce
    .number()
    .min(0, { message: 'Alış maliyeti pozitif bir sayı olmalıdır' }),
  currentValue: z.coerce
    .number()
    .min(0, { message: 'Güncel değer pozitif bir sayı olmalıdır' })
    .optional(),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

interface InvestmentFormProps {
  clientId: string;
  investmentData?: InvestmentFormValues & { id: string };
  onSuccess: () => void;
}

export function InvestmentForm({
  clientId,
  investmentData,
  onSuccess,
}: InvestmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema) as any,
    defaultValues: investmentData || {
      stockName: '',
      stockSymbol: '',
      quantityLots: undefined,
      acquisitionCost: undefined,
      currentValue: undefined,
    },
  });

  const onSubmit = async (data: InvestmentFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Sayısal değerlerin doğru formatta olduğundan emin olalım
      const formattedData = {
        ...data,
        quantityLots: parseFloat(data.quantityLots.toString()),
        acquisitionCost: parseFloat(data.acquisitionCost.toString()),
        currentValue: data.currentValue ? parseFloat(data.currentValue.toString()) : undefined
      };

      const url = investmentData
        ? `/api/investments/${investmentData.id}`
        : '/api/investments';
      const method = investmentData ? 'PATCH' : 'POST';

      // Hata ayıklama için clientId'yi kontrol edelim
      console.log('Form clientId:', clientId);
      console.log('Gönderilen veri:', {
        ...formattedData,
        clientId: investmentData ? undefined : clientId,
      });

      // clientId'nin geçerli bir string olduğundan emin olalım
      if (!investmentData && (!clientId || typeof clientId !== 'string')) {
        throw new Error('Geçersiz müşteri ID');
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formattedData,
          clientId: investmentData ? undefined : clientId,
        }),
      });

      const responseData = await response.json();
      console.log('API yanıtı:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Yatırım kaydedilemedi');
      }

      onSuccess();
    } catch (err) {
      console.error('Yatırım kaydedilirken hata oluştu:', err);
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
          <Label htmlFor="stockName">Hisse Senedi Adı *</Label>
          <Input
            id="stockName"
            {...register('stockName')}
            placeholder="örn., Türkiye İş Bankası"
          />
          {errors.stockName && (
            <p className="text-sm text-red-500">{errors.stockName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stockSymbol">Hisse Senedi Sembolü *</Label>
          <Input
            id="stockSymbol"
            {...register('stockSymbol')}
            placeholder="örn., ISCTR"
          />
          {errors.stockSymbol && (
            <p className="text-sm text-red-500">{errors.stockSymbol.message}</p>
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
          <Label htmlFor="acquisitionCost">Alış Maliyeti (TL) *</Label>
          <Input
            id="acquisitionCost"
            type="number"
            step="0.01"
            {...register('acquisitionCost')}
            placeholder="örn., 5000"
          />
          {errors.acquisitionCost && (
            <p className="text-sm text-red-500">{errors.acquisitionCost.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentValue">Güncel Değer (TL)</Label>
          <Input
            id="currentValue"
            type="number"
            step="0.01"
            {...register('currentValue')}
            placeholder="örn., 5500"
          />
          {errors.currentValue && (
            <p className="text-sm text-red-500">{errors.currentValue.message}</p>
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
          ) : investmentData ? (
            'Yatırımı Güncelle'
          ) : (
            'Yatırım Ekle'
          )}
        </Button>
      </div>
    </form>
  );
}