/**
 * Hook for integrating Controller component with WASM engine
 */

import { useCallback } from 'react';
import type { ButtonType } from '@/components/Controller/Controller';

declare global {
  interface Window {
    rf_set_btn?: (idx: number, down: boolean) => unknown;
    rf_set_button?: (name: string, down: boolean) => unknown;
  }
}

// Map ButtonType to engine button index (matches Controller.tsx)
const buttonToIndex: Record<ButtonType, number> = {
  SELECT: 0,
  START: 1,
  UP: 2,
  DOWN: 3,
  LEFT: 4,
  RIGHT: 5,
  A: 6,
  B: 7,
  X: 8,
  Y: 9,
  TURBO: 10,
};

export function useController() {
  const handleButtonPress = useCallback((button: ButtonType) => {
    const idx = buttonToIndex[button];
    if (idx === undefined) {
      console.error(`[useController] Unknown button: ${button}`);
      return;
    }
    
    // Check if rf_set_btn is available
    if (typeof window.rf_set_btn !== 'function') {
      console.error(`[useController] window.rf_set_btn is not a function!`, {
        exists: 'rf_set_btn' in window,
        type: typeof window.rf_set_btn,
        windowKeys: Object.keys(window).filter(k => k.startsWith('rf_'))
      });
      return;
    }
    
    // Call with button index (0-10) - simple and direct
    try {
      window.rf_set_btn(idx, true);
      console.log(`[useController] rf_set_btn(${idx}, true) called for button: ${button}`);
    } catch (error) {
      console.error(`[useController] Error calling rf_set_btn:`, error);
    }
  }, []);

  const handleButtonRelease = useCallback((button: ButtonType) => {
    const idx = buttonToIndex[button];
    if (idx === undefined) {
      console.error(`[useController] Unknown button: ${button}`);
      return;
    }
    
    // Check if rf_set_btn is available
    if (typeof window.rf_set_btn !== 'function') {
      console.error(`[useController] window.rf_set_btn is not a function!`);
      return;
    }
    
    // Call with button index (0-10) - simple and direct
    try {
      window.rf_set_btn(idx, false);
      console.log(`[useController] rf_set_btn(${idx}, false) called for button: ${button}`);
    } catch (error) {
      console.error(`[useController] Error calling rf_set_btn:`, error);
    }
  }, []);

  return {
    handleButtonPress,
    handleButtonRelease,
  };
}

/**
 * Detect if device is mobile/tablet in portrait mode
 */
export function isMobilePortrait(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isPortrait = window.innerHeight > window.innerWidth;
  
  return isMobile && isPortrait;
}

