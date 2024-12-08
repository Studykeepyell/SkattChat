module.exports = {
    appId: "com.skattchat.app",
    productName: "SkattChat",
    directories: {
        output: "dist/releases",
        app: "electron"
    },
    files: [
        "**/*",
        "!**/node_modules/{test,test/**}", // Exclude test directories
        "!**/*.map",                        // Exclude source maps (optional)
        "!**/unnecessary_file.js"
    ],
    asar: true,
    win: {
        target: [{
            target: "nsis",
            arch: ["x64"]
        }],
        icon: "resources/icon.ico",  // Make sure this exists
        sign: false,
        artifactName: "${productName}-Setup-${version}.${ext}"
    },
    nsis: {
        perMachine: false,
        createDesktopShortcut: true,
        shortcutName: "SkattChat",
        uninstallDisplayName: "SkattChat",
        installerIcon: "resources/icon.ico",  // Make sure this exists
        uninstallerIcon: "resources/icon.ico",  // Make sure this exists
        installerHeaderIcon: "resources/icon.ico",  // Make sure this exists
        differentialPackage: false,
        removeDefaultUninstallWelcomePage: true


    }
};