const fs = require('fs');
const path = require('path');

function syncVersions() {
  // Read electron package.json
  const electronPkg = require('../electron/package.json');
  // Read public package.json
  const webPkg = require('../public/package.json');

  // Sync dependencies and scripts
  const sharedDeps = {
    ...electronPkg.dependencies,
    ...webPkg.dependencies
  };

  // Update both package.json files
  electronPkg.dependencies = sharedDeps;
  webPkg.dependencies = sharedDeps;

  // Write back the updated files
  fs.writeFileSync(
    path.join(__dirname, '../electron/package.json'),
    JSON.stringify(electronPkg, null, 2)
  );
  fs.writeFileSync(
    path.join(__dirname, '../public/package.json'),
    JSON.stringify(webPkg, null, 2)
  );
}

syncVersions(); 