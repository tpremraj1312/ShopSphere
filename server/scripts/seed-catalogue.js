require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { sellers, reviewerProfiles, categoryPhotos, departments: extraDepartments } = require('./catalogue');

// Import Mongoose Models
const User = require('../src/modules/users/user.model');
const Product = require('../src/modules/products/product.model');
const Order = require('../src/modules/orders/order.model');
const Review = require('../src/modules/reviews/review.model');

// Define 10 Departments with rich product blueprints (22 per dept approx -> 220 total)
const departments = [
  {
    l1: 'Electronics',
    sellerIndex: 0, // AuraTech Official
    categories: [
      {
        l2: 'Audio & Headphones',
        l3: 'Over-Ear Headphones',
        imageKey: 'headphones',
        items: [
          { title: 'Sony WH-1000XM5 Wireless Noise-Canceling Overhead Headphones', price: 348.00, brand: 'Sony', keywords: ['sony', 'headphones', 'noise cancelling', 'bluetooth', 'anc', 'wireless'] },
          { title: 'Bose QuietComfort 45 Bluetooth Wireless Noise-Cancelling Headphones', price: 279.00, brand: 'Bose', keywords: ['bose', 'quietcomfort', 'headphones', 'wireless', 'anc'] },
          { title: 'Sennheiser Momentum 4 Wireless Audiophile Headphones with 60hr Battery', price: 299.95, brand: 'Sennheiser', keywords: ['sennheiser', 'momentum', 'audiophile', 'headphones', 'long battery'] },
          { title: 'Audio-Technica ATH-M50x Professional Studio Monitor Headphones', price: 149.00, brand: 'Audio-Technica', keywords: ['audio technica', 'ath-m50x', 'studio monitor', 'wired', 'sound engineer'] },
          { title: 'Anker Soundcore Space Q45 Adaptive Active Noise Cancelling Headphones', price: 99.99, brand: 'Anker', keywords: ['anker', 'soundcore', 'headphones', 'affordable', 'noise cancelling'] }
        ]
      },
      {
        l2: 'Audio & Headphones',
        l3: 'Earbuds & In-Ear',
        imageKey: 'headphones',
        items: [
          { title: 'Apple AirPods Pro (2nd Generation) with USB-C MagSafe Charging Case', price: 249.00, brand: 'Apple', keywords: ['apple', 'airpods pro', 'earbuds', 'noise cancelling', 'magsafe'] },
          { title: 'Sony WF-1000XM5 Truly Wireless Earbuds with High-Res Audio', price: 298.00, brand: 'Sony', keywords: ['sony', 'wf-1000xm5', 'earbuds', 'wireless', 'hi-res'] },
          { title: 'Beats Fit Pro True Wireless Noise Cancelling Earbuds with Wingtips', price: 199.95, brand: 'Beats', keywords: ['beats', 'earbuds', 'workout', 'running', 'gym', 'anc'] },
          { title: 'Jabra Elite 8 Active Ultra-Durable Waterproof Sports Earbuds', price: 179.99, brand: 'Jabra', keywords: ['jabra', 'elite', 'waterproof', 'sports', 'dustproof', 'earbuds'] },
          { title: 'Soundcore by Anker Life P3 Noise Cancelling Wireless Earbuds', price: 59.99, brand: 'Anker', keywords: ['anker', 'soundcore', 'earbuds', 'budget', 'wireless', 'bass'] }
        ]
      },
      {
        l2: 'Wearable Technology',
        l3: 'Smartwatches',
        imageKey: 'wearables',
        items: [
          { title: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum with Sport Band', price: 429.00, brand: 'Apple', keywords: ['apple watch', 'smartwatch', 'series 9', 'fitness tracker', 'gps'] },
          { title: 'Garmin Fenix 7 Pro Solar Multisport GPS Smartwatch with Flashlight', price: 699.99, brand: 'Garmin', keywords: ['garmin', 'fenix', 'solar', 'multisport', 'gps', 'running', 'hiking'] },
          { title: 'Samsung Galaxy Watch 6 Classic 47mm Bluetooth Smartwatch', price: 349.99, brand: 'Samsung', keywords: ['samsung', 'galaxy watch', 'rotating bezel', 'smartwatch', 'health'] },
          { title: 'Google Pixel Watch 2 with Heart Rate and Stress Tracking', price: 349.00, brand: 'Google', keywords: ['google', 'pixel watch', 'fitbit', 'heart rate', 'smartwatch'] },
          { title: 'Fitbit Charge 6 Fitness and Health Tracker with 6-Month Premium', price: 139.95, brand: 'Fitbit', keywords: ['fitbit', 'charge 6', 'fitness band', 'heart rate', 'sleep tracker'] },
          { title: 'Oura Ring Gen3 Horizon Titanium Smart Health & Sleep Tracker', price: 349.00, brand: 'Oura', keywords: ['oura ring', 'sleep tracker', 'smart ring', 'biometrics', 'titanium'] }
        ]
      },
      {
        l2: 'Cameras & Photography',
        l3: 'Action & Digital Cameras',
        imageKey: 'cameras',
        items: [
          { title: 'GoPro HERO12 Black Waterproof Action Camera with 5.3K60 Video', price: 349.00, brand: 'GoPro', keywords: ['gopro', 'hero12', 'action cam', '4k', 'waterproof', 'stabilization'] },
          { title: 'DJI Osmo Pocket 3 4K 1-Inch CMOS Sensor Vlogging Camera with Creator Combo', price: 669.00, brand: 'DJI', keywords: ['dji', 'osmo pocket 3', 'vlog', 'gimbal', 'camera', 'creator'] },
          { title: 'Fujifilm X100V Compact Digital Camera with 23mm F2 Lens', price: 1399.00, brand: 'Fujifilm', keywords: ['fujifilm', 'x100v', 'digital camera', 'street photography', 'film simulation'] },
          { title: 'Insta360 X3 360-Degree Action Camera with 1/2-Inch 48MP Sensors', price: 399.99, brand: 'Insta360', keywords: ['insta360', '360 camera', 'action cam', 'waterproof', 'bullet time'] },
          { title: 'Rode VideoMic Pro+ On-Camera Shotgun Microphone with Rycote Lyre', price: 249.00, brand: 'Rode', keywords: ['rode', 'shotgun mic', 'videomic', 'microphone', 'audio recording'] },
          { title: 'Joby GorillaPod 3K Pro Flexible Tripod Rig for Mirrorless Cameras', price: 89.95, brand: 'Joby', keywords: ['joby', 'gorillapod', 'tripod', 'vlogging', 'flexible stand'] }
        ]
      }
    ]
  },
  {
    l1: 'Computers & Office',
    sellerIndex: 1, // Nova Computing Solutions
    categories: [
      {
        l2: 'Keyboards & Typing',
        l3: 'Mechanical Keyboards',
        imageKey: 'keyboards',
        items: [
          { title: 'Keychron Q1 Pro Custom Wireless Mechanical Keyboard (75% Hot-Swap)', price: 199.00, brand: 'Keychron', keywords: ['keychron', 'mechanical keyboard', 'q1 pro', 'wireless', 'hot-swap'] },
          { title: 'Logitech MX Mechanical Wireless Illuminated Keyboard with Tactile Quiet Switches', price: 149.99, brand: 'Logitech', keywords: ['logitech', 'mx mechanical', 'typing', 'low profile', 'bluetooth'] },
          { title: 'Ducky One 3 RGB TKL Hot-Swappable Double-Shot PBT Mechanical Keyboard', price: 129.00, brand: 'Ducky', keywords: ['ducky', 'one 3', 'tkl', 'pbt keycaps', 'gaming keyboard'] },
          { title: 'NuPhy Air75 V2 Ultra-Slim Wireless Mechanical Keyboard with Gateron Low-Profile', price: 119.95, brand: 'NuPhy', keywords: ['nuphy', 'air75', 'low profile', 'slim keyboard', 'mac', 'windows'] },
          { title: 'Drop ALT 65% Aluminum High-Profile Mechanical Keyboard with Cherry MX Brown', price: 180.00, brand: 'Drop', keywords: ['drop', 'alt', 'aluminum keyboard', 'rgb', '65 percent'] }
        ]
      },
      {
        l2: 'Mice & Input Devices',
        l3: 'Ergonomic & Gaming Mice',
        imageKey: 'mice',
        items: [
          { title: 'Logitech MX Master 3S Advanced Wireless Performance Mouse with Quiet Clicks', price: 99.99, brand: 'Logitech', keywords: ['logitech', 'mx master 3s', 'ergonomic mouse', 'bluetooth', 'creator mouse'] },
          { title: 'Razer DeathAdder V3 Pro Wireless Ultra-Lightweight Ergonomic Esports Mouse', price: 149.99, brand: 'Razer', keywords: ['razer', 'deathadder', 'esports', 'lightweight', 'gaming mouse'] },
          { title: 'Logitech Lift Vertical Ergonomic Mouse with 57-Degree Natural Posture Angle', price: 69.99, brand: 'Logitech', keywords: ['logitech', 'vertical mouse', 'ergonomic', 'wrist pain', 'lift'] },
          { title: 'Zowie EC2-C Ergonomic Esports Gaming Mouse with 3360 Optical Sensor', price: 59.99, brand: 'Zowie', keywords: ['zowie', 'ec2-c', 'esports', 'cs2', 'competitive mouse'] },
          { title: 'DeltaHub Carpio 2.0 Ergonomic Gliding Wrist Rest for Computer Mouse', price: 39.90, brand: 'DeltaHub', keywords: ['deltahub', 'wrist rest', 'ergonomic', 'carpal tunnel', 'mouse pad'] }
        ]
      },
      {
        l2: 'Monitors & Displays',
        l3: 'Computer Monitors',
        imageKey: 'monitors',
        items: [
          { title: 'Dell UltraSharp U2723QE 27-Inch 4K UHD IPS Black Monitor with USB-C Hub', price: 549.99, brand: 'Dell', keywords: ['dell', 'ultrasharp', '4k monitor', 'ips black', 'usb-c', 'designer'] },
          { title: 'LG 34GP83A-B 34-Inch 21:9 UltraGear Curved QHD Nano IPS Gaming Monitor', price: 699.99, brand: 'LG', keywords: ['lg', 'ultrawide', 'curved monitor', '144hz', 'gaming', 'nano ips'] },
          { title: 'ASUS ProArt Display PA278CV 27-Inch 1440p Color-Accurate Creator Monitor', price: 289.00, brand: 'ASUS', keywords: ['asus', 'proart', 'color calibrated', '1440p', 'calman verified'] },
          { title: 'BenQ ScreenBar Plus e-Reading LED Monitor Light Lamp with Auto-Dimming', price: 139.00, brand: 'BenQ', keywords: ['benq', 'screenbar', 'desk lamp', 'monitor light', 'eye care'] },
          { title: 'Ergotron LX Single Monitor Arm with Polished Aluminum Desk Clamp Mount', price: 189.95, brand: 'Ergotron', keywords: ['ergotron', 'monitor arm', 'desk mount', 'vesa', 'heavy duty'] },
          { title: 'CalDigit TS4 Thunderbolt 4 18-Port Docking Station with 98W Power Delivery', price: 399.95, brand: 'CalDigit', keywords: ['caldigit', 'ts4', 'thunderbolt 4', 'dock', 'macbook', 'laptop dock'] }
        ]
      },
      {
        l2: 'Laptops & Storage',
        l3: 'External Storage & Drives',
        imageKey: 'laptops',
        items: [
          { title: 'Samsung T7 Shield 2TB Portable Rugged External Solid State Drive (USB 3.2)', price: 189.99, brand: 'Samsung', keywords: ['samsung', 't7', 'ssd', 'portable ssd', 'external drive', 'rugged'] },
          { title: 'SanDisk Extreme 1TB Portable External NVMe SSD with 1050MB/s Read Speed', price: 114.99, brand: 'SanDisk', keywords: ['sandisk', 'extreme ssd', 'nvme', 'portable', 'fast storage'] },
          { title: 'Crucial X9 Pro 2TB Portable SSD with Hardware Encryption and Water Resistance', price: 169.99, brand: 'Crucial', keywords: ['crucial', 'x9 pro', 'external ssd', 'backup', 'high speed'] },
          { title: 'Anker 737 Power Bank (PowerCore 24K) 140W Fast Charger with Smart Display', price: 149.99, brand: 'Anker', keywords: ['anker', 'power bank', 'portable charger', '140w', 'macbook charger'] },
          { title: 'UGREEN 100W GaN Fast Charger with 4-Port Desktop Charging Station', price: 69.99, brand: 'UGREEN', keywords: ['ugreen', 'gan charger', '100w', 'multi-port', 'usb-c charger'] },
          { title: 'Twelve South BookArc Vertical Aluminum Desktop Stand for MacBook', price: 59.99, brand: 'Twelve South', keywords: ['twelve south', 'bookarc', 'macbook stand', 'vertical stand', 'desk setup'] }
        ]
      }
    ]
  },
  {
    l1: 'Home & Kitchen',
    sellerIndex: 2, // Nordic Hearth & Home
    categories: [
      {
        l2: 'Coffee & Tea',
        l3: 'Coffee Grinders & Brewers',
        imageKey: 'coffee',
        items: [
          { title: 'Baratza Encore Conical Burr Coffee Grinder with 40 Grind Settings', price: 149.95, brand: 'Baratza', keywords: ['baratza', 'encore', 'burr grinder', 'coffee', 'espresso', 'french press'] },
          { title: 'Fellow Ode Gen 2 Precision Brewed Coffee Grinder with 64mm Flat Burrs', price: 345.00, brand: 'Fellow', keywords: ['fellow', 'ode', 'coffee grinder', 'flat burrs', 'pour over'] },
          { title: 'Fellow Stagg EKG Electric Gooseneck Kettle for Pour Over Coffee and Tea', price: 165.00, brand: 'Fellow', keywords: ['fellow', 'stagg', 'gooseneck kettle', 'temperature control', 'tea'] },
          { title: 'Breville Barista Touch Espresso Machine with Touch Screen and ThermoJet', price: 999.95, brand: 'Breville', keywords: ['breville', 'espresso machine', 'barista touch', 'latte', 'steamer'] },
          { title: 'AeroPress Clear Coffee Maker - Shatterproof Tritan Portable Espresso Style', price: 49.95, brand: 'AeroPress', keywords: ['aeropress', 'coffee maker', 'portable', 'french press alternative', 'camping'] },
          { title: 'Hario V60 Ceramic Pour Over Coffee Dripper (Size 02, White)', price: 23.50, brand: 'Hario', keywords: ['hario', 'v60', 'pour over', 'ceramic dripper', 'manual brew'] }
        ]
      },
      {
        l2: 'Cookware & Chef Tools',
        l3: 'Pots & Skillets',
        imageKey: 'cookware',
        items: [
          { title: 'All-Clad D3 3-Ply Stainless Steel 10-Inch Fry Pan with Tri-Ply Bonding', price: 119.95, brand: 'All-Clad', keywords: ['all-clad', 'fry pan', 'stainless steel', 'd3', 'skillet', 'induction'] },
          { title: 'Le Creuset Enameled Cast Iron Signature Round Dutch Oven (5.5 Quart, Cerise)', price: 419.95, brand: 'Le Creuset', keywords: ['le creuset', 'dutch oven', 'cast iron', 'enameled', 'braiser', 'stew'] },
          { title: 'Lodge 10.25 Inch Pre-Seasoned Cast Iron Skillet with Silicone Hot Handle', price: 29.90, brand: 'Lodge', keywords: ['lodge', 'cast iron', 'skillet', 'pre-seasoned', 'searing', 'oven safe'] },
          { title: 'Shun Classic 8-Inch Japanese Chef Knife with VG-MAX Damascus Steel', price: 169.95, brand: 'Shun', keywords: ['shun', 'chef knife', 'japanese knife', 'damascus steel', 'kitchen knife'] },
          { title: 'Wüsthof Classic 7-Piece Slim Knife Block Set with High-Carbon German Steel', price: 395.00, brand: 'Wüsthof', keywords: ['wusthof', 'knife set', 'german steel', 'kitchen cutlery', 'block set'] },
          { title: 'John Boos Block Maple Wood Reversible Cutting Board (18x12x1.5 Inches)', price: 98.95, brand: 'John Boos', keywords: ['john boos', 'cutting board', 'maple wood', 'butcher block', 'chef board'] }
        ]
      },
      {
        l2: 'Kitchen Appliances',
        l3: 'Small Countertop Appliances',
        imageKey: 'cookware',
        items: [
          { title: 'Ninja AF101 Air Fryer with 4-Quart Ceramic Coated Basket and Dehydrate Function', price: 89.99, brand: 'Ninja', keywords: ['ninja', 'air fryer', 'crisp', 'roast', 'healthy cooking'] },
          { title: 'Vitamix 5200 Professional-Grade Blender with 64-Ounce Container', price: 499.95, brand: 'Vitamix', keywords: ['vitamix', '5200', 'blender', 'smoothies', 'professional blender', 'food processor'] },
          { title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker (6 Quart Stainless Steel)', price: 79.95, brand: 'Instant Pot', keywords: ['instant pot', 'pressure cooker', 'slow cooker', 'rice maker', 'yogurt'] },
          { title: 'Breville Smart Oven Air Fryer Pro with Super Convection and Element iQ', price: 399.95, brand: 'Breville', keywords: ['breville', 'toaster oven', 'air fryer pro', 'convection', 'baking'] },
          { title: 'KitchenAid Artisan Series 5-Quart Stand Mixer (Empire Red)', price: 449.99, brand: 'KitchenAid', keywords: ['kitchenaid', 'stand mixer', 'artisan', 'baking', 'dough hook', 'whisk'] },
          { title: 'Cuisinart 14-Cup Food Processor with Stainless Steel Chopping Blades', price: 249.95, brand: 'Cuisinart', keywords: ['cuisinart', 'food processor', 'chopper', 'slicer', 'kitchen prep'] }
        ]
      },
      {
        l2: 'Lighting & Decor',
        l3: 'Lamps & Storage',
        imageKey: 'lighting',
        items: [
          { title: 'Brightech Helix Modern LED Floor Lamp with Minimalist Spiral Glow', price: 89.99, brand: 'Brightech', keywords: ['brightech', 'floor lamp', 'modern lamp', 'living room', 'led lighting'] },
          { title: 'Philips Hue White & Color Ambiance Smart LED Starter Kit with Hue Bridge', price: 159.99, brand: 'Philips Hue', keywords: ['philips hue', 'smart light', 'rgb bulbs', 'alexa', 'homekit'] },
          { title: 'Govee RGBIC LED Strip Lights 16.4ft with Segmented Color and Music Sync', price: 39.99, brand: 'Govee', keywords: ['govee', 'led strips', 'tv backlight', 'bedroom lighting', 'music sync'] },
          { title: 'OXO Good Grips 10-Piece Airtight Food Storage POP Container Set', price: 112.95, brand: 'OXO', keywords: ['oxo', 'pop containers', 'pantry storage', 'airtight', 'food organization'] },
          { title: 'Simplehuman 45-Liter Rectangular Step Trash Can with Liner Pocket', price: 139.99, brand: 'Simplehuman', keywords: ['simplehuman', 'trash can', 'stainless steel', 'step can', 'kitchen bin'] },
          { title: 'Vitruvi Stone Ultrasonic Essential Oil Diffuser with Handcrafted Ceramic Basin', price: 123.00, brand: 'Vitruvi', keywords: ['vitruvi', 'diffuser', 'essential oils', 'ceramic', 'aromatherapy'] }
        ]
      }
    ]
  },
  {
    l1: 'Clothing & Fashion',
    sellerIndex: 4, // Urban Threadwork Co.
    categories: [
      {
        l2: "Men's Apparel",
        l3: 'Jackets & Shirts',
        imageKey: 'mensApparel',
        items: [
          { title: 'Patagonia Better Sweater 1/4-Zip Fleece Jacket in Recycled Polyester', price: 139.00, brand: 'Patagonia', keywords: ['patagonia', 'better sweater', 'fleece jacket', 'mens pullover', 'outdoor'] },
          { title: 'The North Face Resolve 2 Waterproof Breathable Hooded Rain Jacket', price: 110.00, brand: 'The North Face', keywords: ['north face', 'rain jacket', 'windbreaker', 'waterproof', 'hooded'] },
          { title: 'Filson Tin Cloth Short Cruiser Canvas Work Jacket with Water Repellence', price: 350.00, brand: 'Filson', keywords: ['filson', 'tin cloth', 'cruiser jacket', 'heritage workwear', 'canvas'] },
          { title: 'Bonobos Stretch Washed Oxford Everyday Button-Down Shirt', price: 89.00, brand: 'Bonobos', keywords: ['bonobos', 'oxford shirt', 'button down', 'stretch cotton', 'office casual'] },
          { title: 'Lululemon ABC Classic-Fit Trouser Warpstreme 32-Inch Inseam', price: 128.00, brand: 'Lululemon', keywords: ['lululemon', 'abc pants', 'warpstreme', 'comfortable chinos', 'travel pant'] }
        ]
      },
      {
        l2: "Women's Apparel",
        l3: 'Activewear & Outerwear',
        imageKey: 'womensApparel',
        items: [
          { title: 'Lululemon Align High-Rise Pant 25-Inch with Ultra-Soft Nulu Fabric', price: 98.00, brand: 'Lululemon', keywords: ['lululemon', 'align leggings', 'yoga pants', 'nulu', 'high rise'] },
          { title: 'Patagonia Nano Puff Lightweight Insulated Windproof Jacket', price: 239.00, brand: 'Patagonia', keywords: ['patagonia', 'nano puff', 'packable jacket', 'puffer jacket', 'hiking jacket'] },
          { title: 'Outdoor Voices Exercise Dress with Built-In Shorts and Pockets', price: 100.00, brand: 'Outdoor Voices', keywords: ['outdoor voices', 'exercise dress', 'athletic dress', 'running dress'] },
          { title: 'Everlane The Oversized Alpaca Crewneck Cozy Knit Sweater', price: 138.00, brand: 'Everlane', keywords: ['everlane', 'alpaca sweater', 'crewneck', 'cozy knit', 'sustainable fashion'] },
          { title: 'Athleta Rainier Joggers with Polartec Power Stretch Warm Fleece', price: 119.00, brand: 'Athleta', keywords: ['athleta', 'rainier joggers', 'fleece joggers', 'running pants', 'activewear'] }
        ]
      },
      {
        l2: 'Footwear & Shoes',
        l3: 'Sneakers & Boots',
        imageKey: 'footwear',
        items: [
          { title: 'On Cloud 5 Lightweight Everyday Running Shoe with Speed Lacing', price: 139.99, brand: 'On', keywords: ['on running', 'cloud 5', 'running shoes', 'walking sneaker', 'cushioned'] },
          { title: 'Hoka Bondi 8 Maximum Cushion Neutral Road Running Shoes', price: 165.00, brand: 'Hoka', keywords: ['hoka', 'bondi 8', 'cushioned shoes', 'road running', 'orthopedic comfort'] },
          { title: 'Blundstone 500 Original Chelsea Boot in Rustic Brown Oiled Leather', price: 219.95, brand: 'Blundstone', keywords: ['blundstone', 'chelsea boot', 'leather boots', 'pull on boots', 'durable'] },
          { title: 'Allbirds Wool Runners Breathable Merino Wool Comfort Sneakers', price: 110.00, brand: 'Allbirds', keywords: ['allbirds', 'wool runners', 'merino wool', 'washable sneaker', 'eco friendly'] },
          { title: 'Red Wing Heritage Iron Ranger 6-Inch Work Boot with Vibram 430 Mini-Lug', price: 349.99, brand: 'Red Wing', keywords: ['red wing', 'iron ranger', 'heritage boot', 'leather work boot', 'resoleable'] },
          { title: 'Birkenstock Arizona Soft Footbed Two-Strap Suede Sandals', price: 140.00, brand: 'Birkenstock', keywords: ['birkenstock', 'arizona', 'sandals', 'cork footbed', 'suede slide'] }
        ]
      },
      {
        l2: 'Watches & Bags',
        l3: 'Leather Goods & Timepieces',
        imageKey: 'watches',
        items: [
          { title: 'Seiko 5 Sports Automatic Stainless Steel Dive-Style Watch with Day-Date', price: 295.00, brand: 'Seiko', keywords: ['seiko', 'seiko 5', 'automatic watch', 'dive watch', 'stainless steel'] },
          { title: 'Hamilton Khaki Field Mechanical 38mm Hand-Wind Military Watch', price: 575.00, brand: 'Hamilton', keywords: ['hamilton', 'khaki field', 'swiss watch', 'mechanical watch', 'military watch'] },
          { title: 'Bellroy Classic Backpack Plus 24L Water-Resistant Laptop Daypack', price: 179.00, brand: 'Bellroy', keywords: ['bellroy', 'backpack', 'laptop bag', 'daypack', 'recycled weave'] },
          { title: 'Bellroy Hide & Seek Slim RFID-Blocking Leather Bifold Wallet', price: 89.00, brand: 'Bellroy', keywords: ['bellroy', 'wallet', 'leather wallet', 'rfid blocking', 'slim wallet'] },
          { title: 'Away The Bigger Carry-On Polycarbonate Hard Shell Spinner Luggage', price: 295.00, brand: 'Away', keywords: ['away', 'carry on', 'suitcase', 'spinner wheels', 'luggage', 'travel'] },
          { title: 'Ray-Ban Classic Aviator Polarized Sunglasses with Gold Metal Frame', price: 221.00, brand: 'Ray-Ban', keywords: ['ray ban', 'aviator', 'sunglasses', 'polarized', 'gold frame'] }
        ]
      }
    ]
  },
  {
    l1: 'Beauty & Personal Care',
    sellerIndex: 5, // Lumina Botanical Care
    categories: [
      {
        l2: 'Skincare',
        l3: 'Serums & Moisturizers',
        imageKey: 'skincare',
        items: [
          { title: 'The Ordinary Niacinamide 10% + Zinc 1% Oil Control Serum (60ml)', price: 10.80, brand: 'The Ordinary', keywords: ['the ordinary', 'niacinamide', 'serum', 'pore refining', 'zinc'] },
          { title: 'Paula\'s Choice Skin Perfecting 2% BHA Liquid Salicylic Acid Exfoliant', price: 35.00, brand: 'Paula\'s Choice', keywords: ['paulas choice', 'bha exfoliant', 'salicylic acid', 'blackhead treatment', 'toner'] },
          { title: 'CeraVe PM Facial Moisturizing Lotion with Ceramides & Hyaluronic Acid', price: 15.99, brand: 'CeraVe', keywords: ['cerave', 'moisturizer', 'night cream', 'ceramides', 'dermatologist recommended'] },
          { title: 'EltaMD UV Clear Broad-Spectrum SPF 46 Facial Mineral Sunscreen', price: 43.00, brand: 'EltaMD', keywords: ['eltamd', 'sunscreen', 'spf 46', 'zinc oxide', 'dermatologist sunscreen'] },
          { title: 'La Roche-Posay Hyalu B5 Pure Hyaluronic Acid Face Serum', price: 39.99, brand: 'La Roche-Posay', keywords: ['la roche posay', 'hyaluronic acid', 'anti aging', 'hydration', 'serum'] }
        ]
      },
      {
        l2: 'Hair & Grooming',
        l3: 'Hair Styling & Oral Care',
        imageKey: 'skincare',
        items: [
          { title: 'Dyson Supersonic Hair Dryer with Intelligent Heat Control and 5 Attachments', price: 429.99, brand: 'Dyson', keywords: ['dyson', 'hair dryer', 'supersonic', 'salon styling', 'fast dry'] },
          { title: 'Olaplex No. 3 Hair Perfector Repairing Treatment (3.3 Fl Oz)', price: 30.00, brand: 'Olaplex', keywords: ['olaplex', 'no 3', 'hair repair', 'bond builder', 'damaged hair'] },
          { title: 'Oral-B iO Series 9 Electric Toothbrush with AI Pressure Sensor and Smart Case', price: 299.99, brand: 'Oral-B', keywords: ['oral-b', 'io series 9', 'electric toothbrush', 'smart brush', 'plaque removal'] },
          { title: 'Waterpik Aquarius Water Flosser with 10 Pressure Settings and 7 Tips', price: 79.99, brand: 'Waterpik', keywords: ['waterpik', 'water flosser', 'dental hygiene', 'floss', 'plaque'] },
          { title: 'Braun Series 9 Pro Electric Foil Shaver with SmartCare Center Station', price: 329.99, brand: 'Braun', keywords: ['braun', 'series 9', 'electric shaver', 'foil razor', 'wet dry shaver'] }
        ]
      },
      {
        l2: 'Fragrances & Wellness',
        l3: 'Eau de Parfum & Oils',
        imageKey: 'skincare',
        items: [
          { title: 'Maison Margiela REPLICAS Jazz Club Eau de Toilette Spray (100ml)', price: 160.00, brand: 'Maison Margiela', keywords: ['maison margiela', 'jazz club', 'cologne', 'eau de toilette', 'tobacco vanille'] },
          { title: 'Diptyque Baies Scented Luxury Candle with Blackcurrant & Rose Notes (190g)', price: 74.00, brand: 'Diptyque', keywords: ['diptyque', 'candle', 'scented candle', 'baies', 'luxury home fragrance'] },
          { title: 'Le Labo Santal 33 Eau de Parfum Travel Spray with Cardamom and Cedar', price: 99.00, brand: 'Le Labo', keywords: ['le labo', 'santal 33', 'perfume', 'travel spray', 'woody scent'] },
          { title: 'Aesop Resurrection Aromatique Hand Wash with Mandarin and Cedar (500ml)', price: 45.00, brand: 'Aesop', keywords: ['aesop', 'hand wash', 'aromatique', 'botanical soap', 'luxury hand soap'] },
          { title: 'L\'Occitane Shea Butter Ultra Rich Body Cream (6.9 Oz)', price: 49.00, brand: 'L\'Occitane', keywords: ['loccitane', 'shea butter', 'body cream', 'dry skin', 'deep moisturizer'] }
        ]
      },
      {
        l2: 'Bath & Body Care',
        l3: 'Soaps & Scrub Treatments',
        imageKey: 'skincare',
        items: [
          { title: 'Nécessaire The Body Wash Multi-Vitamin Cleanser with Niacinamide (Eucalyptus)', price: 28.00, brand: 'Nécessaire', keywords: ['necessaire', 'body wash', 'multivitamin', 'eucalyptus', 'clean beauty'] },
          { title: 'First Aid Beauty KP Bump Eraser Body Scrub with 10% AHA (8 Oz)', price: 30.00, brand: 'First Aid Beauty', keywords: ['first aid beauty', 'bump eraser', 'kp scrub', 'aha exfoliator', 'smooth skin'] },
          { title: 'Molton Brown Re-Charge Black Pepper Luxury Bath & Shower Gel (300ml)', price: 35.00, brand: 'Molton Brown', keywords: ['molton brown', 'shower gel', 'black pepper', 'luxury bath', 'spicy'] },
          { title: 'L\'Occitane Amande Shower Oil with Almond Oil Hydration (500ml)', price: 46.00, brand: 'L\'Occitane', keywords: ['loccitane', 'almond shower oil', 'cleansing oil', 'silky body wash'] },
          { title: 'Jack Black Double-Duty Face Moisturizer SPF 20 with Blue Algae', price: 32.00, brand: 'Jack Black', keywords: ['jack black', 'mens moisturizer', 'spf 20', 'sunscreen lotion', 'daily care'] }
        ]
      }
    ]
  },
  {
    l1: 'Sports & Outdoors',
    sellerIndex: 3, // Apex Trail & Athletic
    categories: [
      {
        l2: 'Fitness & Gym',
        l3: 'Weights & Training Equipment',
        imageKey: 'fitness',
        items: [
          { title: 'Bowflex SelectTech 552 Adjustable Dumbbells (Pair, 5 to 52.5 lbs)', price: 429.00, brand: 'Bowflex', keywords: ['bowflex', 'dumbbells', 'adjustable weights', 'home gym', 'strength training'] },
          { title: 'Manduka PRO Yoga Mat 6mm High-Density Cushioning Non-Slip', price: 138.00, brand: 'Manduka', keywords: ['manduka', 'pro yoga mat', 'thick yoga mat', 'pilates', 'non slip mat'] },
          { title: 'Therabody Theragun Prime Deep Tissue Percussive Therapy Massage Gun', price: 299.00, brand: 'Therabody', keywords: ['theragun', 'massage gun', 'recovery', 'percussive therapy', 'sore muscles'] },
          { title: 'Rogue Fitness Ohio Bar 20KG Stainless Steel Olympic Barbell', price: 395.00, brand: 'Rogue', keywords: ['rogue fitness', 'ohio bar', 'olympic barbell', 'powerlifting', 'crossfit'] },
          { title: 'Iron Gym Total Upper Body Workout Doorway Pull-Up Bar', price: 34.99, brand: 'Iron Gym', keywords: ['pull up bar', 'doorway gym', 'chin up', 'bodyweight', 'upper body'] },
          { title: 'TRX All-in-One Suspension Trainer Full Body Resistance System', price: 179.95, brand: 'TRX', keywords: ['trx', 'suspension trainer', 'resistance bands', 'travel gym', 'calisthenics'] }
        ]
      },
      {
        l2: 'Camping & Hiking',
        l3: 'Tents & Packs',
        imageKey: 'camping',
        items: [
          { title: 'Big Agnes Copper Spur HV UL2 Ultralight 2-Person Backpacking Tent', price: 499.95, brand: 'Big Agnes', keywords: ['big agnes', 'copper spur', 'ultralight tent', 'backpacking', 'camping tent'] },
          { title: 'Osprey Atmos AG 65 Men\'s Backpacking Pack with Anti-Gravity Suspension', price: 340.00, brand: 'Osprey', keywords: ['osprey', 'atmos 65', 'backpacking backpack', 'hiking pack', 'internal frame'] },
          { title: 'MSR PocketRocket 2 Ultralight Micro Backpacking Stove', price: 49.95, brand: 'MSR', keywords: ['msr', 'pocketrocket', 'camp stove', 'backpacking stove', 'burner'] },
          { title: 'Nemo Disco 15-Degree Down Sleeping Bag with Spoon Shape Comfort', price: 319.95, brand: 'Nemo', keywords: ['nemo', 'sleeping bag', '15 degree', 'down bag', 'cold weather camping'] },
          { title: 'Black Diamond Trail Pro Shock Trekking Poles (Pair with FlickLock Pro)', price: 159.95, brand: 'Black Diamond', keywords: ['black diamond', 'trekking poles', 'hiking sticks', 'carbon fiber', 'shock absorbing'] },
          { title: 'YETI Tundra 45 Hard Cooler with PermaFrost Insulation (Desert Tan)', price: 325.00, brand: 'YETI', keywords: ['yeti', 'tundra 45', 'cooler', 'ice chest', 'heavy duty cooler', 'tailgating'] }
        ]
      },
      {
        l2: 'Hydration & Cycling',
        l3: 'Bottles & Bike Gear',
        imageKey: 'fitness',
        items: [
          { title: 'Hydro Flask 32 oz Wide Mouth Vacuum Insulated Stainless Steel Bottle', price: 44.95, brand: 'Hydro Flask', keywords: ['hydro flask', 'water bottle', 'insulated bottle', 'stainless steel', '32 oz'] },
          { title: 'Stanley Quencher H2.0 FlowState Stainless Steel Tumbler (40 oz)', price: 45.00, brand: 'Stanley', keywords: ['stanley', 'quencher', 'tumbler', 'cup with straw', 'cold drinks', '40oz'] },
          { title: 'Garmin Edge 540 Solar GPS Cycling Computer with Button Controls', price: 449.99, brand: 'Garmin', keywords: ['garmin', 'edge 540', 'bike computer', 'gps cycling', 'speedometer'] },
          { title: 'Topeak Alien II 26-Function Professional Folding Bicycle Multi-Tool', price: 49.95, brand: 'Topeak', keywords: ['topeak', 'bike tool', 'multi-tool', 'chain breaker', 'hex wrench'] },
          { title: 'Kryptonite New York Fahgettaboudit 14mm Hardened Steel Bike U-Lock', price: 144.95, brand: 'Kryptonite', keywords: ['kryptonite', 'bike lock', 'u-lock', 'security lock', 'anti-theft'] }
        ]
      }
    ]
  },
  {
    l1: 'Books & Literature',
    sellerIndex: 6, // Athenaeum Books & Media
    categories: [
      {
        l2: 'Technology & Programming',
        l3: 'Software Engineering',
        imageKey: 'books',
        items: [
          { title: 'Designing Data-Intensive Applications: The Big Ideas Behind Reliable Systems', price: 42.99, brand: 'O\'Reilly', keywords: ['designing data intensive', 'martin kleppmann', 'distributed systems', 'database', 'architecture'] },
          { title: 'Clean Architecture: A Craftsman\'s Guide to Software Structure and Design', price: 34.50, brand: 'Pearson', keywords: ['clean architecture', 'robert martin', 'software engineering', 'oop', 'design patterns'] },
          { title: 'The Pragmatic Programmer: Your Journey to Mastery (20th Anniversary Edition)', price: 39.95, brand: 'Addison-Wesley', keywords: ['pragmatic programmer', 'andy hunt', 'coding best practices', 'developer tips'] },
          { title: 'Staff Engineer: Leadership Beyond the Management Track by Will Larson', price: 29.99, brand: 'Tanya Books', keywords: ['staff engineer', 'will larson', 'engineering leadership', 'principal engineer'] },
          { title: 'System Design Interview – An Insider\'s Guide (Volume 1 & 2) by Alex Xu', price: 49.95, brand: 'ByteDance Press', keywords: ['system design', 'alex xu', 'interview prep', 'scalability', 'distributed systems'] }
        ]
      },
      {
        l2: 'Business & Startups',
        l3: 'Leadership & Strategy',
        imageKey: 'books',
        items: [
          { title: 'Zero to One: Notes on Startups, or How to Build the Future by Peter Thiel', price: 19.99, brand: 'Crown', keywords: ['zero to one', 'peter thiel', 'startups', 'entrepreneurship', 'innovation'] },
          { title: 'The Hard Thing About Hard Things: Building a Business When There Are No Easy Answers', price: 21.99, brand: 'Harper Business', keywords: ['ben horowitz', 'hard thing about hard things', 'a16z', 'ceo', 'startup lessons'] },
          { title: 'Principles: Life and Work by Ray Dalio (Hardcover Edition)', price: 24.99, brand: 'Simon & Schuster', keywords: ['principles', 'ray dalio', 'bridgewater', 'decision making', 'hedge fund'] },
          { title: 'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones', price: 18.00, brand: 'Avery', keywords: ['atomic habits', 'james clear', 'productivity', 'self improvement', 'daily routine'] },
          { title: 'Deep Work: Rules for Focused Success in a Distracted World by Cal Newport', price: 20.95, brand: 'Grand Central', keywords: ['deep work', 'cal newport', 'focus', 'time management', 'concentration'] }
        ]
      },
      {
        l2: 'Science Fiction & Classics',
        l3: 'Fiction & Literature',
        imageKey: 'books',
        items: [
          { title: 'Dune Deluxe Hardcover Collector\'s Edition by Frank Herbert', price: 32.50, brand: 'Ace Books', keywords: ['dune', 'frank herbert', 'sci-fi', 'deluxe edition', 'arrakis', 'hardcover'] },
          { title: 'Project Hail Mary: A Novel by Andy Weir (Author of The Martian)', price: 22.00, brand: 'Ballantine', keywords: ['project hail mary', 'andy weir', 'hard science fiction', 'space', 'martian'] },
          { title: 'The Three-Body Problem (Remembrance of Earth\'s Past) by Cixin Liu', price: 19.99, brand: 'Tor Books', keywords: ['three body problem', 'cixin liu', 'hugo award', 'physics', 'alien invasion'] },
          { title: '1984 & Animal Farm: 75th Anniversary Hardcover Commemorative Edition', price: 25.00, brand: 'Signet Classics', keywords: ['1984', 'george orwell', 'dystopian', 'animal farm', 'classic literature'] },
          { title: 'The Lord of the Rings 70th Anniversary Illustrated Deluxe Box Set', price: 95.00, brand: 'William Morrow', keywords: ['lord of the rings', 'tolkien', 'fantasy', 'box set', 'middle earth'] },
          { title: 'Sapiens: A Brief History of Humankind by Yuval Noah Harari', price: 21.99, brand: 'Harper', keywords: ['sapiens', 'yuval noah harari', 'anthropology', 'human history', 'evolution'] }
        ]
      },
      {
        l2: 'Design & Creative',
        l3: 'Design & Typography',
        imageKey: 'books',
        items: [
          { title: 'The Design of Everyday Things: Revised and Expanded by Don Norman', price: 22.50, brand: 'Basic Books', keywords: ['design of everyday things', 'don norman', 'ux design', 'product design', 'usability'] },
          { title: 'Grid Systems in Graphic Design by Josef Müller-Brockmann', price: 49.95, brand: 'Niggli', keywords: ['grid systems', 'graphic design', 'swiss typography', 'layout', 'design reference'] },
          { title: 'Thinking with Type: A Critical Guide for Designers, Writers, and Editors', price: 24.95, brand: 'Princeton Arch', keywords: ['thinking with type', 'ellen lupton', 'typography', 'fonts', 'graphic design'] },
          { title: 'Refactoring UI: Complete Digital & Print Edition by Adam Wathan & Steve Schoger', price: 79.00, brand: 'Tailwind Press', keywords: ['refactoring ui', 'adam wathan', 'steve schoger', 'web design', 'ui design'] },
          { title: 'Steal Like an Artist: 10 Things Nobody Told You About Being Creative by Austin Kleon', price: 13.95, brand: 'Workman', keywords: ['steal like an artist', 'austin kleon', 'creativity', 'art', 'inspiration'] },
          { title: 'Universal Principles of Design: 125 Ways to Enhance Usability and Influence', price: 26.99, brand: 'Rockport', keywords: ['universal principles of design', 'william lidwell', 'industrial design', 'heuristics'] }
        ]
      }
    ]
  },
  {
    l1: 'Toys & Games',
    sellerIndex: 6, // Athenaeum Books & Media
    categories: [
      {
        l2: 'Board Games & Strategy',
        l3: 'Tabletop Games',
        imageKey: 'toys',
        items: [
          { title: 'Catan 3D Edition Luxury Tabletop Strategy Board Game', price: 299.99, brand: 'Catan Studio', keywords: ['catan', '3d edition', 'board game', 'settlers of catan', 'strategy game'] },
          { title: 'Ticket to Ride Europe 15th Anniversary Deluxe Collector\'s Edition', price: 99.95, brand: 'Days of Wonder', keywords: ['ticket to ride', 'board game', 'trains', 'family game', 'strategy'] },
          { title: 'Terraforming Mars Strategy Board Game with Custom Resource Trays', price: 69.95, brand: 'Stronghold Games', keywords: ['terraforming mars', 'sci-fi board game', 'card drafting', 'engine builder'] },
          { title: 'Wingspan Board Game with 170 Illustrated Bird Cards and Custom Dice Tower', price: 55.00, brand: 'Stonemaier Games', keywords: ['wingspan', 'bird watching', 'engine building', 'award winning board game'] },
          { title: 'Azul Tile Placement Strategy Game with High-Density Resin Tiles', price: 39.99, brand: 'Next Move Games', keywords: ['azul', 'tile placement', 'family board game', 'abstract strategy'] },
          { title: 'Cascadia Pacific Northwest Ecosystem Pattern Building Tile Game', price: 36.95, brand: 'Flatout Games', keywords: ['cascadia', 'nature game', 'tile placement', 'spiel des jahres winner'] }
        ]
      },
      {
        l2: 'STEM & Robotics',
        l3: 'Educational Kits',
        imageKey: 'toys',
        items: [
          { title: 'LEGO Technic NASA Mars Rover Perseverance 42158 Building Kit', price: 99.99, brand: 'LEGO', keywords: ['lego', 'technic', 'mars rover', 'perseverance', 'stem toy', 'building blocks'] },
          { title: 'Elegoo Mega 2560 Project Complete Starter Kit with 200 Components and Tutorial', price: 59.99, brand: 'Elegoo', keywords: ['elegoo', 'arduino kit', 'stem', 'robotics', 'electronics learning'] },
          { title: 'ROKR 3D Wooden Mechanical Marble Run Puzzle Craft Kit with Steel Marbles', price: 45.99, brand: 'ROKR', keywords: ['rokr', 'marble run', 'wooden puzzle', '3d puzzle', 'mechanical model'] },
          { title: 'Snap Circuits Jr. SC-100 Electronics Exploration Kit with 100+ Projects', price: 34.95, brand: 'Elenco', keywords: ['snap circuits', 'electronics for kids', 'stem kit', 'physics learning'] },
          { title: 'Sphero BOLT App-Enabled Programmable Robotic Ball with Infrared Sensors', price: 149.99, brand: 'Sphero', keywords: ['sphero', 'bolt', 'coding robot', 'stem education', 'programmable'] },
          { title: 'Thames & Kosmos Remote-Control Machines Custom Robotics Building Experiment Kit', price: 79.95, brand: 'Thames & Kosmos', keywords: ['thames and kosmos', 'robotics', 'engineering kit', 'remote control'] },
          { title: 'Turing Tumble: Build Mechanical Logic Computers Powered by Marbles', price: 69.95, brand: 'Upper Story', keywords: ['turing tumble', 'logic puzzle', 'computer science toy', 'marbles'] }
        ]
      },
      {
        l2: 'Puzzles & Brain Teasers',
        l3: 'Wooden & Jigsaw Puzzles',
        imageKey: 'toys',
        items: [
          { title: 'Ida Toy Handcrafted Cluebox Wooden Escape Room Puzzle in a Box (Captain Nemo)', price: 42.99, brand: 'Ida Toy', keywords: ['cluebox', 'escape room box', 'puzzle box', 'wooden brain teaser'] },
          { title: 'Hanayama Cast Metal Brain Teaser Puzzle Level 6 (Grand Master Difficulty)', price: 18.50, brand: 'Hanayama', keywords: ['hanayama', 'cast puzzle', 'metal brain teaser', 'desk toy'] },
          { title: 'Ravensburger 1000 Piece Yosemite National Park Premium Jigsaw Puzzle with Softclick', price: 24.99, brand: 'Ravensburger', keywords: ['ravensburger', 'jigsaw puzzle', '1000 pieces', 'yosemite', 'national parks'] },
          { title: 'Rubik\'s Connected Bluetooth Smart 3x3 Speed Cube with Mobile App Training', price: 49.99, brand: 'Rubik\'s', keywords: ['rubiks cube', 'smart cube', 'speed cube', 'bluetooth puzzle', 'timer'] },
          { title: 'Perplexus Epic 3D Maze Gravity Sphere Puzzle with 125 Challenging Obstacles', price: 29.99, brand: 'Spin Master', keywords: ['perplexus', 'gravity maze', '3d puzzle', 'sphere', 'brain teaser'] },
          { title: 'Wooden City V8 Engine Mechanical Working Model Wooden Assembly Kit', price: 68.00, brand: 'Wooden City', keywords: ['wooden model', 'v8 engine', 'laser cut', 'mechanical model'] },
          { title: 'DaVinci Cryptex Lock Antique Style Password Combination Storage Puzzle', price: 38.00, brand: 'DaVinci Lab', keywords: ['cryptex', 'davinci code', 'combination lock', 'brass puzzle'] }
        ]
      }
    ]
  },
  {
    l1: 'Health & Household',
    sellerIndex: 2, // Nordic Hearth & Home
    categories: [
      {
        l2: 'Air Quality & Environment',
        l3: 'Air Purifiers & Humidifiers',
        imageKey: 'lighting',
        items: [
          { title: 'Levoit Core 400S Smart True HEPA Air Purifier with QuietKEAP (403 sq ft)', price: 219.99, brand: 'Levoit', keywords: ['levoit', 'air purifier', 'true hepa', 'allergies', 'pollen', 'smart filter'] },
          { title: 'Coway Airmega AP-1512HH Mighty True HEPA Air Purifier with Eco Mode', price: 199.00, brand: 'Coway', keywords: ['coway', 'airmega', 'hepa purifier', 'smoke filter', 'dust collector'] },
          { title: 'Dyson Purifier Hot+Cool HP07 Formaldehyde Air Purifying Fan and Heater', price: 699.99, brand: 'Dyson', keywords: ['dyson', 'air purifier heater', 'hp07', 'smart fan', 'formaldehyde filter'] },
          { title: 'Levoit OasisMist 4.5L Smart Warm and Cool Ultrasonic Mist Humidifier', price: 79.99, brand: 'Levoit', keywords: ['levoit', 'humidifier', 'ultrasonic', 'warm mist', 'dry winter', 'plants'] },
          { title: 'Airthings Wave Plus Radon & Indoor Air Quality Monitor with TVOC and CO2', price: 229.00, brand: 'Airthings', keywords: ['airthings', 'radon monitor', 'air quality', 'co2 sensor', 'smart home'] }
        ]
      },
      {
        l2: 'Ergonomics & Posture',
        l3: 'Support Pillows & Mats',
        imageKey: 'fitness',
        items: [
          { title: 'Everlasting Comfort Memory Foam Seat Cushion for Office Chair Back Relief', price: 39.95, brand: 'Everlasting Comfort', keywords: ['seat cushion', 'memory foam', 'orthopedic', 'sciatica relief', 'office chair'] },
          { title: 'Toplux Ergonomic Memory Foam Lumbar Support Pillow with Dual Adjustable Straps', price: 34.99, brand: 'Toplux', keywords: ['lumbar support', 'back cushion', 'ergonomic pillow', 'desk posture'] },
          { title: 'Sky Solutions Anti-Fatigue Standing Desk Mat (20x39 Inch, Commercial Grade)', price: 54.99, brand: 'Sky Solutions', keywords: ['standing desk mat', 'anti fatigue', 'kitchen mat', 'knee relief'] },
          { title: 'ProsourceFit Acupressure Mat and Neck Pillow Set for Muscle Tension Relief', price: 29.99, brand: 'ProsourceFit', keywords: ['acupressure mat', 'muscle tension', 'back pain', 'acupuncture pillow'] },
          { title: 'TheraICE Form-Fitting Gel Headache and Migraine Ice Relief Compression Cap', price: 39.95, brand: 'TheraICE', keywords: ['migraine cap', 'headache relief', 'cooling mask', 'cold compression'] }
        ]
      },
      {
        l2: 'Household Supplies',
        l3: 'Eco Cleaners & Paper',
        imageKey: 'cookware',
        items: [
          { title: 'EarthBreeze Eco-Friendly Zero-Waste Liquidless Laundry Detergent Sheets (60 Loads)', price: 19.99, brand: 'EarthBreeze', keywords: ['earthbreeze', 'laundry sheets', 'zero waste', 'eco detergent', 'plastic free'] },
          { title: 'Swedish Dishcloth Cellulose Cleaning Sponges Pack of 10 Reusable Kitchen Towels', price: 18.95, brand: 'Swedish Cloth', keywords: ['swedish dishcloth', 'reusable sponge', 'kitchen cloth', 'biodegradable'] },
          { title: 'Method All-Purpose Surface Cleaner Spray French Lavender (Pack of 3, 28 Oz)', price: 16.50, brand: 'Method', keywords: ['method cleaner', 'surface spray', 'lavender', 'plant based', 'cleaning'] },
          { title: 'Bissell Little Green Multi-Purpose Portable Carpet and Upholstery Cleaner', price: 123.59, brand: 'Bissell', keywords: ['bissell', 'little green', 'carpet cleaner', 'spot cleaner', 'pet stains'] },
          { title: 'Puracy Natural Dish Soap Sulfate-Free Green Tea & Lime (Pack of 3, 16 Oz)', price: 21.99, brand: 'Puracy', keywords: ['puracy', 'dish soap', 'natural soap', 'gentle on hands', 'eco friendly'] }
        ]
      },
      {
        l2: 'Daily Essentials',
        l3: 'Storage & Organization',
        imageKey: 'skincare',
        items: [
          { title: 'Apex 7-Day Ultra Bubble Pill Organizer with Ergonomic Push-Button Openers', price: 12.99, brand: 'Apex Health', keywords: ['pill organizer', 'medication reminder', '7 day box', 'weekly vitamins'] },
          { title: 'Etekcity Digital Food Kitchen Scale with High Precision Sensors (0.1g / 11lbs)', price: 14.99, brand: 'Etekcity', keywords: ['kitchen scale', 'digital scale', 'food weighing', 'baking scale'] },
          { title: 'Braun ThermoScan 7 Ear Thermometer with Age Precision Color Coded Display', price: 54.99, brand: 'Braun', keywords: ['braun', 'ear thermometer', 'thermoscan 7', 'fever reader', 'pediatric'] },
          { title: 'FitIndex Bluetooth Smart Body Fat Digital Scale with 13 Essential Metrics', price: 24.99, brand: 'FitIndex', keywords: ['smart scale', 'body fat', 'bmi monitor', 'weight scale', 'sync with apple health'] },
          { title: 'Pure Enrichment PureRelief Extra-Long Electric Heating Pad with 6 Heat Settings', price: 39.99, brand: 'Pure Enrichment', keywords: ['heating pad', 'electric wrap', 'back cramps', 'moist heat therapy'] }
        ]
      }
    ]
  },
  {
    l1: 'Automotive & Tools',
    sellerIndex: 7, // Apex Motor & Workshop
    categories: [
      {
        l2: 'Power Tools',
        l3: 'Drills & Multi-Tools',
        imageKey: 'tools',
        items: [
          { title: 'DeWalt 20V MAX XR Brushless Cordless Compact Drill / Driver Kit with 2 Batteries', price: 179.00, brand: 'DeWalt', keywords: ['dewalt', '20v max', 'cordless drill', 'brushless driver', 'power tools'] },
          { title: 'Milwaukee M18 FUEL 1/2-Inch High Torque Impact Wrench with Friction Ring', price: 299.00, brand: 'Milwaukee', keywords: ['milwaukee', 'm18 fuel', 'impact wrench', 'mechanic tools', 'lug nuts'] },
          { title: 'Dremel 4300 High-Performance Rotary Tool Kit with Universal Keyless Chuck (45 Pieces)', price: 119.99, brand: 'Dremel', keywords: ['dremel', 'rotary tool', 'carving', 'grinding', 'polishing kit'] },
          { title: 'Bosch 12V Max Pocket Driver Kit with 2 Lithium-Ion Batteries and Soft Case', price: 99.00, brand: 'Bosch', keywords: ['bosch', 'pocket driver', '12v drill', 'cabinet making', 'precision drill'] },
          { title: 'Makita 18V LXT Lithium-Ion Brushless Cordless Variable Speed Random Orbit Sander', price: 149.00, brand: 'Makita', keywords: ['makita', 'orbit sander', 'woodworking', 'dust collection', '18v lxt'] }
        ]
      },
      {
        l2: 'Hand Tools & Mechanics',
        l3: 'Tool Sets & Storage',
        imageKey: 'tools',
        items: [
          { title: 'DEWALT Mechanics Tool Set 168-Piece Chrome Vanadium with Heavy-Duty Case', price: 149.99, brand: 'DeWalt', keywords: ['dewalt', 'mechanics set', 'socket set', 'ratchet', 'metric and sae'] },
          { title: 'Knipex 10-Inch Cobra High-Tech Water Pump Pliers with Quick-Set Push Button', price: 44.95, brand: 'Knipex', keywords: ['knipex', 'cobra pliers', 'german hand tools', 'pipe wrench', 'locking pliers'] },
          { title: 'Wera Kraftform Kompakt 25 Ratcheting Screwdriver Set with Rapidaptor Chuck', price: 48.50, brand: 'Wera', keywords: ['wera', 'screwdriver set', 'ratcheting', 'kraftform', 'precision bits'] },
          { title: 'Tekton 3/8-Inch Drive Micrometer Click Torque Wrench (10-80 Foot-Pounds)', price: 45.00, brand: 'Tekton', keywords: ['tekton', 'torque wrench', 'click wrench', 'spark plugs', 'lug bolts'] },
          { title: 'Klein Tools 8-in-1 HVAC Multi-Bit Screwdriver and Hex Nut Driver', price: 19.97, brand: 'Klein Tools', keywords: ['klein tools', 'electrician tools', 'multi screwdriver', 'nut driver', 'hvac'] }
        ]
      },
      {
        l2: 'Car Electronics',
        l3: 'Dash Cams & Adapters',
        imageKey: 'auto',
        items: [
          { title: 'VIOFO A129 Pro Duo 4K Front and 1080P Rear Dual Dash Cam with Sony Sensor and GPS', price: 249.99, brand: 'VIOFO', keywords: ['viofo', 'dash cam', '4k front rear', 'sony starvis', 'parking mode', 'gps'] },
          { title: 'Garmin Dash Cam Mini 2 Tiny Key-Sized 1080p Camera with Voice Control', price: 129.99, brand: 'Garmin', keywords: ['garmin', 'dash cam mini', 'compact dash cam', '1080p', 'voice commands'] },
          { title: 'Carlinkit 5.0 Wireless CarPlay & Android Auto 2Air Adapter for Factory Wired Cars', price: 79.99, brand: 'Carlinkit', keywords: ['carlinkit', 'wireless carplay', 'android auto', 'bluetooth car adapter'] },
          { title: 'NOCO Boost Plus GB40 1000 Amp 12V UltraSafe Lithium Jump Starter Box', price: 99.95, brand: 'NOCO', keywords: ['noco', 'jump starter', 'car battery booster', 'portable jump box', 'emergency power'] },
          { title: 'AstroAI Digital Tire Inflator Portable Air Compressor 12V DC with Auto Shut-Off', price: 34.99, brand: 'AstroAI', keywords: ['astroai', 'tire inflator', 'air compressor', '12v car pump', 'digital gauge'] }
        ]
      },
      {
        l2: 'Car Detailing & Care',
        l3: 'Cleaning & Wash Supplies',
        imageKey: 'auto',
        items: [
          { title: 'Chemical Guys HydroSlick SiO2 Ceramic Coating HyperWax (16 Fl Oz)', price: 39.99, brand: 'Chemical Guys', keywords: ['chemical guys', 'hydroslick', 'ceramic coating', 'car wax', 'high gloss shine'] },
          { title: 'Chemical Guys Mr. Pink Super Suds Car Wash Soap (1 Gallon, Surface Safe)', price: 29.99, brand: 'Chemical Guys', keywords: ['chemical guys', 'mr pink', 'car soap', 'foam cannon', 'wash shampoo'] },
          { title: 'ThisWorx High-Powered Handheld Car Vacuum Cleaner with 16ft Cord and Attachments', price: 37.99, brand: 'ThisWorx', keywords: ['thisworx', 'car vacuum', 'handheld cleaner', '12v vacuum', 'car interior detailing'] },
          { title: 'Meguiar\'s Ultimate Quik Detailer Hydrophobic Polymer Surface Spray (24 Oz)', price: 15.99, brand: 'Meguiar\'s', keywords: ['meguiars', 'quik detailer', 'spray wax', 'water beading', 'car cleaning'] },
          { title: 'Torq TORQ22D Random Orbital Dual-Action Professional Car Polisher Buffer Kit', price: 179.99, brand: 'Torq', keywords: ['torq', 'car buffer', 'dual action polisher', 'swirl remover', 'paint correction'] }
        ]
      }
    ]
  }
];

const allDepartments = departments.concat(extraDepartments);

// Helper to generate a multi-paragraph, professional Amazon-style description with specifications
function generateProductDescription(item, category) {
  const overview = item.blurb
    ? item.blurb
    : `The ${item.title} from ${item.brand} is a currently sold retail product in ${category.l2}.`;
  const keywordLine = (item.keywords || []).slice(0, 8).join(', ');
  return `### About this item
${overview}

This listing uses the live retail name, typical street price, and published details for a product you can find at major marketplaces. Sold by ${item.brand} in the ${category.l2} department.

### Highlights
- Brand: ${item.brand}
- Path: ${category.l1} > ${category.l2} > ${category.l3}
- Shoppers also search: ${keywordLine || category.l2}

### Product details
- Manufacturer: ${item.brand}
- Item model: ${item.title.split(' ').slice(0, 6).join(' ')}
- Warranty: 12-month limited manufacturer warranty where offered
- Returns: 30-day ShopSphere returns on unused items in original packaging

### What's in the box
1x ${item.title}, manufacturer documentation, and the accessories included with the retail SKU.`;
}

// Helper to pick random element
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate realistic date between daysAgo and daysAgo-10
function randomDate(minDaysAgo, maxDaysAgo) {
  const now = Date.now();
  const diff = (minDaysAgo + Math.random() * (maxDaysAgo - minDaysAgo)) * 24 * 60 * 60 * 1000;
  return new Date(now - diff);
}

async function seedCatalogue() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB successfully.');

  console.log('--- Step 1: Ensuring Sellers & Reviewer Accounts Exist ---');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const sellerDocs = [];
  for (const s of sellers) {
    let user = await User.findOne({ email: s.email });
    if (!user) {
      user = await User.create({
        email: s.email,
        passwordHash,
        role: 'seller',
        emailVerified: true,
        sellerProfile: {
          storeName: s.storeName,
          description: s.description,
          status: 'approved',
          appliedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          approvedAt: new Date(Date.now() - 179 * 24 * 60 * 60 * 1000)
        }
      });
      console.log(`Created Seller: ${s.storeName} (${s.email})`);
    } else {
      user.role = 'seller';
      user.sellerProfile = {
        storeName: s.storeName,
        description: s.description,
        status: 'approved'
      };
      await user.save();
    }
    sellerDocs.push(user);
  }

  const customerDocs = [];
  for (const r of reviewerProfiles) {
    let customer = await User.findOne({ email: r.email });
    if (!customer) {
      customer = await User.create({
        email: r.email,
        passwordHash,
        role: 'customer',
        emailVerified: true,
        addresses: [
          {
            street: '742 Evergreen Terrace',
            city: 'Seattle',
            state: 'WA',
            postalCode: '98101',
            country: 'US',
            isDefault: true
          }
        ]
      });
    }
    customerDocs.push(customer);
  }
  console.log(`Verified ${customerDocs.length} customer reviewer accounts.`);

  console.log('--- Step 2: Clearing Existing Catalogue Products for Clean Slate ---');
  const existingCount = await Product.countDocuments();
  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing products. Clearing old products, reviews, and test orders...`);
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared old catalogue data.');
  }

  console.log('--- Step 3: Generating 500+ live-market products across departments ---');
  const productInsertions = [];
  let totalProductIndex = 0;

  for (const dept of allDepartments) {
    const seller = sellerDocs[dept.sellerIndex] || sellerDocs[0];

    for (const cat of dept.categories) {
      const photos = categoryPhotos[cat.imageKey] || categoryPhotos.headphones;

      for (let i = 0; i < cat.items.length; i++) {
        totalProductIndex++;
        const item = cat.items[i];
        const pLen = photos.length;
        const primary = item.image || photos[i % pLen];
        const v1Images = [
          primary,
          photos[(i + 1) % pLen],
          photos[(i + 2) % pLen],
          photos[(i + 3) % pLen]
        ].filter(Boolean);

        const v2Images = [
          photos[(i + 1) % pLen],
          primary,
          photos[(i + 2) % pLen],
          photos[(i + 3) % pLen]
        ].filter(Boolean);

        const skuBase = `${dept.l1.substring(0, 3).toUpperCase()}-${cat.l3.substring(0, 3).toUpperCase()}-${String(totalProductIndex).padStart(4, '0')}`;

        // Create 2 variants per product (Standard / Deluxe or Color)
        const variants = [
          {
            sku: `${skuBase}-STD`,
            attributes: new Map([
              ['Edition', 'Standard Edition'],
              ['Color', 'Matte Black']
            ]),
            price: item.price,
            stock: 35 + (totalProductIndex * 3) % 120,
            images: v1Images
          },
          {
            sku: `${skuBase}-DLX`,
            attributes: new Map([
              ['Edition', 'Special Deluxe'],
              ['Color', 'Midnight Platinum']
            ]),
            price: Number((item.price * 1.15).toFixed(2)),
            stock: 15 + (totalProductIndex * 2) % 60,
            images: v2Images
          }
        ];

        const productCreationDate = randomDate(30, 120);

        // Generate realistic specs based on category
        const specsMap = new Map();
        specsMap.set('Brand', item.brand);
        specsMap.set('Category', `${dept.l1} > ${cat.l2}`);
        specsMap.set('Model', item.title.split(' ').slice(0, 3).join(' '));
        specsMap.set('Warranty', '12-Month Limited Warranty');
        specsMap.set('Country of Origin', pick(['USA', 'Japan', 'Germany', 'South Korea', 'China', 'Taiwan']));
        specsMap.set('Item Weight', `${(0.2 + Math.random() * 4.8).toFixed(1)} lbs`);
        specsMap.set('Package Dimensions', `${(4 + Math.random() * 12).toFixed(1)} x ${(3 + Math.random() * 8).toFixed(1)} x ${(1 + Math.random() * 6).toFixed(1)} inches`);
        if (['Electronics', 'Computers & Office'].includes(dept.l1)) {
          specsMap.set('Connectivity', pick(['Bluetooth 5.3', 'Wi-Fi 6E', 'USB-C', 'USB-C / Bluetooth 5.2', 'Wi-Fi 6']));
          specsMap.set('Battery Life', `${pick(['8', '12', '20', '30', '40', '60'])} hours`);
          specsMap.set('Color', pick(['Matte Black', 'Space Gray', 'Midnight Blue', 'Silver', 'Rose Gold', 'Arctic White']));
        }
        if (['Home & Kitchen', 'Sports & Outdoors'].includes(dept.l1)) {
          specsMap.set('Material', pick(['Stainless Steel', 'BPA-Free Polymer', 'Cast Iron', 'Bamboo', 'Aluminum Alloy', 'Nylon']));
          specsMap.set('Care Instructions', pick(['Machine Washable', 'Hand Wash Only', 'Dishwasher Safe', 'Wipe Clean']));
        }

        productInsertions.push({
          sellerId: seller._id,
          title: item.title,
          brand: item.brand,
          specs: Object.fromEntries(specsMap),
          description: generateProductDescription(item, cat),
          category: {
            l1: dept.l1,
            l2: cat.l2,
            l3: cat.l3
          },
          basePrice: item.price,
          currency: 'USD',
          variants,
          images: v1Images,
          ratingAvg: 0,
          ratingCount: 0,
          status: 'published',
          searchKeywords: [
            ...item.keywords,
            item.brand.toLowerCase(),
            dept.l1.toLowerCase(),
            cat.l2.toLowerCase(),
            cat.l3.toLowerCase()
          ],
          createdAt: productCreationDate,
          updatedAt: productCreationDate
        });
      }
    }
  }

  console.log(`Prepared ${productInsertions.length} unique products for insertion.`);
  const insertedProducts = await Product.insertMany(productInsertions);
  console.log(`Inserted ${insertedProducts.length} products successfully!`);

  console.log('--- Step 4: Generating Realistic Orders & Customer Reviews ---');
  const reviewTitles = [
    'Outstanding build quality and performance',
    'Exceeded every single expectation',
    'Worth every penny — daily driver now',
    'Fast delivery, impeccable packaging',
    'Does exactly what it promises and looks sleek',
    'Solid Amazon-tier experience and reliable build',
    'Best in its category by far',
    'Very well constructed and reliable for work',
    'Dependable, durable, and well worth the price',
    'Very pleased with this purchase',
    'Great addition to my daily workflow'
  ];

  const reviewBodies = [
    'I was slightly skeptical before buying, but after two weeks of rigorous daily use, this product has completely won me over. The fit, finish, and materials are noticeably premium.',
    'Arrived in two days via standard delivery. The setup took less than five minutes and the documentation was crystal clear. Exceptional value for the price point.',
    'Solid construction with high attention to detail. Performs reliably day in and day out. The ergonomics and design are both top notch.',
    'Purchased this as an upgrade from an older generation, and the difference is night and day. Much lighter, more efficient, and feels distinctly durable in hand.',
    'Clean aesthetics, sturdy materials, and works seamlessly out of the box. Easily five stars from a very discerning customer.',
    'The product was packaged carefully and arrived in mint condition. The real-world performance is consistent with the stated specifications.'
  ];

  const orderDocs = [];
  const reviewDocs = [];
  const productRatingOps = [];

  for (let pIdx = 0; pIdx < insertedProducts.length; pIdx++) {
    const prod = insertedProducts[pIdx];
    const numReviews = 2 + (pIdx % 2);
    let totalStars = 0;

    for (let rIdx = 0; rIdx < numReviews; rIdx++) {
      const customer = customerDocs[(pIdx + rIdx) % customerDocs.length];
      const seller = prod.sellerId;
      const reviewDate = randomDate(2, 60);
      const orderDate = new Date(reviewDate.getTime() - (5 + Math.random() * 10) * 24 * 60 * 60 * 1000);

      const order = new Order({
        customerId: customer._id,
        subOrders: [
          {
            sellerId: seller,
            status: 'delivered',
            trackingNumber: `1Z9999999${10000000 + pIdx * 10 + rIdx}`,
            carrier: 'UPS',
            items: [
              {
                productId: prod._id,
                sku: prod.variants[0].sku,
                title: prod.title,
                unitPrice: prod.basePrice,
                qty: 1,
                image: prod.variants[0].images[0]
              }
            ],
            statusHistory: [
              { from: 'confirmed', to: 'shipped', changedAt: new Date(orderDate.getTime() + 24 * 3600 * 1000) },
              { from: 'shipped', to: 'delivered', changedAt: new Date(orderDate.getTime() + 72 * 3600 * 1000) }
            ]
          }
        ],
        shippingAddress: {
          fullName: 'Customer Verified',
          phone: '+1 555 019 2831',
          addressLine1: '742 Evergreen Terrace',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'US'
        },
        pricing: {
          subtotal: prod.basePrice,
          tax: Number((prod.basePrice * 0.08).toFixed(2)),
          shipping: 0,
          discount: 0,
          total: Number((prod.basePrice * 1.08).toFixed(2))
        },
        payment: {
          provider: 'stripe',
          status: 'completed',
          method: 'card',
          paidAt: orderDate
        },
        idempotencyKey: `seed-ord-${pIdx}-${rIdx}-${customer._id}-${orderDate.getTime()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: orderDate,
        updatedAt: orderDate
      });

      orderDocs.push(order);

      // Assign rating (mostly 5 and 4 stars with occasional 3)
      const rating = rIdx === 0 ? 5 : (pIdx % 5 === 0 && rIdx === 1 ? 4 : 5);
      totalStars += rating;

      reviewDocs.push({
        productId: prod._id,
        customerId: customer._id,
        orderId: order._id,
        rating,
        title: pick(reviewTitles),
        body: pick(reviewBodies),
        isVerifiedPurchase: true,
        helpfulVotes: Math.floor(Math.random() * 18),
        unhelpfulVotes: Math.floor(Math.random() * 2),
        status: 'active',
        createdAt: reviewDate,
        updatedAt: reviewDate
      });
    }

    productRatingOps.push({
      updateOne: {
        filter: { _id: prod._id },
        update: {
          $set: {
            ratingCount: numReviews,
            ratingAvg: Number((totalStars / numReviews).toFixed(1))
          }
        }
      }
    });
  }

  console.log(`Inserting ${orderDocs.length} historical completed orders...`);
  await Order.insertMany(orderDocs);
  console.log(`Updating ratings on ${productRatingOps.length} products...`);
  await Product.bulkWrite(productRatingOps);

  console.log(`Inserting ${reviewDocs.length} authentic customer reviews...`);
  await Review.insertMany(reviewDocs);

  console.log('--- Step 5: Final Catalog Verification ---');
  const finalProductCount = await Product.countDocuments();
  const finalReviewCount = await Review.countDocuments();
  const finalOrderCount = await Order.countDocuments();

  const distinctL1 = await Product.distinct('category.l1');
  const distinctL2 = await Product.distinct('category.l2');
  const distinctL3 = await Product.distinct('category.l3');

  console.log(`
==================================================
 CATALOGUE SEEDING COMPLETED SUCCESSFULLY!
==================================================
 Total Products:   ${finalProductCount} (target: 500+)
 Total Reviews:    ${finalReviewCount}
 Total Orders:     ${finalOrderCount}
 Departments (L1): ${distinctL1.length} (${distinctL1.join(', ')})
 Subcategories L2: ${distinctL2.length}
 Deep Categories L3: ${distinctL3.length}
==================================================
  `);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seedCatalogue().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
