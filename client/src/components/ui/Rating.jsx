import React from 'react';
import { Star } from 'lucide-react';

/**
 * Rating component — read-only with partial fill, or interactive input.
 * Uses lucide-react Star icon with 1.75 stroke width.
 */
export default function Rating({
  value = 0,
  count,
  max = 5,
  size = 16,
  interactive = false,
  onChange,
  className = '',
}) {
  const stars = [];

  for (let i = 1; i <= max; i++) {
    const fillPercent = Math.min(1, Math.max(0, value - (i - 1)));
    const isFull = fillPercent >= 1;
    const isPartial = fillPercent > 0 && fillPercent < 1;

    stars.push(
      <span
        key={i}
        onClick={interactive ? () => onChange?.(i) : undefined}
        onKeyDown={interactive ? (e) => { if (e.key === 'Enter') onChange?.(i); } : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `Rate ${i} stars` : undefined}
        style={{
          cursor: interactive ? 'pointer' : 'default',
          position: 'relative',
          display: 'inline-flex',
          width: size,
          height: size,
        }}
      >
        {/* Empty star (background) */}
        <Star
          size={size}
          strokeWidth={1.75}
          style={{ color: '#D5D9D9', position: 'absolute', top: 0, left: 0 }}
        />
        {/* Filled star (foreground) */}
        {(isFull || isPartial) && (
          <span style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: isPartial ? `${fillPercent * 100}%` : '100%',
            overflow: 'hidden',
            display: 'inline-flex',
          }}>
            <Star
              size={size}
              strokeWidth={1.75}
              fill="var(--warning-star)"
              style={{ color: 'var(--warning-star)', flexShrink: 0 }}
            />
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`${value} out of ${max} stars`}>
      <span className="inline-flex items-center" style={{ gap: '1px' }}>
        {stars}
      </span>
      {count !== undefined && (
        <span style={{ fontSize: '13px', color: 'var(--link)', marginLeft: '4px' }}>
          {typeof count === 'number' ? count.toLocaleString() : count}
        </span>
      )}
    </span>
  );
}
