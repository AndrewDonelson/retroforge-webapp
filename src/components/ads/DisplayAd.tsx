// file: /components/ads/DisplayAd.tsx
// feature: Display Ad (300x250, 336x280) - Rectangle/Square

'use client';

import { AdUnit } from './AdUnit';

export interface DisplayAdProps {
  adSlot: string;
  size?: '300x250' | '336x280';
  className?: string;
}

export function DisplayAd({ adSlot, size = '300x250', className = '' }: DisplayAdProps) {
  const dimensions = size === '300x250' 
    ? { width: 300, height: 250 } 
    : { width: 336, height: 280 };

  return (
    <div className={`flex justify-center items-center my-8 ${className}`}>
      <AdUnit
        adSlot={adSlot}
        adFormat="rectangle"
        className="max-w-full"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          display: 'inline-block',
        }}
      />
    </div>
  );
}

