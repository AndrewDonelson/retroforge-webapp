'use client';

import { ButtonType } from './Controller';

interface ActionButtonsProps {
  isPressed: (button: ButtonType) => boolean;
  onButtonDown: (button: ButtonType) => void;
  onButtonUp: (button: ButtonType) => void;
  size?: string; // CSS size value for action buttons container
  fontSize?: string; // CSS font size value for buttons
  turboFontSize?: string; // CSS font size value for turbo button
  className?: string;
}

export default function ActionButtons({
  isPressed,
  onButtonDown,
  onButtonUp,
  size = "min(168px, 24vw)",
  fontSize = "min(1.2rem, 3.5vw)",
  turboFontSize = "min(0.75rem, 2.5vw)",
  className = ""
}: ActionButtonsProps) {
  return (
    <div className={`action-container ${className}`}>
      {/* Turbo Button */}
      <button
        className={`turbo-btn ${isPressed('TURBO') ? 'pressed' : ''}`}
        onPointerDown={() => onButtonDown('TURBO')}
        onPointerUp={() => onButtonUp('TURBO')}
        onPointerLeave={() => onButtonUp('TURBO')}
        aria-label="Turbo"
      >
        <span className="turbo-text">TURBO</span>
      </button>

      <div className="action-buttons">
        <button
          className={`action-btn btn-x ${isPressed('X') ? 'pressed' : ''}`}
          onPointerDown={() => onButtonDown('X')}
          onPointerUp={() => onButtonUp('X')}
          onPointerLeave={() => onButtonUp('X')}
          aria-label="X Button"
        >
          X
        </button>
        <button
          className={`action-btn btn-y ${isPressed('Y') ? 'pressed' : ''}`}
          onPointerDown={() => onButtonDown('Y')}
          onPointerUp={() => onButtonUp('Y')}
          onPointerLeave={() => onButtonUp('Y')}
          aria-label="Y Button"
        >
          Y
        </button>
        <button
          className={`action-btn btn-a ${isPressed('A') ? 'pressed' : ''}`}
          onPointerDown={() => onButtonDown('A')}
          onPointerUp={() => onButtonUp('A')}
          onPointerLeave={() => onButtonUp('A')}
          aria-label="A Button"
        >
          A
        </button>
        <button
          className={`action-btn btn-b ${isPressed('B') ? 'pressed' : ''}`}
          onPointerDown={() => onButtonDown('B')}
          onPointerUp={() => onButtonUp('B')}
          onPointerLeave={() => onButtonUp('B')}
          aria-label="B Button"
        >
          B
        </button>
      </div>

      <style jsx>{`
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
          font-size: ${turboFontSize};
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
          width: ${size};
          height: ${size};
        }

        .action-btn {
          position: absolute;
          width: 40%;
          height: 40%;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: ${fontSize};
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
      `}</style>
    </div>
  );
}

