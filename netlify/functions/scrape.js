exports.handler = async (event) => {
  console.log('[scrape] invoked:', event.httpMethod, new Date().toISOString());

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let parsed;
  try {
    parsed = JSON.parse(event.body);
  } catch (e) {
    console.error('[scrape] JSON parse error:', e.message);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { apifyKey, handles, period } = parsed;
  console.log('[scrape] handles:', (handles || []).map(h => h.handle), 'period:', period);

  if (!apifyKey || !handles || !handles.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const results = [];

  for (const account of handles) {
    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items?token=${apifyKey}&timeout=60`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            directUrls: [`https://www.instagram.com/${account.handle}/`],
            resultsLimit: 12,
          })
        }
      );

      if (!response.ok) throw new Error(`Apify error ${response.status}`);
      const items = await response.json();

      const posts = (items || []).slice(0, 6).map(item => ({
        id: item.id || item.shortCode,
        type: item.type === 'Video' ? 'Reel' : item.type === 'Sidecar' ? 'Carousel' : 'Static',
        hook: item.caption ? item.caption.split('\n')[0].substring(0, 100) : '(no caption)',
        likes: item.likesCount || 0,
        comments: item.commentsCount || 0,
        views: item.videoViewCount || item.videoPlayCount || 0,
      }));

      results.push({ handle: account.handle, niche: account.niche, posts });
    } catch (e) {
      results.push({ handle: account.handle, niche: account.niche, posts: [], error: e.message });
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify({ results }),
  };
};
