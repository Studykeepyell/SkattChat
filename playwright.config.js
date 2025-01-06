const config = {
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    // Browser options
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Test options
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Context options
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'Safari',
      use: { browserName: 'webkit' },
    },
  ],
  
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
};

module.exports = config;