import { useEffect, useState } from 'react';
import { BookOpen, Brain, CarFront, CheckCircle2, CircleHelp, Clock3, GraduationCap, ShieldCheck, Signal, UserRound } from 'lucide-react';
import { api, type ApiHealth } from './api';

type Tab = 'home' | 'learn' | 'exam' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api.health().then(setHealth).catch((error: Error) => setApiError(error.message));
  }, []);

  const cards = [
    { icon: BookOpen, title: 'Nauka działami', detail: 'Przerabiaj materiał krok po kroku', tab: 'learn' as Tab },
    { icon: Brain, title: 'Egzamin próbny', detail: 'Sprawdź wiedzę w warunkach egzaminu', tab: 'exam' as Tab },
    { icon: GraduationCap, title: 'Moje postępy', detail: 'Wróć do nauki i śledź wyniki', tab: 'profile' as Tab }
  ];

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-icon"><CarFront size={22}/></div><div><strong>TEORIA B</strong><span>PRAWKO MOBILE</span></div></div>
      <button className="avatar" onClick={() => setTab('profile')} aria-label="Profil"><UserRound size={19}/></button>
    </header>

    <main>
      {tab === 'home' && <>
        <section className="hero">
          <div className="eyebrow"><span className="pulse"/> TWOJA DROGA DO PRAWA JAZDY</div>
          <h1>Wiedza, która<br/><em>prowadzi do celu.</em></h1>
          <p>Ucz się teorii na kategorię B, rozwiązuj pytania i przygotuj się do egzaminu.</p>
          <button className="primary" onClick={() => setTab('learn')}>Rozpocznij naukę <span>→</span></button>
          <div className="hero-mark"><CarFront size={116} strokeWidth={1}/></div>
        </section>
        <div className="section-heading"><div><span className="eyebrow muted">TWÓJ PLAN</span><h2>Co dziś robimy?</h2></div><span className="date-label">KATEGORIA B</span></div>
        <div className="feature-list">{cards.map(({icon: Icon,title,detail,tab: target}, i) =>
          <button className="feature-card" key={title} onClick={() => setTab(target)}>
            <div className={`feature-icon tone-${i}`}><Icon size={22}/></div><div className="feature-copy"><strong>{title}</strong><span>{detail}</span></div><span className="arrow">↗</span>
          </button>)}</div>
        <section className="status-card"><div className="status-icon"><Signal size={18}/></div><div><strong>Połączenie z API</strong><span>{health?.upstreamConfigured ? 'Skonfigurowano adres zewnętrznego API' : 'Oczekiwanie na konfigurację dostawcy API'}</span></div><span className={health?.upstreamConfigured ? 'status-dot online' : 'status-dot'}/></section>
        {apiError && <p className="error">{apiError}</p>}
      </>}
      {tab === 'learn' && <section className="page"><span className="eyebrow muted">STREFA NAUKI</span><h1>Ucz się <em>skutecznie.</em></h1><p className="lead">Wybierz dział i ćwicz pytania tematyczne.</p><div className="empty-state"><BookOpen size={34}/><h3>Moduły nauki</h3><p>Lista działów zostanie pobrana z API po skonfigurowaniu adresu i właściwego formatu odpowiedzi.</p><button className="secondary" onClick={() => api.questions().then(() => setNotice('Połączenie z endpointem pytań działa.')).catch((e: Error) => setNotice(e.message))}>Sprawdź API pytań</button>{notice && <small>{notice}</small>}</div></section>}
      {tab === 'exam' && <section className="page"><span className="eyebrow muted">TRYB EGZAMINACYJNY</span><h1>Sprawdź <em>swoją wiedzę.</em></h1><p className="lead">Przygotuj się do egzaminu teoretycznego kategorii B.</p><div className="exam-info"><div><Clock3/><strong>25 min</strong><span>Limit czasu</span></div><div><CircleHelp/><strong>32 pytania</strong><span>Format egzaminu</span></div><div><ShieldCheck/><strong>Egzamin</strong><span>Tryb treningowy</span></div></div><button className="primary wide" onClick={() => api.startExam({ category: 'B' }).then(() => setNotice('Egzamin został uruchomiony.')).catch((e: Error) => setNotice(e.message))}>Połącz z API i rozpocznij <span>→</span></button>{notice && <p className="notice">{notice}</p>}</section>}
      {tab === 'profile' && <section className="page"><span className="eyebrow muted">TWOJE KONTO</span><h1>Twój <em>postęp.</em></h1><div className="empty-state"><UserRound size={34}/><h3>Profil użytkownika</h3><p>Logowanie i synchronizacja postępów zostaną aktywowane po potwierdzeniu kontraktu API.</p><div className="api-pill"><CheckCircle2 size={16}/> Identyfikator szkoły: {health?.schoolId || 'nieustawiony'}</div></div></section>}
    </main>

    <nav className="bottom-nav">
      {([{id:'home',label:'Start',icon:CarFront},{id:'learn',label:'Nauka',icon:BookOpen},{id:'exam',label:'Egzamin',icon:Brain},{id:'profile',label:'Profil',icon:UserRound}] as const).map(({id,label,icon: Icon}) =>
        <button key={id} className={tab === id ? 'nav-item active' : 'nav-item'} onClick={() => {setTab(id);setNotice('');}}><Icon size={20}/><span>{label}</span></button>)}
    </nav>
  </div>;
}