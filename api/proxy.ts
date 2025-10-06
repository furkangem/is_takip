export default async function handler(req: any, res: any) {
  // CORS headers ekleyin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS request için
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Backend URL'ini oluşturun
    const backendUrl = `https://is-takip-backend-dxud.onrender.com${req.url?.replace('/api/proxy', '') || ''}`;
    
    console.log('Proxy Request:', {
      method: req.method,
      url: req.url,
      backendUrl,
      body: req.body
    });
    
    // Request'i backend'e yönlendirin
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    
    console.log('Backend Response:', {
      status: response.status,
      data: data
    });
    
    // Backend response'unu frontend'e gönderin
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error',
      details: error.message,
      backendUrl: `https://is-takip-backend-dxud.onrender.com${req.url?.replace('/api/proxy', '') || ''}`
    });
  }
}
