import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ErrorState — error message with retry button.
 */
export default function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      background: 'var(--surface)',
      border: '1px solid var(--danger)',
      borderRadius: '6px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: '#FFF0F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        color: 'var(--danger)',
      }}>
        <AlertTriangle size={24} strokeWidth={1.75} />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
          {description}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            height: '36px',
            padding: '0 20px',
            backgroundColor: 'var(--btn-secondary-bg)',
            border: '1px solid var(--btn-secondary-bd)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
