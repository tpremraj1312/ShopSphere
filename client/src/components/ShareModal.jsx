import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Price from './ui/Price';
import {
  Share2,
  Copy,
  Check,
  X,
  QrCode,
  MessageCircle,
  Mail,
  ExternalLink,
  Eye,
} from 'lucide-react';

export default function ShareModal({
  isOpen = false,
  onClose,
  product,
}) {
  const [shortUrl, setShortUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    if (!isOpen || !product) return;

    setLoading(true);
    setCopied(false);

    const productId = product._id || product.id;
    const fullCurrentUrl = window.location.href;
    const origin = window.location.origin;

    // Call URL Shortener API
    fetch('/api/v1/share/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalUrl: fullCurrentUrl,
        productId,
        title: product.title || product.name,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.shortUrl) {
          setShortUrl(data.data.shortUrl);
          setClicks(data.data.clicks || 0);
        } else {
          // Fallback short link
          setShortUrl(`${origin}/products/${productId}`);
        }
      })
      .catch(() => {
        setShortUrl(`${origin}/products/${productId}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const title = product.title || product.name || 'Product';
  const price = product.basePrice ?? product.price ?? 0;
  const image =
    product.variants?.[0]?.images?.[0]?.url ||
    product.variants?.[0]?.images?.[0] ||
    product.images?.[0]?.url ||
    product.images?.[0] ||
    product.image ||
    '/placeholder-product.svg';

  const handleCopy = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = `Check out ${title} on ShopSphere for ₹${price.toLocaleString('en-IN')}: ${shortUrl}`;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    shortUrl
  )}&color=0F1111&bgcolor=FFFFFF`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#D5D9D9] rounded-[8px] max-w-md w-full shadow-2xl overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="bg-[#232F3E] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 size={17} className="text-[#FFD814]" />
            <span className="font-bold text-[14px]">Share This Product</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#D5D9D9] hover:text-white p-1 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mini Product Preview */}
          <div className="flex items-center gap-3 p-2.5 bg-[#F7F8F8] border border-[#D5D9D9] rounded-[6px]">
            <img
              src={image}
              alt={title}
              className="w-12 h-12 object-contain bg-white rounded p-1 border border-[#E7E7E7]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#0F1111] line-clamp-1">{title}</p>
              <Price amount={price} size="sm" />
            </div>
            {clicks > 0 && (
              <span className="text-[11px] bg-white border border-[#D5D9D9] px-2 py-0.5 rounded text-[#565959] flex items-center gap-1 shrink-0">
                <Eye size={12} /> {clicks} clicks
              </span>
            )}
          </div>

          {/* Short URL Box */}
          <div>
            <label className="block text-[12px] font-bold text-[#0F1111] mb-1.5">
              Short Link (Compact &amp; Shareable)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={loading ? 'Generating short URL...' : shortUrl}
                className="flex-1 h-[38px] px-3 text-[13px] bg-[#F7F8F8] border border-[#888C8C] rounded-[4px] font-mono text-[#0F1111] select-all focus:outline-none"
              />
              <Button
                type="button"
                variant={copied ? 'secondary' : 'primary'}
                onClick={handleCopy}
                disabled={loading}
                className="h-[38px] !px-4 text-[13px] shrink-0 flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check size={15} className="text-[#007600]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Social Sharing */}
          <div>
            <label className="block text-[12px] font-bold text-[#565959] uppercase tracking-wider mb-2">
              Share via
            </label>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px] text-[#0F1111]">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 p-2 rounded-[6px] border border-[#D5D9D9] hover:border-[#25D366] hover:bg-[#F0FDF4] transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
                <span>WhatsApp</span>
              </a>

              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  shareText
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 p-2 rounded-[6px] border border-[#D5D9D9] hover:border-[#0F1111] hover:bg-[#FAFAFA] transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span>X (Twitter)</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  `ShopSphere: ${title}`
                )}&body=${encodeURIComponent(shareText)}`}
                className="flex flex-col items-center gap-1.5 p-2 rounded-[6px] border border-[#D5D9D9] hover:border-[#007185] hover:bg-[#F0F8FF] transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-[#007185] text-white flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <span>Email</span>
              </a>

              {/* QR Code toggle */}
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-[6px] border transition-all ${
                  showQr
                    ? 'border-[#E77600] bg-[#FFF8F0] font-bold text-[#C45500]'
                    : 'border-[#D5D9D9] hover:border-[#888C8C] hover:bg-[#FAFAFA]'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#37475A] text-white flex items-center justify-center">
                  <QrCode size={16} />
                </div>
                <span>QR Code</span>
              </button>
            </div>
          </div>

          {/* QR Code preview drawer */}
          {showQr && (
            <div className="p-3 bg-[#F8FAFA] border border-[#D5D9D9] rounded-[6px] text-center space-y-2 animate-fadeIn">
              <p className="text-[12px] font-bold text-[#0F1111]">
                Scan with phone camera to view product
              </p>
              <div className="w-36 h-36 mx-auto bg-white p-2 border border-[#D5D9D9] rounded shadow-sm flex items-center justify-center">
                <img
                  src={qrApiUrl}
                  alt="Product Shortlink QR Code"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <p className="text-[11px] text-[#565959] font-mono">{shortUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
