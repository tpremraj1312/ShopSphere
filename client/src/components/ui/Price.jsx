import React from 'react';

/**
 * Price component — splits currency/whole/fraction in marketplace style.
 * Whole number is large, currency symbol and decimals are small superscript.
 * Defaults to Indian Rupee (₹) for ShopSphere India marketplace.
 */
export default function Price({ amount, currency = '₹', listPrice, showDiscount = false, className = '' }) {
  const num = Number(amount) || 0;
  const whole = Math.floor(num);
  const fraction = String(Math.round((num - whole) * 100)).padStart(2, '0');

  const discount = listPrice && listPrice > num
    ? Math.round(((listPrice - num) / listPrice) * 100)
    : 0;

  return (
    <span className={`inline-flex items-baseline gap-0.5 ${className}`}>
      {showDiscount && discount > 0 && (
        <span style={{ color: 'var(--price)', fontSize: '13px', fontWeight: 400, marginRight: '4px' }}>
          -{discount}%
        </span>
      )}
      <span style={{ fontSize: '13px', fontWeight: 400, position: 'relative', top: '-0.4em' }}>
        {currency}
      </span>
      <span style={{ fontSize: '21px', fontWeight: 500, lineHeight: 1, color: 'var(--text-primary)' }}>
        {whole.toLocaleString('en-IN')}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 400, position: 'relative', top: '-0.4em' }}>
        {fraction}
      </span>
      {listPrice && listPrice > num && (
        <span style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          textDecoration: 'line-through',
          marginLeft: '6px',
          fontWeight: 400
        }}>
          {currency}{Number(listPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )}
    </span>
  );
}
