import React from 'react';
import { PackageOpen } from 'lucide-react';

/**
 * EmptyState — centered message with optional icon and action button.
 */
export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: '#F0F2F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        color: 'var(--text-muted)',
      }}>
        {icon || <PackageOpen size={24} strokeWidth={1.75} />}
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            height: '36px',
            padding: '0 20px',
            backgroundColor: 'var(--btn-primary)',
            border: '1px solid #FCD200',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
