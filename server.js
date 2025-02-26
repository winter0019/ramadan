const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Enhanced CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:3000',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Client-side routing fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Enhanced test route with error handling
app.get('/api/test', (req, res, next) => {
  try {
    // Simulate potential error
    if (req.query.error) throw new Error('Test error');
    
    res.json({ 
      status: 'success',
      message: 'Server is working!',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error'
  });
});

// Server start with validation
if (require.main === module) {
  app.listen(port, () => {
    console.log(`
      Server running in ${process.env.NODE_ENV || 'development'} mode
      Listening on port ${port}
      Ready to handle requests at ${process.env.SERVER_URL || `http://localhost:${port}`}
    `);
  });
}

module.exports = app;