// file: /components/ads/SkyscraperAd.tsx
// feature: Vertical Skyscraper Ad (160x600, 300x600) - Desktop sidebar

'use client';

import { AdUnit } from './AdUnit';

export interface SkyscraperAdProps {
  adSlot: string;
  size?: '160x600' | '300x600';
  className?: string;
}

export function SkyscraperAd({ adSlot, size = '160x600', className = '' }: SkyscraperAdProps) {
  const dimensions = size === '160x600' 
    ? { width: 160, height: 600 } 
    : { width: 300, height: 600 };

  return (
    <div className={`hidden lg:flex justify-center items-start my-8 ${className}`}>
      <AdUnit
        adSlot={adSlot}
        adFormat="vertical"
        fullWidthResponsive={false}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          display: 'inline-block',
        }}
      />
    </div>
  );
}

