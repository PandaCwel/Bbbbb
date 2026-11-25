import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BookOpen, Brain, CarFront, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Clock3, GraduationCap, LogOut, ShieldCheck, Signal, UserRound, X } from 'lucide-react';
import { api, type ApiHealth, type ExamAnswer, type ExamSummary, type Execution, type Module, type Profile, type Progress, type Statistics } from './api';

type Tab='home'|'learn'|'exam'|'profile';
type Mode='learning'|'exam';
export default function App(){
 const [tab,setTab]=useState<Tab>('home');
 const [health,setHealth]=useState<ApiHealth|null>(null);
 const [profile,setProfile]=useState<Profile|null>(null);
 const [logged,setLogged]=useState(false);
 const [username,setUsername]=useState('');
 const [password,setPassword]=useState('');
 const [authBusy,setAuthBusy]=useState(false);
 const [error,setError]=useState('');
 const [modules,setModules]=useState<Module[]>([]);
 const [progress,setProgress]=useState<Progress[]>([]);
 const [history,setHistory]=useState<ExamSummary[]>([]);
 const [statistics,setStatistics]=useState<Statistics|null>(null);
 const [session,setSession]=useState<Execution[]>([]);
 const [examAnswers,setExamAnswers]=useState<ExamAnswer[]>([]);
 const [mode,setMode]=useState<Mode>('learning');
 const [moduleId,setModuleId]=useState('');
 const [index,setIndex]=useState(0);
 const [choice,setChoice]=useState<string|null>(null);
 const [checked,setChecked]=useState(false);
 const [busy,setBusy]=useState(false);
 const [examNotice,setExamNotice]=useState('');
 const [showLogin,setShowLogin]=useState(false);

 useEffect(()=>{api.health().then(setHealth).catch(()=>{});},[]);
 useEffect(()=>{if(logged){void refreshDashboard();}},[logged]);
 async function refreshDashboard(){
  try{
   const [p,m,pr,h,s]=await Promise.all([api.profile(),api.modules('B'),api.progress(),api.examHistory(365),api.statistics('B',365)]);
   setProfile(p);setModules(m);setProgress(Array.isArray(pr)?pr:[]);setHistory(Array.isArray(h)?h:[]);setStatistics(s);
  }catch(e){setError((e as Error).message);}
 }
 async function login(e:FormEvent){e.preventDefault();setAuthBusy(true);setError('');try{await api.login({username,password});setLogged(true);setShowLogin(false);setPassword('');}catch(e){setError((e as Error).message);}finally{setAuthBusy(false);}}
 async function logout(){try{await api.logout();}catch{}setLogged(false);setProfile(null);setSession([]);setHistory([]);setStatistics(null);setTab('home');}
 async function openModule(m:Module){setBusy(true);setError('');try{const data=await api.learning(String(m.moduleId));setSession(data.execution||[]);setMode('learning');setModuleId(String(m.moduleId));setIndex(0);setChoice(null);setChecked(false);setTab('learn');if(data.execution?.[0]?.question) await api.seen(data.execution[0].question,String(m.moduleId));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function startExam(){setBusy(true);setError('');setExamNotice('');try{const data=await api.startExam(profile?.category||'B');setSession(data.execution||[]);setExamAnswers((data.execution||[]).map(item=>({ordinalNumber:item.ordinalNumber,answer:null,firstSelection:0,timeOnQuestion:0,changes:0})));setMode('exam');setModuleId('');setIndex(0);setChoice(null);setChecked(false);setTab('exam');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const current=session[index];
 const options=useMemo(()=>{if(!current?.question)return [];const answers=[['A',current.question.answerA],['B',current.question.answerB],['C',current.question.answerC]].filter((x):x is [string,string]=>Boolean(x[1]?.trim()));return answers.length?answers:(current.question.answerFormat==='YES_NO'?[['TAK','Tak'],['NIE','Nie']]:[]);},[current]);
 async function nextQuestion(){
  if(!current)return;
  if(mode==='exam'&&index===session.length-1){
   setBusy(true);setError('');
   try{
    const result=await api.submitExam(examAnswers);
    setExamNotice(`Egzamin wysłany do API. Wynik: ${result.points}/${result.pointsAll} pkt, poprawne: ${result.correctAnswers}, błędne: ${result.wrongAnswers}. ${result.passed?'Według progu kategorii B – zaliczony.':'Według progu kategorii B – niezaliczony.'}`);
    setSession([]);setTab('exam');
    const [h,s]=await Promise.all([api.examHistory(365),api.statistics(profile?.category||'B',365)]);
    setHistory(Array.isArray(h)?h:[]);setStatistics(s);
   }catch(e){setError((e as Error).message);}
   finally{setBusy(false);}
   return;
  }
  setBusy(true);
  try{
   if(mode==='learning'){
    await api.storeProgress({moduleId,questionNumber:index+1,max:session.length,category:profile?.category||'B'});
    if(index+1<session.length)await api.seen(session[index+1].question,moduleId);
    api.progress().then(setProgress).catch(()=>{});
   }
   if(index+1<session.length){setIndex(index+1);setChoice(mode==='exam'?examAnswers[index+1]?.answer:null);setChecked(false);}
   else{setSession([]);setTab(mode==='learning'?'profile':'exam');if(mode==='learning')setExamNotice('Moduł ukończony.');}
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function selectAnswer(value:string){
  setChoice(value);
  if(mode==='exam'){
   setExamAnswers(old=>old.map((a,i)=>i===index?{...a,answer:value,changes:a.answer&&a.answer!==value?a.changes+1:a.changes}:a));
  }else if(current){try{await api.seen(current.question,moduleId);}catch{}setChecked(true);}
 }
 const cards=[{icon:BookOpen,title:'Nauka działami',detail:'Wybierz moduł i ćwicz pytania',target:'learn' as Tab},{icon:Brain,title:'Egzamin próbny',detail:'Rzeczywisty zestaw z API',target:'exam' as Tab},{icon:GraduationCap,title:'Postępy i wyniki',detail:'Statystyki oraz historia egzaminów',target:'profile' as Tab}];
 return <div className="app-shell">
  <header className="topbar"><button className="brand" onClick={()=>setTab('home')}><div className="brand-icon"><CarFront size={22}/></div><div><strong>TEORIA B</strong><span>PRAWKO MOBILE</span></div></button><button className="avatar" onClick={()=>logged?setTab('profile'):setShowLogin(true)} aria-label="Profil"><UserRound size={19}/></button></header>
  <main>
   {tab==='home'&&<><section className="hero"><div className="eyebrow"><span className="pulse"/> TWOJA DROGA DO PRAWA JAZDY</div><h1>Wiedza, która<br/><em>prowadzi do celu.</em></h1><p>Ucz się teorii na kategorię B, rozwiązuj pytania i przygotuj się do egzaminu.</p><button className="primary" onClick={()=>logged?setTab('learn'):setShowLogin(true)}>{logged?'Przejdź do nauki':'Zaloguj się'} <span>→</span></button><div className="hero-mark"><CarFront size={116} strokeWidth={1}/></div></section>
    <div className="section-heading"><div><span className="eyebrow muted">TWÓJ PLAN</span><h2>Co dziś robimy?</h2></div><span className="date-label">KATEGORIA B</span></div>
    <div className="feature-list">{cards.map(({icon:Icon,title,detail,target},i)=><button className="feature-card" key={title} onClick={()=>{if(!logged){setShowLogin(true);return;}setTab(target);}}><div className={'feature-icon tone-'+i}><Icon size={22}/></div><div className="feature-copy"><strong>{title}</strong><span>{detail}</span></div><span className="arrow">↗</span></button>)}</div>
    <section className="status-card"><div className="status-icon"><Signal size={18}/></div><div><strong>Oryginalne API</strong><span>{health?.ok?'Backend aplikacji działa':'Sprawdzanie połączenia'}</span></div><span className="status-dot online"/></section>
    {logged&&profile&&<p className="welcome">Witaj{profile.firstName?' '+profile.firstName:''}! Miło Cię widzieć.</p>}</>}
   {tab==='learn'&&!current&&<section className="page"><span className="eyebrow muted">STREFA NAUKI</span><h1>Ucz się <em>skutecznie.</em></h1><p className="lead">Wybierz dział i ćwicz pytania tematyczne.</p>{modules.length? <div className="module-list">{modules.map(m=><button className="module-card" key={m.id+'-'+m.moduleId} onClick={()=>openModule(m)} disabled={busy}><span className="module-count">{m.count}</span><span><strong>Moduł {m.moduleId}</strong><small>{m.count} pytań w bazie</small></span><ChevronRight/></button>)}</div>:<div className="empty-state"><BookOpen size={34}/><h3>Brak listy modułów</h3><p>Nie udało się pobrać modułów z serwera.</p></div>}</section>}
   {tab==='exam'&&!current&&<section className="page"><span className="eyebrow muted">TRYB EGZAMINACYJNY</span><h1>Sprawdź <em>swoją wiedzę.</em></h1><p className="lead">Rozwiąż zestaw egzaminacyjny pobrany z oryginalnego API.</p><div className="exam-info"><div><CircleHelp/><strong>32 pytania*</strong><span>*zestaw z przechwyconej sesji</span></div><div><ShieldCheck/><strong>Kategoria B</strong><span>Język polski</span></div><div><Clock3/><strong>Bez limitu w UI</strong><span>Limit czasu API nieustalony</span></div></div><button className="primary wide" disabled={!logged||busy} onClick={startExam}>{busy?'Pobieranie…':logged?'Rozpocznij egzamin':'Zaloguj się, aby rozpocząć'} <span>→</span></button>{examNotice&&<p className="notice">{examNotice}</p>}<p className="exam-warning">Wynik jest obliczany po stronie backendu z klucza odpowiedzi przechowywanego poza przeglądarką. Próg zaliczenia kategorii B przyjęto jako 68/74 pkt i wymaga potwierdzenia na koncie.</p></section>}
   {tab==='profile'&&<section className="page"><span className="eyebrow muted">TWOJE KONTO</span><h1>Twój <em>postęp.</em></h1>{logged&&profile?<><div className="profile-card"><div className="profile-avatar"><UserRound/></div><h3>{[profile.firstName,profile.lastName].filter(Boolean).join(' ')||profile.email||'Kursant'}</h3><p>{profile.email||'Konto kursanta'} · kat. {profile.category||'B'}</p><div className="stats"><div><strong>{profile.viewedQuestions??0}</strong><span>Obejrzane pytania</span></div><div><strong>{statistics?.positiveExams??profile.exams??0}</strong><span>Zaliczone</span></div><div><strong>{statistics?.negativeExams??0}</strong><span>Niezaliczone</span></div></div></div>
    <h2 className="subheading">Statystyki nauki</h2><div className="stats"><div><strong>{statistics?.standardQuestionsAnswered??0}/{statistics?.standardQuestionsTotalCount??0}</strong><span>Podstawowe</span></div><div><strong>{statistics?.specialisticQuestionsAnswered??0}/{statistics?.specialisticQuestionsTotalCount??0}</strong><span>Specjalistyczne</span></div></div>
    <h2 className="subheading">Historia egzaminów</h2>{history.length?history.map((exam,i)=><div className="progress-row" key={String(exam.id)+'-'+i}><span>{new Date(exam.startDate).toLocaleDateString('pl-PL')} · {exam.category} · {exam.passed?'ZALICZONY':'NIEZALICZONY'}</span><strong>{exam.points}/{exam.pointsAll} pkt</strong></div>):<p className="lead">Brak egzaminów w historii.</p>}
    <h2 className="subheading">Zapisane postępy nauki</h2>{progress.length?progress.map((p,i)=><div className="progress-row" key={p.moduleId+'-'+i}><span>Moduł {p.moduleId}</span><strong>{p.questionNumber}/{p.max}</strong></div>):<p className="lead">Brak zapisanych postępów.</p>}<button className="secondary logout" onClick={logout}><LogOut size={16}/> Wyloguj się</button></>:<div className="empty-state"><UserRound size={34}/><h3>Twój profil</h3><p>Zaloguj się, aby zobaczyć swoje dane i postępy.</p><button className="secondary" onClick={()=>setShowLogin(true)}>Zaloguj się</button></div>}</section>}
   {current&&<section className="question-page"><div className="question-top"><button className="back-button" onClick={()=>{setSession([]);setTab(mode==='learning'?'learn':'exam');}}> <ChevronLeft/> Wróć</button><span>{mode==='learning'?'NAUKA':'EGZAMIN'} · {index+1}/{session.length}</span></div><div className="progress-track"><i style={{width:`${(index+1)/session.length*100}%`}}/></div><div className="question-meta">{current.question.module?.name||'Pytanie'} <span>{current.question.weight} pkt</span></div><h2 className="question-text">{current.question.questionText}</h2>{current.question.media&&<div className="media-placeholder">Materiał: {current.question.media}<small>Adres multimediów nie został jeszcze ustalony.</small></div>}<div className="answers">{options.map(([letter,value])=><button key={letter} className={'answer '+(choice===letter?'selected':'')+(checked&&letter===current.question.correct?' is-correct':'')+(checked&&choice===letter&&letter!==current.question.correct?' is-wrong':'')} onClick={()=>selectAnswer(letter)} disabled={checked&&mode==='learning'}><b>{letter}</b><span>{value}</span>{checked&&letter===current.question.correct&&<CheckCircle2/>}</button>)}</div>{checked&&mode==='learning'&&<div className="explanation"><strong>{choice===current.question.correct?'Dobrze!':'Nie tym razem.'}</strong><p>{current.question.explenation||current.question.legalSource||'Brak dodatkowego wyjaśnienia w danych pytania.'}</p>{current.question.legalSource&&<small>{current.question.legalSource}</small>}</div>}{mode==='exam'&&<p className="exam-warning">Odpowiedź zostanie wysłana razem z całym egzaminem po ostatnim pytaniu. Możesz wracać do wcześniejszych pytań i zmieniać wybór.</p>}<div className="question-actions"><button className="secondary" disabled={index===0||busy} onClick={()=>{setIndex(index-1);setChoice(mode==='exam'?examAnswers[index-1]?.answer:null);setChecked(false);}}><ChevronLeft/> Wstecz</button><button className="primary" disabled={busy||(mode==='learning'&&!checked)} onClick={nextQuestion}>{index===session.length-1?(mode==='exam'?'Wyślij egzamin':'Zakończ'):'Dalej'} <ChevronRight/></button></div></section>}
   {error&&<div className="error-banner"><span>{error}</span><button onClick={()=>setError('')}><X size={16}/></button></div>}
  </main>
  <nav className="bottom-nav">{([{id:'home',label:'Start',icon:CarFront},{id:'learn',label:'Nauka',icon:BookOpen},{id:'exam',label:'Egzamin',icon:Brain},{id:'profile',label:'Profil',icon:UserRound}] as const).map(({id,label,icon:Icon})=><button key={id} className={tab===id?'nav-item active':'nav-item'} onClick={()=>{setSession([]);setTab(id);setError('');}}><Icon size={20}/><span>{label}</span></button>)}</nav>
  {showLogin&&<div className="modal-backdrop" onClick={()=>setShowLogin(false)}><form className="login-modal" onSubmit={login} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setShowLogin(false)}><X/></button><span className="eyebrow muted">KONTO KURSANTA</span><h2>Zaloguj się</h2><p>Użyj danych do platformy Testy na Prawo Jazdy.</p><label>Login / e-mail<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/></label><label>Hasło<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<p className="modal-error">{error}</p>}<button className="primary wide" disabled={authBusy}>{authBusy?'Logowanie…':'Zaloguj się'} <span>→</span></button><small>Hasło jest przesyłane przez backend do API. Token sesji pozostaje po stronie serwera.</small></form></div>}
 </div>;
}
