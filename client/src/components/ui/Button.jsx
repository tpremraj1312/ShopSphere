import React from 'react';

/**
 * Button component following design brief Section 2.4.
 * Variants: primary (Add to Cart), buy (Buy Now), secondary (white).
 * Sizes: compact (32px), form (36px), checkout (40px).
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'form',
  type = 'button',
  disabled = false,
  fullWidth = false,
  onClick,
  className = '',
  ...props
}) {
  const heights = {
    compact: '32px',
    form: '36px',
    checkout: '40px',
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: heights[size] || heights.form,
    padding: '0 16px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    transition: 'background-color 100ms ease, border-color 100ms ease',
    border: 'none',
    textDecoration: 'none',
    lineHeight: 1,
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--btn-primary)',
      border: '1px solid #FCD200',
      color: 'var(--text-primary)',
    },
    buy: {
      backgroundColor: 'var(--btn-buy)',
      border: '1px solid #E09700',
      color: 'var(--text-primary)',
    },
    secondary: {
      backgroundColor: 'var(--btn-secondary-bg)',
      border: '1px solid var(--btn-secondary-bd)',
      color: 'var(--text-primary)',
    },
    danger: {
      backgroundColor: '#FFFFFF',
      border: '1px solid var(--danger)',
      color: 'var(--danger)',
    },
    link: {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'var(--link)',
      padding: '0',
      height: 'auto',
      fontWeight: 400,
    },
  };

  const hoverClass = variant === 'primary' ? 'btn-primary-hover'
    : variant === 'buy' ? 'btn-buy-hover'
    : variant === 'secondary' ? 'btn-secondary-hover'
    : '';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn-${variant} ${hoverClass} ${className}`}
      style={{ ...baseStyles, ...variants[variant] }}
      {...props}
    >
      {children}
    </button>
  );
}
