'use client';

import { useCallback, useEffect, useState } from 'react';
import ControllerPortrait from './ControllerPortrait';
import ControllerLandscape from './ControllerLandscape';
import { isMobilePortrait } from '@/lib/useController';

export type ButtonType = 'A' | 'B' | 'X' | 'Y' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'START' | 'SELECT' | 'TURBO';

// Map ButtonType to engine button index (0-10)
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

// Default keyboard mappings (can be customized)
const keyboardMap: Record<string, ButtonType> = {
  // D-Pad
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  // Action Buttons
  KeyA: 'A',
  KeyS: 'B',
  KeyZ: 'X',
  KeyX: 'Y',
  // System Buttons
  Enter: 'SELECT',
  Space: 'START',
  ShiftLeft: 'TURBO',
  ShiftRight: 'TURBO',
};

interface ControllerProps {
  onButtonPress?: (button: ButtonType) => void;
  onButtonRelease?: (button: ButtonType) => void;
  onButtonState?: (state: Record<ButtonType, boolean>) => void;
  className?: string;
  enabled?: boolean; // Only capture keyboard input when enabled (game is running)
}

export default function Controller({ 
  onButtonPress, 
  onButtonRelease,
  onButtonState,
  className = '',
  enabled = true 
}: ControllerProps) {
  const [pressedButtons, setPressedButtons] = useState<Set<ButtonType>>(new Set());

  // Notify parent of button state changes
  useEffect(() => {
    if (onButtonState) {
      const state: Record<ButtonType, boolean> = {
        A: false, B: false, X: false, Y: false,
        UP: false, DOWN: false, LEFT: false, RIGHT: false,
        START: false, SELECT: false, TURBO: false
      };
      pressedButtons.forEach(btn => {
        state[btn] = true;
      });
      onButtonState(state);
    }
  }, [pressedButtons, onButtonState]);

  const handleButtonDown = useCallback((button: ButtonType) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(button)) {
        newSet.add(button);
        console.log(`[Controller] handleButtonDown: ${button}, calling onButtonPress`);
        onButtonPress?.(button);
      }
      return newSet;
    });
  }, [onButtonPress]);

  const handleButtonUp = useCallback((button: ButtonType) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(button)) {
        newSet.delete(button);
        onButtonRelease?.(button);
      }
      return newSet;
    });
  }, [onButtonRelease]);

  const isPressed = (button: ButtonType) => pressedButtons.has(button);

  // Handle keyboard input - only when enabled (game is running)
  useEffect(() => {
    if (!enabled) {
      return; // Don't capture keyboard events when disabled
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input/textarea/select element
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )) {
        return; // Allow normal keyboard behavior for form inputs
      }

      const button = keyboardMap[e.code];
      if (button) {
        e.preventDefault();
        console.log(`[Controller] Keyboard: ${e.code} -> ${button}`);
        handleButtonDown(button);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input/textarea/select element
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )) {
        return; // Allow normal keyboard behavior for form inputs
      }

      const button = keyboardMap[e.code];
      if (button) {
        e.preventDefault();
        handleButtonUp(button);
      }
    };

    // Listen only on window to avoid duplicate events
    // Use capture phase (true) to catch events early
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [enabled, handleButtonDown, handleButtonUp]);

  // Detect if we're on mobile portrait
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(isMobilePortrait());
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return (
    <div className={`controller-container ${className}`}>
      {isPortrait ? (
        <ControllerPortrait
          isPressed={isPressed}
          onButtonDown={handleButtonDown}
          onButtonUp={handleButtonUp}
        />
      ) : (
        <ControllerLandscape
          isPressed={isPressed}
          onButtonDown={handleButtonDown}
          onButtonUp={handleButtonUp}
        />
      )}

      <style jsx>{`
        .controller-container {
          width: 100%;
          max-width: 100%;
          padding: 0;
          display: flex;
          justify-content: center;
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
        }
        
        .controller-container.gameboy-controller {
          padding: 0;
        }
      `}</style>
    </div>
  );
}
