// Test script to verify the new configuration endpoint
const API_BASE_URL = 'http://localhost:8082/api';

// You would need a valid token for testing
// This is just a placeholder - in a real test you would get a valid token
const TEST_TOKEN = 'your-test-token-here';

async function testConfigurationEndpoint() {
  try {
    console.log('Testing new configuration endpoint...');
    
    // Test getting a specific configuration value
    const response = await fetch(`${API_BASE_URL}/configuration/key/ai.stream`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Configuration endpoint is working correctly!');
      console.log('Configuration key:', data.data.key);
      console.log('Configuration value:', data.data.value);
    } else {
      console.log('❌ Configuration endpoint returned an error:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing configuration endpoint:', error.message);
  }
}

// Run the test
testConfigurationEndpoint();
