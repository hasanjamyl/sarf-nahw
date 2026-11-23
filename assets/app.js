/**
 * Asan Sarf & Nahw Quiz Academy
 * Pure static front-end: no login, backend, cookies, analytics, or external dependencies.
 * Question banks are original JSON files, kept unmodified in /data.
 */
const CATALOG = [
  { id:'sarf-1', ur:'آسان صرف اوّل', en:'Asan Sarf I', area:'sarf', volume:'I', description:'صرف کی بنیادی اصطلاحات، گردانیں، معروف و مجہول، امر و نہی، اوزان اور ابواب۔', questionBank:'data/sarf-1.json', pdf:'books/sarf-1.pdf', cover:'assets/covers/sarf-1.webp' },
  { id:'sarf-2', ur:'آسان صرف دوم', en:'Asan Sarf II', area:'sarf', volume:'II', description:'ماضی و مضارع کے صیغے، مشتقات، اسمِ فاعل و مفعول، رباعی اوزان اور صرفی اقسام۔', questionBank:'data/sarf-2.json', pdf:'books/sarf-2.pdf', cover:'assets/covers/sarf-2.webp' },
  { id:'nahw-1', ur:'آسان نحو اوّل', en:'Asan Nahw I', area:'nahw', volume:'I', description:'کلمہ، مرکب، اعراب، مرفوعات، منصوبات، مجرورات، توابع اور حروف۔', questionBank:'data/nahw-1.json', pdf:'books/nahw-1.pdf', cover:'assets/covers/nahw-1.webp' },
  { id:'nahw-2', ur:'آسان نحو دوم', en:'Asan Nahw II', area:'nahw', volume:'II', description:'نحو کے مزید قواعد، جملہ سازی، عوامل، توابع، حروف اور جامع اعادہ۔', questionBank:'data/nahw-2.json', pdf:'books/nahw-2.pdf', cover:'assets/covers/nahw-2.webp' }
];
const APP_BASE = new URL('../', import.meta.url);
const PROGRESS_KEY = 'asan-sarf-nahw-progress-v1';
const THEME_KEY = 'asan-sarf-nahw-theme-v1';
const banks = new Map();
const main = document.getElementById('main-content');
const ui = { questionIndex:0, activeQuizKey:'', bookSearch:'', bookFilter:'all', bookSearchId:'' };
let progress = readProgress();
let toastTimer = null;

function escapeHtml(input='') {
  return String(input).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}
function attr(input='') { return escapeHtml(input); }
function fmt(n) { return Number(n).toLocaleString('en-US'); }
function percent(part, total) { return total ? Math.round(part * 100 / total) : 0; }
function readProgress() {
  try { const v=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}'); return v && typeof v==='object' && !Array.isArray(v) ? v : {}; }
  catch { return {}; }
}
function storeProgress() { try { localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress)); } catch { toast('پیش رفت محفوظ کرنے کی سہولت اس براؤزر میں دستیاب نہیں۔'); } }
function book(id) { return CATALOG.find(b=>b.id===id); }
function bank(id) { return banks.get(id); }
function lessons(id) { return bank(id)?.lessons || []; }
function keyFor(bookId, lessonIdx) { return `${bookId}:${lessonIdx}`; }
function saved(bookId, lessonIdx) {
  const record = progress[keyFor(bookId,lessonIdx)];
  return record && typeof record==='object' && !Array.isArray(record) ? record : { answers:{} };
}
function picked(bookId, lessonIdx, questionIdx) {
  const answers = saved(bookId,lessonIdx).answers || {};
  const x = answers[String(questionIdx)];
  return Number.isInteger(x) && x>=0 && x<=3 ? x : null;
}
function lessonStats(bookId, lessonIdx) {
  const questions = lessons(bookId)[lessonIdx]?.questions || [];
  let answered=0, correct=0;
  questions.forEach((q,qi)=>{ const v=picked(bookId,lessonIdx,qi); if(v!==null){answered++;if(v===q.a) correct++;}});
  return {answered, correct, total:questions.length, complete:questions.length>0 && answered===questions.length, percent:percent(answered,questions.length)};
}
function bookStats(bookId) {
  const list=lessons(bookId), totalQuestions=list.reduce((n,l)=>n+l.questions.length,0);
  const stats=list.map((_,i)=>lessonStats(bookId,i));
  return { lessons:list.length, completed:stats.filter(s=>s.complete).length, questions:totalQuestions, answered:stats.reduce((n,s)=>n+s.answered,0), correct:stats.reduce((n,s)=>n+s.correct,0) };
}
function totalStats() {
  return CATALOG.reduce((a,b)=>{const x=bookStats(b.id);a.books++;a.lessons+=x.lessons;a.completed+=x.completed;a.questions+=x.questions;a.answered+=x.answered;a.correct+=x.correct;return a;},{books:0,lessons:0,completed:0,questions:0,answered:0,correct:0});
}
function bar(p) { return `<div class="progress-track" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p}%"></span></div>`; }
function crumbs(...items) { return `<div class="breadcrumb"><a href="#/">کتابیں</a>${items.map(x=>`<span class="sep">/</span>${x.url?`<a href="${attr(x.url)}">${escapeHtml(x.text)}</a>`:`<span>${escapeHtml(x.text)}</span>`}`).join('')}</div>`; }
function statTile(n,label) { return `<div class="stat-tile"><strong>${fmt(n)}</strong><span>${escapeHtml(label)}</span></div>`; }
function sourceLink(id,page,label='اصل کتاب کا صفحہ') {
  const b=book(id);
  const p = Number.isInteger(+page) ? Math.max(1,Math.floor(+page)) : 1;
  return `<a class="btn btn-sm" href="./${attr(b.pdf)}#page=${p}" target="_blank" rel="noopener noreferrer" title="اصل اسکین شدہ صفحہ نئی ٹیب میں کھولیں">${escapeHtml(label)} ${p} ↗</a>`;
}
function toast(msg) {
  const el=document.getElementById('toast'); el.textContent=msg;el.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3100);
}
function getRoute() {
  const segments=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
  if(segments.length===0) return {page:'home'};
  if(segments[0]==='book' && book(segments[1])) return {page:'book',id:segments[1]};
  if(['quiz','results'].includes(segments[0]) && book(segments[1])) {
    const idx=Number(segments[2])-1;
    if(Number.isInteger(idx) && idx>=0 && idx<lessons(segments[1]).length) return {page:segments[0],id:segments[1],idx};
  }
  if(segments[0]==='progress'||segments[0]==='about')return {page:segments[0]};
  return {page:'notfound'};
}
function setNav(page) {
  document.querySelectorAll('[data-route]').forEach(x=>x.classList.toggle('active',x.dataset.route===((page==='book'||page==='quiz'||page==='results')?'home':page)));
}
function render() {
  const r=getRoute();setNav(r.page);
  if(r.page==='home') renderHome();
  else if(r.page==='book')renderBook(r.id);
  else if(r.page==='quiz')renderQuiz(r.id,r.idx);
  else if(r.page==='results')renderResults(r.id,r.idx);
  else if(r.page==='progress')renderProgress();
  else if(r.page==='about')renderAbout();
  else main.innerHTML=`<div class="empty-state"><h2>یہ صفحہ نہیں ملا</h2><a class="btn btn-primary" href="#/">کتابوں کی فہرست</a></div>`;
  document.title = (r.id?`${book(r.id).ur} | `:'') + 'آسان صرف و نحو — Quiz Academy';
}
function card(b) {
  const s=bookStats(b.id);const pc=percent(s.completed,s.lessons);
  return `<article class="book-card">
    <div class="cover-wrap"><img src="./${attr(b.cover)}" alt="${attr(b.ur)} کی کتاب کا سرورق" loading="lazy" /></div>
    <div class="book-card-body">
      <div class="eyebrow">${b.area==='sarf'?'علمِ صرف':'علمِ نحو'} · حصہ ${escapeHtml(b.volume)}</div>
      <h3 class="book-title">${escapeHtml(b.ur)}</h3><div class="book-en">${escapeHtml(b.en)}</div>
      <p class="book-description">${escapeHtml(b.description)}</p>
      <div class="book-tags"><span class="tag">${fmt(s.lessons)} کوئز</span><span class="tag">${fmt(s.questions)} سوالات</span></div>
      ${bar(pc)}<div class="progress-caption"><span>${fmt(s.completed)} / ${fmt(s.lessons)} مکمل</span><span class="ltr">${pc}%</span></div>
      <div class="book-card-bottom"><span class="muted small">${s.answered?`${fmt(s.answered)} سوال حل کیے گئے`:'پہلا سبق شروع کریں'}</span><a class="btn btn-primary btn-sm" href="#/book/${b.id}">اسباق دیکھیں ←</a></div>
    </div>
  </article>`;
}
function renderHome() {
  const s=totalStats();
  main.innerHTML=`
    <section class="hero" aria-labelledby="welcome-title">
      <div><div class="eyebrow">گھر بیٹھے عربی قواعد کی مشق</div>
        <h1 id="welcome-title">آسان <span>صرف و نحو</span><br>انٹرایکٹو کوئز</h1>
        <p>چار نصابی کتابیں، مرحلہ وار سبق، فوراً نتیجہ اور ہر جواب کی اردو وضاحت۔ نہ اکاؤنٹ بنانا ہے، نہ کوئی فیس ادا کرنی ہے۔</p>
        <div class="hero-actions"><button class="btn btn-primary" type="button" data-action="scroll-books">کتاب منتخب کریں ←</button><a class="btn" href="#/progress">میری پیش رفت</a></div>
      </div>
      <div class="hero-visual" aria-hidden="true"><div><svg viewBox="0 0 128 128"><path d="M14 30Q38 20 64 33Q90 20 114 30V95Q90 87 64 101Q39 87 14 95Z" stroke="currentColor" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M64 34V100" stroke="currentColor" stroke-width="3"/><path d="M25 47Q38 44 53 51M25 60Q38 57 53 64M75 51Q90 43 103 47M75 64Q90 57 103 60" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="64" cy="16" r="6" fill="#c79543"/></svg></div></div>
    </section>
    <div class="stats-strip">${statTile(s.books,'کتابیں')}${statTile(s.lessons,'کوئز اسباق')}${statTile(s.questions,'کل سوالات')}${statTile(s.completed,'مکمل کیے گئے کوئز')}</div>
    <div class="section-heading" id="books"><div><div class="eyebrow">نصابی مجموعہ</div><h2>اپنی کتاب منتخب کریں</h2><p>ہر کتاب میں اپنے اسباق، مشقیں اور اصل PDF کے صفحات موجود ہیں۔</p></div></div>
    <div class="book-grid">${CATALOG.map(card).join('')}</div>
    <p class="small muted" style="margin:23px 2px 0">یاد رہے: آپ کی پیش رفت اسی ڈیوائس/براؤزر میں محفوظ ہوتی ہے؛ دوسرے ڈیوائس پر منتقل کرنے کے لیے بیک اپ استعمال کریں۔</p>`;
}
function renderBook(id) {
  const b=book(id);const s=bookStats(id);const pc=percent(s.completed,s.lessons);
  if(ui.bookSearchId!==id){ui.bookSearchId=id;ui.bookSearch='';ui.bookFilter='all';}
  main.innerHTML=`${crumbs({text:b.ur})}
    <section class="book-detail-top"><img src="./${attr(b.cover)}" alt="${attr(b.ur)} کا سرورق" />
      <div><span class="eyebrow">${b.area==='sarf'?'علمِ صرف':'علمِ نحو'} · ${b.en}</span><h1>${escapeHtml(b.ur)}</h1><p class="page-lead">${escapeHtml(b.description)}</p>
        <div class="book-tags"><span class="tag">${fmt(s.lessons)} اسباق</span><span class="tag">${fmt(s.questions)} سوال</span><span class="tag">${fmt(s.completed)} مکمل</span></div>
        ${bar(pc)}<div class="progress-caption"><span>اسباق کی پیش رفت</span><span class="ltr">${pc}%</span></div>
        <div class="action-row">${sourceLink(id,1,'مکمل اصل کتاب (PDF)')}<a href="#/" class="btn btn-sm">دیگر کتابیں</a></div>
      </div>
    </section>
    <div class="section-heading"><div><div class="eyebrow">سبق وار امتحانات</div><h2>تمام کوئز</h2><p>سبق کھولیں، چار اختیارات میں سے جواب منتخب کریں اور وضاحت پڑھیں۔</p></div></div>
    <div class="toolbar"><input id="lesson-search" class="search-field" type="search" placeholder="سبق کا نام یا عنوان تلاش کریں…" aria-label="سبق تلاش کریں" value="${attr(ui.bookSearch)}" />
      <select id="lesson-filter" class="filter-select" aria-label="حیثیت کے حساب سے فلٹر" ><option value="all">تمام اسباق</option><option value="new">ابھی شروع نہیں ہوئے</option><option value="doing">زیرِ تکمیل</option><option value="done">مکمل</option></select></div>
    <div id="lesson-list" class="lesson-list"></div>`;
  document.getElementById('lesson-filter').value=ui.bookFilter;
  updateLessonList(id);
}
function updateLessonList(id) {
  const target=document.getElementById('lesson-list');if(!target)return;
  const term=ui.bookSearch.trim().toLocaleLowerCase();
  const items=lessons(id).map((l,i)=>({l,i,stats:lessonStats(id,i)}))
    .filter(x=>!term||[x.l.title,x.l.desc,x.l.pages].some(y=>String(y||'').toLocaleLowerCase().includes(term)))
    .filter(x=>ui.bookFilter==='all'||(ui.bookFilter==='done'&&x.stats.complete)||(ui.bookFilter==='new'&&!x.stats.answered)||(ui.bookFilter==='doing'&&x.stats.answered&&!x.stats.complete));
  target.innerHTML=items.length?items.map(({l,i,stats:s})=>`<a class="lesson-card" href="#/quiz/${id}/${i+1}" aria-label="${attr(l.title)} کوئز کھولیں">
    <div class="lesson-number">${fmt(i+1)}</div>
    <div><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.desc||'')} · PDF ص ${escapeHtml(l.pages||'—')} · ${fmt(l.questions.length)} سوالات</p></div>
    <span class="status ${s.complete?'done':s.answered?'doing':''}">${s.complete?`✓ مکمل · ${percent(s.correct,s.total)}%`:s.answered?`${s.answered}/${s.total} جاری`:'شروع کریں'}</span>
    <div class="micro-progress"><span style="width:${s.percent}%"></span></div>
  </a>`).join(''):`<div class="empty-state" style="grid-column:1/-1">اس تلاش سے کوئی سبق نہیں ملا۔</div>`;
}
function quizHeader(id,idx,lesson) {
  const b=book(id);
  return `${crumbs({text:b.ur,url:`#/book/${id}`},{text:lesson.title})}`;
}
function renderQuiz(id, idx) {
  const l=lessons(id)[idx];const quizKey=keyFor(id,idx);
  if(ui.activeQuizKey!==quizKey){ui.activeQuizKey=quizKey;const first=l.questions.findIndex((_,i)=>picked(id,idx,i)===null);ui.questionIndex=first<0?0:first;}
  ui.questionIndex=Math.max(0,Math.min(ui.questionIndex,l.questions.length-1));
  const qi=ui.questionIndex,q=l.questions[qi],a=picked(id,idx,qi),s=lessonStats(id,idx),correct=a!==null&&a===q.a;
  const letters=['ا','ب','ج','د'];
  main.innerHTML=`<div class="quiz-shell">${quizHeader(id,idx,l)}
    <div class="quiz-meta"><div><div class="eyebrow">${escapeHtml(book(id).ur)} · کوئز ${fmt(idx+1)}</div><h2>${escapeHtml(l.title)}</h2><span class="muted small">${fmt(s.answered)} / ${fmt(s.total)} سوال حل ہوئے · ${fmt(s.correct)} درست</span></div>${sourceLink(id,q.page)}</div>
    ${bar(s.percent)}<div class="progress-caption"><span>جواب شدہ سوالات</span><span class="ltr">${s.percent}%</span></div>
    <section class="quiz-card" aria-labelledby="question-text">
      <div class="quiz-card-top"><span class="question-label">سوال ${fmt(qi+1)} از ${fmt(l.questions.length)}</span><span class="tag">${escapeHtml(q.level||'مشق')}</span></div>
      <h3 class="question-prompt" id="question-text" dir="auto">${escapeHtml(q.q)}</h3>
      <div class="answers-grid" role="group" aria-label="جواب کے اختیارات">${q.opts.map((o,i)=>`<button type="button" class="answer-btn${a!==null&&i===q.a?' correct':''}${a!==null&&i===a&&a!==q.a?' incorrect':''}${a!==null&&i===a?' selected':''}" data-action="answer" data-index="${i}" ${a!==null?'disabled':''} aria-label="اختیار ${i+1}: ${attr(o)}"><span class="letter">${letters[i]}</span><span class="answer-text" dir="auto">${escapeHtml(o)}</span></button>`).join('')}</div>
      ${a!==null?`<div class="feedback ${correct?'good':'bad'}" role="status"><strong>${correct?'✓ درست جواب!':'✕ یہ جواب درست نہیں'}</strong><p>صحیح جواب: <b dir="auto">${escapeHtml(q.opts[q.a])}</b></p><p>${escapeHtml(q.why)}</p></div>`:''}
      <div class="quiz-footer"><button type="button" class="btn" data-action="prev-question" ${qi===0?'disabled':''}>→ پچھلا سوال</button>
        ${s.complete?`<a href="#/results/${id}/${idx+1}" class="btn btn-primary">نتیجہ دیکھیں ✓</a>`:qi===l.questions.length-1?`<button type="button" data-action="finish-check" class="btn btn-primary">نتیجہ دیکھیں</button>`:`<button type="button" data-action="next-question" class="btn btn-primary">اگلا سوال ←</button>`}
      </div>
      <div class="question-dots" aria-label="سوال نمبر منتخب کریں">${l.questions.map((x,i)=>{const answer=picked(id,idx,i);const flag=answer===null?'':answer===x.a?' right answered':' wrong answered';return `<button class="question-dot ${flag}${i===qi?' current':''}" type="button" data-action="jump-question" data-index="${i}" aria-label="سوال ${i+1}" aria-current="${i===qi?'step':'false'}">${i+1}</button>`;}).join('')}</div>
      <div class="quiz-support"><span>سوال کا جواب منتخب کرتے ہی وضاحت ظاہر ہو جائے گی۔</span><span>کی بورڈ: <b dir="ltr">1–4</b> اختیارات</span></div>
    </section>
    <div class="action-row"><a href="#/book/${id}" class="btn btn-sm">← اسباق کی فہرست</a><button class="btn btn-sm btn-danger" type="button" data-action="retry-lesson" data-id="${id}" data-lesson="${idx}">اس کوئز کو نئے سرے سے شروع کریں</button></div>
  </div>`;
}
function renderResults(id,idx) {
  const l=lessons(id)[idx];const s=lessonStats(id,idx);const score=percent(s.correct,s.total);
  main.innerHTML=`<div class="quiz-shell">${quizHeader(id,idx,l)}
    <div class="result-hero"><span class="eyebrow">کوئز کا نتیجہ</span><h1>${escapeHtml(l.title)}</h1>
      <div class="result-score">${score}<small>%</small></div>
      <p class="muted">${fmt(s.correct)} درست · ${fmt(s.total-s.correct)} غلط یا حل نہیں کیے گئے · ${fmt(s.total)} کل سوالات</p>
      ${bar(score)}
      <div class="result-actions"><a class="btn btn-primary" href="#/quiz/${id}/${idx+1}">جوابات دیکھیں</a><button class="btn" data-action="retry-lesson" data-id="${id}" data-lesson="${idx}">دوبارہ کوئز دیں</button><a class="btn" href="#/book/${id}">دوسرا سبق منتخب کریں</a></div>
    </div>
    <div class="section-heading"><div><div class="eyebrow">نظرثانی</div><h2>سوالات اور درست جوابات</h2></div></div>
    <div class="review-list">${l.questions.map((q,i)=>{const a=picked(id,idx,i);const right=a===q.a;return `<article class="review-item"><div class="review-heading"><h3>(${i+1}) ${escapeHtml(q.q)}</h3><span class="status ${right?'done':'doing'}">${right?'✓ درست':'✕ غلط'}</span></div>
      <div class="review-detail"><div><strong>آپ کا جواب</strong><span dir="auto">${a===null?'جواب نہیں دیا':escapeHtml(q.opts[a])}</span></div><div><strong>درست جواب</strong><span dir="auto">${escapeHtml(q.opts[q.a])}</span></div></div>
      <p class="review-why">${escapeHtml(q.why)} · ${sourceLink(id,q.page,'PDF صفحہ')}</p></article>`;}).join('')}</div>
  </div>`;
}
function renderProgress(){
  const t=totalStats();
  main.innerHTML=`${crumbs({text:'میری پیش رفت'})}<div class="eyebrow">ذاتی جائزہ</div><h1>میری پیش رفت</h1><p class="page-lead">اس ڈیوائس پر محفوظ آپ کے کوئز، درست جوابات اور مکمل اسباق کا جائزہ۔</p>
    <div class="stats-strip">${statTile(t.completed,'مکمل کوئز')}${statTile(t.answered,'حل کیے گئے سوالات')}${statTile(t.correct,'درست جوابات')}${statTile(t.lessons-t.completed,'باقی کوئز')}</div>
    <div class="progress-layout">${CATALOG.map(b=>{const s=bookStats(b.id),p=percent(s.completed,s.lessons);return `<section class="info-card"><div class="eyebrow">${b.en}</div><h3>${escapeHtml(b.ur)}</h3><p class="muted">${fmt(s.completed)} / ${fmt(s.lessons)} سبق مکمل · ${fmt(s.answered)} / ${fmt(s.questions)} سوال حل</p>${bar(p)}<div class="progress-caption"><span>تکمیل</span><span class="ltr">${p}%</span></div><div class="action-row"><a href="#/book/${b.id}" class="btn btn-sm">اسباق کھولیں ←</a></div></section>`;}).join('')}</div>
    <section class="info-card"><h2>پیش رفت کا بیک اپ</h2><p class="muted">لاگ اِن کی ضرورت نہیں؛ لیکن پیش رفت صرف اس براؤزر میں محفوظ ہوتی ہے۔ دوسری ڈیوائس پر منتقل کرنے کے لیے JSON بیک اپ ڈاؤن لوڈ کریں، پھر دوسری ڈیوائس میں درآمد کریں۔</p>
    <div class="action-row"><button class="btn btn-primary" data-action="export-progress">بیک اپ ڈاؤن لوڈ کریں</button><button class="btn" data-action="import-progress">بیک اپ واپس لائیں</button><button class="btn btn-danger" data-action="reset-progress">تمام پیش رفت مٹا دیں</button></div></section>`;
}
function renderAbout() {
  main.innerHTML=`${crumbs({text:'رہنمائی'})}<div class="eyebrow">طریقہ استعمال</div><h1>کوئز کیسے حل کریں؟</h1>
    <div class="progress-layout">
      <section class="info-card"><h2>۱۔ کتاب منتخب کریں</h2><p>چار کتابوں میں سے اپنی کتاب کھولیں، پھر جس سبق کی مشق کرنی ہے اسے منتخب کریں۔</p></section>
      <section class="info-card"><h2>۲۔ جواب دیں</h2><p>ہر سوال کے چار اختیارات ہیں۔ ایک جواب منتخب کرنے پر درست جواب اور اردو تشریح فوراً سامنے آ جائے گی۔</p></section>
      <section class="info-card"><h2>۳۔ نتیجہ دیکھیں</h2><p>تمام سوالات حل ہونے کے بعد نتیجہ دیکھیں؛ صحیح اور غلط جوابات کا تفصیلی جائزہ بھی دستیاب ہے۔</p></section>
      <section class="info-card"><h2>۴۔ اصل کتاب پڑھیں</h2><p>ہر سوال کے ساتھ PDF صفحے کا لنک ہے۔ مکمل اسکین شدہ کتاب بھی کھولی جا سکتی ہے۔</p></section>
      <section class="info-card"><h2>پیش رفت اور پرائیویسی</h2><p>یہ ایک مکمل جامد (static) ویب ایپ ہے۔ کوئی اکاؤنٹ، سرور ڈیٹا بیس، ٹریکنگ یا کوکی درکار نہیں۔ پیش رفت آپ کے براؤزر کے Local Storage میں محفوظ ہوتی ہے۔ اسے بیک اپ/ری اسٹور کیا جا سکتا ہے۔</p></section>
      <section class="info-card"><h2>چاروں اصل کتابیں</h2><p>${CATALOG.map(b=>`<a class="btn btn-sm" style="margin:4px" href="./${attr(b.pdf)}" target="_blank" rel="noopener noreferrer">${escapeHtml(b.ur)} PDF ↗</a>`).join('')}</p></section>
    </div><div class="info-card"><p><b>تعلیمی وضاحت:</b> اس ویب سائٹ کے سوالات نصابی موضوعات پر مبنی تعلیمی مشقیں ہیں۔ اصل مطبوعہ کتابوں کے تمام سوالات کو حرف بہ حرف نقل کرنے کا دعویٰ نہیں۔ کسی عربی مثال یا قاعدے کی تصدیق کے لیے اصل صفحے سے رجوع کریں۔</p></div>`;
}
function saveChoice(bookId,lessonIdx,qi,chosen) {
  const l=lessons(bookId)[lessonIdx];if(!l||!l.questions[qi]||picked(bookId,lessonIdx,qi)!==null)return;
  const k=keyFor(bookId,lessonIdx);const r=saved(bookId,lessonIdx);
  r.answers={...(r.answers||{}), [qi]:chosen};r.updatedAt=new Date().toISOString();
  progress[k]=r;storeProgress();render();
}
function retryLesson(bookId,idx) {
  if(!window.confirm('کیا آپ واقعی اس کوئز کے تمام پچھلے جوابات مٹا کر دوبارہ شروع کرنا چاہتے ہیں؟'))return;
  delete progress[keyFor(bookId,idx)];storeProgress();ui.activeQuizKey='';ui.questionIndex=0;
  if(location.hash!==`#/quiz/${bookId}/${idx+1}`) location.hash=`#/quiz/${bookId}/${idx+1}`;
  else render();
  toast('کوئز دوبارہ شروع ہو گیا۔');
}
function exportProgress() {
  const payload={format:'asan-sarf-nahw-progress',version:1,createdAt:new Date().toISOString(),progress};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='asan-sarf-nahw-progress-backup.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('بیک اپ فائل ڈاؤن لوڈ کی گئی۔');
}
async function importProgress(file){
  if(!file)return;
  try{
    const obj=JSON.parse(await file.text());
    if(!obj||obj.format!=='asan-sarf-nahw-progress'||obj.version!==1||typeof obj.progress!=='object'||Array.isArray(obj.progress))throw Error('Invalid backup format');
    const data={};
    for(const [k,v] of Object.entries(obj.progress)) {
      const [bid,iRaw]=k.split(':');const i=Number(iRaw);
      if(!book(bid)||!Number.isInteger(i)||i<0||i>=lessons(bid).length||!v||typeof v.answers!=='object'||Array.isArray(v.answers))continue;
      const questions=lessons(bid)[i].questions;
      const answers={};
      for(const [qRaw,a] of Object.entries(v.answers)){
        const qi=Number(qRaw);if(Number.isInteger(qi)&&qi>=0&&qi<questions.length&&Number.isInteger(a)&&a>=0&&a<4) answers[qi]=a;
      }
      data[k]={answers,updatedAt:typeof v.updatedAt==='string'?v.updatedAt:new Date().toISOString()};
    }
    if(!window.confirm('موجودہ پیش رفت کو بیک اپ کے ڈیٹا سے تبدیل کریں؟'))return;
    progress=data;storeProgress();render();toast('بیک اپ کامیابی سے بحال ہو گیا۔');
  } catch(err){console.error(err);toast('یہ فائل درست پیش رفت کا بیک اپ نہیں ہے۔');}
}
function onAction(ev) {
  const target=ev.target.closest('[data-action]');if(!target)return;
  const action=target.dataset.action,r=getRoute();
  if(action==='answer'&&r.page==='quiz')saveChoice(r.id,r.idx,ui.questionIndex,Number(target.dataset.index));
  if(action==='prev-question'&&r.page==='quiz'){ui.questionIndex=Math.max(0,ui.questionIndex-1);render();}
  if(action==='next-question'&&r.page==='quiz'){ui.questionIndex=Math.min(lessons(r.id)[r.idx].questions.length-1,ui.questionIndex+1);render();}
  if(action==='jump-question'&&r.page==='quiz'){ui.questionIndex=Number(target.dataset.index);render();}
  if(action==='finish-check'&&r.page==='quiz'){
    const l=lessons(r.id)[r.idx];const first=l.questions.findIndex((_,i)=>picked(r.id,r.idx,i)===null);
    if(first>=0){ui.questionIndex=first;render();toast('نتیجہ دیکھنے سے پہلے باقی سوالات بھی حل کریں۔');}
    else location.hash=`#/results/${r.id}/${r.idx+1}`;
  }
  if(action==='retry-lesson') retryLesson(target.dataset.id,Number(target.dataset.lesson));
  if(action==='scroll-books')document.getElementById('books')?.scrollIntoView({block:'start',behavior:'smooth'});
  if(action==='export-progress')exportProgress();
  if(action==='import-progress')document.getElementById('import-progress').click();
  if(action==='reset-progress'&&window.confirm('کیا آپ چاروں کتابوں کی تمام محفوظ پیش رفت مستقل طور پر مٹانا چاہتے ہیں؟')){
    progress={};storeProgress();render();toast('تمام محفوظ پیش رفت مٹا دی گئی۔');
  }
}
function themeInit(){
  try{ if(localStorage.getItem(THEME_KEY)==='dark')document.documentElement.dataset.theme='dark'; }catch{}
  document.getElementById('theme-toggle').addEventListener('click',()=>{
    const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';
    try{localStorage.setItem(THEME_KEY,dark?'dark':'light');}catch{}
  });
}
async function boot() {
  themeInit();
  main.innerHTML='<div class="loading"><div><h2>کتابیں لوڈ ہو رہی ہیں…</h2><p>نصابی سوالات تیار کیے جا رہے ہیں۔</p></div></div>';
  try {
    const loaded=await Promise.all(CATALOG.map(async b=>{
      const res=await fetch(new URL(b.questionBank,APP_BASE),{cache:'default'});
      if(!res.ok)throw Error(`Cannot fetch ${b.questionBank}: HTTP ${res.status}`);
      const data=await res.json();
      if(!Array.isArray(data.lessons)||!data.lessons.length)throw Error(`Invalid book ${b.id}`);
      for(const l of data.lessons)if(!Array.isArray(l.questions))throw Error(`Invalid lesson ${b.id}`);
      return [b.id,data];
    }));
    loaded.forEach(([id,obj])=>banks.set(id,obj));
    render();
  } catch(err) {
    console.error(err);
    main.innerHTML=`<div class="error"><h2>سوالات لوڈ نہیں ہو سکے</h2><p>یہ ویب ایپ براہِ راست <code>file://</code> سے کھولنے کی بجائے ویب سرور کے ذریعے چلائیں۔</p>
      <p><b>مقامی طریقہ:</b> اس فولڈر میں <code>python -m http.server 8000</code> چلائیں، پھر براؤزر میں <code>http://localhost:8000</code> کھولیں۔</p><p>Vercel پر پبلش ہونے کے بعد یہ فائلیں خود بخود لوڈ ہوں گی۔</p></div>`;
  }
}
main.addEventListener('click',onAction);
main.addEventListener('input',e=>{
  if(e.target.id==='lesson-search'){ui.bookSearch=e.target.value;const r=getRoute();if(r.page==='book')updateLessonList(r.id);}
});
main.addEventListener('change',e=>{
  if(e.target.id==='lesson-filter'){ui.bookFilter=e.target.value;const r=getRoute();if(r.page==='book')updateLessonList(r.id);}
});
document.getElementById('import-progress').addEventListener('change',async e=>{await importProgress(e.target.files?.[0]);e.target.value='';});
window.addEventListener('hashchange',()=>{ui.activeQuizKey='';render();window.scrollTo({top:0,behavior:'instant'});});
window.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.target.matches('input,textarea,select'))return;
  const r=getRoute();if(r.page!=='quiz'||!['1','2','3','4'].includes(e.key))return;
  if(e.target.matches('button,a'))return;
  saveChoice(r.id,r.idx,ui.questionIndex,Number(e.key)-1);
});
boot();
