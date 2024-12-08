
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Download functionality', () => {
  test('should download Windows app when clicking Windows download button', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    await page.click('.windows-dl');
    const download = await downloadPromise;
    
    // Verify download filename
    expect(download.suggestedFilename()).toContain('.exe');
    
    // Wait for the download process to complete
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('should download macOS app when clicking Mac download button', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('.mac-dl');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.dmg');
  });

  test('should download Linux app when clicking Linux download button', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('.linux-dl');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.AppImage');
  });
});