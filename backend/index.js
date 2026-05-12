const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const issueRoutes = require('./src/routes/issueRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health checks
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'CampusCare API is running',
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'CampusCare API is running',
    routes: {
      auth: '/api/auth',
      issues: '/api/issues',
      workers: '/api/manager/workers',
      adminUsers: '/api/admin/users',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Backend is reachable from frontend',
    port: process.env.PORT || 5000,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api', userRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error fallback
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
