import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80',
    title: 'Huge Savings on Electronics',
    link: '/products?category=electronics',
    alt: 'Holiday Electronics Deals',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    title: 'New Arrivals in Fashion & Apparel',
    link: '/products?category=clothing',
    alt: 'Fashion & Apparel',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&q=80',
    title: 'Home & Kitchen Essentials',
    link: '/products?category=home',
    alt: 'Home Essentials',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&q=80',
    title: 'Top Tech & Photography Gear',
    link: '/products?sort=rating',
    alt: 'Top Tech Gear',
  },
];

/**
 * HeroCarousel adhering to Section 4.1:
 * - 300px desktop / 180px mobile
 * - Auto-rotates every 5s, pauses on hover
 * - Large translucent chevron zones at edges
 * - Bottom edge gradient fade into --page-bg (#EAEDED)
 */
export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, currentIndex]);

  return (
    <div
      className="relative w-full h-[200px] sm:h-[260px] md:h-[320px] overflow-hidden select-none bg-[#131921]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Promotional carousel"
    >
      {/* Slides Container */}
      <div
        className="flex h-full transition-transform duration-400 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div key={slide.id} className="min-w-full h-full relative shrink-0">
            <Link to={slide.link} className="block w-full h-full">
              <img
                src={slide.image}
                alt={slide.alt}
                className="w-full h-full object-cover object-center"
                loading="eager"
              />
            </Link>
          </div>
        ))}
      </div>

      {/* Allowed Gradient Fade at the bottom into --page-bg (#EAEDED) per Section 2.1 */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#EAEDED] via-[#EAEDED]/70 to-transparent pointer-events-none z-10" />

      {/* Left Chevron Zone */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-0 top-0 bottom-16 w-14 sm:w-18 flex items-center justify-center bg-black/10 hover:bg-black/25 text-white/90 transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-[#007185]"
      >
        <ChevronLeft size={36} strokeWidth={2} />
      </button>

      {/* Right Chevron Zone */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-0 top-0 bottom-16 w-14 sm:w-18 flex items-center justify-center bg-black/10 hover:bg-black/25 text-white/90 transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-[#007185]"
      >
        <ChevronRight size={36} strokeWidth={2} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex
                ? 'w-6 bg-[#E77600]'
                : 'w-2 bg-white/70 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
