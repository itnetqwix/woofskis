import React from 'react';
import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { TenantSwitcherHUD } from '@/components/layout/tenant-switcher-hud';
import { AboutPageView } from '@/features/about/components/about-page-view';
import { siteConfig } from '@/config/site';

const defaultShareImage = new URL(
  '/logo/woofskis_logo_with_dog.png',
  siteConfig.url
).toString();

export const metadata: Metadata = {
  title: 'What is Woofskis? | Where Every Dog Has a Chance to Be a Star',
  description:
    'Woofskis is the community-driven dog video contest platform. Watch dog videos one at a time, rate entries fairly with instant community consensus, and celebrate extraordinary dogs.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteConfig.url}/about`,
    title: 'What is Woofskis? | Where Every Dog Has a Chance to Be a Star',
    description:
      'Woofskis is the community-driven dog video contest platform where dog lovers watch, rate, and celebrate dogs through fun video contests.',
    siteName: siteConfig.name,
    images: [{ url: defaultShareImage, alt: 'Woofskis — What is Woofskis?' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What is Woofskis? | Where Every Dog Has a Chance to Be a Star',
    description:
      'Woofskis is the community-driven dog video contest platform where dog lovers watch, rate, and celebrate dogs through fun video contests.',
    images: [defaultShareImage],
  },
};

export default function AboutPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <AppHeader />
      <TenantSwitcherHUD />
      <main className="flex-1">
        <AboutPageView />
      </main>
      <AppFooter />
    </div>
  );
}
