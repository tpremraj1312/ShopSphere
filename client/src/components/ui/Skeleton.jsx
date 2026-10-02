import React from 'react';

/**
 * Skeleton loader with shimmer animation.
 * Use `width`, `height`, `borderRadius` props or children for layout.
 */
export function Skeleton({ width, height = 16, borderRadius = 3, className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Product card skeleton for loading states.
 */
export function ProductCardSkeleton() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
      <Skeleton height={180} borderRadius={4} style={{ marginBottom: '12px' }} />
      <Skeleton height={14} width="85%" style={{ marginBottom: '8px' }} />
      <Skeleton height={12} width="60%" style={{ marginBottom: '8px' }} />
      <Skeleton height={12} width="40%" style={{ marginBottom: '12px' }} />
      <Skeleton height={20} width="30%" />
    </div>
  );
}

/**
 * Table row skeleton for loading states.
 */
export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: '10px 12px' }}>
          <Skeleton height={14} width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}

export default Skeleton;
