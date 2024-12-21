const fs = require('fs');
const path = require('path');

const SHARED_PATHS = {
  scripts: {
    src: 'shared/scripts',
    electron: 'electron/src/scripts',
    web: 'public/scripts'
  },
  styles: {
    src: 'shared/styles',
    electron: 'electron/src/styles',
    web: 'public/styles'
  },
  assets: {
    src: 'shared/assets',
    electron: 'electron/src/assets',
    web: 'public/assets'
  }
};

function syncFiles() {
  Object.values(SHARED_PATHS).forEach(paths => {
    // Copy from shared to electron
    fs.cpSync(paths.src, paths.electron, { recursive: true });
    // Copy from shared to web
    fs.cpSync(paths.src, paths.web, { recursive: true });
  });
}

syncFiles(); 