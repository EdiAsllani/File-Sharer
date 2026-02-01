const { app, BrowserWindow, Menu, Tray, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let mainWindow;
let serverProcess;
let tray;

// Get the correct paths whether running in dev or production
const isDev = !app.isPackaged;
const rootPath = isDev
  ? path.join(__dirname, "..")
  : path.join(process.resourcesPath, "app");

console.log("App root path:", rootPath);

// Start the Python backend server
function startBackend() {
  const isWindows = process.platform === "win32";
  const pythonCmd = isWindows ? "python" : "python3";

  // Path to the backend main.py
  const backendPath = path.join(rootPath, "backend", "main.py");

  console.log("Starting backend server...");
  console.log("Backend path:", backendPath);

  // Check if backend file exists
  if (!fs.existsSync(backendPath)) {
    dialog.showErrorBox(
      "Backend Not Found",
      `Cannot find backend at: ${backendPath}\n\nPlease ensure Python backend is installed.`,
    );
    app.quit();
    return;
  }

  serverProcess = spawn(pythonCmd, [backendPath], {
    cwd: rootPath,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  serverProcess.stdout.on("data", (data) => {
    console.log(`Backend: ${data}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`Backend Error: ${data}`);
  });

  serverProcess.on("close", (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0 && code !== null) {
      dialog.showErrorBox(
        "Backend Crashed",
        `Backend server stopped unexpectedly (exit code: ${code})`,
      );
    }
  });

  serverProcess.on("error", (err) => {
    console.error("Failed to start backend:", err);
    dialog.showErrorBox(
      "Failed to Start Backend",
      `Could not start Python backend:\n${err.message}\n\nMake sure Python 3 is installed.`,
    );
    app.quit();
  });
}

// Create the application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "icon.png"),
    title: "File Sharer",
  });

  // Wait for server to start, then load the app
  setTimeout(() => {
    mainWindow.loadURL("http://localhost:8000");
  }, 2000);

  // Handle load failures
  mainWindow.webContents.on("did-fail-load", () => {
    mainWindow.loadFile(path.join(__dirname, "error.html"));
  });

  // Create application menu
  const menu = Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        {
          label: "Refresh",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow.reload(),
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle DevTools",
          accelerator: "CmdOrCtrl+Shift+I",
          click: () => mainWindow.webContents.toggleDevTools(),
        },
        { type: "separator" },
        {
          label: "Actual Size",
          accelerator: "CmdOrCtrl+0",
          click: () => mainWindow.webContents.setZoomLevel(0),
        },
        {
          label: "Zoom In",
          accelerator: "CmdOrCtrl+Plus",
          click: () => {
            const level = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(level + 0.5);
          },
        },
        {
          label: "Zoom Out",
          accelerator: "CmdOrCtrl+-",
          click: () => {
            const level = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(level - 0.5);
          },
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About File Sharer",
              message: "File Sharer v1.0.0",
              detail:
                "Share files across your local network\n\nMade with Electron and FastAPI",
            });
          },
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Minimize to tray instead of closing (optional)
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// Create system tray icon
function createTray() {
  const iconPath = path.join(__dirname, "icon.png");
  if (fs.existsSync(iconPath)) {
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show App",
        click: () => {
          mainWindow.show();
        },
      },
      {
        label: "Quit",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip("File Sharer");
    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
      mainWindow.show();
    });
  }
}

// App lifecycle
app.on("ready", () => {
  startBackend();
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  // On macOS, keep app running even when windows are closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// Cleanup -- kill backend server when app closes
app.on("before-quit", () => {
  app.isQuitting = true;
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on("will-quit", () => {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
});
