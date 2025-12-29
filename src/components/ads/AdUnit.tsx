// file: /components/ads/AdUnit.tsx
// feature: Base Google AdSense component

'use client';

import { useEffect, useRef } from 'react';

export interface AdUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  adLayout?: string;
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AdUnit({
  adSlot,
  adFormat = 'auto',
  adLayout,
  fullWidthResponsive = true,
  className = '',
  style = {},
}: AdUnitProps) {
  const adInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React StrictMode (development)
    if (adInitialized.current) {
      return;
    }

    try {
      // Mark as initialized before pushing to prevent race conditions
      adInitialized.current = true;
      
      // Push ad to AdSense queue
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      // Only log in development, suppress in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('AdSense initialization skipped (expected in dev mode):', err);
      }
      // Reset flag on error so it can retry
      adInitialized.current = false;
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-7431399643348196"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-ad-layout={adLayout}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
}

