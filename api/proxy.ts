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
    
    // Test endpoint'i - backend bağlantısını test et
    if (path === 'test' || path === 'health') {
      res.status(200).json({ 
        message: 'Proxy çalışıyor',
        backendUrl: `${backendUrl}/api/health`,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // URL temizleme ve :1 sorununu önleme
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // :1 sorununu önleme - sadece sonundaki :1'i kaldır
    if (path.endsWith(':1')) {
      path = path.slice(0, -2); // Son 2 karakteri (:1) kaldır
      console.log('⚠️ :1 sorunu tespit edildi ve düzeltildi:', {
        originalUrl: req.url,
        cleanedPath: path
      });
    }
    
    // Backend API formatı: https://backend.com/api/[controller]
    backendUrl = `${backendUrl}/api/${path}`;
    
    console.log('🔍 Proxy Request Debug:', {
      method: req.method,
      originalUrl: req.url,
      cleanedPath: path,
      finalBackendUrl: backendUrl,
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    // Güncelleme işlemleri için daha uzun timeout
    const isUpdateOperation = req.method === 'PUT' || req.method === 'PATCH';
    const timeoutDuration = isUpdateOperation ? 60000 : 45000; // PUT/PATCH için 60 saniye
    
    console.log('⏱️ Timeout ayarı:', {
      method: req.method,
      isUpdateOperation,
      timeoutDuration: `${timeoutDuration / 1000}s`,
      endpoint: path
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
      // Timeout ekleyin - güncelleme işlemleri için daha uzun
      signal: AbortSignal.timeout(timeoutDuration)
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
      backendUrl: `https://is-takip-backend-dxud.onrender.com/api/${req.url?.replace('/api/proxy/', '') || ''}`,
      timestamp: new Date().toISOString()
    });
  }
}
