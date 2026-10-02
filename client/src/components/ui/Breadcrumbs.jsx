import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Breadcrumbs — 12px, text-secondary, ">" separators per Section 3.D.
 */
export default function Breadcrumbs({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', padding: 0, margin: 0, flexWrap: 'wrap' }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {index > 0 && (
                <ChevronRight size={12} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              )}
              {isLast || !item.to ? (
                <span style={{ color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  style={{ color: 'var(--link)', textDecoration: 'none', fontSize: '12px' }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
