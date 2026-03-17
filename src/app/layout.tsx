
"use client"

import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const iconUrl = "https://i.postimg.cc/cJQrd2f6/Gemini-Generated-Image-fczyflfczyflfczy.png";
  const version = "12";
  
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        
        {/* Favicons e Apple Icons com Cache Busting v12 */}
        <link rel="icon" type="image/png" href={`${iconUrl}?v=${version}`} />
        <link rel="shortcut icon" href={`${iconUrl}?v=${version}`} />
        <link rel="apple-touch-icon" href={`${iconUrl}?v=${version}`} />
        
        {/* Manifest com ID Renovado v12 para forçar o Android a criar um novo WebAPK */}
        <link rel="manifest" href={`/manifest.json?v=${version}`} />
        
        {/* Meta tags para Mobile Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        
        <title>PassGuard Ultimate</title>
        <meta name="description" content="Gerencie e gere senhas fortes com segurança máxima no PassGuard." />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
