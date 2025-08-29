'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

interface DeleteClientPageProps {
  params: {
    id: string;
  };
}

export default function DeleteClientPage({ params }: DeleteClientPageProps) {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { id: clientId } = params;

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        
        if (!response.ok) {
          throw new Error('Müşteri bulunamadı');
        }
        
        const data = await response.json();
        setClient(data);
      } catch (err) {
        setError('Müşteri bilgileri yüklenirken bir hata oluştu.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClient();
  }, [clientId]);
  
  async function handleDelete() {
    setIsDeleting(true);
    try {
      // Doğrudan API'ye istek göndermek yerine, önce bir fetch isteği oluşturalım
      const response = await fetch(`/api/clients/${clientId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Yönlendirmeyi takip etmemesi için redirect: 'manual' ekleyelim
        redirect: 'manual',
      });
      
      // 200-299 arası durum kodları başarılı kabul edilir
      // 30x yönlendirme kodları da başarılı kabul edilebilir
      if (!(response.ok || response.status >= 300 && response.status < 400)) {
        throw new Error('Müşteri silinirken bir hata oluştu');
      }
      
      toast({
        title: 'Başarılı',
        description: 'Müşteri başarıyla silindi',
      });
      
      // Programatik olarak yönlendirme yapalım
      router.push('/clients');
      router.refresh(); // Sayfayı yenileyelim
    } catch (err) {
      console.error('Müşteri silme hatası:', err);
      toast({
        title: 'Hata',
        description: 'Müşteri silinirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }
  
  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-12 bg-white">
        <CardContent className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4">Müşteri bilgileri yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !client) {
    return (
      <Card className="p-6 text-center bg-white">
        <CardContent>
          <p className="text-red-500">{error || 'Müşteri bulunamadı'}</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/clients">Müşterilere Dön</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Müşteri Sil</h1>
        <p className="text-muted-foreground">
          Bu müşteriyi silmek istediğinizden emin misiniz?
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Müşteri Bilgileri</CardTitle>
          <CardDescription>
            Bu müşteriyi silmek geri alınamaz. Müşteriye ait tüm yatırımlar ve işlemler de silinecektir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Müşteri Adı</p>
              <p>{client.fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefon Numarası</p>
              <p>{client.phoneNumber || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Şehir</p>
              <p>{client.city || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aracı Kurum</p>
              <p>{client.brokerageFirm || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Yatırım Sayısı</p>
              <p>{client.investments?.length || 0}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" asChild>
              <Link href={`/clients/${clientId}`}>İptal</Link>
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Siliniyor...' : 'Müşteriyi Sil'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}