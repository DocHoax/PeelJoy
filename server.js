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

// IconScout API configuration
const ICONSCOUT_API_BASE = 'https://api.iconscout.com/v3';
const CLIENT_ID = process.env.ICONSCOUT_CLIENT_ID;

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

// Debug: Log the Client ID (first 10 chars only for security)
console.log('Client ID loaded:', CLIENT_ID ? `${CLIENT_ID.substring(0, 10)}...` : 'NOT FOUND - Check environment variables!');

// Helper function to make IconScout API requests
async function fetchFromIconScout(endpoint, params = {}) {
  try {
    if (!CLIENT_ID) {
      throw new Error('ICONSCOUT_CLIENT_ID environment variable is not set');
    }
    
    console.log(`Fetching: ${ICONSCOUT_API_BASE}${endpoint}`, { params });
    
    // Try multiple header formats
    const response = await axios({
      method: 'GET',
      url: `${ICONSCOUT_API_BASE}${endpoint}`,
      headers: {
        'Client-ID': CLIENT_ID,
        'client-id': CLIENT_ID,
        'Authorization': `Bearer ${CLIENT_ID}`,
        'X-Client-ID': CLIENT_ID
      },
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('IconScout API error:', error.response?.data || error.message);
    console.error('Response headers:', error.response?.headers);
    throw error;
  }
}

// Search Icons endpoint
app.get('/api/icons', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20 } = req.query;
    
    const data = await fetchFromIconScout('/search', {
      query: q,
      asset: 'icon',
      page: page,
      per_page: per_page,
      price: 'free'
    });
    
    res.json({
      success: true,
      data: data.response?.items?.data || [],
      pagination: data.response?.items?.pagination || {}
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

// Search 3D Icons endpoint
app.get('/api/3d-icons', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20 } = req.query;
    
    const data = await fetchFromIconScout('/search', {
      query: q,
      asset: '3d',
      page: page,
      per_page: per_page,
      price: 'free'
    });
    
    res.json({
      success: true,
      data: data.response?.items?.data || [],
      pagination: data.response?.items?.pagination || {}
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch 3D icons',
      message: error.response?.data?.message || error.message,
      data: []
    });
  }
});

// Search Illustrations endpoint
app.get('/api/illustrations', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20 } = req.query;
    
    const data = await fetchFromIconScout('/search', {
      query: q,
      asset: 'illustration',
      page: page,
      per_page: per_page,
      price: 'free'
    });
    
    res.json({
      success: true,
      data: data.response?.items?.data || [],
      pagination: data.response?.items?.pagination || {}
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

// Search Lottie Animations endpoint
app.get('/api/lottie', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20 } = req.query;
    
    const data = await fetchFromIconScout('/search', {
      query: q,
      asset: 'lottie',
      page: page,
      per_page: per_page,
      price: 'free'
    });
    
    res.json({
      success: true,
      data: data.response?.items?.data || [],
      pagination: data.response?.items?.pagination || {}
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch Lottie animations',
      message: error.response?.data?.message || error.message,
      data: []
    });
  }
});

// Universal search endpoint (searches all asset types)
app.get('/api/search', async (req, res) => {
  try {
    const { q = 'popular', page = 1, per_page = 20, asset = 'icon' } = req.query;
    
    const data = await fetchFromIconScout('/search', {
      query: q,
      asset: asset,
      page: page,
      per_page: per_page,
      price: 'free'
    });
    
    res.json({
      success: true,
      data: data.response?.items?.data || [],
      pagination: data.response?.items?.pagination || {}
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

// Default route - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export for Vercel serverless
module.exports = app;

// Only start server if running directly (not on Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    console.log(`PeelJoy server running on http://localhost:${PORT}`);
    console.log(`IconScout Client ID configured: ${CLIENT_ID ? 'Yes' : 'No - Check your .env file!'}`);
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