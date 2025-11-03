'use client';

import { ButtonType } from './Controller';

interface KeyMapping {
  button: string;
  key: string;
  code: string;
  category?: 'dpad' | 'action' | 'system';
}

const keyMappings: KeyMapping[] = [
  // D-Pad
  { button: 'UP', key: '↑ (Arrow Up)', code: 'ArrowUp', category: 'dpad' },
  { button: 'DOWN', key: '↓ (Arrow Down)', code: 'ArrowDown', category: 'dpad' },
  { button: 'LEFT', key: '← (Arrow Left)', code: 'ArrowLeft', category: 'dpad' },
  { button: 'RIGHT', key: '→ (Arrow Right)', code: 'ArrowRight', category: 'dpad' },
  // Action Buttons
  { button: 'A', key: 'Z', code: 'KeyZ', category: 'action' },
  { button: 'B', key: 'X', code: 'KeyX', category: 'action' },
  { button: 'X', key: 'S', code: 'KeyS', category: 'action' },
  { button: 'Y', key: 'A', code: 'KeyA', category: 'action' },
  // System Buttons
  { button: 'START', key: 'Enter ↵', code: 'Enter', category: 'system' },
  { button: 'SELECT', key: 'Shift ⇧', code: 'Shift', category: 'system' },
  { button: 'TURBO', key: 'Space', code: 'Space', category: 'system' },
];

interface KeyboardMappingsProps {
  className?: string;
  compact?: boolean;
}

export default function KeyboardMappings({ className = '', compact = false }: KeyboardMappingsProps) {
  const renderSection = (title: string, category: 'dpad' | 'action' | 'system') => {
    const items = keyMappings.filter(m => m.category === category);
    
    return (
      <>
        <tr className="section-header">
          <td colSpan={3}>{title}</td>
        </tr>
        {items.map((mapping) => (
          <tr key={mapping.button} className="mapping-row">
            <td className="button-cell">{mapping.button}</td>
            <td className="key-cell">{mapping.key}</td>
            <td className="code-cell">{mapping.code}</td>
          </tr>
        ))}
      </>
    );
  };

  return (
    <div className={`keyboard-mappings ${compact ? 'compact' : ''} ${className}`}>
      <h2 className="mappings-title">Default Keyboard Mappings</h2>
      
      <div className="table-container">
        <table className="mappings-table">
          <thead>
            <tr>
              <th>Button</th>
              <th>Key</th>
              <th>Code</th>
            </tr>
          </thead>
          <tbody>
            {renderSection('D-Pad', 'dpad')}
            {renderSection('Action Buttons', 'action')}
            {renderSection('System Buttons', 'system')}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .keyboard-mappings {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
          padding: 1.5rem;
          background: #1f2937; /* bg-gray-800 */
          border-radius: 0.75rem; /* rounded-xl */
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
        }

        .keyboard-mappings.compact {
          padding: 1rem;
          max-width: 600px;
        }

        .mappings-title {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff; /* text-white */
          text-align: left;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .compact .mappings-title {
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 0.5rem;
          background: #111827; /* bg-gray-900 */
        }

        .mappings-table {
          width: 100%;
          border-collapse: collapse;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .mappings-table thead {
          background: #374151; /* bg-gray-700 */
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .mappings-table th {
          padding: 0.875rem 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          color: #ffffff; /* text-white */
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #4b5563; /* border-gray-600 */
        }

        .section-header td {
          padding: 1rem 1.25rem;
          font-weight: 700;
          font-size: 0.9375rem;
          color: #ffffff; /* text-white */
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); /* retro-600 to retro-700 gradient */
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-top: 2px solid #075985; /* retro-800 */
          border-bottom: 1px solid #0284c7; /* retro-600 */
          position: relative;
        }

        .section-header td::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #38bdf8; /* retro-400 accent */
        }

        .mapping-row {
          transition: background-color 0.15s ease;
        }

        .mapping-row:hover {
          background: #374151; /* bg-gray-700 */
        }

        /* Add spacing after section headers */
        .section-header + .mapping-row td {
          padding-top: 1rem;
        }

        .mapping-row td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #374151; /* border-gray-700 */
          font-size: 0.9375rem;
        }

        .compact .mapping-row td,
        .compact .mappings-table th {
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
        }

        .compact .section-header td {
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
        }

        .button-cell {
          color: #ffffff; /* text-white */
          font-weight: 600;
          min-width: 80px;
        }

        .key-cell {
          color: #d1d5db; /* text-gray-300 */
          min-width: 120px;
        }

        .code-cell {
          color: #38bdf8; /* retro-400 */
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          background: rgba(56, 189, 248, 0.1); /* retro-400 with opacity */
          border-radius: 0.25rem;
          padding: 0.5rem 0.75rem !important;
        }

        .compact .code-cell {
          font-size: 0.8125rem;
          padding: 0.375rem 0.5rem !important;
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .keyboard-mappings {
            padding: 1rem;
            border-radius: 0.75rem;
          }

          .mappings-title {
            font-size: 1.25rem;
            margin-bottom: 1rem;
          }

          .mappings-table th {
            padding: 0.625rem 0.75rem;
            font-size: 0.8125rem;
          }

          .section-header td {
            padding: 0.875rem 0.75rem;
            font-size: 0.875rem;
          }

          .mapping-row td {
            padding: 0.625rem 0.75rem;
            font-size: 0.875rem;
          }

          .code-cell {
            font-size: 0.8125rem;
            padding: 0.375rem 0.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .keyboard-mappings {
            padding: 0.75rem;
          }

          .mappings-title {
            font-size: 1.125rem;
          }

          .mappings-table th {
            font-size: 0.75rem;
            padding: 0.5rem;
          }

          .section-header td {
            font-size: 0.8125rem;
            padding: 0.75rem 0.5rem;
          }

          .mapping-row td {
            padding: 0.5rem;
            font-size: 0.8125rem;
          }

          .button-cell {
            min-width: 60px;
          }

          .key-cell {
            min-width: 90px;
          }

          .code-cell {
            font-size: 0.75rem;
            padding: 0.25rem 0.375rem !important;
          }
        }
      `}</style>
    </div>
  );
}
