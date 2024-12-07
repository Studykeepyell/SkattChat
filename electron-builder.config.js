module.exports = {
    appId: "com.skattchat.app",
    productName: "SkattChat",
    directories: {
        output: "dist/releases",
        app: "dist/app"
    },
    files: [
        "**/*",
        "!**/node_modules/**/*"
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
        oneClick: false,
        perMachine: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        deleteAppDataOnUninstall: true,
        installerIcon: "resources/icon.ico",  // Make sure this exists
        uninstallerIcon: "resources/icon.ico",  // Make sure this exists
        installerHeaderIcon: "resources/icon.ico",  // Make sure this exists
        differentialPackage: false,
        removeDefaultUninstallWelcomePage: true
    }
};