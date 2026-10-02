require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { sellers, reviewerProfiles } = require('./catalog-data');

// Import Schemas
const User = require('../src/modules/users/user.model');
const Product = require('../src/modules/products/product.model');
const Order = require('../src/modules/orders/order.model');
const Review = require('../src/modules/reviews/review.model');

// High-resolution reliable product images by department
const categoryPhotos = {
  headphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'
  ],
  wearables: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
    'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80'
  ],
  cameras: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800&q=80'
  ],
  laptops: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80'
  ],
  keyboards: [
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80',
    'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80',
    'https://images.unsplash.com/photo-1541140532154-b024d705b909?w=800&q=80'
  ],
  mice: [
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
    'https://images.unsplash.com/photo-1626771385764-77735fa7bf17?w=800&q=80'
  ],
  monitors: [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&q=80',
    'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&q=80'
  ],
  coffee: [
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800&q=80'
  ],
  cookware: [
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80',
    'https://images.unsplash.com/photo-1584990347449-3e334a1a6f30?w=800&q=80',
    'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80',
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80'
  ],
  lighting: [
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'
  ],
  mensApparel: [
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
    'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&q=80',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80'
  ],
  womensApparel: [
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80'
  ],
  footwear: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80'
  ],
  watches: [
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800&q=80'
  ],
  bags: [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
    'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80'
  ],
  skincare: [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
    'https://images.unsplash.com/photo-1608248597359-0027788448a3?w=800&q=80',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80'
  ],
  fitness: [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80',
    'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80'
  ],
  camping: [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
    'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80',
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80'
  ],
  books: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
    'https://images.unsplash.com/photo-1532012164546-f432f2e37b73?w=800&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80'
  ],
  toys: [
    'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80',
    'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?w=800&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80'
  ],
  tools: [
    'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&q=80',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80'
  ],
  auto: [
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80'
  ],
  tvs: [
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
    'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=80',
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80'
  ],
  phones: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80'
  ],
  tablets: [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80'
  ],
  speakers: [
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
    'https://images.unsplash.com/photo-1608043152269-423dbbaed06b?w=800&q=80',
    'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800&q=80'
  ],
  gaming: [
    'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',
    'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=800&q=80',
    'https://images.unsplash.com/photo-1578303512597-81e6cc1552c8?w=800&q=80'
  ],
  desktops: [
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&q=80',
    'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80'
  ],
  printers: [
    'https://images.unsplash.com/photo-1612815154858-960ea89e3f2e?w=800&q=80',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80'
  ],
  webcams: [
    'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&q=80',
    'https://images.unsplash.com/photo-1590602846989-e99596d2a5a3?w=800&q=80'
  ],
  vacuums: [
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80'
  ],
  bedding: [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'
  ],
  furniture: [
    'https://images.unsplash.com/photo-1580481077195-c99945f39644?w=800&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'
  ],
  smarthome: [
    'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
    'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80'
  ],
  activewear: [
    'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'
  ],
  makeup: [
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'
  ],
  haircare: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    'https://images.unsplash.com/photo-1527799820371-d83fc1bf2876?w=800&q=80'
  ],
  cycling: [
    'https://images.unsplash.com/photo-1485965120184-e07f15699c97?w=800&q=80',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80'
  ],
  running: [
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80',
    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80'
  ],
  golf: [
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80'
  ],
  cookbooks: [
    'https://images.unsplash.com/photo-1466637574441-749b8f2c4a1d?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'
  ],
  lego: [
    'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80'
  ],
  collectibles: [
    'https://images.unsplash.com/photo-1613771404784-3a7413e725e8?w=800&q=80',
    'https://images.unsplash.com/photo-1601814933824-fd0b3dbedb51?w=800&q=80'
  ],
  vitamins: [
    'https://images.unsplash.com/photo-1584308666744-24d98cee4597?w=800&q=80',
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80'
  ],
  firstaid: [
    'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800&q=80',
    'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=800&q=80'
  ],
  garage: [
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80'
  ],
  grocery: [
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'
  ],
  snacks: [
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80'
  ],
  tea: [
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
    'https://images.unsplash.com/photo-1564890369479-c409984a1d27?w=800&q=80'
  ],
  pets: [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80'
  ],
  cats: [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&q=80'
  ],
  baby: [
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80',
    'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80'
  ],
  nursery: [
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
    'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=800&q=80'
  ],
  garden: [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80'
  ],
  grill: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80'
  ],
  ps5: [
    'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=800&q=80',
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80'
  ],
  nintendo: [
    'https://images.unsplash.com/photo-1578303512597-81e6cc1552c8?w=800&q=80',
    'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&q=80'
  ],
  office: [
    'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80'
  ],
  desks: [
    'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80',
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'
  ],
  chargers: [
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
    'https://images.unsplash.com/photo-1591290619762-c588f7ed7f9a?w=800&q=80'
  ],
  networking: [
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a2?w=800&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80'
  ],
  dinnerware: [
    'https://images.unsplash.com/photo-1578500494198-339d145e32b2?w=800&q=80',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80'
  ]
};

// Realistic review bank
const positiveReviewTitles = [
  'Outstanding build quality and performance',
  'Exceeded every single expectation',
  'Worth every penny — daily driver now',
  'Fast delivery, impeccable packaging',
  'Does exactly what it promises and looks sleek',
  'Solid Amazon-tier experience and reliable build',
  'Best in its category by a long shot',
  'Highly recommended for work and everyday use'
];

const positiveReviewBodies = [
  'I was slightly skeptical before buying, but after two weeks of rigorous daily use, this product has completely won me over. The fit, finish, and materials are noticeably premium.',
  'Arrived in two days via standard delivery. The setup took less than five minutes and the documentation was crystal clear. Exceptional value for the price point.',
  'Solid construction with high attention to detail. Performs reliably day in and day out. The battery life and ergonomics are both top notch.',
  'Purchased this as an upgrade from an older generation, and the difference is night and day. Much lighter, more efficient, and feels distinctly durable in hand.',
  'Clean aesthetics, sturdy materials, and works seamlessly out of the box. Easily five stars from a very discerning customer.'
];

const neutralReviewTitles = [
  'Good product overall with a minor learning curve',
  'Solid performance, though documentation could be better',
  'Decent value for money, 4 out of 5 stars'
];

const neutralReviewBodies = [
  'The core hardware functions great and has been reliable. However, the initial configuration took a little patience. Once dialed in, it does its job well.',
  'Well made and functional. A solid 4-star purchase that meets specifications without flashy gimmicks.'
];

console.log('Seed configuration loaded.');

module.exports = {
  categoryPhotos,
  positiveReviewTitles,
  positiveReviewBodies,
  neutralReviewTitles,
  neutralReviewBodies
};
