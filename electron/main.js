const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createServer } = require('http');
const next = require('next');
const fs = require('fs');

// Configuración de Next.js
const isDev = !app.isPackaged;
const appDir = path.join(__dirname, '..');

// Establecer la carpeta de datos (en producción, será AppData/Roaming/nombre-app)
const userDataPath = app.getPath('userData');
const dataDir = path.join(userDataPath, 'data');

// Crear la carpeta de datos si no existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Establecer variable de entorno para la BD
process.env.DB_DATA_PATH = dataDir;

const nextApp = next({ dev: isDev, dir: appDir });
const handle = nextApp.getRequestHandler();

let mainWindow;

async function createWindow() {
  // Preparar Next.js
  await nextApp.prepare();

  // Crear el servidor HTTP
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // Iniciar servidor en un puerto aleatorio o fijo
  const PORT = isDev ? 3000 : 0; // 0 = puerto aleatorio en producción
  server.listen(PORT, () => {
    console.log(`Servidor Next.js corriendo en http://localhost:${PORT}`);

    // Crear la ventana de Electron
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false, // Mejor seguridad
        contextIsolation: true,
      },
    });

    // Cargar la app
    const url = isDev
      ? 'http://localhost:3000'
      : `http://localhost:${server.address().port}`;

    mainWindow.loadURL(url);

    // Abrir DevTools en desarrollo
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
