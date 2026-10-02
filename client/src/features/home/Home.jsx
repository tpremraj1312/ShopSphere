import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import HeroCarousel from './HeroCarousel';
import CategoryGridCard from './CategoryGridCard';
import ProductRail from './ProductRail';
import RecentlyViewedRail from './RecentlyViewedRail';
import Toast from '../../components/ui/Toast';
import { useGetProductsQuery, useGetCategoriesQuery } from '../../store/productsApi';
import { useAddToCartMutation } from '../../store/cartApi';

export default function Home() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [addToCart] = useAddToCartMutation();
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch real products from backend
  const { data: dealsData, isLoading: dealsLoading } = useGetProductsQuery({
    limit: 12,
    sort: 'price',
  });
  const { data: bestSellersData, isLoading: bestSellersLoading } = useGetProductsQuery({
    limit: 12,
    sort: 'rating',
  });
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useGetProductsQuery({
    limit: 12,
    sort: 'newest',
  });
  const { data: categoriesData } = useGetCategoriesQuery();

  const handleAddToCart = async (product) => {
    try {
      const productId = product.id || product._id;
      await addToCart({ productId, qty: 1 }).unwrap();
      setToastMessage(`Added "${product.name || product.title}" to your cart.`);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      const errorMsg = err?.data?.error?.message || err?.message || 'Failed to add item to cart. Please try again.';
      setToastMessage(errorMsg);
    }
  };

  // Mock Category Tile Items with clean e-commerce photography
  const gamingItems = [
    { label: 'Headsets', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&q=80', to: '/products?category=electronics' },
    { label: 'Keyboards', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80', to: '/products?category=electronics' },
    { label: 'Mice & Mats', image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&q=80', to: '/products?category=electronics' },
    { label: 'Chairs & Desks', image: 'https://images.unsplash.com/photo-1580481077195-c99945f39644?w=300&q=80', to: '/products?category=furniture' },
  ];

  const homeRefreshItems = [
    { label: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&q=80', to: '/products?category=home' },
    { label: 'Bedding & Linen', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&q=80', to: '/products?category=home' },
    { label: 'Home Decor', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&q=80', to: '/products?category=home' },
    { label: 'Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&q=80', to: '/products?category=home' },
  ];

  const fashionDeals = [
    { label: 'Casual Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80', discount: '30% off', price: 49.99, to: '/products?category=clothing' },
    { label: 'Leather Backpack', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80', discount: '20% off', price: 39.99, to: '/products?category=clothing' },
    { label: 'Chronograph Watch', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&q=80', discount: '40% off', price: 89.99, to: '/products?category=clothing' },
  ];

  const techDeals = [
    { label: 'Noise Canceling Earbuds', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80', discount: '35% off', price: 59.99, to: '/products?category=electronics' },
    { label: 'Wireless Charger Pad', image: 'https://images.unsplash.com/photo-1622445268047-97d33b4737a0?w=300&q=80', discount: '25% off', price: 19.99, to: '/products?category=electronics' },
    { label: 'Smart Home Speaker', image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=300&q=80', discount: '15% off', price: 44.99, to: '/products?category=electronics' },
  ];

  const categories = categoriesData?.data || [
    { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&q=80', slug: 'electronics' },
    { name: 'Fashion & Apparel', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200&q=80', slug: 'clothing' },
    { name: 'Home & Kitchen', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&q=80', slug: 'home' },
    { name: 'Computers & Office', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&q=80', slug: 'computers' },
    { name: 'Beauty & Care', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80', slug: 'beauty' },
    { name: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&q=80', slug: 'sports' },
  ];

  return (
    <div className="w-full bg-[#EAEDED] pb-12">
      {/* 4.1 Hero Carousel */}
      <HeroCarousel />

      <div className="page-container relative z-20 -mt-16 sm:-mt-24 md:-mt-32 space-y-6">
        {/* 4.2 Overlapping Card Grid (Section 4.2: 4 columns desktop / 2 tablet / 1 mobile, 8 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: 2x2 Gaming */}
          <CategoryGridCard
            type="2x2"
            title="Gaming accessories"
            items={gamingItems}
            linkText="See more gaming gear"
            linkTo="/products?category=electronics"
          />

          {/* Card 2: 2x2 Home Refresh */}
          <CategoryGridCard
            type="2x2"
            title="Refresh your living space"
            items={homeRefreshItems}
            linkText="Discover home essentials"
            linkTo="/products?category=home"
          />

          {/* Card 3: Top Deals Card */}
          <CategoryGridCard
            type="deals"
            title="Top deals in tech & audio"
            items={techDeals}
            linkText="Shop all tech deals"
            linkTo="/products?sort=relevance"
          />

          {/* Card 4: Sign-in or Personal Card */}
          {isAuthenticated ? (
            <CategoryGridCard
              type="single"
              title={`Welcome back, ${user?.name || 'Customer'}`}
              singleImage="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"
              singleSubtitle="Explore new recommendations for your account"
              linkText="View your orders"
              linkTo="/orders"
            />
          ) : (
            <CategoryGridCard
              type="signin"
              title="Sign in for the best experience"
              user={user}
            />
          )}

          {/* Card 5: Single Image Category */}
          <CategoryGridCard
            type="single"
            title="Top rated in Audio & Electronics"
            singleImage="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80"
            singleSubtitle="Studio quality headphones and accessories"
            linkText="Explore electronics"
            linkTo="/products?category=electronics"
          />

          {/* Card 6: Fashion Deals */}
          <CategoryGridCard
            type="deals"
            title="Fashion & Footwear Deals"
            items={fashionDeals}
            linkText="See fashion discounts"
            linkTo="/products?category=clothing"
          />

          {/* Card 7: Single Image Style */}
          <CategoryGridCard
            type="single"
            title="Modern Workspace Essentials"
            singleImage="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80"
            singleSubtitle="Monitors, stands, and ergonomic accessories"
            linkText="Upgrade your desk"
            linkTo="/products?category=computers"
          />

          {/* Card 8: Kitchen & Cooking */}
          <CategoryGridCard
            type="single"
            title="Culinary & Kitchenware Favorites"
            singleImage="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80"
            singleSubtitle="Cookware, espresso makers, and small appliances"
            linkText="Browse kitchenware"
            linkTo="/products?category=home"
          />
        </div>

        {/* 4.3 Horizontal Product Rail: Today's Deals */}
        <ProductRail
          title="Today's Deals"
          subtitle="Top discounts curated for you"
          linkText="See all deals"
          linkTo="/products?sort=relevance"
          products={dealsData?.data || []}
          isLoading={dealsLoading}
          onAddToCart={handleAddToCart}
        />

        {/* 4.4 Shop by Category (Section 4.4: 1 row of square-thumbnail tiles with 14px labels) */}
        <div className="bg-white border border-[#D5D9D9] rounded-[2px] p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[18px] font-semibold text-[#0F1111]">
              Shop by Category
            </h2>
            <Link
              to="/categories"
              className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline font-medium"
            >
              All departments
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to={`/products?category=${cat.slug || cat.name?.toLowerCase()}`}
                className="group flex flex-col items-center text-center gap-2 p-2 hover:bg-[#F7FAFA] rounded-[2px] transition-colors"
              >
                <div className="w-full aspect-square max-w-[130px] bg-[#F0F2F2] rounded-[2px] overflow-hidden flex items-center justify-center p-2 border border-[#D5D9D9] group-hover:border-[#007185] transition-colors">
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-[14px] font-medium text-[#0F1111] group-hover:text-[#C7511F] group-hover:underline line-clamp-1">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 4.3 Horizontal Product Rail: Best Sellers */}
        <ProductRail
          title="Best Sellers on ShopSphere"
          subtitle="Customer favorites across all categories"
          linkText="See best sellers"
          linkTo="/products?sort=rating"
          products={bestSellersData?.data || []}
          isLoading={bestSellersLoading}
          onAddToCart={handleAddToCart}
        />

        {/* 4.3 Horizontal Product Rail: New Arrivals */}
        <ProductRail
          title="New Releases & Trending Arrivals"
          linkText="Explore new releases"
          linkTo="/products?sort=newest"
          products={newArrivalsData?.data || []}
          isLoading={newArrivalsLoading}
          onAddToCart={handleAddToCart}
        />

        {/* 4.5 Recently Viewed Strip (from localStorage) */}
        <RecentlyViewedRail />
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
