// Raw Cut IX — 빌드 없는 정적 SPA(GitHub Pages). 해시 라우팅:
//   #/                 첫 화면(소개 + 카테고리 목록)
//   #/c/<카테고리>      카테고리: 최근 글 카드 + 장(章) 시리즈 카드
//   #/b/<책>?c=<장>&t=read|cards|quiz   리더
// 책 본문 html 은 직접 작성한 정적 학습 노트라 그대로 렌더한다.
import { BOOKS, CATEGORIES, DUMMIES } from './books/index.js';
import { cardGradient, cardTexture } from './cardArt.js';

const app = document.getElementById('app');
/* ── 한/영 ── 화면 문구는 사전, 책 본문은 책 파일의 sections(ko) / sectionsEn(en). 선택은 localStorage 에 저장. */
const UI = {
  ko: {
    intro: '<b>처음 배우는 사람의 눈높이</b>로 다시 쓴 개인 공부 서재예요. 정의와 이유, 동작 원리, 실패 케이스, 코드와 AI에게 시키는 법까지 한 틀로 정리해요.',
    all: '전체 글', allEn: 'All Stories', soon: '준비 중', soonBody: '아직 쓰는 중인 책이에요.', back: '목록으로 돌아가기', more: '다음 시리즈', moreBlurb: '곧 채울 자리예요.',
    reads: '읽을거리', ep: n => `${n}편`, min: n => `${n}분`, fail: '불러오지 못했어요. 새로고침해 주세요.',
    swap: '책 바꾸기', fontSize: '글자 크기', fontSm: '글자 작게', fontLg: '글자 크게', toc: '장 목록', first: '처음', last: '끝',
    tabRead: '본문', tabCards: '암기 카드', tabQuiz: '문제', subAll: '전체', sub12: '1·2과목', sub3: '3과목',
    shuffle: '섞기', hideDone: '외운 카드 숨기기', learned: (a, b) => `외운 카드 ${a} / ${b}`, allDone: '다 외웠어요. 「외운 카드 숨기기」를 끄면 다시 볼 수 있어요.',
    no: n => `${n}번`, memo: '외움', tapAnswer: '눌러서 답 보기 · 옆으로 밀어 넘기기', ans: '답', prev: '← 이전', next: '다음 →', again: '다시 볼래요', gotIt: '외웠어요',
    restart: '처음부터', solved: (a, b, c) => `${a} / ${b} 풀었어요 · 맞힌 문제 ${c}`, correct: '정답이에요', answerIs: m => `정답은 ${m}`,
    zoomBar: '그림 크게 보기 · 옆으로 밀어서 봐요', close: '닫기', noEn: 'English version of this book is not available yet — showing Korean.',
    chip: { adsp: '' },
  },
  en: {
    intro: 'A personal study library written for <b>people starting from zero</b> — definition, why it matters, how it works, failure cases, code, and how to prompt an AI, all in one consistent frame.',
    all: 'All Stories', allEn: 'All Stories', soon: 'Coming soon', soonBody: 'This book is still being written.', back: 'Back to the list', more: 'Next series', moreBlurb: 'A slot to fill soon.',
    reads: 'More reading', ep: n => `Part ${n}`, min: n => `${n} min read`, fail: 'Failed to load. Please refresh.',
    swap: 'Switch book', fontSize: 'Text size', fontSm: 'Smaller text', fontLg: 'Larger text', toc: 'Chapters', first: 'Start', last: 'End',
    tabRead: 'Read', tabCards: 'Flashcards', tabQuiz: 'Quiz', subAll: 'All', sub12: 'Subjects 1–2', sub3: 'Subject 3',
    shuffle: 'Shuffle', hideDone: 'Hide learned', learned: (a, b) => `Learned ${a} / ${b}`, allDone: 'All learned. Turn off “Hide learned” to review again.',
    no: n => `#${n}`, memo: 'learned', tapAnswer: 'Tap to reveal · swipe to move', ans: 'Answer', prev: '← Prev', next: 'Next →', again: 'Review again', gotIt: 'Got it',
    restart: 'Restart', solved: (a, b, c) => `${a} / ${b} solved · ${c} correct`, correct: 'Correct', answerIs: m => `Answer: ${m}`,
    zoomBar: 'Figure view · swipe sideways', close: 'Close', noEn: 'English version of this book is not available yet — showing Korean.',
  },
};
let LANG = (() => { try { return localStorage.getItem('study-lang') === 'en' ? 'en' : 'ko'; } catch { return 'ko'; } })();
const U = k => UI[LANG][k] ?? UI.ko[k];
const bt = o => (LANG === 'en' && o.en ? o.en.title : o.title);
const bb = o => (LANG === 'en' && o.en ? o.en.blurb : o.blurb);
const cl = c => (LANG === 'en' ? c.label : c.ko);
const secsOf = d => (LANG === 'en' && d.sectionsEn && d.sectionsEn.length ? d.sectionsEn : d.sections);
function setLang(l) {
  LANG = l;
  try { localStorage.setItem('study-lang', l); } catch { /* 저장 불가 환경 */ }
  document.documentElement.lang = l;
  syncChrome();
  route();
}
function syncChrome() {
  document.querySelectorAll('[data-lang]').forEach(b => { b.classList.toggle('is-on', b.dataset.lang === LANG); b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)); });
  document.getElementById('zoom-bar-t').textContent = U('zoomBar');
  document.getElementById('zoom-close').textContent = U('close');
}
const cache = {};
const loadBook = async id => (cache[id] ||= await BOOKS.find(b => b.id === id).load());
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 환경 */ } },
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const catOf = id => CATEGORIES.find(c => c.id === id);
const firstSvg = html => (html.match(/<svg[\s\S]*?<\/svg>/) || [''])[0];

function parseHash() {
  const [path, q = ''] = location.hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  return { parts, q: new URLSearchParams(q) };
}
function go(hash, replace) {
  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
  route();
}

function topNav(active) {
  document.getElementById('topnav').innerHTML = CATEGORIES.map(
    c => `<a href="#/c/${c.id}" class="${c.id === active ? 'is-on' : ''}">${c.label}</a>`
  ).join('');
}

/* ── 첫 화면 ─────────────────────────────────────────── */
async function renderHome() {
  topNav(null);
  document.title = 'Raw Cut IX';
  const books = await Promise.all(BOOKS.map(async b => ({ ...b, data: await loadBook(b.id) })));
  const feat = books[0];
  app.innerHTML = `
  <section class="home">
    <div class="home-art" aria-hidden="true">${thumb(firstSvg(secsOf(feat.data).map(s => s.html).join('')))}</div>
    <div class="home-side">
      <p class="home-intro">Raw Cut IX — ${U('intro')}</p>
      <ul class="cat-list">
        ${CATEGORIES.map(c => `<li><a href="#/c/${c.id}"><span>${c.label}<small>${cl(c)}</small></span><span aria-hidden="true">→</span></a></li>`).join('')}
        <li><a href="#/c/all"><span>All Stories<small>${U('all')}</small></span><span aria-hidden="true">→</span></a></li>
      </ul>
    </div>
  </section>
  <section class="band">
    <h2 class="band-title">Latest Stories</h2>
    <div class="pal-row">${books.map(bookCard).join('')}</div>
  </section>`;
}

function thumb(svg) {
  return `<div class="thumb">${svg ? `<div class="sg-body thumb-svg">${svg}</div>` : '<div class="thumb-blank"></div>'}</div>`;
}
function storyCard(b) {
  const c = catOf(b.cat);
  const first = secsOf(b.data).find(s => /<svg/.test(s.html));
  return `<a class="story" href="#/b/${b.id}">
    ${thumb(first ? firstSvg(first.html) : '')}
    <span class="story-cat">${c.label}</span>
    <h3>${esc(b.title)}</h3>
    <p>${esc(b.blurb)}</p>
    <span class="story-meta">Raw Cut IX · ${b.date} · ${b.data.sections.length}장 · ${b.minutes}분</span>
  </a>`;
}
function chapterCard(b, s, i) {
  const svg = firstSvg(s.html);
  return `<a class="story story--sm" href="#/b/${b.id}?c=${s.id}">
    ${svg ? thumb(svg) : `<div class="thumb thumb-type"><span>${String(i + 1).padStart(2, '0')}</span></div>`}
    <span class="story-cat">${esc(s.part)}</span>
    <h3>${esc(s.title)}</h3>
    <span class="story-meta">${esc(s.sub)}</span>
  </a>`;
}

/* ── 카테고리 — blog.palantir.com/subpage/tech 배치(1440px 실측)를 그대로 ──
   상단 바 57 · 블로그명 줄(20/500) · 큰 제목 42/52 · 카드 섹션(제목 48 + 카드 283, 간격 444)
   · 아래 목록형 섹션(간격 161) · 콘텐츠 폭 1192 */
/* 카드 — ~/repos/ax-blog(Raw Cut) 의 scard 그대로: 1.9:1 직각 그림(제목 해시 그라데이션 + 결) · 큰 키워드 · 분류 칩 · 세리프 제목 · 메타 */
function scard({ href, seed, kw, chip, title, meta, dummy }) {
  return `<article class="scard${dummy ? ' is-dummy' : ''}"><a href="${href}" aria-label="${esc(title)}">
    <div class="scard-art" aria-hidden="true">
      <div class="scard-media" style="background: ${cardGradient(seed, 'deep')};"><div class="scard-tex" style="background-image: ${cardTexture(seed)};"></div>
      <span class="scard-kw">${esc(kw)}</span></div>
      <span class="scard-chip">${esc(chip)}</span>
    </div>
    <div class="scard-body"><h3>${esc(title)}</h3><span class="scard-meta">${esc(meta)}</span></div>
  </a></article>`;
}
const dummyCard = d => scard({ href: `#/soon/${d.id}`, seed: d.title, kw: d.kw || bt(d), chip: catOf(d.cat)?.label || 'Coming soon', title: bt(d), meta: U('soon'), dummy: true });
const bookCard = b => scard({ href: `#/b/${b.id}`, seed: b.title, kw: b.kw, chip: catOf(b.cat).label, title: bt(b), meta: `${catOf(b.cat).label} · ${b.date} · ${U('min')(b.minutes)}` });
const chapterPcard = (b, s) => scard({ href: `#/b/${b.id}?c=${s.id}`, seed: `${b.id}:${s.id}`, kw: s.title.split(/ — |, /)[0], chip: s.part, title: s.title, meta: `${b.kw} · ${s.sub}` });
const pad3 = (items, fill) => [...items, ...fill].slice(0, 3);

async function renderCategory(catId) {
  topNav(catId);
  const cat = catId === 'all' ? { label: 'All Stories', ko: '전체 글' } : catOf(catId);
  if (!cat) return go('#/', true);
  document.title = `${cat.label} — Raw Cut IX`;
  const list = BOOKS.filter(b => catId === 'all' || b.cat === catId);
  const books = await Promise.all(list.map(async b => ({ ...b, data: await loadBook(b.id) })));
  const dummies = DUMMIES.filter(d => catId === 'all' || d.cat === catId);
  const latest = pad3(books.map(bookCard), dummies.map(dummyCard));
  const series = books.map(b => ({ title: `Series: ${bt(b)}`, cards: secsOf(b.data).slice(0, 3).map(s => chapterPcard(b, s)) }));
  // 시리즈가 모자라면 더미 시리즈로 카드 섹션 수를 원본과 같게(Latest + 5)
  const dummySeries = dummies.map(d => ({ title: `Series: ${bt(d)}`, cards: [dummyCard(d), dummyCard({ ...d, en: d.en && { ...d.en, title: `${d.en.title} — ${U('ep')(2)}` }, title: `${d.title} — ${U('ep')(2)}` }), dummyCard({ ...d, en: d.en && { ...d.en, title: `${d.en.title} — ${U('ep')(3)}` }, title: `${d.title} — ${U('ep')(3)}` })] }));
  const filler = n => Array.from({ length: n }, (_, i) => ({ id: `more-${i}`, cat: catId, title: `${U('more')} ${i + 1}`, blurb: U('moreBlurb') }));
  const rows = [...series, ...dummySeries, ...filler(5).map(d => ({ title: `Series: ${d.title}`, cards: [1, 2, 3].map(k => dummyCard({ ...d, en: undefined, title: `${d.title} — ${U('ep')(k)}` })) }))].slice(0, 5);
  const lists = [
    ...books.map(b => ({ title: bt(b), items: secsOf(b.data).map(s => `<a href="#/b/${b.id}?c=${s.id}">${esc(s.title)}</a>`) })),
    ...dummies.map(d => ({ title: bt(d), items: [1, 2, 3].map(x => `<a href="#/soon/${d.id}" class="is-dummy">${U('ep')(x)} · ${U('soon')}</a>`) })),
    { title: 'All stories', items: [...BOOKS.map(b => `<a href="#/b/${b.id}">${esc(bt(b))}</a>`), ...DUMMIES.map(d => `<a href="#/soon/${d.id}" class="is-dummy">${esc(bt(d))}</a>`)] },
  ];
  while (lists.length < 8) lists.splice(lists.length - 1, 0, { title: `${U('reads')} ${lists.length}`, items: [U('soon')].map(x => `<a href="#/c/all" class="is-dummy">${x}</a>`) });
  lists.splice(0, lists.length - 8);
  app.innerHTML = `
  <div class="pal">
    <div class="pal-sub"><a class="pal-blog" href="#/">Raw Cut IX</a>
      <nav class="pal-tabs">${CATEGORIES.map(c => `<a href="#/c/${c.id}" class="${c.id === catId ? 'is-on' : ''}">${c.label}</a>`).join('')}<a href="#/c/all" class="${catId === 'all' ? 'is-on' : ''}">All Stories</a></nav></div>
    <h1 class="pal-h1">${cat.label}</h1>
    <section class="pal-sec"><h2 class="pal-sec-t">Latest Stories</h2><div class="pal-row">${latest.join('')}</div></section>
    ${rows.map(r => `<section class="pal-sec"><h2 class="pal-sec-t">${esc(r.title)}</h2><div class="pal-row">${r.cards.join('')}</div></section>`).join('')}
    ${lists.map(l => `<section class="pal-list"><h2 class="pal-sec-t">${esc(l.title)}</h2><div class="pal-links">${l.items.join('')}</div></section>`).join('')}
  </div>`;
}

function renderSoon(id) {
  const d = DUMMIES.find(x => x.id === id);
  topNav(d?.cat);
  app.innerHTML = `<div class="pal"><h1 class="pal-h1">${esc(d ? bt(d) : U('soon'))}</h1><p class="sg-msg">${U('soonBody')} <a href="#/c/${d?.cat || 'all'}">${U('back')}</a></p></div>`;
}

/* ── 리더 ───────────────────────────────────────────── */
const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
const MARKS = ['①', '②', '③', '④'];
const SUBS = () => [['all', U('subAll')], ['12', U('sub12')], ['3', U('sub3')]];
const state = { cardSub: 'all', cardPos: 0, cardFlip: false, hideDone: false, order: null, quizSub: 'all', quizPos: 0, picked: {} };

async function renderReader(bookId, q) {
  const meta = BOOKS.find(b => b.id === bookId);
  if (!meta) return go('#/', true);
  topNav(meta.cat);
  const data = await loadBook(bookId);
  const sections = secsOf(data);
  const noEn = LANG === 'en' && !(data.sectionsEn && data.sectionsEn.length);
  const tabs = [['read', U('tabRead')], ...(data.cards.length ? [['cards', U('tabCards')]] : []), ...(data.quiz.length ? [['quiz', U('tabQuiz')]] : [])];
  const tab = tabs.some(t => t[0] === q.get('t')) ? q.get('t') : 'read';
  const cid = q.get('c') || ls.get(`study-last-${bookId}`, sections[0].id);
  const idx = Math.max(0, sections.findIndex(s => s.id === cid));
  const sec = sections[idx];
  const font = ls.get('study-font', 1);
  document.title = `${bt(meta)} — Raw Cut IX`;

  const head = `
  <header class="sg-head">
    <div class="sg-head-row">
      <a class="sg-back" href="#/c/${meta.cat}">← ${catOf(meta.cat).label}</a>
      <div class="sg-head-tools">
        <select class="sg-pick" id="pick" aria-label="${U('swap')}">${BOOKS.map(b => `<option value="${b.id}" ${b.id === bookId ? 'selected' : ''}>${esc(bt(b))}</option>`).join('')}</select>
        <div class="sg-font" aria-label="${U('fontSize')}"><button type="button" data-font="-1" ${font === 0 ? 'disabled' : ''} aria-label="${U('fontSm')}">${LANG === 'en' ? 'A' : '가'}</button><button type="button" data-font="1" ${font === 2 ? 'disabled' : ''} aria-label="${U('fontLg')}">${LANG === 'en' ? 'A' : '가'}<sup>+</sup></button></div>
      </div>
    </div>
    <p class="sg-eyebrow">${catOf(meta.cat).label} · ${meta.date}</p>
    <h1 class="sg-title">${esc(bt(meta))}</h1>${noEn ? `<p class="sg-notice">${U('noEn')}</p>` : ''}
    ${tabs.length > 1 ? `<div class="sg-seg sg-tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" class="${k === tab ? 'is-on' : ''}" aria-selected="${k === tab}">${l}</button>`).join('')}</div>` : ''}
  </header>`;

  let body = '';
  if (tab === 'read') {
    ls.set(`study-last-${bookId}`, sec.id);
    let lastPart = '';
    const toc = sections.map(s => {
      const h = s.part !== lastPart ? `<div class="sg-toc-part">${esc(s.part)}</div>` : '';
      lastPart = s.part;
      return `${h}<button type="button" data-ch="${s.id}" class="${s.id === sec.id ? 'is-on' : ''}"><span>${esc(s.title)}</span><small>${esc(s.sub)}</small></button>`;
    }).join('');
    const chips = sections.map((s, i) => `<button type="button" data-ch="${s.id}" class="${s.id === sec.id ? 'is-on' : ''}"><b>${i + 1}</b>${esc(s.title)}</button>`).join('');
    const prev = sections[idx - 1], next = sections[idx + 1];
    body = `<div class="sg-reader">
      <nav class="sg-toc" aria-label="${U('toc')}">${toc}</nav>
      <div class="sg-main">
        <div class="sg-chips" id="chips">${chips}</div>
        <div class="sg-readbar" aria-hidden="true"><span style="width:${((idx + 1) / sections.length) * 100}%"></span></div>
        <article class="sg-body sg-font-${font}" id="body">${sec.html}</article>
        <div class="sg-pager">
          <button type="button" class="sg-btn" ${prev ? `data-ch="${prev.id}"` : 'disabled'}>← ${prev ? esc(prev.title) : U('first')}</button>
          <span class="sg-pager-pos">${idx + 1} / ${sections.length}</span>
          <button type="button" class="sg-btn sg-btn--fill" ${next ? `data-ch="${next.id}"` : 'disabled'}>${next ? esc(next.title) : U('last')} →</button>
        </div>
      </div></div>`;
  } else if (tab === 'cards') body = cardsView(data.cards);
  else body = quizView(data.quiz);

  app.innerHTML = `<div class="sg">${head}${body}</div>`;
  window.scrollTo(0, 0);
  document.querySelector('#chips .is-on')?.scrollIntoView({ block: 'nearest', inline: 'center' });

  const setQ = patch => {
    const n = new URLSearchParams(q);
    Object.entries(patch).forEach(([k, v]) => n.set(k, v));
    go(`#/b/${bookId}?${n}`, true);
  };
  app.querySelector('#pick').onchange = e => go(`#/b/${e.target.value}`);
  app.querySelectorAll('[data-font]').forEach(b => (b.onclick = () => { ls.set('study-font', Math.min(2, Math.max(0, font + Number(b.dataset.font)))); route(); }));
  app.querySelectorAll('[data-tab]').forEach(b => (b.onclick = () => setQ({ t: b.dataset.tab })));
  app.querySelectorAll('[data-ch]').forEach(b => (b.onclick = () => setQ({ t: 'read', c: b.dataset.ch })));
  if (tab === 'read') wireBody(app.querySelector('#body'), data.anchors, sec.id, id => setQ({ t: 'read', c: id }));
  if (tab === 'cards') wireCards(data.cards);
  if (tab === 'quiz') wireQuiz(data.quiz);
}

function wireBody(el, anchors, curId, toChapter) {
  const pick = node => {
    const fig = node.closest('.g-hovfig');
    const id = node.dataset.id, rel = new Set([id]);
    fig.querySelectorAll('[data-a]').forEach(e => {
      const on = e.dataset.a === id || e.dataset.b === id;
      if (on) { rel.add(e.dataset.a); rel.add(e.dataset.b); }
      e.classList.toggle('is-on', on); e.classList.toggle('is-dim', !on);
    });
    fig.querySelectorAll('.g-hv-n').forEach(e => { e.classList.toggle('is-dim', !rel.has(e.dataset.id)); e.classList.toggle('is-sel', e.dataset.id === id); });
    const out = fig.querySelector('.g-readout');
    if (out) out.textContent = `${node.dataset.t} — ${node.dataset.d}`;
  };
  el.addEventListener('mouseover', e => { const n = e.target.closest?.('.g-hv-n'); if (n) pick(n); });
  el.addEventListener('click', e => {
    const n = e.target.closest('.g-hv-n');
    if (n) return pick(n);
    const a = e.target.closest('a[href^="#g-"]');
    if (a) {
      e.preventDefault();
      const t = a.getAttribute('href').slice(1), owner = anchors[t];
      if (!owner) return;
      if (owner !== curId) { toChapter(owner); setTimeout(() => document.getElementById(t)?.scrollIntoView({ behavior: 'smooth' }), 60); }
      else document.getElementById(t)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (e.target.closest('a')) return;
    const fig = e.target.closest('figure');
    if (fig && !fig.classList.contains('g-hovfig')) openZoom(fig.innerHTML);
  });
}

function openZoom(html) {
  const z = document.getElementById('zoom');
  document.getElementById('zoom-fig').innerHTML = html;
  z.hidden = false;
  document.body.style.overflow = 'hidden';
}
document.getElementById('zoom-close').onclick = () => { document.getElementById('zoom').hidden = true; document.body.style.overflow = ''; };

/* 암기 카드 */
function cardList(cards) {
  const done = new Set(ls.get('adsp-done', []));
  state.order ||= cards.map((_, i) => i);
  return { done, list: state.order.filter(i => (state.cardSub === 'all' || String(cards[i].sub) === state.cardSub) && !(state.hideDone && done.has(i))) };
}
function segHtml(cur, attr) {
  return `<div class="sg-seg sg-seg--sm">${SUBS().map(([k, l]) => `<button type="button" ${attr}="${k}" class="${k === cur ? 'is-on' : ''}">${l}</button>`).join('')}</div>`;
}
function cardsView(cards) {
  const { done, list } = cardList(cards);
  const subTotal = cards.filter(c => state.cardSub === 'all' || String(c.sub) === state.cardSub).length;
  const subDone = cards.filter((c, i) => (state.cardSub === 'all' || String(c.sub) === state.cardSub) && done.has(i)).length;
  state.cardPos = Math.min(state.cardPos, Math.max(0, list.length - 1));
  const cur = list[state.cardPos];
  const c = cards[cur];
  return `<div class="sg-tool">
    <div class="sg-tool-bar">${segHtml(state.cardSub, 'data-csub')}<div class="sg-tool-actions"><button type="button" class="sg-btn" id="shuffle">${U('shuffle')}</button><button type="button" class="sg-btn ${state.hideDone ? 'sg-btn--fill' : ''}" id="hide">${U('hideDone')}</button></div></div>
    <div class="sg-progress"><span style="width:${subTotal ? (subDone / subTotal) * 100 : 0}%"></span></div>
    <p class="sg-progress-text">${U('learned')(subDone, subTotal)}</p>
    ${cur == null ? `<p class="sg-empty">${U('allDone')}</p>` : `
    <button type="button" class="sg-card ${state.cardFlip ? 'is-flip' : ''} ${done.has(cur) ? 'is-done' : ''}" id="card">
      <span class="sg-card-meta">${U('no')(cur + 1)} · ${c.sub === 3 ? U('sub3') : U('sub12')}${done.has(cur) ? ' · ' + U('memo') : ''}</span>
      <span class="sg-card-text">${esc(state.cardFlip ? c.a : c.q)}</span>
      <span class="sg-card-hint">${state.cardFlip ? U('ans') : U('tapAnswer')}</span>
    </button>
    <div class="sg-pager"><button type="button" class="sg-btn" id="cprev" ${state.cardPos === 0 ? 'disabled' : ''}>${U('prev')}</button>
      <button type="button" class="sg-btn ${done.has(cur) ? '' : 'sg-btn--fill'}" id="cdone">${done.has(cur) ? U('again') : U('gotIt')}</button>
      <button type="button" class="sg-btn" id="cnext" ${state.cardPos >= list.length - 1 ? 'disabled' : ''}>${U('next')}</button></div>
    <p class="sg-pager-pos sg-center">${state.cardPos + 1} / ${list.length}</p>`}
  </div>`;
}
function wireCards(cards) {
  const rerender = () => route();
  const step = d => { const { list } = cardList(cards); state.cardFlip = false; state.cardPos = Math.min(Math.max(0, state.cardPos + d), Math.max(0, list.length - 1)); rerender(); };
  app.querySelectorAll('[data-csub]').forEach(b => (b.onclick = () => { state.cardSub = b.dataset.csub; state.cardPos = 0; state.cardFlip = false; rerender(); }));
  app.querySelector('#shuffle').onclick = () => { const a = [...state.order]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } state.order = a; state.cardPos = 0; rerender(); };
  app.querySelector('#hide').onclick = () => { state.hideDone = !state.hideDone; state.cardPos = 0; rerender(); };
  const card = app.querySelector('#card');
  if (!card) return;
  let x0 = null;
  card.onclick = () => { state.cardFlip = !state.cardFlip; rerender(); };
  card.addEventListener('touchstart', e => (x0 = e.touches[0].clientX), { passive: true });
  card.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) { e.preventDefault(); step(dx < 0 ? 1 : -1); } });
  app.querySelector('#cprev').onclick = () => step(-1);
  app.querySelector('#cnext').onclick = () => step(1);
  app.querySelector('#cdone').onclick = () => {
    const { list, done } = cardList(cards); const cur = list[state.cardPos];
    const was = done.has(cur); if (was) done.delete(cur); else done.add(cur);
    ls.set('adsp-done', [...done]);
    if (!was) step(1); else rerender();
  };
}

/* 문제 */
function quizList(quiz) { return quiz.map((q, i) => ({ ...q, i })).filter(q => state.quizSub === 'all' || String(q.sub) === state.quizSub); }
function quizView(quiz) {
  const list = quizList(quiz);
  const cur = list[state.quizPos];
  const solved = list.filter(q => state.picked[q.i] != null);
  const right = solved.filter(q => state.picked[q.i] === q.ans).length;
  const ch = cur ? state.picked[cur.i] : null;
  return `<div class="sg-tool">
    <div class="sg-tool-bar">${segHtml(state.quizSub, 'data-qsub')}<div class="sg-tool-actions"><button type="button" class="sg-btn" id="qreset">${U('restart')}</button></div></div>
    <div class="sg-progress"><span style="width:${list.length ? (solved.length / list.length) * 100 : 0}%"></span></div>
    <p class="sg-progress-text">${U('solved')(solved.length, list.length, right)}</p>
    ${cur ? `<div class="sg-q"><div class="sg-q-head">Q${state.quizPos + 1} · ${cur.sub === 3 ? U('sub3') : U('sub12')}</div><p class="sg-q-text">${esc(cur.q)}</p>
      <div class="sg-q-ops">${cur.ops.map((o, k) => `<button type="button" data-op="${k}" ${ch != null ? 'disabled' : ''} class="${ch != null ? (k === cur.ans ? 'is-right' : k === ch ? 'is-wrong' : '') : ''}"><b>${MARKS[k]}</b> ${esc(o)}</button>`).join('')}</div>
      ${ch != null ? `<div class="sg-q-ex"><b>${ch === cur.ans ? U('correct') : U('answerIs')(MARKS[cur.ans])}</b> — ${esc(cur.ex)} <a href="https://youtu.be/${cur.vid}?t=${cur.t}" target="_blank" rel="noopener noreferrer">▶ ${fmt(cur.t)}</a></div>` : ''}</div>` : ''}
    <div class="sg-pager"><button type="button" class="sg-btn" id="qprev" ${state.quizPos === 0 ? 'disabled' : ''}>${U('prev')}</button><span class="sg-pager-pos">${state.quizPos + 1} / ${list.length}</span><button type="button" class="sg-btn sg-btn--fill" id="qnext" ${state.quizPos >= list.length - 1 ? 'disabled' : ''}>다음 →</button></div>
  </div>`;
}
function wireQuiz(quiz) {
  const list = quizList(quiz);
  app.querySelectorAll('[data-qsub]').forEach(b => (b.onclick = () => { state.quizSub = b.dataset.qsub; state.quizPos = 0; route(); }));
  app.querySelector('#qreset').onclick = () => { state.picked = {}; state.quizPos = 0; route(); };
  app.querySelectorAll('[data-op]').forEach(b => (b.onclick = () => { state.picked[list[state.quizPos].i] = Number(b.dataset.op); route(); }));
  app.querySelector('#qprev').onclick = () => { state.quizPos--; route(); };
  app.querySelector('#qnext').onclick = () => { state.quizPos++; route(); };
}

/* ── 라우터 ─────────────────────────────────────────── */
async function route() {
  const { parts, q } = parseHash();
  try {
    if (parts[0] === 'c') await renderCategory(parts[1]);
    else if (parts[0] === 'soon') renderSoon(parts[1]);
    else if (parts[0] === 'b') await renderReader(parts[1], q);
    else await renderHome();
  } catch (err) {
    app.innerHTML = `<p class="sg-msg">${U('fail')} (${esc(err.message)})</p>`;
  }
}
document.querySelectorAll('[data-lang]').forEach(b => (b.onclick = () => setLang(b.dataset.lang)));
document.documentElement.lang = LANG;
syncChrome();
window.addEventListener('popstate', route);
window.addEventListener('hashchange', route);
route();
