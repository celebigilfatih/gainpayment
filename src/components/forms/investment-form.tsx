'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Aracı kurumlar listesi
const brokerageFirms = [
  "ACAR MENKUL DEĞERLER A.Ş.",
  "A1 CAPİTAL YATIRIM MENKUL DEĞERLER A.Ş.",
  "ANADOLU YATIRIM MENKUL KIYMETLER A.Ş.",
  "AK YATIRIM MENKUL DEĞERLER A.Ş.",
  "ALB MENKUL DEĞERLER A.Ş.",
  "ALAN YATIRIM MENKUL DEĞERLER A.Ş.",
  "ALTERNATİF YATIRIM MENKUL DEĞERLER A.Ş.",
  "ALNUS YATIRIM MENKUL DEĞERLER A.Ş.",
  "ATA YATIRIM MENKUL KIYMETLER A.Ş.",
  "AHLATCI YATIRIM MENKUL DEĞERLER A.Ş.",
  "BAHAR MENKUL DEĞERLER TİCARETİ A.Ş.",
  "BGC PARTNERS MENKUL DEĞERLER A.Ş.",
  "BİZİM MENKUL DEĞERLER A.Ş.",
  "CITI MENKUL DEĞERLER A.Ş.",
  "CREDIT SUISSE İSTANBUL MENKUL DEĞERLER A.Ş.",
  "DELTA MENKUL DEĞERLER A.Ş.",
  "DİNAMİK MENKUL DEĞERLER A.Ş.",
  "DEUTSCHE SECURITIES MENKUL DEĞERLER A.Ş.",
  "DENİZ YATIRIM MENKUL KIYMETLER A.Ş.",
  "BURGAN YATIRIM MENKUL DEĞERLER A.Ş.",
  "QNB FİNANS YATIRIM MENKUL DEĞERLER A.Ş.",
  "GCM YATIRIM MENKUL DEĞERLER A.Ş.",
  "GEDİK YATIRIM MENKUL DEĞERLER A.Ş.",
  "GLOBAL MENKUL DEĞERLER A.Ş.",
  "ING MENKUL DEĞERLER A.Ş.",
  "GARANTİ YATIRIM MENKUL KIYMETLER A.Ş.",
  "HALK YATIRIM MENKUL DEĞERLER A.Ş.",
  "HSBC YATIRIM MENKUL DEĞERLER A.Ş.",
  "INVEST AZ YATIRIM MENKUL DEĞERLER A.Ş.",
  "ICBC TURKEY YATIRIM MENKUL DEĞERLER A.Ş.",
  "IKON MENKUL DEĞERLER A.Ş.",
  "IŞIK MENKUL DEĞERLER A.Ş.",
  "İNTEGRAL YATIRIM MENKUL DEĞERLER A.Ş.",
  "İNFO YATIRIM MENKUL DEĞERLER A.Ş.",
  "İŞ YATIRIM MENKUL DEĞERLER A.Ş.",
  "MARBAŞ MENKUL DEĞERLER A.Ş.",
  "MEKSA YATIRIM MENKUL DEĞERLER A.Ş.",
  "MORGAN STANLEY MENKUL DEĞERLER A.Ş.",
  "METRO YATIRIM MENKUL DEĞERLER A.Ş.",
  "NOOR CAPİTAL MARKET MENKUL DEĞERLER A.Ş.",
  "NETA MENKUL DEĞERLER A.Ş.",
  "OSMANLI YATIRIM MENKUL DEĞERLER A.Ş.",
  "OYAK YATIRIM MENKUL DEĞERLER A.Ş.",
  "PAY MENKUL DEĞERLER A.Ş.",
  "PHİLLİPCAPİTAL MENKUL DEĞERLER A.Ş.",
  "PİRAMİT MENKUL KIYMETLER A.Ş.",
  "PRİM MENKUL DEĞERLER A.Ş.",
  "POLEN MENKUL DEĞERLER A.Ş.",
  "REEL KAPİTAL MENKUL DEĞERLER A.Ş.",
  "ŞEKER YATIRIM MENKUL DEĞERLER A.Ş.",
  "SANKO YATIRIM MENKUL DEĞERLER A.Ş.",
  "STRATEJİ MENKUL DEĞERLER A.Ş.",
  "TACİRLER YATIRIM MENKUL DEĞERLER A.Ş.",
  "TEB YATIRIM MENKUL DEĞERLER A.Ş.",
  "TURKİSH YATIRIM MENKUL DEĞERLER A.Ş.",
  "TERA YATIRIM MENKUL DEĞERLER A.Ş.",
  "ÜNLÜ MENKUL DEĞERLER A.Ş.",
  "VAKIF YATIRIM MENKUL DEĞERLER A.Ş.",
  "VENBEY YATIRIM MENKUL DEĞERLER A.Ş.",
  "YATIRIM FİNANSMAN MENKUL DEĞERLER A.Ş.",
  "YAPI KREDİ YATIRIM MENKUL DEĞERLER A.Ş.",
  "ZİRAAT YATIRIM MENKUL DEĞERLER A.Ş."
];

const investmentSchema = z.object({
  stockName: z.string().min(1, { message: 'Hisse senedi adı gereklidir' }),
  stockSymbol: z.string().default(''),
  brokerageFirm: z.string().min(1, { message: 'Aracı kurum gereklidir' }),
  acquisitionDate: z.string().min(1, { message: 'Alış tarihi gereklidir' }),
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
  const [showBrokerageList, setShowBrokerageList] = useState(false);
  const [filteredBrokerages, setFilteredBrokerages] = useState<string[]>([]);
  
  // Initialize filtered brokerages with all options
  useEffect(() => {
    setFilteredBrokerages(brokerageFirms);
    
    // Close dropdown lists when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#brokerage-search') && !target.closest('#brokerage-dropdown')) {
        setShowBrokerageList(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema) as any,
    defaultValues: investmentData || {
      stockName: '',
      stockSymbol: '',
      brokerageFirm: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
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
          <Label htmlFor="brokerageFirm">Aracı Kurum *</Label>
          <div className="relative">
            <Input
              id="brokerage-search"
              placeholder="Aracı kurum ara..."
              className="bg-white text-black"
              value={watch('brokerageFirm') || ''}
              onChange={(e) => {
                const searchValue = e.target.value.toLowerCase();
                setFilteredBrokerages(
                  brokerageFirms.filter(firm =>
                    firm.toLowerCase().includes(searchValue)
                  )
                );
                setValue('brokerageFirm', e.target.value);
              }}
              onClick={() => {
                setShowBrokerageList(true);
              }}
              disabled={isSubmitting}
            />
            {showBrokerageList && (
              <div id="brokerage-dropdown" className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                <div className="p-2">
                  {filteredBrokerages.length === 0 ? (
                    <div className="py-2 px-2 text-sm text-gray-500">Aracı kurum bulunamadı</div>
                  ) : (
                    filteredBrokerages.map(firm => (
                      <div
                        key={firm}
                        className="cursor-pointer py-2 px-2 text-sm hover:bg-gray-100 text-black rounded-md"
                        onClick={() => {
                          setValue('brokerageFirm', firm);
                          setShowBrokerageList(false);
                        }}
                      >
                        {firm}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.brokerageFirm && (
            <p className="text-sm text-red-500">{errors.brokerageFirm.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="acquisitionDate">Alış Tarihi *</Label>
          <Input
            id="acquisitionDate"
            type="date"
            {...register('acquisitionDate')}
          />
          {errors.acquisitionDate && (
            <p className="text-sm text-red-500">{errors.acquisitionDate.message}</p>
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