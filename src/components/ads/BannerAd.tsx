// file: /components/ads/BannerAd.tsx
// feature: Horizontal Banner Ad (728x90 desktop, 320x50 mobile)

'use client';

import { AdUnit } from './AdUnit';

export interface BannerAdProps {
  adSlot: string;
  className?: string;
}

export function BannerAd({ adSlot, className = '' }: BannerAdProps) {
  return (
    <div className={`flex justify-center items-center my-8 ${className}`}>
      <AdUnit
        adSlot={adSlot}
        adFormat="horizontal"
        fullWidthResponsive={true}
        className="max-w-full"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          minHeight: '50px',
        }}
      />
    </div>
  );
}

