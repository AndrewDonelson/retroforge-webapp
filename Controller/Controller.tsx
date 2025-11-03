'use client';

import { useCallback, useEffect, useState } from 'react';

export type ButtonType = 'A' | 'B' | 'X' | 'Y' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'START' | 'SELECT' | 'TURBO';

interface ControllerProps {
  onButtonPress?: (button: ButtonType) => void;
  onButtonRelease?: (button: ButtonType) => void;
  onButtonState?: (state: Record<ButtonType, boolean>) => void;
  className?: string;
}

export default function Controller({ 
  onButtonPress, 
  onButtonRelease,
  onButtonState,
  className = '' 
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

  return (
    <div className={`controller-container ${className}`}>
      <div className="controller">
        {/* Left side - D-Pad */}
        <div className="dpad-container">
          <div className="dpad">
            <button
              className={`dpad-btn dpad-up ${isPressed('UP') ? 'pressed' : ''}`}
              onPointerDown={() => handleButtonDown('UP')}
              onPointerUp={() => handleButtonUp('UP')}
              onPointerLeave={() => handleButtonUp('UP')}
              aria-label="D-pad Up"
            >
              <div className="dpad-arrow">▲</div>
            </button>
            <button
              className={`dpad-btn dpad-down ${isPressed('DOWN') ? 'pressed' : ''}`}
              onPointerDown={() => handleButtonDown('DOWN')}
              onPointerUp={() => handleButtonUp('DOWN')}
              onPointerLeave={() => handleButtonUp('DOWN')}
              aria-label="D-pad Down"
            >
              <div className="dpad-arrow">▼</div>
            </button>
            <button
              className={`dpad-btn dpad-left ${isPressed('LEFT') ? 'pressed' : ''}`}
              onPointerDown={() => handleButtonDown('LEFT')}
              onPointerUp={() => handleButtonUp('LEFT')}
              onPointerLeave={() => handleButtonUp('LEFT')}
              aria-label="D-pad Left"
            >
              <div className="dpad-arrow">◀</div>
            </button>
            <button
              className={`dpad-btn dpad-right ${isPressed('RIGHT') ? 'pressed' : ''}`}
              onPointerDown={() => handleButtonDown('RIGHT')}
              onPointerUp={() => handleButtonUp('RIGHT')}
              onPointerLeave={() => handleButtonUp('RIGHT')}
              aria-label="D-pad Right"
            >
              <div className="dpad-arrow">▶</div>
            </button>
            <div className="dpad-center"></div>
          </div>
        </div>

        {/* Center - Select/Start */}
        <div className="center-buttons">
          <button
            className={`center-btn ${isPressed('SELECT') ? 'pressed' : ''}`}
            onPointerDown={() => handleButtonDown('SELECT')}
            onPointerUp={() => handleButtonUp('SELECT')}
            onPointerLeave={() => handleButtonUp('SELECT')}
            aria-label="Select"
          >
            SELECT
          </button>
          <button
            className={`center-btn ${isPressed('START') ? 'pressed' : ''}`}
            onPointerDown={() => handleButtonDown('START')}
            onPointerUp={() => handleButtonUp('START')}
            onPointerLeave={() => handleButtonUp('START')}
            aria-label="Start"
          >
            START
          </button>
        </div>

        {/* Right side - Action Buttons */}
        <div className="action-container">
          {/* Turbo Button */}
          <button
            className={`turbo-btn ${isPressed('TURBO') ? 'pressed' : ''}`}
            onPointerDown={() => handleButtonDown('TURBO')}
            onPointerUp={() => handleButtonUp('TURBO')}
            onPointerLeave={() => handleButtonUp('TURBO')}
            aria-label="Turbo"
          >
            <span className="turbo-text">TURBO</span>
          </button>

          <div className="action-buttons">
            <button
              className={`action-btn btn-x ${isPressed('X') ? 'pressed' : ''}`}
              onPointerDown={() => handleButtonDown('X')}
              onPointerUp={() => handleButtonUp('X')}
              onPointerLeave={() => handleButtonUp('X')}
              aria-label="X Button"
            >
              X
            </button>
            <button
              className={`action-btn btn-y ${isPressed('Y') ? 'pressed' : ''}`}
              onPointerDown={() => handleButtonDown('Y')}
              onPointerUp={() => handleButtonUp('Y')}
              onPointerLeave={() => handleButtonUp('Y')}
              aria-label="Y Button"
            >
              Y
            </button>
            <button
              className={`action-btn btn-a ${isPressed('A') ? 'pressed' : ''}`}
              onPointerDown={() => handleButtonDown('A')}
              onPointerUp={() => handleButtonUp('A')}
              onPointerLeave={() => handleButtonUp('A')}
              aria-label="A Button"
            >
              A
            </button>
            <button
              className={`action-btn btn-b ${isPressed('B') ? 'pressed' : ''}`}
              onPointerDown={() => handleButtonDown('B')}
              onPointerUp={() => handleButtonUp('B')}
              onPointerLeave={() => handleButtonUp('B')}
              aria-label="B Button"
            >
              B
            </button>
          </div>
        </div>

        {/* Logo at bottom center */}
        <div className="logo-container">
          <img src="/logo.svg" alt="Retro" className="controller-logo" />
        </div>
      </div>

      <style jsx>{`
        .controller-container {
          width: 100%;
          max-width: 100%;
          padding: 1rem;
          display: flex;
          justify-content: center;
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
        }

        .controller {
          width: 100%;
          max-width: 768px;
          aspect-ratio: 16 / 9;
          background: linear-gradient(145deg, #e6e6e6, #c4c4c4);
          border-radius: 2rem;
          padding: 1.5rem;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: center;
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.2),
            inset 0 2px 4px rgba(255, 255, 255, 0.5),
            inset 0 -2px 4px rgba(0, 0, 0, 0.2);
          position: relative;
        }

        /* D-Pad Styles */
        .dpad-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .dpad {
          position: relative;
          width: min(168px, 24vw);
          height: min(168px, 24vw);
        }

        .dpad-btn {
          position: absolute;
          background: linear-gradient(145deg, #4a4a4a, #2a2a2a);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          font-size: min(1.5rem, 4vw);
          transition: all 0.1s ease;
          touch-action: none;
        }

        .dpad-btn:active,
        .dpad-btn.pressed {
          background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
          transform: translateY(2px);
        }

        .dpad-up {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 33%;
          height: 40%;
          border-radius: 0.5rem 0.5rem 0 0;
        }

        .dpad-down {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 33%;
          height: 40%;
          border-radius: 0 0 0.5rem 0.5rem;
        }

        .dpad-left {
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 40%;
          height: 33%;
          border-radius: 0.5rem 0 0 0.5rem;
        }

        .dpad-right {
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 40%;
          height: 33%;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        .dpad-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 25%;
          height: 25%;
          background: #1a1a1a;
          border-radius: 50%;
          pointer-events: none;
        }

        /* Center Buttons */
        .center-buttons {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          align-items: center;
        }

        .center-btn {
          background: linear-gradient(145deg, #4a4a4a, #2a2a2a);
          border: none;
          border-radius: 2rem;
          padding: 0.5rem 1.2rem;
          font-size: min(0.85rem, 2.5vw);
          font-weight: 600;
          color: #888;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.1s ease;
          touch-action: none;
          white-space: nowrap;
        }

        .center-btn:active,
        .center-btn.pressed {
          background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
          transform: translateY(2px);
        }

        /* Action Buttons */
        .action-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          position: relative;
        }

        .turbo-btn {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          border-radius: 1.5rem;
          padding: 0.6rem 2rem;
          font-size: min(0.75rem, 2.5vw);
          font-weight: 700;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(168, 85, 247, 0.4);
          transition: all 0.1s ease;
          touch-action: none;
          margin-bottom: 0.75rem;
        }

        .turbo-btn:active,
        .turbo-btn.pressed {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
          transform: translateY(2px);
        }

        .action-buttons {
          position: relative;
          width: min(168px, 24vw);
          height: min(168px, 24vw);
        }

        .action-btn {
          position: absolute;
          width: 40%;
          height: 40%;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: min(1.2rem, 3.5vw);
          transition: all 0.1s ease;
          touch-action: none;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .action-btn:active,
        .action-btn.pressed {
          transform: translateY(3px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .btn-x {
          top: 0;
          right: 30%;
          background: linear-gradient(145deg, #7c9dd9, #5b7db8);
          color: white;
        }

        .btn-y {
          top: 30%;
          left: 0;
          background: linear-gradient(145deg, #7c9dd9, #5b7db8);
          color: white;
        }

        .btn-a {
          top: 30%;
          right: 0;
          background: linear-gradient(145deg, #b794f6, #9f7aea);
          color: white;
        }

        .btn-b {
          bottom: 0;
          right: 30%;
          background: linear-gradient(145deg, #b794f6, #9f7aea);
          color: white;
        }

        /* Logo at bottom center */
        .logo-container {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0.6;
          pointer-events: none;
        }

        .controller-logo {
          height: min(24px, 3vw);
          width: auto;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .controller {
            padding: 1rem;
            gap: 0.5rem;
          }
        }

        @media (min-width: 768px) {
          .controller {
            aspect-ratio: 2 / 1;
          }
        }
      `}</style>
    </div>
  );
}
