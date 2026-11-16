// Сетапы — настольное приложение для Windows и macOS (Electron).
// Автор просмотрщика — Екатерина Скоробогатько, @katya_skorobogatko.
// Всё считается локально на компьютере; программа никуда не отправляет файлы пациентов,
// кроме случая, когда врач сам нажимает «Опубликовать ссылкой» (на свой сайт).
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

const INSTAGRAM = 'https://www.instagram.com/katya_skorobogatko/';
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    title: 'Сетапы — просмотр планов лечения',
    backgroundColor: '#F4F6FA',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // ссылки (Instagram, опубликованные планы) открываются в обычном браузере
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); } });

  // экспорт: системное окно «Сохранить как…»
  win.webContents.session.on('will-download', (e, item) => {
    const file = dialog.showSaveDialogSync(win, { defaultPath: path.join(app.getPath('documents'), item.getFilename()) });
    if (file) item.setSavePath(file); else item.cancel();
  });
}

const isMac = process.platform === 'darwin';
const menu = Menu.buildFromTemplate([
  ...(isMac ? [{ label: 'Сетапы', submenu: [
    { label: 'О программе', click: about }, { type: 'separator' },
    { role: 'hide', label: 'Скрыть' }, { role: 'hideOthers', label: 'Скрыть остальные' }, { type: 'separator' },
    { role: 'quit', label: 'Выйти' }] }] : []),
  { label: 'Файл', submenu: [
    { label: 'Новый кейс', accelerator: 'CmdOrCtrl+N', click: () => win && win.webContents.executeJavaScript("document.getElementById('openBtn').click()") },
    { label: 'Открыть сохранённый план…', accelerator: 'CmdOrCtrl+O', click: () => win && win.webContents.executeJavaScript("document.getElementById('start').classList.remove('hidden'); document.getElementById('openSaved').click()") },
    { label: 'Экспорт…', accelerator: 'CmdOrCtrl+E', click: () => win && win.webContents.executeJavaScript("document.getElementById('exportBtn').click()") },
    { type: 'separator' }, isMac ? { role: 'close', label: 'Закрыть окно' } : { role: 'quit', label: 'Выход' }] },
  { label: 'Правка', submenu: [{ role: 'undo', label: 'Отменить' }, { role: 'redo', label: 'Повторить' }, { type: 'separator' }, { role: 'cut', label: 'Вырезать' }, { role: 'copy', label: 'Копировать' }, { role: 'paste', label: 'Вставить' }, { role: 'selectAll', label: 'Выделить всё' }] },
  { label: 'Вид', submenu: [{ role: 'reload', label: 'Перезагрузить' }, { type: 'separator' }, { role: 'resetZoom', label: 'Обычный масштаб' }, { role: 'zoomIn', label: 'Крупнее' }, { role: 'zoomOut', label: 'Мельче' }, { type: 'separator' }, { role: 'togglefullscreen', label: 'Во весь экран' }] },
  { label: 'Справка', submenu: [{ label: 'О программе', click: about }, { label: 'Instagram автора', click: () => shell.openExternal(INSTAGRAM) }] }
]);

function about() {
  dialog.showMessageBox(win, {
    type: 'info', title: 'О программе', buttons: ['OK', 'Instagram'],
    message: 'Сетапы — просмотр планов лечения на элайнерах',
    detail: `Версия ${app.getVersion()}\nАвтор: Екатерина Скоробогатько (@katya_skorobogatko)\nМир цифровой стоматологии\n\nВсе расчёты выполняются на этом компьютере, файлы пациентов никуда не отправляются.`
  }).then(r => { if (r.response === 1) shell.openExternal(INSTAGRAM); });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(menu);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (!isMac) app.quit(); });
