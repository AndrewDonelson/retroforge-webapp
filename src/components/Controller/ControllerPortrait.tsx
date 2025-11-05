'use client';

import { useRef, useEffect, useState } from 'react';
import DirectionPad from './DirectionPad';
import ActionButtons from './ActionButtons';
import ControlButtons from './ControlButtons';
import { ButtonType } from './Controller';

interface ControllerPortraitProps {
  isPressed: (button: ButtonType) => boolean;
  onButtonDown: (button: ButtonType) => void;
  onButtonUp: (button: ButtonType) => void;
  className?: string;
}

export default function ControllerPortrait({
  isPressed,
  onButtonDown,
  onButtonUp,
  className = ""
}: ControllerPortraitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dpadSize, setDpadSize] = useState("min(200px, 35vw)");
  const [actionSize, setActionSize] = useState("min(200px, 35vw)");

  // Calculate optimal sizes based on available space
  useEffect(() => {
    const updateSizes = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Calculate available space (accounting for padding)
      const padding = 16; // 1rem = 16px
      const availableWidth = containerWidth - (padding * 2);
      const availableHeight = containerHeight - (padding * 2);
      
      // Reserve space for Start/Select at bottom center - ~50px height
      const controlReserve = 50;
      
      // Calculate space for D-Pad (top-left) and Action buttons (bottom-right)
      // They should not overlap, so we need to ensure they fit diagonally
      // D-Pad uses top-left, Action buttons use bottom-right
      // They can share the middle area but we need to ensure no overlap
      
      // D-Pad: Can use up to 50% of width and 60% of height (top area)
      // Increase by 20% for better touch targets
      const dpadMaxWidth = availableWidth * 0.5;
      const dpadMaxHeight = (availableHeight - controlReserve) * 0.6;
      const dpadOptimal = Math.min(dpadMaxWidth, dpadMaxHeight) * 1.2;
      
      // Action buttons: Can use up to 50% of width and 60% of height (bottom area)
      // Increase by 20% for better touch targets
      const actionMaxWidth = availableWidth * 0.5;
      const actionMaxHeight = (availableHeight - controlReserve) * 0.6;
      const actionOptimal = Math.min(actionMaxWidth, actionMaxHeight) * 1.2;
      
      // Ensure minimum size and cap maximum (increased max for 20% larger buttons)
      const dpadFinal = Math.max(144, Math.min(dpadOptimal, 336)); // 120*1.2=144, 280*1.2=336
      const actionFinal = Math.max(144, Math.min(actionOptimal, 336));
      
      // Convert to CSS value (use min() for responsiveness with viewport units)
      const dpadCSS = `min(${Math.round(dpadFinal)}px, 45vw)`;
      const actionCSS = `min(${Math.round(actionFinal)}px, 45vw)`;
      
      setDpadSize(dpadCSS);
      setActionSize(actionCSS);
    };

    // Use ResizeObserver for more accurate size tracking
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure layout is settled
      setTimeout(updateSizes, 10);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      updateSizes();
    }

    window.addEventListener('resize', updateSizes);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateSizes, 100); // Delay for orientation change
    });
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSizes);
      window.removeEventListener('orientationchange', updateSizes);
    };
  }, []);

  return (
    <div ref={containerRef} className={`controller-portrait ${className}`}>
      {/* D-Pad: Top-left, absolute positioned */}
      <div className="dpad-wrapper">
        <DirectionPad
          isPressed={isPressed}
          onButtonDown={onButtonDown}
          onButtonUp={onButtonUp}
          size={dpadSize}
          fontSize="min(1.8rem, 5vw)"
        />
      </div>

      {/* Control Buttons: Left side, small, out of the way */}
      <div className="control-wrapper">
        <ControlButtons
          isPressed={isPressed}
          onButtonDown={onButtonDown}
          onButtonUp={onButtonUp}
          fontSize="min(0.7rem, 2vw)"
          padding="0.4rem 0.8rem"
        />
      </div>

      {/* Action Buttons + Turbo: Bottom-right, absolute positioned */}
      <div className="action-wrapper">
        <ActionButtons
          isPressed={isPressed}
          onButtonDown={onButtonDown}
          onButtonUp={onButtonUp}
          size={actionSize}
          fontSize="min(1.4rem, 4vw)"
          turboFontSize="min(0.7rem, 2.2vw)"
        />
      </div>

      <style jsx>{`
        .controller-portrait {
          width: 100%;
          height: 100%;
          min-height: 300px;
          position: relative;
          background: #1f2937;
          border-radius: 0.75rem;
          padding: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .dpad-wrapper {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 10;
        }

        .control-wrapper {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          z-index: 5;
        }

        .control-wrapper :global(.center-buttons) {
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-wrapper {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          z-index: 10;
        }

        .action-wrapper :global(.action-container) {
          flex-direction: column-reverse;
          gap: 0.5rem;
        }

        .action-wrapper :global(.turbo-btn) {
          margin-bottom: 0;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}

