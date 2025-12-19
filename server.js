// Load environment variables (silent fail on Vercel)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not needed on Vercel, env vars are injected
}

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Freepik API configuration
const FREEPIK_API_BASE = 'https://api.freepik.com/v1';
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

// Download counts storage (in-memory for serverless, use database for production)
let downloadCounts = {};

// Try to load from file in local dev (will fail silently on Vercel)
if (process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const DOWNLOADS_FILE = path.join(__dirname, 'downloads.json');
    if (fs.existsSync(DOWNLOADS_FILE)) {
      downloadCounts = JSON.parse(fs.readFileSync(DOWNLOADS_FILE, 'utf8'));
    }
  } catch (error) {
    console.log('No existing download counts found, starting fresh');
  }
}

// Save download counts to file (local dev only)
function saveDownloadCounts() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const fs = require('fs');
      const DOWNLOADS_FILE = path.join(__dirname, 'downloads.json');
      fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloadCounts, null, 2));
    } catch (error) {
      // Silently fail on Vercel
    }
  }
}

// Debug: Log the API Key (first 10 chars only for security)
console.log('Freepik API Key loaded:', FREEPIK_API_KEY ? `${FREEPIK_API_KEY.substring(0, 10)}...` : 'NOT FOUND - Check environment variables!');

// Helper function to make Freepik API requests
async function fetchFromFreepik(endpoint, params = {}) {
  try {
    if (!FREEPIK_API_KEY) {
      throw new Error('FREEPIK_API_KEY environment variable is not set');
    }
    
    console.log(`Fetching: ${FREEPIK_API_BASE}${endpoint}`, { params });
    
    const response = await axios({
      method: 'GET',
      url: `${FREEPIK_API_BASE}${endpoint}`,
      headers: {
        'x-freepik-api-key': FREEPIK_API_KEY,
        'Accept-Language': 'en-US'
      },
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('Freepik API error:', error.response?.data || error.message);
    console.error('Response headers:', error.response?.headers);
    throw error;
  }
}

// Transform Freepik icon response to match frontend expected format
function transformIconResponse(freepikData) {
  const items = freepikData.data || [];
  return items.map(item => ({
    id: item.id,
    uuid: String(item.id),
    name: item.description || item.name || 'Untitled Icon',
    urls: {
      png_128: item.thumbnails?.find(t => t.size === 128)?.url || item.thumbnails?.[0]?.url,
      png_64: item.thumbnails?.find(t => t.size === 64)?.url || item.thumbnails?.[0]?.url,
      thumb: item.thumbnails?.[0]?.url
    },
    preview: item.thumbnails?.[0]?.url
  }));
}

// Transform Freepik resources response to match frontend expected format
function transformResourceResponse(freepikData) {
  const items = freepikData.data || [];
  return items.map(item => ({
    id: item.id,
    uuid: String(item.id),
    name: item.title || item.filename || 'Untitled',
    urls: {
      png_128: item.image?.source?.url || item.thumbnails?.find(t => t.key === 'small')?.url,
      png_64: item.image?.source?.url || item.thumbnails?.find(t => t.key === 'small')?.url,
      thumb: item.image?.source?.url || item.thumbnails?.[0]?.url
    },
    preview: item.image?.source?.url
  }));
}

// Search Icons endpoint
app.get('/api/icons', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20 } = req.query;
    
    const data = await fetchFromFreepik('/icons', {
      term: q,
      page: page,
      per_page: Math.min(per_page, 100),
      order: 'relevance',
      'filters[license][freemium]': 1
    });
    
    res.json({
      success: true,
      data: transformIconResponse(data),
      pagination: data.meta || {}
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch icons',
      message: error.response?.data?.message || error.message,
      data: []
    });
  }
});

// Search 3D Icons endpoint (uses resources with 3d style filter)
app.get('/api/3d-icons', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20 } = req.query;
    
    const data = await fetchFromFreepik('/resources', {
      term: q + ' 3d',
      page: page,
      limit: Math.min(per_page, 100),
      order: 'relevance',
      'filters[content_type][vector]': 1,
      'filters[vector][style]': '3d',
      'filters[license][freemium]': 1
    });
    
    res.json({
      success: true,
      data: transformResourceResponse(data),
      pagination: data.meta || {}
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch 3D assets',
      message: error.response?.data?.message || error.message,
      data: []
    });
  }
});

// Search Illustrations endpoint
app.get('/api/illustrations', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20 } = req.query;
    
    const data = await fetchFromFreepik('/resources', {
      term: q,
      page: page,
      limit: Math.min(per_page, 100),
      order: 'relevance',
      'filters[content_type][vector]': 1,
      'filters[license][freemium]': 1
    });
    
    res.json({
      success: true,
      data: transformResourceResponse(data),
      pagination: data.meta || {}
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch illustrations',
      message: error.response?.data?.message || error.message,
      data: []
    });
  }
});

// Search Lottie/Animated content endpoint (Note: Freepik doesn't have native Lottie, using animated vectors)
app.get('/api/lottie', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20 } = req.query;
    
    // Freepik doesn't have Lottie animations - use animated/motion vectors as alternative
    const data = await fetchFromFreepik('/resources', {
      term: q + ' animation motion',
      page: page,
      limit: Math.min(per_page, 100),
      order: 'relevance',
      'filters[content_type][vector]': 1,
      'filters[license][freemium]': 1
    });
    
    res.json({
      success: true,
      data: transformResourceResponse(data),
      pagination: data.meta || {},
      note: 'Freepik does not have native Lottie animations. Showing animated/motion vectors instead.'
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch animations',
      message: error.response?.data?.message || error.message,
      data: []
    });
  }
});

// Universal search endpoint (searches all asset types)
app.get('/api/search', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20, asset = 'icon' } = req.query;
    
    let data;
    let transformedData;
    
    if (asset === 'icon') {
      data = await fetchFromFreepik('/icons', {
        term: q,
        page: page,
        per_page: Math.min(per_page, 100),
        order: 'relevance',
        'filters[license][freemium]': 1
      });
      transformedData = transformIconResponse(data);
    } else {
      // For other asset types, use resources endpoint
      const filters = {};
      if (asset === '3d') {
        filters['filters[content_type][vector]'] = 1;
        filters['filters[vector][style]'] = '3d';
      } else if (asset === 'illustration' || asset === 'vector') {
        filters['filters[content_type][vector]'] = 1;
      } else if (asset === 'photo') {
        filters['filters[content_type][photo]'] = 1;
      }
      
      data = await fetchFromFreepik('/resources', {
        term: q,
        page: page,
        limit: Math.min(per_page, 100),
        order: 'relevance',
        'filters[license][freemium]': 1,
        ...filters
      });
      transformedData = transformResourceResponse(data);
    }
    
    res.json({
      success: true,
      data: transformedData,
      pagination: data.meta || {}
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch assets',
      message: error.response?.data?.message || error.message,
      data: []
    });
  }
});

// Get download count for an asset
app.get('/api/downloads/:assetId', (req, res) => {
  const { assetId } = req.params;
  res.json({ 
    success: true, 
    downloads: downloadCounts[assetId] || 0 
  });
});

// Get all download counts
app.get('/api/downloads', (req, res) => {
  res.json({ 
    success: true, 
    downloads: downloadCounts 
  });
});

// Increment download count for an asset
app.post('/api/downloads/:assetId', (req, res) => {
  const { assetId } = req.params;
  downloadCounts[assetId] = (downloadCounts[assetId] || 0) + 1;
  saveDownloadCounts();
  res.json({ 
    success: true, 
    downloads: downloadCounts[assetId] 
  });
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Specific routes for HTML pages
app.get('/privacy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy.html'));
});

app.get('/terms.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms.html'));
});

app.get('/review.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'review.html'));
});

app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

// ads.txt for Google AdSense
app.get('/ads.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'ads.txt'));
});

// robots.txt for SEO
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// sitemap.xml for SEO
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// Default route - serve index.html for all other routes
// Express 5 requires named wildcards, not bare *
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export for Vercel serverless
module.exports = app;

// Only start server if running directly (not on Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    console.log(`PeelJoy server running on http://localhost:${PORT}`);
    console.log(`Freepik API Key configured: ${FREEPIK_API_KEY ? 'Yes' : 'No - Check your .env file!'}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Try a different port.`);
    } else {
      console.error('Server error:', error);
    }
    process.exit(1);
  });

  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}