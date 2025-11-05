'use client';

import DirectionPad from './DirectionPad';
import ActionButtons from './ActionButtons';
import ControlButtons from './ControlButtons';
import { ButtonType } from './Controller';

interface ControllerLandscapeProps {
  isPressed: (button: ButtonType) => boolean;
  onButtonDown: (button: ButtonType) => void;
  onButtonUp: (button: ButtonType) => void;
  className?: string;
}

export default function ControllerLandscape({
  isPressed,
  onButtonDown,
  onButtonUp,
  className = ""
}: ControllerLandscapeProps) {
  return (
    <div className={`controller-landscape ${className}`}>
      {/* Left side - D-Pad */}
      <div className="dpad-wrapper">
        <DirectionPad
          isPressed={isPressed}
          onButtonDown={onButtonDown}
          onButtonUp={onButtonUp}
        />
      </div>

      {/* Center - Select/Start */}
      <div className="control-wrapper">
        <ControlButtons
          isPressed={isPressed}
          onButtonDown={onButtonDown}
          onButtonUp={onButtonUp}
        />
      </div>

      {/* Right side - Action Buttons + Turbo */}
      <div className="action-wrapper">
        <ActionButtons
          isPressed={isPressed}
          onButtonDown={onButtonDown}
          onButtonUp={onButtonUp}
        />
      </div>

      <style jsx>{`
        .controller-landscape {
          width: 100%;
          max-width: 768px;
          aspect-ratio: 16 / 9;
          background: #1f2937;
          border-radius: 0.75rem;
          padding: 1.5rem;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          position: relative;
        }

        .dpad-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .control-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .action-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        @media (min-width: 768px) {
          .controller-landscape {
            aspect-ratio: 2 / 1;
          }
        }
      `}</style>
    </div>
  );
}

