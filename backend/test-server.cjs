// Minimal test server - no modules, just basic Node.js
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting minimal test server...');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    console.log(`📝 ${req.method} ${url}`);

    // Health check
    if (url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            service: 'BIM Test Server'
        }));
        return;
    }

    // BIM estimation endpoint (mock for now)
    if (url === '/api/bim/estimate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            console.log('📊 Processing BIM estimation request');
            
            // Mock estimation response
            const mockResult = {
                success: true,
                filename: "07.28.25 Whispering Pines_Building A.pdf",
                processed_at: new Date().toISOString(),
                quantity_takeoff: {
                    concrete: { volume: 245.8, unit: "cubic_yards", cost: 18435 },
                    steel_rebar: { weight: 12.4, unit: "tons", cost: 15500 },
                    lumber: { volume: 1204.5, unit: "board_feet", cost: 3614 },
                    drywall: { area: 8960, unit: "square_feet", cost: 4480 }
                },
                total_cost: 42029,
                processing_time: "2.3s",
                accuracy: "99.2%"
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(mockResult));
        });
        return;
    }

    // File upload endpoint (mock)
    if (url === '/api/bim/upload' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: 'File uploaded successfully',
            file_id: 'mock_' + Date.now()
        }));
        return;
    }

    // Serve test interface
    if (url === '/' || url === '/test') {
        try {
            const htmlContent = fs.readFileSync('./test-interface.html', 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Cannot load test interface' }));
        }
        return;
    }

    // Default response
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 8000;
server.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 BIM Test Server running on http://127.0.0.1:${PORT}`);
    console.log(`📋 Health check: http://127.0.0.1:${PORT}/health`);
    console.log(`📊 BIM estimation: POST http://127.0.0.1:${PORT}/api/bim/estimate`);
    console.log(`📁 File upload: POST http://127.0.0.1:${PORT}/api/bim/upload`);
});

server.on('error', (err) => {
    console.error('❌ Server error:', err);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});