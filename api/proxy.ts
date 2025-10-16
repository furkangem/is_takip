export default async function handler(req: any, res: any) {
  // CORS headers ekleyin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Cache kontrolü için headers ekleyin
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // OPTIONS request için
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Backend URL'ini oluşturun - daha güvenli
    let backendUrl = `https://is-takip-backend-dxud.onrender.com`;
    let path = req.url?.replace('/api/proxy', '') || '';
    
    // URL temizleme ve :1 sorununu önleme
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // :1 sorununu önleme - daha kapsamlı temizleme
    path = path.replace(/:1$/, '').replace(/:1\//, '/').replace(/\/:1/, '');
    
    if (req.url?.includes(':1')) {
      console.log('⚠️ :1 sorunu tespit edildi ve düzeltildi:', {
        originalUrl: req.url,
        cleanedPath: path
      });
    }
    
    backendUrl = `${backendUrl}/${path}`;
    
    console.log('🔍 Proxy Request Debug:', {
      method: req.method,
      originalUrl: req.url,
      cleanedPath: path,
      finalBackendUrl: backendUrl,
      body: req.body,
      headers: req.headers
    });
    
    // Request'i backend'e yönlendirin
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'IsTakip-Frontend/1.0',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
      // Timeout ekleyin
      signal: AbortSignal.timeout(25000) // 25 saniye
    });

    const data = await response.text();
    
    console.log('✅ Backend Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      dataLength: data.length,
      dataPreview: data.substring(0, 200) + (data.length > 200 ? '...' : '')
    });
    
    // Backend response'unu frontend'e gönderin
    res.status(response.status).send(data);
  } catch (error) {
    console.error('❌ Proxy Error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      originalUrl: req.url,
      method: req.method
    });
    
    // Daha detaylı hata mesajı
    let errorMessage = 'Proxy error';
    let statusCode = 500;
    
    if (error.name === 'TimeoutError') {
      errorMessage = 'Backend timeout - server çok yavaş yanıt veriyor';
      statusCode = 504;
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Backend sunucuya bağlanılamıyor';
      statusCode = 503;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      originalUrl: req.url,
      backendUrl: `https://is-takip-backend-dxud.onrender.com${req.url?.replace('/api/proxy', '') || ''}`
    });
  }
}
