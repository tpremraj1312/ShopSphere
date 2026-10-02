/**
 * ShopSphere Buying Advisor & Technical Analysis Client
 * Quantitative, context-rich comparison engine (Amazon-style buying guide).
 */

async function callGeminiRestApi(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

function generateSmartFallbackComparison(products, userQuestion) {
  if (!products || products.length === 0) {
    return {
      recommendation: 'Select products to generate technical comparison.',
      verdict: 'Please add at least 2 items to compare specifications.',
      prosCons: [],
      answer: 'Please add at least two items to begin specification comparison.',
      isAiPowered: false,
    };
  }

  // Sort by rating and price
  const sortedByRating = [...products].sort(
    (a, b) => (b.ratingAvg ?? b.averageRating ?? 0) - (a.ratingAvg ?? a.averageRating ?? 0)
  );
  const sortedByPrice = [...products].sort(
    (a, b) => (a.basePrice ?? a.price ?? 0) - (b.basePrice ?? b.price ?? 0)
  );

  const highestRated = sortedByRating[0];
  const lowestPrice = sortedByPrice[0];
  const highestPrice = sortedByPrice[sortedByPrice.length - 1];

  const getPid = (p) => String(p._id || p.id || p.title || p.name || '');

  const minP = lowestPrice.basePrice ?? lowestPrice.price ?? 0;
  const maxP = highestPrice.basePrice ?? highestPrice.price ?? 0;
  const priceDiff = maxP - minP;

  // Extract all unique specs
  const allSpecsKeys = new Set();
  products.forEach((p) => {
    const s = p.specs instanceof Map ? Object.fromEntries(p.specs) : p.specs || {};
    Object.keys(s).forEach((k) => allSpecsKeys.add(k));
  });

  const prosCons = products.map((p) => {
    const pId = getPid(p);
    const price = p.basePrice ?? p.price ?? 0;
    const rating = p.ratingAvg ?? p.averageRating ?? 0;
    const reviews = p.ratingCount ?? p.reviewsCount ?? 0;
    const specs = p.specs instanceof Map ? Object.fromEntries(p.specs) : p.specs || {};

    const pros = [];
    const cons = [];

    if (pId === getPid(lowestPrice) && products.length > 1) {
      pros.push(`Lowest purchase price: ₹${price.toLocaleString('en-IN')}${priceDiff > 0 ? ` (saves ₹${priceDiff.toLocaleString('en-IN')})` : ''}`);
    }
    if (rating >= 4.0) {
      pros.push(`Customer satisfaction: ${rating.toFixed(1)}/5 stars across ${reviews} verified reviews`);
    }

    // Inspect spec highlights
    Object.entries(specs).slice(0, 3).forEach(([key, val]) => {
      if (val && typeof val === 'string' && val.length < 40) {
        pros.push(`${key}: ${val}`);
      }
    });

    if (pId === getPid(highestPrice) && priceDiff > 0) {
      cons.push(`Priced ₹${priceDiff.toLocaleString('en-IN')} higher than entry option`);
    }
    if (rating < 3.8 && rating > 0) {
      cons.push(`Average feedback score is ${rating.toFixed(1)}/5`);
    }

    if (pros.length === 0) {
      pros.push('Standard manufacturer warranty & direct fulfillment');
    }
    if (cons.length === 0) {
      cons.push('Standard return window applies');
    }

    let badge = 'Balanced Selection';
    if (pId === getPid(lowestPrice) && products.length > 1) badge = 'Best Value';
    else if (pId === getPid(highestRated)) badge = 'Top Customer Rated';

    return {
      id: p._id || p.id,
      title: p.title || p.name,
      badge,
      pros,
      cons,
    };
  });

  let verdict = '';
  if (products.length === 1) {
    verdict = `${products[0].title || products[0].name} provides solid hardware specifications at ₹${(products[0].basePrice ?? products[0].price ?? 0).toLocaleString('en-IN')}.`;
  } else if (getPid(highestRated) === getPid(lowestPrice)) {
    verdict = `Clear Winner: ${highestRated.title || highestRated.name} provides both the lowest acquisition cost (₹${minP.toLocaleString('en-IN')}) and the highest verified user satisfaction (${(highestRated.ratingAvg ?? highestRated.averageRating ?? 0).toFixed(1)}★), making it the superior purchase.`;
  } else {
    verdict = `Top Recommendation: For buyers focused on economy, ${lowestPrice.title || lowestPrice.name} saves you ₹${priceDiff.toLocaleString('en-IN')} at ₹${minP.toLocaleString('en-IN')}. For buyers prioritizing reliability and verified user sentiment, ${highestRated.title || highestRated.name} (${(highestRated.ratingAvg ?? highestRated.averageRating ?? 0).toFixed(1)}★) warrants the ₹${priceDiff.toLocaleString('en-IN')} difference.`;
  }

  let answer = '';
  if (userQuestion && userQuestion.trim()) {
    const qLower = userQuestion.toLowerCase();
    if (qLower.includes('budget') || qLower.includes('cheap') || qLower.includes('cost') || qLower.includes('afford')) {
      answer = `From a cost-efficiency standpoint, **${lowestPrice.title || lowestPrice.name}** at ₹${minP.toLocaleString('en-IN')} is the most economical choice, saving ₹${priceDiff.toLocaleString('en-IN')} over premium alternatives while delivering core capabilities.`;
    } else if (qLower.includes('quality') || qLower.includes('best') || qLower.includes('rating') || qLower.includes('durable')) {
      answer = `Based on verified customer data, **${highestRated.title || highestRated.name}** delivers the highest satisfaction index (${(highestRated.ratingAvg ?? highestRated.averageRating ?? 0).toFixed(1)}/5 from ${highestRated.ratingCount ?? highestRated.reviewsCount ?? 0} ratings).`;
    } else if (qLower.includes('difference') || qLower.includes('compare')) {
      answer = `Key differences: The price delta is ₹${priceDiff.toLocaleString('en-IN')} between ${lowestPrice.title || lowestPrice.name} (₹${minP.toLocaleString('en-IN')}) and ${highestPrice.title || highestPrice.name} (₹${maxP.toLocaleString('en-IN')}). Rating spans from ${(lowestPrice.ratingAvg ?? lowestPrice.averageRating ?? 0).toFixed(1)}★ to ${(highestRated.ratingAvg ?? highestRated.averageRating ?? 0).toFixed(1)}★.`;
    } else {
      answer = `${verdict} Both models comply with standard 7-day return guidelines and doorstep fulfillment.`;
    }
  } else {
    answer = verdict;
  }

  return {
    recommendation: verdict,
    verdict,
    prosCons,
    answer,
    isAiPowered: false,
  };
}

async function compareProductsWithAI({ products, userQuestion }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('placeholder')) {
    return generateSmartFallbackComparison(products, userQuestion);
  }

  try {
    const productSummaries = products.map((p, idx) => {
      const price = p.basePrice ?? p.price ?? 0;
      const listPrice = p.listPrice || price;
      const discount = listPrice > price ? Math.round(((listPrice - price) / listPrice) * 100) : 0;
      const rating = p.ratingAvg ?? p.averageRating ?? 0;
      const reviews = p.ratingCount ?? p.reviewsCount ?? 0;
      const brand = p.brand || 'Unbranded';
      const specs = p.specs instanceof Map ? Object.fromEntries(p.specs) : p.specs || {};
      return `Item [${idx + 1}]:
- Model: ${p.title || p.name}
- Brand: ${brand}
- Effective Price: ₹${price} (MRP: ₹${listPrice}, Discount: ${discount}%)
- Rating: ${rating}/5 (${reviews} verified reviews)
- Stock: ${p.variants?.[0]?.stock ?? p.stock ?? 'Available'}
- Specifications: ${JSON.stringify(specs)}
- Highlights: ${(p.description || '').slice(0, 300)}`;
    }).join('\n\n');

    const prompt = `You are a professional Retail Buying Advisor for an Amazon-style e-commerce platform. Provide an authoritative, technical, and objective specification comparison between these ${products.length} products.

Context Data:
${productSummaries}

Customer Query:
${userQuestion ? userQuestion : 'Provide a head-to-head comparison and state the definitive best choice based on specifications and value.'}

Guidelines:
- Maintain an executive, precise tone like Consumer Reports or Amazon Buying Guides.
- Avoid promotional fluff, buzzwords, or conversational filler (e.g. no "game-changer", "dive in", "unleash", "hello there").
- Quantify comparisons explicitly with metrics (exact price differences in ₹, spec differences, battery/capacity/RAM/display comparisons).
- Return ONLY valid raw JSON conforming strictly to this schema:
{
  "recommendation": "Executive summary with concrete numbers and clear category winner",
  "verdict": "Clear winner statement citing specs and price delta",
  "answer": "Direct, evidence-backed response answering the customer question",
  "prosCons": [
    {
      "id": "model_id_or_title",
      "title": "Model Title",
      "badge": "e.g. Best Overall | Best Budget | Best Performance",
      "pros": ["Quantitative advantage 1", "Quantitative advantage 2"],
      "cons": ["Tradeoff 1", "Tradeoff 2"]
    }
  ]
}`;

    const rawResult = await callGeminiRestApi(apiKey, prompt);

    const cleanJson = rawResult
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    return {
      ...parsed,
      isAiPowered: true,
    };
  } catch (err) {
    console.warn('Falling back to quantitative comparison engine:', err.message);
    return generateSmartFallbackComparison(products, userQuestion);
  }
}

module.exports = {
  compareProductsWithAI,
};
