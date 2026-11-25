import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'teoria-b-api',
    upstreamConfigured: Boolean(process.env.UPSTREAM_API_BASE_URL),
    schoolId: process.env.SCHOOL_ID || null
  });
});

async function proxy(req, res, upstreamPath) {
  const base = process.env.UPSTREAM_API_BASE_URL;
  if (!base) {
    return res.status(503).json({
      error: 'UPSTREAM_API_NOT_CONFIGURED',
      message: 'Brak UPSTREAM_API_BASE_URL. Uzupełnij .env zgodnie z dokumentacją dostawcy API.'
    });
  }

  try {
    const url = new URL(upstreamPath, base);
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (process.env.UPSTREAM_API_TOKEN) headers.Authorization = `Bearer ${process.env.UPSTREAM_API_TOKEN}`;
    const response = await fetch(url, {
      method: req.method,
      headers,
      ...(req.method === 'GET' ? {} : { body: JSON.stringify({ ...req.body, schoolId: process.env.SCHOOL_ID }) })
    });
    const body = await response.text();
    res.status(response.status);
    res.type(response.headers.get('content-type') || 'application/json');
    return res.send(body);
  } catch (error) {
    return res.status(502).json({ error: 'UPSTREAM_REQUEST_FAILED', message: error.message });
  }
}

app.post('/api/auth/login', (req, res) => proxy(req, res, process.env.UPSTREAM_LOGIN_PATH || '/auth/login'));
app.get('/api/questions', (req, res) => proxy(req, res, process.env.UPSTREAM_QUESTIONS_PATH || '/questions'));
app.post('/api/exam', (req, res) => proxy(req, res, process.env.UPSTREAM_EXAM_PATH || '/exam'));

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '../dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`Teoria B API działa na porcie ${PORT}`));