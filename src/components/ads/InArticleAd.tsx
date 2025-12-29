// file: /components/ads/InArticleAd.tsx
// feature: In-Article Ad - Responsive, blends with content

'use client';

import { AdUnit } from './AdUnit';

export interface InArticleAdProps {
  adSlot: string;
  className?: string;
}

export function InArticleAd({ adSlot, className = '' }: InArticleAdProps) {
  return (
    <div className={`my-8 ${className}`}>
      <AdUnit
        adSlot={adSlot}
        adFormat="fluid"
        adLayout="in-article"
        fullWidthResponsive={true}
        style={{
          display: 'block',
          textAlign: 'center',
        }}
      />
    </div>
  );
}

