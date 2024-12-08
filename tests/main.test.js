
const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');

test('launch app', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  
  // Verify window is visible
  expect(await window.isVisible()).toBe(true);
  
  // Test window title
  const title = await window.title();
  expect(title).toBe('Skattchat');
  
  await app.close();
});