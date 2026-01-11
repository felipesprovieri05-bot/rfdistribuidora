import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import React from 'react';
import SuppressConsoleWarning from '../components/SuppressConsoleWarning';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'RF Distribuidora',
  description: 'RF Distribuidora - Sistema de Gestão',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SuppressConsoleWarning />
        {children}
      </body>
    </html>
  );
}
