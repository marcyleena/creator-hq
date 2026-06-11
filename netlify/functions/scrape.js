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

  // Try an actor with the given input body, returning { ok, items, errorBody }
  async function tryActor(actorSlug, inputBody) {
    const url = `https://api.apify.com/v2/acts/${actorSlug}/run-sync-get-dataset-items?token=${apifyKey}&timeout=60`;
    console.log(`[scrape] trying actor=${actorSlug} url=${url}`);
    console.log('[scrape] request body:', JSON.stringify(inputBody));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[scrape] actor=${actorSlug} status=${response.status} errorBody=${errorBody}`);
      return { ok: false, status: response.status, errorBody };
    }

    const items = await response.json();
    console.log(`[scrape] actor=${actorSlug} success, items=${items.length}`);
    return { ok: true, items, actor: actorSlug };
  }

  const results = [];

  for (const account of handles) {
    console.log(`[scrape] processing handle: ${account.handle}`);
    try {
      const result = await tryActor('apify~instagram-scraper', {
        directUrls: [`https://www.instagram.com/${account.handle}/`],
        resultsType: 'posts',
        resultsLimit: 12,
      });

      if (!result.ok) {
        throw new Error(`Apify error ${result.status}: ${result.errorBody}`);
      }

      const items = result.items || [];

      // Log the full first item so we can see the exact field names Apify returns
      if (items.length > 0) {
        console.log(`[scrape] SUCCESS — actor that worked: ${result.actor} — first item raw fields for @${account.handle}:`, JSON.stringify(items[0], null, 2));
      } else {
        console.log(`[scrape] actor ${result.actor} returned 0 items for @${account.handle}`);
      }

      // Apify returns error objects in the dataset instead of throwing when the
      // account is private or the scrape returns no data — detect and surface it
      if (items[0]?.error) {
        throw new Error(items[0].errorDescription || 'No data returned');
      }

      const posts = items.slice(0, 6).map(item => {
        const likes    = item.likesCount    ?? item.likes         ?? item.diggCount       ?? 0;
        const comments = item.commentsCount ?? item.comments      ?? item.commentsNumber  ?? 0;
        const views    = item.videoViewCount ?? item.videoPlayCount ?? item.viewCount      ?? item.playsCount ?? 0;
        const caption  = item.caption       ?? item.text          ?? item.description     ?? item.alt ?? '';
        const rawType  = item.type          ?? item.mediaType     ?? item.productType     ?? '';
        const type     = /video/i.test(rawType) ? 'Reel'
                       : /sidecar|carousel|album/i.test(rawType) ? 'Carousel'
                       : 'Static';

        console.log(`[scrape] mapped item id=${item.id || item.shortCode} type="${rawType}"->"${type}" likes=${likes} comments=${comments} captionLen=${caption.length}`);

        return {
          id:       item.id || item.shortCode,
          type,
          hook:     caption ? caption.split('\n')[0].substring(0, 100) : '(no caption)',
          likes,
          comments,
          views,
        };
      });

      results.push({ handle: account.handle, niche: account.niche, posts });
    } catch (e) {
      console.error(`[scrape] error for ${account.handle}:`, e.message);
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
