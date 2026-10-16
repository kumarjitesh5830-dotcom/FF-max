import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const distPath = path.resolve(__dirname, 'dist');

// Serve static files from Vite build output directory
app.use(express.static(distPath));

// Health probe for Cloud Run and container readiness
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', app: 'FreeFire 3D: Battle Royale' });
});

// SPA fallback: Return index.html for any navigation to avoid 404 on refresh or direct entry
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`FreeFire 3D production server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err: any) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
});
