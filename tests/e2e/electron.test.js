const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Electron App Testing', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../electron/dist/main.bundle.cjs')]
    });

    // Get the first window
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('launch app', async () => {
    // Verify the window is visible
    const windowState = await window.evaluate(() => {
      const win = require('electron').remote.getCurrentWindow();
      return {
        isVisible: win.isVisible(),
        title: win.getTitle()
      };
    });

    expect(windowState.isVisible).toBeTruthy();

    // Test window title
    const title = await window.title();
    expect(title).toBe('SkattChat'); // Replace with your actual app title

    // Verify window dimensions
    const bounds = await window.evaluate(() => {
      const win = require('electron').remote.getCurrentWindow();
      return win.getBounds();
    });
    
    expect(bounds.width).toBe(1200);
    expect(bounds.height).toBe(800);
  });
});