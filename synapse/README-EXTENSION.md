Testing the extension (Chrome / Firefox)

1. Build the project:

```bash
npm run build
```

2. In Chrome:
- Open chrome://extensions
- Enable Developer mode
- Click "Load unpacked" and select the project root (the folder that contains `manifest.json`).
- Click the extension icon. The popup should open and display the React app.

3. In Firefox:
- Open about:debugging#/runtime/this-firefox
- Click "Load Temporary Add-on..." and select `manifest.json` in the project root.
- Click the extension icon.

Notes:
- The popup HTML and assets are served from `dist/` after build.
- If you change code, rebuild before reloading the extension.
