const express = require('express');
const path = require('path');

// Routes
const playerRoutes = require('./routes/playerRoutes');
const itemRoutes = require('./routes/itemRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.json({
        message: '🎮 Welkom bij de Minecraft Inventory System API!',
        version: '1.0.0',
        endpoints: {
            players: '/api/players',
            items: '/api/items',
            documentation: '/docs'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/players', playerRoutes);
app.use('/api/items', itemRoutes);

// Documentation route (Dag 4)
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} bestaat niet`,
        availableEndpoints: ['/', '/health', '/api/players', '/api/items', '/docs']
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Er is iets misgegaan op de server'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🎮 ================================');
    console.log('   MINECRAFT INVENTORY SYSTEM API');
    console.log('🎮 ================================');
    console.log('');
    console.log(`🚀 Server draait op: http://localhost:${PORT}`);
    console.log('');
    console.log('📚 Endpoints:');
    console.log(`   GET  http://localhost:${PORT}/`);
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   GET  http://localhost:${PORT}/api/players`);
    console.log(`   GET  http://localhost:${PORT}/api/items`);
    console.log(`   GET  http://localhost:${PORT}/docs`);
    console.log('');
});
