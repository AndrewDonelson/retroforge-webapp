'use client';

import { ButtonType } from './Controller';

interface DirectionPadProps {
  isPressed: (button: ButtonType) => boolean;
  onButtonDown: (button: ButtonType) => void;
  onButtonUp: (button: ButtonType) => void;
  size?: string; // CSS size value (e.g., "200px", "35vw", "min(200px, 35vw)")
  fontSize?: string; // CSS font size value
  className?: string;
}

export default function DirectionPad({
  isPressed,
  onButtonDown,
  onButtonUp,
  size = "min(168px, 24vw)",
  fontSize = "min(1.5rem, 4vw)",
  className = ""
}: DirectionPadProps) {
  return (
    <div className={`dpad-container ${className}`}>
      <div className="dpad">
        <button
          className={`dpad-btn dpad-up ${isPressed('UP') ? 'pressed' : ''}`}
          onPointerDown={() => onButtonDown('UP')}
          onPointerUp={() => onButtonUp('UP')}
          onPointerLeave={() => onButtonUp('UP')}
          aria-label="D-pad Up"
        >
          <div className="dpad-arrow">▲</div>
        </button>
        <button
          className={`dpad-btn dpad-down ${isPressed('DOWN') ? 'pressed' : ''}`}
          onPointerDown={() => onButtonDown('DOWN')}
          onPointerUp={() => onButtonUp('DOWN')}
          onPointerLeave={() => onButtonUp('DOWN')}
          aria-label="D-pad Down"
        >
          <div className="dpad-arrow">▼</div>
        </button>
        <button
          className={`dpad-btn dpad-left ${isPressed('LEFT') ? 'pressed' : ''}`}
          onPointerDown={() => onButtonDown('LEFT')}
          onPointerUp={() => onButtonUp('LEFT')}
          onPointerLeave={() => onButtonUp('LEFT')}
          aria-label="D-pad Left"
        >
          <div className="dpad-arrow">◀</div>
        </button>
        <button
          className={`dpad-btn dpad-right ${isPressed('RIGHT') ? 'pressed' : ''}`}
          onPointerDown={() => onButtonDown('RIGHT')}
          onPointerUp={() => onButtonUp('RIGHT')}
          onPointerLeave={() => onButtonUp('RIGHT')}
          aria-label="D-pad Right"
        >
          <div className="dpad-arrow">▶</div>
        </button>
        <div className="dpad-center"></div>
      </div>

      <style jsx>{`
        .dpad-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .dpad {
          position: relative;
          width: ${size};
          height: ${size};
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
          font-size: ${fontSize};
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
          width: 38%;
          height: 38%;
          background: linear-gradient(145deg, #4a4a4a, #2a2a2a);
          border-radius: 50%;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

