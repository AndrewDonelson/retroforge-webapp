'use client';

import { ButtonType } from './Controller';

interface ControlButtonsProps {
  isPressed: (button: ButtonType) => boolean;
  onButtonDown: (button: ButtonType) => void;
  onButtonUp: (button: ButtonType) => void;
  fontSize?: string; // CSS font size value
  padding?: string; // CSS padding value
  className?: string;
}

export default function ControlButtons({
  isPressed,
  onButtonDown,
  onButtonUp,
  fontSize = "min(0.85rem, 2.5vw)",
  padding = "0.5rem 1.2rem",
  className = ""
}: ControlButtonsProps) {
  return (
    <div className={`center-buttons ${className}`}>
      <button
        className={`center-btn ${isPressed('SELECT') ? 'pressed' : ''}`}
        onPointerDown={() => onButtonDown('SELECT')}
        onPointerUp={() => onButtonUp('SELECT')}
        onPointerLeave={() => onButtonUp('SELECT')}
        aria-label="Select"
      >
        SELECT
      </button>
      <button
        className={`center-btn ${isPressed('START') ? 'pressed' : ''}`}
        onPointerDown={() => onButtonDown('START')}
        onPointerUp={() => onButtonUp('START')}
        onPointerLeave={() => onButtonUp('START')}
        aria-label="Start"
      >
        START
      </button>

      <style jsx>{`
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
          padding: ${padding};
          font-size: ${fontSize};
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
      `}</style>
    </div>
  );
}

