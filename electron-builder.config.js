module.exports = {
    appId: "com.skattchat.app",
    productName: "SkattChat",
    directories: {
        output: "dist/releases",
        app: "."
    },
    files: [
        "electron/dist/**/*",
        "package.json"
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