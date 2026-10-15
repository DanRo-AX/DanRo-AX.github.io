// Raw Cut IX — 빌드 없는 정적 SPA(GitHub Pages). 해시 라우팅:
//   #/                 첫 화면(소개 + 카테고리 목록)
//   #/c/<카테고리>      카테고리: 최근 글 카드 + 장(章) 시리즈 카드
//   #/b/<책>?c=<장>&t=read|cards|quiz   리더
// 책 본문 html 은 직접 작성한 정적 학습 노트라 그대로 렌더한다.
import { BOOKS, CATEGORIES, DUMMIES } from './books/index.js';
import { cardGradient, cardTexture } from './cardArt.js';

const app = document.getElementById('app');
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
    <div class="home-art" aria-hidden="true">${thumb(firstSvg(feat.data.sections.map(s => s.html).join('')))}</div>
    <div class="home-side">
      <p class="home-intro">Raw Cut IX는 데이터와 인프라를 <b>처음 배우는 사람의 눈높이</b>로 다시 쓴 개인 공부 서재예요. 구조를 그림으로 먼저 보고, 왜 필요한지 이해한 다음, 코드와 AI에게 시키는 법으로 넘어가요.</p>
      <ul class="cat-list">
        ${CATEGORIES.map(c => `<li><a href="#/c/${c.id}"><span>${c.label}<small>${c.ko}</small></span><span aria-hidden="true">→</span></a></li>`).join('')}
        <li><a href="#/c/all"><span>All Stories<small>전체 글</small></span><span aria-hidden="true">→</span></a></li>
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
  const first = b.data.sections.find(s => /<svg/.test(s.html));
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
  return `<article class="scard${dummy ? ' is-dummy' : ''}"><a href="${href}" aria-label="${esc(title)} 읽기">
    <div class="scard-art" aria-hidden="true">
      <div class="scard-media" style="background: ${cardGradient(seed, 'deep')};"><div class="scard-tex" style="background-image: ${cardTexture(seed)};"></div>
      <span class="scard-kw">${esc(kw)}</span></div>
      <span class="scard-chip">${esc(chip)}</span>
    </div>
    <div class="scard-body"><h3>${esc(title)}</h3><span class="scard-meta">${esc(meta)}</span></div>
  </a></article>`;
}
const dummyCard = d => scard({ href: `#/soon/${d.id}`, seed: d.title, kw: d.kw || d.title, chip: catOf(d.cat)?.label || 'Coming soon', title: d.title, meta: '준비 중', dummy: true });
const bookCard = b => scard({ href: `#/b/${b.id}`, seed: b.title, kw: b.kw, chip: catOf(b.cat).label, title: b.title, meta: `${catOf(b.cat).label} · ${b.date} · ${b.minutes}분` });
const chapterPcard = (b, s) => scard({ href: `#/b/${b.id}?c=${s.id}`, seed: `${b.id}:${s.title}`, kw: s.title.split(/ — |, /)[0], chip: s.part, title: s.title, meta: `${b.kw} · ${s.sub}` });
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
  const series = books.map(b => ({ title: `Series: ${b.title}`, cards: b.data.sections.slice(0, 3).map(s => chapterPcard(b, s)) }));
  // 시리즈가 모자라면 더미 시리즈로 카드 섹션 수를 원본과 같게(Latest + 5)
  const dummySeries = dummies.map(d => ({ title: `Series: ${d.title}`, cards: [dummyCard(d), dummyCard({ ...d, title: `${d.title} — 2편` }), dummyCard({ ...d, title: `${d.title} — 3편` })] }));
  const filler = n => Array.from({ length: n }, (_, i) => ({ id: `more-${i}`, cat: catId, title: `다음 시리즈 ${i + 1}`, blurb: '곧 채울 자리예요.' }));
  const rows = [...series, ...dummySeries, ...filler(5).map(d => ({ title: `Series: ${d.title}`, cards: [1, 2, 3].map(k => dummyCard({ ...d, title: `${d.title} — ${k}편` })) }))].slice(0, 5);
  const lists = [
    ...books.map(b => ({ title: b.title, items: b.data.sections.map(s => `<a href="#/b/${b.id}?c=${s.id}">${esc(s.title)}</a>`) })),
    ...dummies.map(d => ({ title: d.title, items: ['1편', '2편', '3편'].map(x => `<a href="#/soon/${d.id}" class="is-dummy">${x} · 준비 중</a>`) })),
    { title: 'All stories', items: [...BOOKS.map(b => `<a href="#/b/${b.id}">${esc(b.title)}</a>`), ...DUMMIES.map(d => `<a href="#/soon/${d.id}" class="is-dummy">${esc(d.title)}</a>`)] },
  ];
  while (lists.length < 8) lists.splice(lists.length - 1, 0, { title: `읽을거리 ${lists.length}`, items: ['준비 중'].map(x => `<a href="#/c/all" class="is-dummy">${x}</a>`) });
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
  app.innerHTML = `<div class="pal"><h1 class="pal-h1">${esc(d ? d.title : '준비 중')}</h1><p class="sg-msg">아직 쓰는 중인 책이에요. <a href="#/c/${d?.cat || 'all'}">목록으로 돌아가기</a></p></div>`;
}

/* ── 리더 ───────────────────────────────────────────── */
const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
const MARKS = ['①', '②', '③', '④'];
const SUBS = [['all', '전체'], ['12', '1·2과목'], ['3', '3과목']];
const state = { cardSub: 'all', cardPos: 0, cardFlip: false, hideDone: false, order: null, quizSub: 'all', quizPos: 0, picked: {} };

async function renderReader(bookId, q) {
  const meta = BOOKS.find(b => b.id === bookId);
  if (!meta) return go('#/', true);
  topNav(meta.cat);
  const data = await loadBook(bookId);
  const { sections } = data;
  const tabs = [['read', '본문'], ...(data.cards.length ? [['cards', '암기 카드']] : []), ...(data.quiz.length ? [['quiz', '문제']] : [])];
  const tab = tabs.some(t => t[0] === q.get('t')) ? q.get('t') : 'read';
  const cid = q.get('c') || ls.get(`study-last-${bookId}`, sections[0].id);
  const idx = Math.max(0, sections.findIndex(s => s.id === cid));
  const sec = sections[idx];
  const font = ls.get('study-font', 1);
  document.title = `${meta.title} — Raw Cut IX`;

  const head = `
  <header class="sg-head">
    <div class="sg-head-row">
      <a class="sg-back" href="#/c/${meta.cat}">← ${catOf(meta.cat).label}</a>
      <div class="sg-head-tools">
        <select class="sg-pick" id="pick" aria-label="책 바꾸기">${BOOKS.map(b => `<option value="${b.id}" ${b.id === bookId ? 'selected' : ''}>${esc(b.title)}</option>`).join('')}</select>
        <div class="sg-font" aria-label="글자 크기"><button type="button" data-font="-1" ${font === 0 ? 'disabled' : ''} aria-label="글자 작게">가</button><button type="button" data-font="1" ${font === 2 ? 'disabled' : ''} aria-label="글자 크게">가<sup>+</sup></button></div>
      </div>
    </div>
    <p class="sg-eyebrow">${catOf(meta.cat).label} · ${meta.date}</p>
    <h1 class="sg-title">${esc(meta.title)}</h1>
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
      <nav class="sg-toc" aria-label="장 목록">${toc}</nav>
      <div class="sg-main">
        <div class="sg-chips" id="chips">${chips}</div>
        <div class="sg-readbar" aria-hidden="true"><span style="width:${((idx + 1) / sections.length) * 100}%"></span></div>
        <article class="sg-body sg-font-${font}" id="body">${sec.html}</article>
        <div class="sg-pager">
          <button type="button" class="sg-btn" ${prev ? `data-ch="${prev.id}"` : 'disabled'}>← ${prev ? esc(prev.title) : '처음'}</button>
          <span class="sg-pager-pos">${idx + 1} / ${sections.length}</span>
          <button type="button" class="sg-btn sg-btn--fill" ${next ? `data-ch="${next.id}"` : 'disabled'}>${next ? esc(next.title) : '끝'} →</button>
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
  return `<div class="sg-seg sg-seg--sm">${SUBS.map(([k, l]) => `<button type="button" ${attr}="${k}" class="${k === cur ? 'is-on' : ''}">${l}</button>`).join('')}</div>`;
}
function cardsView(cards) {
  const { done, list } = cardList(cards);
  const subTotal = cards.filter(c => state.cardSub === 'all' || String(c.sub) === state.cardSub).length;
  const subDone = cards.filter((c, i) => (state.cardSub === 'all' || String(c.sub) === state.cardSub) && done.has(i)).length;
  state.cardPos = Math.min(state.cardPos, Math.max(0, list.length - 1));
  const cur = list[state.cardPos];
  const c = cards[cur];
  return `<div class="sg-tool">
    <div class="sg-tool-bar">${segHtml(state.cardSub, 'data-csub')}<div class="sg-tool-actions"><button type="button" class="sg-btn" id="shuffle">섞기</button><button type="button" class="sg-btn ${state.hideDone ? 'sg-btn--fill' : ''}" id="hide">외운 카드 숨기기</button></div></div>
    <div class="sg-progress"><span style="width:${subTotal ? (subDone / subTotal) * 100 : 0}%"></span></div>
    <p class="sg-progress-text">외운 카드 ${subDone} / ${subTotal}</p>
    ${cur == null ? '<p class="sg-empty">다 외웠어요. 「외운 카드 숨기기」를 끄면 다시 볼 수 있어요.</p>' : `
    <button type="button" class="sg-card ${state.cardFlip ? 'is-flip' : ''} ${done.has(cur) ? 'is-done' : ''}" id="card">
      <span class="sg-card-meta">${cur + 1}번 · ${c.sub === 3 ? '3과목' : '1·2과목'}${done.has(cur) ? ' · 외움' : ''}</span>
      <span class="sg-card-text">${esc(state.cardFlip ? c.a : c.q)}</span>
      <span class="sg-card-hint">${state.cardFlip ? '답' : '눌러서 답 보기 · 옆으로 밀어 넘기기'}</span>
    </button>
    <div class="sg-pager"><button type="button" class="sg-btn" id="cprev" ${state.cardPos === 0 ? 'disabled' : ''}>← 이전</button>
      <button type="button" class="sg-btn ${done.has(cur) ? '' : 'sg-btn--fill'}" id="cdone">${done.has(cur) ? '다시 볼래요' : '외웠어요'}</button>
      <button type="button" class="sg-btn" id="cnext" ${state.cardPos >= list.length - 1 ? 'disabled' : ''}>다음 →</button></div>
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
    <div class="sg-tool-bar">${segHtml(state.quizSub, 'data-qsub')}<div class="sg-tool-actions"><button type="button" class="sg-btn" id="qreset">처음부터</button></div></div>
    <div class="sg-progress"><span style="width:${list.length ? (solved.length / list.length) * 100 : 0}%"></span></div>
    <p class="sg-progress-text">${solved.length} / ${list.length} 풀었어요 · 맞힌 문제 ${right}</p>
    ${cur ? `<div class="sg-q"><div class="sg-q-head">Q${state.quizPos + 1} · ${cur.sub === 3 ? '3과목' : '1·2과목'}</div><p class="sg-q-text">${esc(cur.q)}</p>
      <div class="sg-q-ops">${cur.ops.map((o, k) => `<button type="button" data-op="${k}" ${ch != null ? 'disabled' : ''} class="${ch != null ? (k === cur.ans ? 'is-right' : k === ch ? 'is-wrong' : '') : ''}"><b>${MARKS[k]}</b> ${esc(o)}</button>`).join('')}</div>
      ${ch != null ? `<div class="sg-q-ex"><b>${ch === cur.ans ? '정답이에요' : `정답은 ${MARKS[cur.ans]}`}</b> — ${esc(cur.ex)} <a href="https://youtu.be/${cur.vid}?t=${cur.t}" target="_blank" rel="noopener noreferrer">▶ ${fmt(cur.t)}</a></div>` : ''}</div>` : ''}
    <div class="sg-pager"><button type="button" class="sg-btn" id="qprev" ${state.quizPos === 0 ? 'disabled' : ''}>← 이전</button><span class="sg-pager-pos">${state.quizPos + 1} / ${list.length}</span><button type="button" class="sg-btn sg-btn--fill" id="qnext" ${state.quizPos >= list.length - 1 ? 'disabled' : ''}>다음 →</button></div>
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
    app.innerHTML = `<p class="sg-msg">불러오지 못했어요. 새로고침해 주세요. (${esc(err.message)})</p>`;
  }
}
window.addEventListener('popstate', route);
window.addEventListener('hashchange', route);
route();
