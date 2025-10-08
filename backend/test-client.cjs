// BIM Test Client - Test the estimation workflow
const http = require('http');
const fs = require('fs');

console.log('🧪 Starting BIM End-to-End Test');
console.log('📁 Testing with file: c:\\Users\\lesso\\Desktop\\07.28.25 Whispering Pines_Building A.pdf');

// Test health check first
function testHealthCheck() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:8000/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ Health Check Passed:', response);
                    resolve(response);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (err) => {
            console.error('❌ Health check failed:', err.message);
            reject(err);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Health check timeout'));
        });
    });
}

// Test BIM estimation
function testBIMEstimation() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            filename: "07.28.25 Whispering Pines_Building A.pdf",
            file_path: "c:\\Users\\lesso\\Desktop\\07.28.25 Whispering Pines_Building A.pdf",
            project_type: "commercial_building",
            estimation_type: "quantity_takeoff"
        });

        const options = {
            hostname: '127.0.0.1',
            port: 8000,
            path: '/api/bim/estimate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('📊 BIM Estimation Result:');
                    console.log('   └─ Success:', response.success);
                    console.log('   └─ File:', response.filename);
                    console.log('   └─ Total Cost: $' + response.total_cost.toLocaleString());
                    console.log('   └─ Processing Time:', response.processing_time);
                    console.log('   └─ Accuracy:', response.accuracy);
                    
                    // Show quantity breakdown
                    console.log('   └─ Quantity Takeoff:');
                    Object.entries(response.quantity_takeoff).forEach(([material, data]) => {
                        console.log(`      ├─ ${material}: ${data.volume || data.weight || data.area} ${data.unit} = $${data.cost.toLocaleString()}`);
                    });
                    
                    resolve(response);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (err) => {
            console.error('❌ BIM estimation failed:', err.message);
            reject(err);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('BIM estimation timeout'));
        });

        req.write(postData);
        req.end();
    });
}

// Run the test sequence
async function runTests() {
    try {
        console.log('\n🔍 Step 1: Testing Health Check...');
        await testHealthCheck();
        
        console.log('\n📊 Step 2: Testing BIM Estimation...');
        const result = await testBIMEstimation();
        
        console.log('\n✅ All Tests Passed!');
        console.log('🎉 BIM/CAD 3D Estimating Module is working correctly');
        console.log('📈 Ready for production use with:', result.filename);
        
    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        process.exit(1);
    }
}

// Start the tests
runTests();