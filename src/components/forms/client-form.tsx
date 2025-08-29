'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { turkishCities } from '@/lib/turkish-cities';

const clientSchema = z.object({
  fullName: z.string().min(2, { message: 'İsim soyisim gereklidir' }),
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
  brokerageFirms: z.array(z.string()).default([]),
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

export function ClientForm({ client, clientData, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCityList, setShowCityList] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showBrokerageList, setShowBrokerageList] = useState(false);
  const [filteredBrokerages, setFilteredBrokerages] = useState<string[]>([]);
  const [searchBrokerage, setSearchBrokerage] = useState('');
  const [selectedBrokerages, setSelectedBrokerages] = useState<string[]>([]);
  
  // Use clientData as fallback for client for backward compatibility
  const clientInfo = client || clientData;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as any, // Type assertion to fix resolver compatibility
    defaultValues: clientInfo || {
      fullName: '',
      phoneNumber: '',
      city: '',
      brokerageFirms: [],
      referralSource: '',
      notes: '',
      cashPosition: 0,
    },
  });
  
  // Initialize filtered cities and brokerages with all options
  useEffect(() => {
    setFilteredCities(turkishCities);
    setFilteredBrokerages(brokerageFirms);
    
    // Close dropdown lists when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#city-search') && !target.closest('#city-dropdown')) {
        setShowCityList(false);
      }
      if (!target.closest('#brokerage-search') && !target.closest('#brokerage-dropdown')) {
        setShowBrokerageList(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Initialize selected brokerages from form data
  useEffect(() => {
    const initialBrokerages = form.getValues('brokerageFirms') || [];
    setSelectedBrokerages(initialBrokerages);
  }, [form]);

  async function onSubmit(data: ClientFormValues) {
    setIsLoading(true);
    try {
      const url = clientInfo ? `/api/clients/${clientInfo.id}` : '/api/clients';
      const method = clientInfo ? 'PATCH' : 'POST';
      
      // Ensure brokerageFirms is properly set
      if (!data.brokerageFirms) {
        data.brokerageFirms = [];
      }

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
        <Label htmlFor="city">Şehir</Label>
        <div className="relative">
          <Input
            id="city-search"
            placeholder="Şehir ara..."
            className="bg-white text-black"
            value={form.watch('city') || ''}
            onChange={(e) => {
              const searchValue = e.target.value.toLowerCase();
              setFilteredCities(
                turkishCities.filter(city =>
                  city.toLowerCase().includes(searchValue)
                )
              );
              form.setValue('city', e.target.value);
            }}
            onClick={() => {
              setShowCityList(true);
            }}
            disabled={isLoading}
          />
          {showCityList && (
            <div id="city-dropdown" className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="p-2">
                {filteredCities.length === 0 ? (
                  <div className="py-2 px-2 text-sm text-gray-500">Şehir bulunamadı</div>
                ) : (
                  filteredCities.map(city => (
                    <div
                      key={city}
                      className="cursor-pointer py-2 px-2 text-sm hover:bg-gray-100 text-black rounded-md"
                      onClick={() => {
                        form.setValue('city', city);
                        setShowCityList(false);
                      }}
                    >
                      {city}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brokerageFirms">Aracı Kurumlar (Birden fazla seçebilirsiniz)</Label>
        <div className="relative">
          <Input
            id="brokerage-search"
            placeholder="Aracı kurum ara..."
            className="bg-white text-black"
            value={searchBrokerage}
            onChange={(e) => {
              const searchValue = e.target.value.toLowerCase();
              setSearchBrokerage(e.target.value);
              setFilteredBrokerages(
                brokerageFirms.filter(firm =>
                  firm.toLowerCase().includes(searchValue)
                )
              );
            }}
            onClick={() => {
              setShowBrokerageList(true);
            }}
            disabled={isLoading}
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
                      className="flex items-center cursor-pointer py-2 px-2 text-sm hover:bg-gray-100 text-black rounded-md"
                      onClick={() => {
                        const isSelected = selectedBrokerages.includes(firm);
                        let newSelected;
                        
                        if (isSelected) {
                          newSelected = selectedBrokerages.filter(item => item !== firm);
                        } else {
                          newSelected = [...selectedBrokerages, firm];
                        }
                        
                        setSelectedBrokerages(newSelected);
                        form.setValue('brokerageFirms', newSelected);
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedBrokerages.includes(firm)}
                        onChange={() => {}} // Handled by parent div onClick
                        className="mr-2"
                      />
                      {firm}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Selected brokerages display */}
        {selectedBrokerages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedBrokerages.map(firm => (
              <div 
                key={firm} 
                className="bg-gray-100 text-black px-2 py-1 rounded-md text-sm flex items-center"
              >
                {firm}
                <button
                  type="button"
                  className="ml-2 text-gray-500 hover:text-red-500"
                  onClick={() => {
                    const newSelected = selectedBrokerages.filter(item => item !== firm);
                    setSelectedBrokerages(newSelected);
                    form.setValue('brokerageFirms', newSelected);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
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

      <Button 
        type="submit" 
        disabled={isLoading}
        className="bg-black text-white hover:bg-gray-800 rounded-md cursor-pointer"
      >
        {isLoading ? 'Kaydediliyor...' : clientInfo ? 'Müşteriyi Güncelle' : 'Müşteri Ekle'}
      </Button>
    </form>
  );
}