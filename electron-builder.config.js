module.exports = {
    appId: "com.skattchat.app",
    productName: "SkattChat",
    directories: {
        output: "dist/releases",
        app: ".",
        buildResources: "resources/electron"
    },
    files: [
        "electron/dist/**/*",
        "package.json",
        "electron"
    ],
    asar: true,
    win: {
        target: [{
            target: "nsis",
            arch: ["x64"]
        }],
        icon: "resources/electron/icons/win/icon.ico",
        sign: false,
        artifactName: "${productName}-Setup-${version}.${ext}"
    },
    nsis: {
        perMachine: false,
        createDesktopShortcut: true,
        shortcutName: "SkattChat",
        uninstallDisplayName: "SkattChat",
        installerIcon: "resources/electron/icons/win/installer.ico",
        uninstallerIcon: "resources/electron/icons/win/uninstaller.ico",
        installerHeaderIcon: "resources/electron/icons/win/header.ico",
        differentialPackage: false,
        removeDefaultUninstallWelcomePage: true
    }
};