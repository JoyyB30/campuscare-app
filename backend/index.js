const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 1. Import your Auth Routes
const authRoutes = require('./src/routes/authRoutes'); 

const app = express();

app.use(cors());
app.use(express.json());

// 2. Connect the routes to a URL path
// This means all routes in authRoutes will start with /api/auth
app.use('/api/auth', authRoutes); 

app.get('/', (req, res) => {
    res.send('CampusCare API is officially running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});