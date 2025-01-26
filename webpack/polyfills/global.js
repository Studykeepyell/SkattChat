// Polyfill for the global object that works in both browser and Node.js environments
module.exports = (function() {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    throw new Error('Unable to locate global object');
})();

// Browser polyfills
if (typeof window !== 'undefined') {
  window.global = window;
  window.process = { env: {} };
} 