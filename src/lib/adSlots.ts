// lib/adSlots.ts
// Universal AdSense slot IDs for all Nlaak Studios sites

export const AD_SLOTS = {
  // Banner Ads (Horizontal - top/bottom placement)
  banner1: '4160000570',    // nlaak-banner-1
  banner2: '8660668119',    // nlaak-banner-2
  
  // Display Ads (Square/Rectangle - general content)
  display1: '3828618612',   // nlaak-display-1 (300x250)
  display2: '8840453906',   // nlaak-display-2 (336x280)
  display3: '5882949935',   // nlaak-display-3 (backup/sidebar)
  
  // In-Article Ads (Native - mid-content)
  article1: '8111599395',   // nlaak-article-1
  article2: '9669787018',   // nlaak-article-2
  
  // Multiplex (Related content grid - optional)
  multiplex: '1857844949',  // nlaak-multiplex
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;

