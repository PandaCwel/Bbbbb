export type ApiHealth = { ok:boolean; service:string; upstream:string };
export type Module = { id:number; moduleId:string; count:number };
export type Question = {
  id:number; externalId:number; questionText:string; answerA:string; answerB:string; answerC:string;
  correct?:string; answerFormat?:'YES_NO'|'CHOICE'; weight:number; categories:string; module:{id:number;name:string;moduleId:string};
  media?:string|null; madiaType?:string; explenation?:string; legalSource?:string; type:string;
};
export type Execution = { id:number|null; ordinalNumber:number; question:Question; answer:string|null; correct?:boolean; timeOnQuestion?:number; changes?:number; firstSelection?:number };
export type LearningSession = { id:number|null; execution:Execution[]; studentId:string|number; schoolId:string|number; startDate:string; endDate:string|null; category:string };
export type Profile = { id:string|number; email?:string; firstName?:string; lastName?:string; category?:string; schoolId?:string|number; viewedQuestions?:number; exams?:number; passed?:number; learningAvailableTill?:string };
export type Progress = { moduleId:string; questionNumber:number; max:number; category:string };
export type ExamSummary = { id:number|string; passed:boolean; points:number; pointsAll:number; correctAnswers:number; wrongAnswers:number; totalAnswers:number; category:string; startDate:string; endDate:string|null };
export type Statistics = { learningProgress?:unknown[]; standardQuestionsAnswered?:number; standardQuestionsTotalCount?:number; specialisticQuestionsAnswered?:number; specialisticQuestionsTotalCount?:number; positiveExams?:number; negativeExams?:number };
export type ExamAnswer = { ordinalNumber:number; answer:string|null; firstSelection:number; timeOnQuestion:number; changes:number };
async function request<T>(url:string, init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,credentials:'include',headers:{'Content-Type':'application/json',...(init?.headers||{})}});
  const raw=await response.text(); let data:any=null; try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
  if(!response.ok) {
    const diagnostics = data?.diagnostics;
    const detail = diagnostics
      ? ` (API: HTTP ${diagnostics.upstreamStatus ?? response.status}; ${diagnostics.upstreamContentType || 'brak Content-Type'}; odpowiedź: ${diagnostics.upstreamResponse || '(pusta)'})`
      : '';
    throw new Error((data?.message||data?.error||`HTTP ${response.status}`) + detail);
  }
  return data as T;
}
export const api={
 health:()=>request<ApiHealth>('/api/health'),
 login:(credentials:{username:string;password:string})=>request<{id:string|number;userName:string}>('/api/auth/login',{method:'POST',body:JSON.stringify(credentials)}),
 logout:()=>request<{ok:boolean}>('/api/auth/logout',{method:'POST'}),
 profile:()=>request<Profile>('/api/profile'),
 school:()=>request<Record<string,unknown>>('/api/school'),
 systemMessages:()=>request<unknown[]>('/api/system-messages'),
 questionsLastUpdate:()=>request<string>('/api/questions/last-update'),
 studentQuestionIds:()=>request<Array<number|string>>('/api/questions/student-ids'),
 modules:(category='B')=>request<Module[]>(`/api/modules/${encodeURIComponent(category)}`),
 learning:(moduleId:string,category='B',lang='PL')=>request<LearningSession>('/api/learning',{method:'POST',body:JSON.stringify({moduleId,category,lang})}),
 seen:(q:Question,moduleId:string)=>request('/api/progress/seen',{method:'POST',body:JSON.stringify({externalId:q.externalId,categories:q.categories,type:q.type,moduleId})}),
 progress:()=>request<Progress[]>('/api/progress/learning'),
 storeProgress:(payload:{moduleId:string;questionNumber:number;max:number;category:string})=>request<boolean>('/api/progress/store',{method:'POST',body:JSON.stringify(payload)}),
 startExam:(category='B',lang='PL')=>request<LearningSession>('/api/exams',{method:'POST',body:JSON.stringify({category,lang})}),
 submitExam:(answers:ExamAnswer[])=>request<{ok:boolean;submitted:boolean;correctAnswers:number;wrongAnswers:number;points:number;pointsAll:number;passed:boolean}>('/api/exams/submit',{method:'PUT',body:JSON.stringify({answers})}),
 examHistory:(days=365)=>request<ExamSummary[]>(`/api/exams/history?days=${days}`),
 statistics:(category='B',days=365)=>request<Statistics>(`/api/statistics?category=${encodeURIComponent(category)}&days=${days}`)
};
