module.exports = {
    appId: "com.skattchat.app",
    productName: "SkattChat",
    directories: {
        output: "public/downloads",
        buildResources: "resources"
    },
    files: [
        "dist/**/*",
        "package.json"
    ],
    extraMetadata: {
        main: "dist/main.bundle.cjs"
    },
    asar: true,
    win: {
        target: "nsis",
        icon: "resources/electron/icons/win/icon.ico",
        artifactName: "SkattChat Setup 1.0.0.exe"
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        installerIcon: "resources/electron/icons/win/installer.ico",
        uninstallerIcon: "resources/electron/icons/win/uninstaller.ico",
        installerHeaderIcon: "resources/electron/icons/win/header.ico"
    }
};