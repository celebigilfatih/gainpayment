'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Bir Şeyler Yanlış Gitti</h1>
        <p className="text-muted-foreground">
          Üzgünüz, bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <Button onClick={() => reset()}>Tekrar Dene</Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    </div>
  );
}