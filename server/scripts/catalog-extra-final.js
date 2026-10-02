function item(title, price, brand, keywords, image, blurb) {
  return {
    title,
    price,
    brand,
    keywords: keywords.split(',').map((k) => k.trim()),
    image,
    blurb,
  };
}

module.exports = [
  {
    l1: 'Office Products',
    sellerIndex: 1,
    categories: [
      {
        l2: 'Paper & Writing',
        l3: 'Notebooks, Pens & Paper',
        imageKey: 'office',
        items: [
          item('Leuchtturm1917 Medium A5 Hardcover Dotted Notebook — Navy', 26.50, 'Leuchtturm1917', 'leuchtturm,a5,dotted,notebook,bullet journal', 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80', '249 numbered pages, stickers, and an expandable pocket.'),
          item('Moleskine Classic Ruled Hard Cover Notebook Large', 24.95, 'Moleskine', 'moleskine,ruled,hardcover,notebook', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80', 'Ivory ruled paper with a ribbon bookmark and elastic closure.'),
          item('Pilot G2 Premium Gel Pens Fine Point 0.7 mm 12-Pack Black', 13.64, 'Pilot', 'pilot g2,gel pen,0.7,black', 'https://images.unsplash.com/photo-1568205612837-017257d2380a?w=800&q=80', 'Smooth gel ink with a contoured rubber grip.'),
          item('Uni-ball Signo 207 Retractable Gel Pens 12-Pack', 16.89, 'Uni-ball', 'uniball,signo 207,gel,fraud resistant', 'https://images.unsplash.com/photo-1583485088034-697b5bc36b35?w=800&q=80', 'Super Ink that bonds to paper and resists check washing.'),
          item('Sharpie Permanent Markers Fine Point 12-Count Assorted', 9.97, 'Sharpie', 'sharpie,permanent marker,fine,assorted', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&q=80', 'Quick-drying ink that writes on most surfaces.'),
          item('HP Printer Paper 8.5x11 20 lb 500 Sheets 5-Ream Case', 39.99, 'HP', 'hp paper,copy paper,letter,ream', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80', 'ColorLok 20 lb paper for inkjet and laser.'),
          item('Post-it Super Sticky Notes 3x3 24 Pads Cabinet Pack', 19.89, 'Post-it', 'post-it,sticky notes,3x3,super sticky', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80', 'Super Sticky adhesive that holds on monitors and walls.'),
          item('Avery Easy Peel Address Labels 5160 750 Labels', 18.79, 'Avery', 'avery,5160,address labels,laser', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80', '30 labels per sheet, Easy Peel split backing.'),
        ],
      },
      {
        l2: 'Desk Organization',
        l3: 'Lamps, Stands & Storage',
        imageKey: 'desks',
        items: [
          item('BenQ ScreenBar Halo Monitor Light with Wireless Controller', 169.00, 'BenQ', 'benq,screenbar halo,monitor light,asymmetric', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', 'Asymmetric optic that lights the desk without screen glare.'),
          item('Rain Design mStand Laptop Stand — Silver', 49.95, 'Rain Design', 'rain design,mstand,laptop stand,aluminum', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80', 'Solid aluminum stand that raises a laptop 6 inches.'),
          item('Anker 575 USB-C Docking Station 14-in-1', 199.99, 'Anker', 'anker,575,dock,14-in-1,thunderbolt', 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80', 'Dual 4K HDMI, 85W PD, Ethernet, and SD/microSD.'),
          item('Fellowes Powershred 99Ci 100% Jam Proof Cross-Cut Shredder', 279.99, 'Fellowes', 'fellowes,99ci,shredder,cross-cut,p-4', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80', '18-sheet cross-cut with SafeSense and a 9-gallon bin.'),
          item('Smead Hanging File Folders Letter Size 25-Pack', 17.69, 'Smead', 'smead,hanging files,letter,tabs', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80', '1/5-cut tabs and coated rod tips that slide in drawers.'),
          item('Swingline Heavy Duty Stapler 77701 160 Sheet', 42.89, 'Swingline', 'swingline,heavy duty stapler,160 sheet', 'https://images.unsplash.com/photo-1583485088034-697b5bc36b35?w=800&q=80', 'Front-end jam clearing and a 160-sheet capacity.'),
        ],
      },
    ],
  },
  {
    l1: 'Electronics',
    sellerIndex: 0,
    categories: [
      {
        l2: 'Charging & Cables',
        l3: 'GaN Chargers & USB-C',
        imageKey: 'chargers',
        items: [
          item('Anker 747 Charger (GaNPrime 150W) 4-Port Fast Charger', 129.99, 'Anker', 'anker,747,ganprime,150w,usb-c', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80', 'ActiveShield 2.0 temperature control across four ports.'),
          item('Apple 240W USB-C Charge Cable (2m)', 69.00, 'Apple', 'apple,240w,usb-c cable,2m,macbook', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80', 'Woven USB-C cable rated for 240W charging.'),
          item('Belkin BoostCharge Pro 3-in-1 Wireless Charging Pad with MagSafe', 149.99, 'Belkin', 'belkin,magsafe,3-in-1,apple watch,airpods', 'https://images.unsplash.com/photo-1591290619762-c588f7ed7f9a?w=800&q=80', 'Official MagSafe pad for iPhone, Watch, and AirPods.'),
          item('Nomad Base One Max 15W MagSafe Charger — Walnut', 130.00, 'Nomad', 'nomad,base one max,magsafe,walnut', 'https://images.unsplash.com/photo-1550009158-9aadfa71ed8f?w=800&q=80', 'Machined aluminum and walnut with 15W MagSafe.'),
          item('Anker USB-C to USB-C Cable 240W 6ft 2-Pack', 19.99, 'Anker', 'anker,usb-c cable,240w,6ft', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80', 'eMarker chip, 240W PD, and a 6-foot length.'),
          item('Native Union Belt Cable Pro USB-C to USB-C 2.4m — Kraft', 39.99, 'Native Union', 'native union,belt cable,usb-c,kraft', 'https://images.unsplash.com/photo-1591290619762-c588f7ed7f9a?w=800&q=80', 'Anchor-point strap and a 240W-capable USB-C cable.'),
        ],
      },
      {
        l2: 'Networking',
        l3: 'Wi-Fi 6E & Mesh',
        imageKey: 'networking',
        items: [
          item('Eero Pro 6E Mesh Wi-Fi System 3-Pack', 399.99, 'Amazon', 'eero,pro 6e,mesh,wifi 6e,router', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a2?w=800&q=80', 'Tri-band Wi-Fi 6E covering up to 6,000 sq ft.'),
          item('ASUS ROG Rapture GT-AXE16000 Wi-Fi 6E Gaming Router', 699.00, 'ASUS', 'asus,gt-axe16000,wifi 6e,gaming router', 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800&q=80', 'Quad-band 6E router with 10G WAN/LAN ports.'),
          item('TP-Link Deco XE75 Pro Wi-Fi 6E Mesh 3-Pack', 349.99, 'TP-Link', 'tp-link,deco xe75,mesh,wifi 6e', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a2?w=800&q=80', 'Internal 2.5 Gbps port and AI-driven mesh roaming.'),
          item('Netgear Nighthawk RS700S Wi-Fi 7 Router', 699.99, 'Netgear', 'netgear,nighthawk,rs700,wifi 7', 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800&q=80', 'BE19000 Wi-Fi 7 with 10G internet and Multi-Gig LAN.'),
          item('Ubiquiti UniFi Dream Machine SE Gateway', 499.00, 'Ubiquiti', 'unifi,udm se,dream machine,nvr', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', '2.5 Gbps WAN, 8-port PoE switch, and NVR storage bay.'),
          item('Google Nest Wifi Pro 6E 3-Pack — Snow', 299.99, 'Google', 'nest wifi pro,6e,mesh,google', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a2?w=800&q=80', 'Matter-ready Wi-Fi 6E points covering up to 6,600 sq ft.'),
        ],
      },
    ],
  },
  {
    l1: 'Home & Kitchen',
    sellerIndex: 2,
    categories: [
      {
        l2: 'Dinnerware',
        l3: 'Plates, Glassware & Flatware',
        imageKey: 'dinnerware',
        items: [
          item('Fiesta 16-Piece Dinnerware Set — Scarlet', 159.99, 'Fiesta', 'fiesta,dinnerware,scarlet,lead free', 'https://images.unsplash.com/photo-1578500494198-339d145e32b2?w=800&q=80', 'Vitrified china made in West Virginia, dishwasher safe.'),
          item('Our Place Always Pan 2.0 11-Inch — Spice', 150.00, 'Our Place', 'our place,always pan,nonstick,ceramic', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80', 'Nesting steamer, grater, and colander with a ceramic coating.'),
          item('Libbey Signature Kentfield Gold Rim Wine Glasses Set of 4', 39.99, 'Libbey', 'libbey,wine glasses,gold rim,stemware', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80', 'Lead-free crystal with a 24K gold rim.'),
          item('Zwilling J.A. Henckels Bellasera 45-Piece Flatware Set', 199.95, 'Zwilling', 'zwilling,bellasera,flatware,18/10', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80', '18/10 stainless with extra salad forks and serving pieces.'),
          item('Corelle Winter Frost White 16-Piece Dinnerware Set', 79.99, 'Corelle', 'corelle,winter frost,vitrelle,break resistant', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80', 'Triple-layer Vitrelle glass that resists chips and stains.'),
          item('Emile Henry Modern Classics Rectangular Baker 13x9 — Figue', 89.95, 'Emile Henry', 'emile henry,baker,ceramic,figue,burgundy', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', 'Burgundy HR ceramic that goes from freezer to oven.'),
        ],
      },
    ],
  },
];
