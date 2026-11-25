import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const API = 'https://api.testynaprawojazdy.eu/eprawko-rest';
const SCHOOL_FALLBACK = process.env.SCHOOL_ID || '';
const sessions = new Map();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.APP_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));

function cookieValue(req, name) {
  return (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1);
}
function sessionFor(req) {
  const key = cookieValue(req, 'tb_session');
  return key ? sessions.get(key) : undefined;
}
function requireSession(req, res, next) {
  const session = sessionFor(req);
  if (!session) return res.status(401).json({ error: 'NOT_AUTHENTICATED', message: 'Zaloguj się ponownie.' });
  req.userSession = session;
  next();
}
async function upstream(pathname, { method='GET', session, body, multipart=false } = {}) {
  const headers = {
    Accept: 'application/json, text/plain, */*',
    Origin: 'https://panel.testynaprawojazdy.eu',
    Referer: 'https://panel.testynaprawojazdy.eu/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  };
  if (session?.token) headers.jsessionid = session.token;
  let payload;
  if (multipart) payload = body;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const response = await fetch(new URL(API + pathname), { method, headers, body: payload });
  const raw = await response.text();
  let data = raw;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `API zwróciło HTTP ${response.status}`);
    error.status = response.status;
    error.upstream = data;
    throw error;
  }
  return data;
}
function handleError(error, res) {
  const status = error.status || 502;
  res.status(status).json({ error: status === 502 ? 'UPSTREAM_REQUEST_FAILED' : 'UPSTREAM_ERROR', message: error.message || 'Błąd komunikacji z API.' });
}
function safeExamForBrowser(exam) {
  return {
    ...exam,
    execution: (exam.execution || []).map(item => {
      const { correct, ...question } = item.question || {};
      return { ...item, correct: undefined, question: { ...question, answerFormat: correct === 'TAK' || correct === 'NIE' ? 'YES_NO' : 'CHOICE' } };
    })
  };
}

app.get('/api/health', (_req, res) => res.json({ ok:true, service:'teoria-b-api', upstream:API }));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message:'Podaj login i hasło.' });
    const form = new FormData();
    form.set('userName', String(username));
    form.set('password', String(password));
    const data = await upstream('/login', { method:'POST', body:form, multipart:true });
    if (!data?.uuid || !data?.id) return res.status(502).json({ message:'API nie zwróciło wymaganych danych sesji.' });
    const key = randomUUID();
    sessions.set(key, { token:data.uuid, studentId:String(data.id), userName:data.userName || String(username), createdAt:Date.now(), activeExam:null });
    res.setHeader('Set-Cookie', `tb_session=${key}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.json({ id:data.id, userName:data.userName, userType:data.userType });
  } catch (e) { handleError(e,res); }
});

app.post('/api/auth/logout', requireSession, async (req,res) => {
  try { await upstream('/logout',{method:'POST',session:req.userSession}); } catch {}
  const key = cookieValue(req,'tb_session'); if (key) sessions.delete(key);
  res.setHeader('Set-Cookie','tb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ ok:true });
});

app.get('/api/profile', requireSession, async (req,res) => {
  try { res.json(await upstream(`/student/${encodeURIComponent(req.userSession.studentId)}`,{session:req.userSession})); }
  catch(e){ handleError(e,res); }
});
app.get('/api/modules/:category', requireSession, async (req,res) => {
  try { res.json(await upstream(`/questions/getModules/${encodeURIComponent(req.params.category)}`,{session:req.userSession})); }
  catch(e){ handleError(e,res); }
});
app.post('/api/learning', requireSession, async (req,res) => {
  try {
    const { moduleId, category='B', lang='PL' } = req.body || {};
    if (!moduleId) return res.status(400).json({message:'Brak moduleId.'});
    const profile = await upstream(`/student/${encodeURIComponent(req.userSession.studentId)}`,{session:req.userSession});
    const schoolId = profile.schoolId || SCHOOL_FALLBACK;
    if (!schoolId) return res.status(422).json({message:'Profil nie zawiera schoolId.'});
    const p = `/learning/create/studentId/${encodeURIComponent(req.userSession.studentId)}/schoolId/${encodeURIComponent(schoolId)}/category/${encodeURIComponent(category)}/lang/${encodeURIComponent(lang)}/moduleId/${encodeURIComponent(moduleId)}`;
    res.status(201).json(await upstream(p,{method:'PUT',session:req.userSession,body:{}}));
  } catch(e){ handleError(e,res); }
});
app.post('/api/progress/seen', requireSession, async (req,res) => {
  try {
    const { externalId, categories, type, moduleId } = req.body || {};
    if (externalId == null) return res.status(400).json({message:'Brak externalId.'});
    res.json(await upstream('/progress/seen',{method:'POST',session:req.userSession,body:{externalId,categories,type,moduleId:String(moduleId)}}));
  } catch(e){ handleError(e,res); }
});
app.get('/api/progress/learning', requireSession, async (req,res) => {
  try { res.json(await upstream(`/progress/learn/${encodeURIComponent(req.userSession.studentId)}`,{session:req.userSession})); }
  catch(e){ handleError(e,res); }
});
app.post('/api/progress/store', requireSession, async (req,res) => {
  try {
    const { moduleId, questionNumber, max, category='B' } = req.body || {};
    if ([moduleId,questionNumber,max].some(v => v == null)) return res.status(400).json({message:'Niekompletne dane postępu.'});
    const p = `/progress/learn/store/${encodeURIComponent(req.userSession.studentId)}/${encodeURIComponent(moduleId)}/${encodeURIComponent(questionNumber)}/${encodeURIComponent(max)}/${encodeURIComponent(category)}`;
    res.json(await upstream(p,{session:req.userSession}));
  } catch(e){ handleError(e,res); }
});

// Create an upstream exam. Keep the original answer key only in server memory.
app.post('/api/exams', requireSession, async (req,res) => {
  try {
    const profile = await upstream(`/student/${encodeURIComponent(req.userSession.studentId)}`,{session:req.userSession});
    const exam = await upstream('/exam',{method:'POST',session:req.userSession,body:{studentId:req.userSession.studentId,schoolId:profile.schoolId || SCHOOL_FALLBACK,examType:'EXAM',category:req.body?.category || profile.category || 'B',lang:req.body?.lang || 'PL'}});
    if (!exam || !Array.isArray(exam.execution) || !exam.execution.length) return res.status(502).json({message:'API nie zwróciło pytań egzaminacyjnych.'});
    req.userSession.activeExam = exam;
    res.status(201).json(safeExamForBrowser(exam));
  } catch(e){ handleError(e,res); }
});

// Submit the complete exam object observed in Proxyman. Answer keys are read from
// the server-side copy; the browser never supplies question.correct or execution.correct.
app.put('/api/exams/submit', requireSession, async (req,res) => {
  try {
    const original = req.userSession.activeExam;
    if (!original?.execution?.length) return res.status(409).json({message:'Brak aktywnego egzaminu. Rozpocznij nowy egzamin.'});
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const byOrdinal = new Map(answers.map(a => [Number(a.ordinalNumber), a]));
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let points = 0;
    const execution = original.execution.map((item, index) => {
      const supplied = byOrdinal.get(Number(item.ordinalNumber ?? index + 1)) || {};
      const answer = typeof supplied.answer === 'string' ? supplied.answer : null;
      const key = String(item.question?.correct ?? '').trim().toUpperCase();
      const isCorrect = Boolean(answer) && answer.trim().toUpperCase() === key;
      if (isCorrect) { correctAnswers += 1; points += Number(item.question?.weight || 0); }
      else wrongAnswers += 1;
      return {
        ...item,
        answer,
        firstSelection: Number.isFinite(Number(supplied.firstSelection)) ? Number(supplied.firstSelection) : 0,
        timeOnQuestion: Number.isFinite(Number(supplied.timeOnQuestion)) ? Number(supplied.timeOnQuestion) : 0,
        correct: isCorrect,
        changes: Number.isFinite(Number(supplied.changes)) ? Number(supplied.changes) : 0
      };
    });
    const pointsAll = execution.reduce((sum,item) => sum + Number(item.question?.weight || 0), 0);
    const now = new Date().toISOString();
    const payload = {
      ...original,
      execution,
      studentId: original.studentId ?? req.userSession.studentId,
      startDate: original.startDate || now,
      endDate: now,
      correctAnswers,
      wrongAnswers,
      points,
      pointsAll,
      passed: original.category === 'B' ? points >= 68 : Boolean(original.passed),
      printed: Boolean(original.printed),
      internalExam: Boolean(original.internalExam),
      privateExam: original.privateExam ?? true,
      qualification: Boolean(original.qualification)
    };
    await upstream('/exam',{method:'PUT',session:req.userSession,body:payload});
    req.userSession.activeExam = null;
    res.json({ok:true,submitted:true,correctAnswers,wrongAnswers,points,pointsAll,passed:payload.passed});
  } catch(e){ handleError(e,res); }
});

app.get('/api/exams/history', requireSession, async (req,res) => {
  try {
    const days = Math.min(3650, Math.max(1, Number(req.query.days) || 365));
    res.json(await upstream(`/exam/light/show/by/student/${encodeURIComponent(req.userSession.studentId)}?days=${days}`,{session:req.userSession}));
  } catch(e){ handleError(e,res); }
});
app.get('/api/statistics', requireSession, async (req,res) => {
  try {
    const category = String(req.query.category || 'B');
    const days = Math.min(3650, Math.max(1, Number(req.query.days) || 365));
    res.json(await upstream(`/student/${encodeURIComponent(req.userSession.studentId)}/statistics?category=${encodeURIComponent(category)}&days=${days}`,{session:req.userSession}));
  } catch(e){ handleError(e,res); }
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '../dist');
  app.use(express.static(dist));
  app.get('*', (_req,res) => res.sendFile(path.join(dist,'index.html')));
}
app.listen(PORT, () => console.log(`Teoria B API działa na porcie ${PORT}`));
