/**
 * test_protocol_upgrade.ts
 * Verifies that getApiBaseUrl handles both window and worker contexts correctly.
 */

// Mock environment
process.env.NEXT_PUBLIC_API_URL = "http://api.significia.com/api/v1";

import { getApiBaseUrl } from './src/core/api/api-utils';

function runTest(context: string, mockGlobals: any) {
  console.log(`\n--- Testing Context: ${context} ---`);
  
  // Apply mocks
  const originalWindow = (global as any).window;
  const originalSelf = (global as any).self;
  
  (global as any).window = mockGlobals.window;
  (global as any).self = mockGlobals.self;

  try {
    const url = getApiBaseUrl();
    console.log(`Input: ${process.env.NEXT_PUBLIC_API_URL}`);
    console.log(`Output: ${url}`);
    
    if (mockGlobals.isHttps) {
      if (url.startsWith("https://")) {
        console.log("✅ SUCCESS: Upgraded to HTTPS");
      } else {
        console.log("❌ FAILURE: Protocol mismatch (expected HTTPS)");
      }
    } else {
      if (url.startsWith("http://")) {
        console.log("✅ SUCCESS: Stayed as HTTP");
      } else {
        console.log("❌ FAILURE: Unexpected upgrade/downgrade");
      }
    }
  } finally {
    (global as any).window = originalWindow;
    (global as any).self = originalSelf;
  }
}

// Test cases
runTest("Window HTTPS", {
  window: { location: { protocol: "https:" } },
  self: undefined,
  isHttps: true
});

runTest("Worker HTTPS", {
  window: undefined,
  self: { location: { protocol: "https:" } },
  isHttps: true
});

runTest("Localhost (No upgrade)", {
  window: { location: { protocol: "https:" } },
  self: undefined,
  isHttps: false // Should stay HTTP because of localhost check
});
// Update env for localhost test
process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8000/api/v1";
runTest("Localhost Context", {
  window: { location: { protocol: "https:" } },
  self: undefined,
  isHttps: false
});
