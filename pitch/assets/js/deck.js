/* ============================================================
   TEAM — edit this block. One entry per person, in speaking order.
   photo: path relative to pitch/index.html, e.g. 'assets/img/team/ana.jpg'
   (leave '' to show a placeholder frame).
   ============================================================ */
const TEAM = [
  { name: 'Team member 1', role: 'Role · contribution', photo: '' },
  { name: 'Team member 2', role: 'Role · contribution', photo: '' },
  { name: 'Team member 3', role: 'Role · contribution', photo: '' },
  { name: 'Team member 4', role: 'Role · contribution', photo: '' },
];

/* Total speaking budget in seconds (per-slide targets live in each slide's data-time). */
const BUDGET = 300;

(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const MODE = params.has('presenter') ? 'presenter' : params.has('embed') ? 'embed' : 'main';
  if (MODE === 'embed') root.classList.add('embed', 'no-motion');
  if (params.get('motion') === 'off') root.classList.add('no-motion');
  const reduced = () => root.classList.contains('no-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- team ---------- */
  const teamEl = document.getElementById('team');
  if (teamEl) {
    teamEl.style.gridTemplateColumns = `repeat(${TEAM.length}, 1fr)`;
    teamEl.innerHTML = TEAM.map((m, i) => `
      <div class="member rv" style="--d:${0.3 + i * 0.12}s">
        <div class="ph">${m.photo ? `<img src="${m.photo}" alt="${m.name}">` : 'Photo'}</div>
        <div class="nm">${m.name}</div>
        <div class="rl">${m.role}</div>
      </div>`).join('');
  }

  /* ---------- slides + chrome ---------- */
  const stage = document.querySelector('.stage');
  const slides = [...document.querySelectorAll('.slide')];
  const N = slides.length;
  const steps = slides.map(s => Math.max(0, ...[...s.querySelectorAll('[data-step]')].map(e => +e.dataset.step)));
  const times = slides.map(s => +(s.dataset.time || 0));
  const cumStart = times.map((_, i) => times.slice(0, i).reduce((a, b) => a + b, 0));

  slides.forEach((s, i) => {
    s.dataset.n = i + 1;
    const c = document.createElement('div');
    c.className = 'chrome';
    c.innerHTML = `<div class="mark">THERMOSTAT</div>` +
      (s.dataset.chapter ? `<div class="chap">${s.dataset.chapter}</div>` : '') +
      `<div class="num">${String(i + 1).padStart(2, '0')} / ${N}</div>` +
      (s.dataset.credit ? `<div class="credit">${s.dataset.credit}</div>` : '');
    s.querySelector('.frame').appendChild(c);
    const n = s.querySelector('.notes');
    if (n) n.dataset.label = `${i + 1} · ${s.dataset.title || ''}`;
  });

  document.querySelectorAll('.draw').forEach(p => {
    try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch (e) { /* not rendered */ }
  });

  /* ---------- count-up numbers ---------- */
  const fmt = (el, v) => {
    const d = +(el.dataset.dec || 0);
    const s = v.toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d });
    el.textContent = (el.dataset.pre || '') + s + (el.dataset.suf || '');
  };
  const runCount = el => {
    if (el._ran) return;
    el._ran = true;
    const to = +el.dataset.count;
    if (reduced()) return fmt(el, to);
    if (window.gsap) {
      const o = { v: 0 }, d = +(el.dataset.dec || 0);
      fmt(el, 0);
      return gsap.to(o, { v: to, duration: +(el.dataset.dur || 2200) / 1000, delay: +(el.dataset.delay || 0) / 1000, ease: 'expo.out',
        onUpdate: () => fmt(el, d ? +o.v.toFixed(d) : Math.round(o.v)), onComplete: () => fmt(el, to) });
    }
    const dur = +(el.dataset.dur || 2200), t0 = performance.now(), delay = +(el.dataset.delay || 0);
    fmt(el, 0);
    const tick = now => {
      const t = Math.min(1, Math.max(0, (now - t0 - delay) / dur));
      const e = 1 - Math.pow(1 - t, 4);
      fmt(el, t >= 1 ? to : Math.round(to * e * Math.pow(10, +(el.dataset.dec || 0))) / Math.pow(10, +(el.dataset.dec || 0)));
      if (t < 1 && el._ran) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const resetCounts = s => s.querySelectorAll('[data-count]').forEach(el => { el._ran = false; fmt(el, +el.dataset.count); });

  /* ---------- state ---------- */
  let cur = -1, step = 0;
  const progress = document.querySelector('.progress');

  function render(n, s, opts = {}) {
    n = Math.max(0, Math.min(N - 1, n));
    s = Math.max(0, Math.min(steps[n], s));
    const changed = n !== cur;
    if (changed && cur >= 0) resetCounts(slides[cur]);
    slides.forEach((el, i) => {
      el.classList.toggle('is-active', i === n);
      el.classList.toggle('is-past', i < n);
    });
    cur = n; step = s;
    const sl = slides[n];
    sl.querySelectorAll('[data-step]').forEach(el => el.classList.toggle('on', +el.dataset.step <= s));
    if (changed) document.dispatchEvent(new CustomEvent('deck:enter', { detail: { slide: sl, reduced: reduced() } }));
    document.dispatchEvent(new CustomEvent('deck:step', { detail: { slide: sl, step: s } }));
    sl.querySelectorAll('[data-count]').forEach(el => {
      const host = el.closest('[data-step]');
      if (!host || +host.dataset.step <= s) runCount(el);
      else { el._ran = false; }
    });
    if (MODE === 'main') {
      const h = `#/${n + 1}`;
      if (location.hash !== h && location.hash !== `${h}/${s}`) history.replaceState(null, '', h);
      if (progress) progress.style.width = `${(n / (N - 1)) * 100}%`;
      document.title = `ThermoStat — ${n + 1}. ${sl.dataset.title || ''}`;
      broadcast({ type: 'state', cur, step });
    }
    if (opts.cb) opts.cb();
  }
  const nextPos = (n, s) => s < steps[n] ? [n, s + 1] : n < N - 1 ? [n + 1, 0] : [n, s];
  const prevPos = (n, s) => s > 0 ? [n, s - 1] : n > 0 ? [n - 1, steps[n - 1]] : [0, 0];

  /* ---------- messaging (BroadcastChannel + window refs for file://) ---------- */
  let chan = null;
  try { chan = new BroadcastChannel('thermostat-deck'); } catch (e) { /* unsupported */ }
  let peer = null;
  function broadcast(msg) {
    try { chan && chan.postMessage(msg); } catch (e) {}
    try { peer && !peer.closed && peer.postMessage(msg, '*'); } catch (e) {}
    try { window.opener && window.opener.postMessage(msg, '*'); } catch (e) {}
  }
  const handlers = [];
  const onMsg = d => { if (d && d.type) handlers.forEach(h => h(d)); };
  if (chan) chan.onmessage = e => onMsg(e.data);
  window.addEventListener('message', e => onMsg(e.data));

  /* ---------- parse hash ---------- */
  const fromHash = () => {
    const m = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/);
    return m ? [(+m[1] || 1) - 1, +(m[2] || 0)] : [0, 0];
  };

  if (MODE === 'presenter') return presenter();

  /* ---------- scale stage ---------- */
  function fit() {
    if (document.body.classList.contains('overview')) return;
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${-960 * k}px, ${-540 * k}px) scale(${k})`;
  }
  addEventListener('resize', () => { fit(); if (document.body.classList.contains('overview')) sizeOverview(); });
  fit();

  if (MODE === 'embed') {
    handlers.push(d => { if (d.type === 'set') render(d.cur, d.step); });
    const [n, s] = fromHash();
    render(n, s);
    return;
  }

  /* ---------- main ---------- */
  const go = (n, s) => render(n, s);
  const next = () => go(...nextPos(cur, step));
  const prev = () => go(...prevPos(cur, step));
  handlers.push(d => {
    if (d.type === 'go') go(d.cur, d.step);
    if (d.type === 'hello') broadcast({ type: 'state', cur, step });
  });
  addEventListener('hashchange', () => { const [n, s] = fromHash(); if (n !== cur) go(n, s); });

  const blank = document.querySelector('.blank');
  const jump = document.querySelector('.jump');
  let buf = '';
  let ovSel = 0;

  function sizeOverview() {
    const w = slides[0].getBoundingClientRect().width;
    stage.style.setProperty('--ov', w / 1920);
  }
  function overview(on) {
    document.body.classList.toggle('overview', on);
    if (on) {
      stage.style.transform = '';
      ovSel = cur;
      slides.forEach((s, i) => { s.classList.add('is-done'); s.classList.toggle('sel', i === ovSel); s.querySelectorAll('[data-step]').forEach(e => e.classList.add('on')); });
      root.classList.add('ov-static');
      sizeOverview();
      slides[ovSel].scrollIntoView({ block: 'center' });
    } else {
      slides.forEach(s => s.classList.remove('is-done', 'sel'));
      root.classList.remove('ov-static');
      fit();
      render(cur, step);
    }
  }
  const inOv = () => document.body.classList.contains('overview');
  const ovMove = d => { ovSel = Math.max(0, Math.min(N - 1, ovSel + d)); slides.forEach((s, i) => s.classList.toggle('sel', i === ovSel)); slides[ovSel].scrollIntoView({ block: 'nearest' }); };

  function openPresenter() {
    const url = location.href.split('#')[0].split('?')[0] + '?presenter' + `#/${cur + 1}`;
    peer = window.open(url, 'thermostat-presenter', 'width=1400,height=860');
  }

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (inOv()) {
      if (k === 'ArrowRight') ovMove(1); else if (k === 'ArrowLeft') ovMove(-1);
      else if (k === 'ArrowDown') ovMove(5); else if (k === 'ArrowUp') ovMove(-5);
      else if (k === 'Enter' || k === ' ') { cur = -1; overview(false); go(ovSel, 0); }
      else if (k === 'o' || k === 'O' || k === 'Escape') overview(false);
      else return;
      e.preventDefault(); return;
    }
    if (/^[0-9]$/.test(k)) { buf += k; jump.textContent = `Go to ${buf}`; jump.classList.add('on'); return; }
    if (k === 'Enter' && buf) { go(+buf - 1, 0); buf = ''; jump.classList.remove('on'); e.preventDefault(); return; }
    if (buf && k === 'Escape') { buf = ''; jump.classList.remove('on'); return; }
    if (blank.classList.contains('on') && !['b', 'B', '.', 'Escape'].includes(k)) blank.classList.remove('on');
    switch (k) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Enter': case 'ArrowDown': next(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace': case 'ArrowUp': prev(); break;
      case 'Home': go(0, 0); break;
      case 'End': go(N - 1, steps[N - 1]); break;
      case 'f': case 'F': document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); break;
      case 's': case 'S': openPresenter(); break;
      case 'o': case 'O': overview(true); break;
      case 'b': case 'B': case '.': blank.classList.toggle('on'); break;
      case 'Escape': blank.classList.remove('on'); break;
      default: return;
    }
    e.preventDefault();
  });

  document.querySelector('.viewport').addEventListener('click', e => {
    if (inOv()) {
      const s = e.target.closest('.slide');
      if (s) { const i = slides.indexOf(s); cur = -1; overview(false); go(i, 0); }
      return;
    }
    if (e.target.closest('a')) return;
    e.clientX < innerWidth * 0.18 ? prev() : next();
  });
  blank.addEventListener('click', () => blank.classList.remove('on'));
  let tx = null, ty = null;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', e => {
    if (tx === null || inOv()) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); e.preventDefault(); }
    tx = null;
  });

  const [n0, s0] = fromHash();
  render(n0, s0);

  /* ---------- presenter window ---------- */
  function presenter() {
    document.title = 'ThermoStat — presenter';
    const base = location.href.split('#')[0].split('?')[0];
    const [h0, hs] = fromHash();
    document.body.innerHTML = `
      <div class="presenter">
        <header>
          <div class="clock" id="clk">0:00</div>
          <div class="meta">of <b>5:00</b> · <span id="rem">5:00 left</span></div>
          <div class="meta">Slide <b id="pos">1</b> / ${N} <span id="stp"></span></div>
          <div class="pace" id="pace">Timer starts on first advance</div>
          <button id="pp">Pause</button><button id="rs">Reset</button>
        </header>
        <div class="left">
          <div class="lbl2">Now</div>
          <div class="cur"><iframe id="fc" src="${base}?embed#/${h0 + 1}"></iframe></div>
        </div>
        <div class="right">
          <div class="lbl2">Next</div>
          <div class="nxt"><iframe id="fn" src="${base}?embed#/${h0 + 1}"></iframe></div>
          <div class="lbl2" id="ttl">What we say</div>
          <div class="nts" id="nts"></div>
        </div>
        <footer><span>→ / Space next · ← back · number + Enter jump · Home / End</span><span class="sp">Synced with the audience window</span></footer>
      </div>`;
    const fc = document.getElementById('fc'), fn = document.getElementById('fn');
    let t0 = null, acc = 0, paused = false;
    const elapsed = () => acc + (t0 && !paused ? (Date.now() - t0) / 1000 : 0);
    const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    let pn = h0, ps = hs, pbuf = '';
    const send = (frame, n, s) => { try { frame.contentWindow.postMessage({ type: 'set', cur: n, step: s }, '*'); } catch (e) {} };
    function show(n, s) {
      pn = n; ps = s;
      send(fc, n, s);
      const [nn, ns] = nextPos(n, s);
      send(fn, nn, (nn === n && ns === s) ? s : ns);
      document.getElementById('pos').textContent = n + 1;
      document.getElementById('stp').textContent = steps[n] ? `· build ${s}/${steps[n]}` : '';
      document.getElementById('ttl').textContent = `What we say · ${slides[n].dataset.title || ''} · target ${times[n]}s`;
      const notes = slides[n].querySelector('.notes');
      document.getElementById('nts').innerHTML = notes ? notes.innerHTML : '';
      tick();
    }
    function tick() {
      const e = elapsed();
      const c = document.getElementById('clk');
      c.textContent = mmss(e);
      c.classList.toggle('over', e > BUDGET);
      document.getElementById('rem').textContent = e > BUDGET ? `${mmss(e - BUDGET)} over` : `${mmss(BUDGET - e)} left`;
      if (t0 !== null || acc) {
        const target = cumStart[pn];
        const diff = e - target - times[pn];
        const p = document.getElementById('pace');
        p.textContent = diff > 0 ? `${mmss(diff)} behind pace` : `On pace · slide ends by ${mmss(target + times[pn])}`;
        p.classList.toggle('behind', diff > 0);
      }
    }
    setInterval(tick, 250);
    const start = () => { if (t0 === null) t0 = Date.now(); };
    const cmd = (n, s) => { start(); show(n, s); broadcast({ type: 'go', cur: n, step: s }); };
    document.getElementById('pp').onclick = e => {
      if (t0 === null) { start(); e.target.textContent = 'Pause'; return; }
      if (paused) { t0 = Date.now(); paused = false; e.target.textContent = 'Pause'; }
      else { acc = elapsed(); paused = true; e.target.textContent = 'Resume'; }
    };
    document.getElementById('rs').onclick = () => { t0 = null; acc = 0; paused = false; document.getElementById('pp').textContent = 'Pause'; document.getElementById('pace').textContent = 'Timer starts on first advance'; tick(); };
    handlers.push(d => { if (d.type === 'state') show(d.cur, d.step); });
    addEventListener('keydown', e => {
      const k = e.key;
      if (/^[0-9]$/.test(k)) { pbuf += k; return; }
      if (k === 'Enter' && pbuf) { cmd(Math.min(N, +pbuf) - 1, 0); pbuf = ''; return; }
      if (['ArrowRight', 'PageDown', ' ', 'Enter', 'ArrowDown'].includes(k)) cmd(...nextPos(pn, ps));
      else if (['ArrowLeft', 'PageUp', 'Backspace', 'ArrowUp'].includes(k)) cmd(...prevPos(pn, ps));
      else if (k === 'Home') cmd(0, 0);
      else if (k === 'End') cmd(N - 1, steps[N - 1]);
      else if (k === 'b' || k === 'B') return;
      else return;
      e.preventDefault();
    });
    fc.addEventListener('load', () => show(pn, ps));
    fn.addEventListener('load', () => show(pn, ps));
    show(h0, hs);
    broadcast({ type: 'hello' });
  }
})();
