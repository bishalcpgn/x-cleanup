/* ============================================================
   X Cleanup v1.0.0 — interactive bulk delete for your OWN account
   ------------------------------------------------------------
   Remove your posts, replies, reposts (retweets) and likes in bulk,
   with optional date and keyword filters. Runs in the console.

   HOW TO USE
   1. Log into x.com in a desktop-width window (any page).
      The script opens the right page by itself (your Posts,
      Replies or Reposts tab, or History > Likes) and stops if
      the page changes mid-run.
   2. Open DevTools (F12) -> Console, paste this whole file,
      press Enter. A settings panel appears — fill it in and
      click Remove.
   3. A box in the bottom-right shows live progress and a Stop
      button, and auto-closes a few seconds after finishing.

   NOTES
   - It only clicks buttons you're allowed to click on your own
     account. Automating actions is against X's Terms of
     Service; use it on your own account at your own risk.
   - X keeps only ~3,200 of your most recent posts reachable by
     scrolling; for a deeper wipe use your downloaded archive.
   - For likes and reposts, the date shown by X is the ORIGINAL
     post's date (not when you liked/reposted), so the date
     filter is most accurate on Posts.
   - Likes now live under History (x.com/i/history/likes). Older
     layouts keep a Likes tab on the profile; both work.
   - Replies: the Replies tab also shows your own posts and the
     posts you replied to. Only your replies are deleted; a reply
     whose original post isn't shown there is skipped.
   - Deleting posts and replies looks for X's English "Delete"
     menu item, so set X's language to English for those.
     Likes and reposts work in any language.
   - If nothing gets removed, the console prints a one-line
     report on what the script saw. Include it when you report
     a problem. Full guide: README.md in the GitHub repository.
   ============================================================ */

(function xCleanupInit() {
  if (window.__xCleanupRunning) { console.log('%cAlready running. Click Stop or refresh.', 'color:#f43f5e'); return; }
  document.getElementById('xcp')?.remove();
  document.getElementById('xcp-style')?.remove();

  // Match X's display setting: a light panel on X's light theme, a dark one
  // on Dim and Lights out. Falls back to the browser's setting.
  const bgOf = el => {
    const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    return m && !(m.length === 4 && +m[3] === 0) ? m.slice(0, 3).map(Number) : null;
  };
  const xBg = bgOf(document.body) || bgOf(document.documentElement);
  const light = xBg ? 0.299 * xBg[0] + 0.587 * xBg[1] + 0.114 * xBg[2] > 140
                    : !(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);

  // ---------------- styles ----------------
  const style = document.createElement('style');
  style.id = 'xcp-style';
  style.textContent = `
  #xcp,#xcp *{box-sizing:border-box;margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
  #xcp{--ov:rgba(7,9,13,.62);--card:#12161d;--edge:rgba(255,255,255,.09);--ink:#eceff3;--muted:#9aa4b1;--lab:#b4bdc8;
       --surf:#1b222c;--line:#44505d;--line2:#5d6a78;--ctl:#d6dce3;--acc:#f43f5e;--accbtn:#e11d48;--accbtn2:#be123c;
       --soft:rgba(244,63,94,.15);--softink:#ffd7dd;--btn2:#252e3a;--btn2h:#2f3a47;--off:#3a2c30;--offink:#9a8088;
       --track:#34404c;--shadow:0 24px 60px rgba(0,0,0,.55);color-scheme:dark}
  #xcp.light{--ov:rgba(15,20,25,.4);--card:#ffffff;--edge:#e1e5ea;--ink:#0f1419;--muted:#536471;--lab:#3c4650;
       --surf:#f4f6f8;--line:#c4cdd5;--line2:#9fabb7;--ctl:#26303a;--acc:#e11d48;--accbtn:#e11d48;--accbtn2:#be123c;
       --soft:rgba(225,29,72,.09);--softink:#9f1239;--btn2:#eef1f4;--btn2h:#e2e7ec;--off:#f6d9df;--offink:#b0737f;
       --track:#d3dae1;--shadow:0 24px 60px rgba(15,20,25,.22);color-scheme:light}
  #xcp{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;
       background:var(--ov);backdrop-filter:blur(3px);color:var(--ink)}
  #xcp .card{width:360px;max-width:92vw;max-height:92vh;overflow:auto;background:var(--card);
       border:1px solid var(--edge);border-radius:20px;padding:24px 24px 20px;
       box-shadow:var(--shadow);animation:xcpIn .22s cubic-bezier(.2,.8,.2,1) both}
  @keyframes xcpIn{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){#xcp .card{animation:none}}
  #xcp .hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
  #xcp .ttl{font-size:19px;font-weight:700;letter-spacing:-.02em}
  #xcp .sub{font-size:12.5px;color:var(--muted);margin-top:3px}
  #xcp .x{background:none;border:0;color:var(--muted);font-size:20px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:6px}
  #xcp .x:hover{color:var(--ink);background:var(--btn2)}
  #xcp .lab{font-size:12.5px;font-weight:600;color:var(--lab);margin:18px 0 8px}
  #xcp .lab:first-of-type{margin-top:0}
  #xcp .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  #xcp .tile{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 6px;border-radius:12px;
       border:1px solid var(--line);background:var(--surf);cursor:pointer;transition:.15s;user-select:none}
  #xcp .tile:hover{border-color:var(--line2)}
  #xcp .tile .ic{font-size:18px}
  #xcp .tile .nm{font-size:12px;color:var(--ctl)}
  #xcp .tile.on{border-color:var(--acc);background:var(--soft)}
  #xcp .tile.on .nm{color:var(--softink);font-weight:600}
  #xcp .row{display:flex;align-items:center;gap:10px}
  #xcp input[type=number],#xcp input[type=text],#xcp input[type=date]{
       background:var(--surf);border:1px solid var(--line);border-radius:10px;color:var(--ink);padding:9px 11px;font-size:14px;outline:none;transition:.15s}
  #xcp input::placeholder{color:var(--muted)}
  #xcp input:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--soft)}
  #xcp .num{width:92px}
  #xcp .num.dim{opacity:.45}
  #xcp .num.dim:hover{opacity:.8}
  #xcp .pill{border:1px solid var(--line);background:var(--surf);color:var(--ctl);border-radius:999px;
       padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:.15s;user-select:none}
  #xcp .pill:hover{border-color:var(--line2)}
  #xcp .pill.on{border-color:var(--acc);background:var(--soft);color:var(--softink)}
  #xcp .dates{display:flex;gap:10px}
  #xcp .dates label{flex:1;font-size:11.5px;color:var(--muted)}
  #xcp .dates input{width:100%;margin-top:5px}
  #xcp input[type=text].kw{width:100%}
  #xcp .seg{display:flex;gap:4px;background:var(--surf);border:1px solid var(--line);border-radius:10px;padding:4px;margin-top:8px}
  #xcp .seg button{flex:1;background:none;border:0;color:var(--ctl);font-size:12.5px;font-weight:600;padding:7px;border-radius:7px;cursor:pointer;transition:.15s}
  #xcp .seg button:hover{background:var(--btn2)}
  #xcp .seg button.on{background:var(--soft);color:var(--softink)}
  #xcp .pace{display:flex;align-items:center;gap:12px}
  #xcp input[type=range]{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:999px;background:var(--track);outline:none}
  #xcp input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--acc);cursor:pointer;border:2px solid var(--card)}
  #xcp input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--acc);cursor:pointer;border:2px solid var(--card)}
  #xcp .pace .val{font-size:13px;color:var(--ctl);width:40px;text-align:right;font-variant-numeric:tabular-nums}
  #xcp .foot{margin-top:22px;border-top:1px solid var(--edge);padding-top:16px}
  #xcp .summary{font-size:13px;color:var(--lab);min-height:18px;margin-bottom:12px}
  #xcp .summary b{color:var(--ink);font-weight:600}
  #xcp .btns{display:flex;gap:10px}
  #xcp .go{flex:1;background:var(--accbtn);color:#fff;border:0;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;transition:.15s}
  #xcp .go:hover{background:var(--accbtn2)}
  #xcp .go[disabled]{background:var(--off);color:var(--offink);cursor:not-allowed}
  #xcp button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}`;
  document.head.appendChild(style);

  // ---------------- markup ----------------
  const panel = document.createElement('div');
  panel.id = 'xcp';
  if (light) panel.classList.add('light');
  panel.innerHTML = `
    <div class="card">
      <div class="hd">
        <div><div class="ttl">Cleanup</div><div class="sub">Remove your posts, replies, reposts & likes in bulk</div></div>
        <button class="x" id="xc-x" title="Close" aria-label="Close">&times;</button>
      </div>

      <div class="lab">What to remove <span style="color:var(--muted);font-weight:400">· pick one or more</span></div>
      <div class="tiles">
        <div class="tile" data-k="posts"><span class="ic">✍</span><span class="nm">Posts</span></div>
        <div class="tile" data-k="replies"><span class="ic">💬</span><span class="nm">Replies</span></div>
        <div class="tile" data-k="retweets"><span class="ic">🔁</span><span class="nm">Reposts</span></div>
        <div class="tile" data-k="likes"><span class="ic">♥</span><span class="nm">Likes</span></div>
      </div>

      <div class="lab">Amount</div>
      <div class="row">
        <input type="number" class="num" id="xc-count" value="50" min="1">
        <span>of each</span>
        <div class="pill" id="xc-all" style="margin-left:auto">All</div>
      </div>

      <div class="lab">Date range <span style="color:var(--muted);font-weight:400">· optional</span></div>
      <div class="dates">
        <label>Older than<input type="date" id="xc-before"></label>
        <label>Newer than<input type="date" id="xc-after"></label>
      </div>

      <div class="lab">Keywords <span style="color:var(--muted);font-weight:400">· optional</span></div>
      <input type="text" class="kw" id="xc-kw" placeholder="word1, word2">
      <div class="seg">
        <button class="on" data-m="include" id="xc-m-in">Contains these</button>
        <button data-m="exclude" id="xc-m-ex">Doesn't contain</button>
      </div>

      <div class="lab">Pace</div>
      <div class="pace">
        <input type="range" id="xc-delay" min="1" max="8" step="0.5" value="3">
        <span class="val" id="xc-delayv">3.0s</span>
      </div>

      <div class="foot">
        <div class="summary" id="xc-sum"></div>
        <div class="btns">
          <button class="go" id="xc-go">Remove 50</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(panel);

  // ---------------- state + wiring ----------------
  const q = s => panel.querySelector(s);
  const state = { posts: false, replies: false, retweets: false, likes: false, all: false, kwmode: 'include' };

  const typeNames = { posts: 'posts', replies: 'replies', retweets: 'reposts', likes: 'likes' };
  function selectedTypes() { return ['posts', 'replies', 'retweets', 'likes'].filter(k => state[k]); }
  function joinTypes(arr) {
    if (arr.length <= 1) return arr[0] || '';
    return arr.slice(0, -1).join(', ') + ' & ' + arr[arr.length - 1];
  }
  function amount() { return state.all ? 'all' : (parseInt(q('#xc-count').value, 10) || 0); }

  function refresh() {
    const types = selectedTypes().map(k => typeNames[k]);
    const amt = amount();
    const go = q('#xc-go');
    if (!types.length || (!state.all && !(amt > 0))) {
      q('#xc-sum').innerHTML = types.length ? 'Enter an amount.' : 'Pick what to remove.';
      go.disabled = true; go.textContent = 'Remove';
      return;
    }
    go.disabled = false;
    go.textContent = `Remove ${state.all ? 'all' : amt}`;

    let s = `Remove <b>${state.all ? 'all' : amt}</b> ${joinTypes(types)}`;
    const b = q('#xc-before').value, a = q('#xc-after').value;
    if (b && a) s += ` between <b>${a}</b> and <b>${b}</b>`;
    else if (b) s += ` older than <b>${b}</b>`;
    else if (a) s += ` newer than <b>${a}</b>`;
    const kw = q('#xc-kw').value.trim();
    if (kw) s += ` ${state.kwmode === 'include' ? 'containing' : 'without'} <b>${kw}</b>`;
    q('#xc-sum').innerHTML = s + '.';
  }

  panel.querySelectorAll('.tile').forEach(t => t.onclick = () => {
    const k = t.dataset.k; state[k] = !state[k]; t.classList.toggle('on', state[k]); refresh();
  });
  // "All" dims the amount field but never locks it: clicking the field,
  // typing, or using its arrows switches straight back to a number.
  function setAll(on) {
    state.all = on;
    q('#xc-all').classList.toggle('on', on);
    q('#xc-count').classList.toggle('dim', on);
    refresh();
  }
  q('#xc-all').onclick = () => setAll(!state.all);
  const countEl = q('#xc-count');
  const leaveAll = () => { if (state.all) setAll(false); };
  countEl.addEventListener('pointerdown', leaveAll);
  countEl.addEventListener('input', () => { leaveAll(); refresh(); });
  q('#xc-m-in').onclick = () => { state.kwmode = 'include'; q('#xc-m-in').classList.add('on'); q('#xc-m-ex').classList.remove('on'); refresh(); };
  q('#xc-m-ex').onclick = () => { state.kwmode = 'exclude'; q('#xc-m-ex').classList.add('on'); q('#xc-m-in').classList.remove('on'); refresh(); };
  q('#xc-delay').oninput = e => { q('#xc-delayv').textContent = (+e.target.value).toFixed(1) + 's'; };
  ['#xc-before', '#xc-after', '#xc-kw'].forEach(sel => { q(sel).oninput = refresh; });
  q('#xc-x').onclick = () => { panel.remove(); style.remove(); };
  refresh();

  q('#xc-go').onclick = () => {
    const targets = selectedTypes();
    const limit = state.all ? Infinity : (parseInt(q('#xc-count').value, 10) || 0);
    if (!targets.length || !(limit > 0)) return;
    const delay = Math.max(1, parseFloat(q('#xc-delay').value) || 3) * 1000;
    const filters = {
      before: q('#xc-before').value ? new Date(q('#xc-before').value) : null,
      after: q('#xc-after').value ? new Date(q('#xc-after').value) : null,
      keywords: q('#xc-kw').value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
      keywordMode: state.kwmode
    };
    const actions = { posts: 'delete your own posts', replies: 'delete your own replies', retweets: 'undo your reposts', likes: 'remove your likes' };
    const plan = targets.map(k => '• ' + actions[k]).join('\n');
    if (!confirm(`This will:\n${plan}\n\n${q('#xc-sum').textContent}\n\nThis is permanent. Continue?`)) return;
    panel.remove(); style.remove();
    xCleanupRun(targets, limit, delay, filters);
  };

  // ---------------- the run ----------------
  async function xCleanupRun(targets, limit, delay, filters) {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const stopped = () => window.__stopCleanup === true;
    window.__xCleanupRunning = true;
    window.__stopCleanup = false;

    const T = light
      ? { card: '#ffffff', ink: '#0f1419', muted: '#536471', edge: '#7c3aed', shadow: 'rgba(15,20,25,.18)' }
      : { card: '#12161d', ink: '#eceff3', muted: '#aab3bf', edge: '#a78bfa', shadow: 'rgba(0,0,0,.5)' };   // purple outline: the box has no backdrop, so it needs its own edge
    const box = document.createElement('div');
    box.id = 'x-cleanup-box';
    box.style.cssText =
      `position:fixed;z-index:2147483647;bottom:20px;right:20px;background:${T.card};color:${T.ink};` +
      'font:14px/1.45 -apple-system,system-ui,sans-serif;padding:15px 17px;border-radius:14px;' +
      `border:4px solid ${T.edge};box-shadow:0 10px 36px ${T.shadow};min-width:216px;max-width:320px`;
    box.innerHTML =
      '<div style="font-weight:700;margin-bottom:6px">Cleanup</div>' +
      `<div id="x-cleanup-status" style="color:${T.muted}">Starting…</div>` +
      '<button id="x-cleanup-stop" style="margin-top:12px;background:#e11d48;color:#fff;border:0;' +
      'padding:8px 18px;border-radius:999px;cursor:pointer;font-weight:700">Stop</button>';
    document.body.appendChild(box);
    const setStatus = t => { const s = document.getElementById('x-cleanup-status'); if (s) s.textContent = t; };
    box.querySelector('#x-cleanup-stop').onclick = () => { window.__stopCleanup = true; setStatus('Stopping…'); };
    console.log('%cX Cleanup v1.0.0 started. Click Stop (or refresh) to halt.', 'color:#f43f5e;font-weight:bold');

    const matches = (art) => {
      if (filters.before || filters.after) {
        const t = art.querySelector('time[datetime]');
        if (!t) return false;
        const d = new Date(t.getAttribute('datetime'));
        if (filters.before && !(d < filters.before)) return false;
        if (filters.after && !(d > filters.after)) return false;
      }
      if (filters.keywords.length) {
        const el = art.querySelector('[data-testid="tweetText"]');
        const text = (el ? el.textContent : '').toLowerCase();
        const hit = filters.keywords.some(k => text.includes(k));
        if (filters.keywordMode === 'exclude' ? hit : !hit) return false;
      }
      return true;
    };

    // Stoppable wait, so Stop works even during long pauses.
    const pause = async ms => { for (let t = 0; t < ms && !stopped(); t += 250) await sleep(250); };
    const waitFor = async (fn, ms = 6000) => {
      for (let t = 0; t < ms; t += 250) { const v = fn(); if (v) return v; await sleep(250); }
      return null;
    };

    // ---------- stay on YOUR OWN profile ----------
    // Each type runs only on its own page: posts on /you, replies on
    // /you/with_replies, reposts on /you/reposts, and likes under
    // History at /i/history/likes (or /you/likes on older layouts).
    // The script goes there itself, and each pass stops if the page
    // changes, so it never acts anywhere else.
    const profileLink = () => document.querySelector('[data-testid="AppTabBar_Profile_Link"]');
    const handle = (profileLink()?.getAttribute('href') || '').split('/')[1] || null;
    const postsPath = handle ? `/${handle}`.toLowerCase() : null;
    const repliesPath = handle ? `/${handle}/with_replies`.toLowerCase() : null;
    const repostsPath = handle ? `/${handle}/reposts`.toLowerCase() : null;
    const likesPath = handle ? `/${handle}/likes`.toLowerCase() : null;     // older layouts
    const historyLikesPath = '/i/history/likes';
    const here = () => location.pathname.replace(/\/+$/, '').toLowerCase();
    const tabLink = path => () => [...document.querySelectorAll('a')]
      .find(a => (a.getAttribute('href') || '').toLowerCase() === path);

    async function goTo(path, getLink) {
      if (here() === path) return true;
      const link = await waitFor(getLink);
      if (link) link.click();
      const ok = !!(await waitFor(() => here() === path));
      if (ok) await sleep(2000);                          // let the timeline load
      return ok;
    }
    const goToPosts = () => goTo(postsPath, profileLink);
    // These tabs only show on your profile, so open the profile first
    // when the tab link isn't on the page.
    async function goToTab(path) {
      if (here() === path) return true;
      if (!tabLink(path)() && !(await goToPosts())) return false;
      return goTo(path, tabLink(path));
    }

    // Likes moved from the profile into History in 2026. Try History
    // first, then the old profile tab, then in-app navigation. Returns
    // the page it reached, or null.
    const historyLink = () => [...document.querySelectorAll('a')]
      .find(a => /^\/i\/history(\/|$)/i.test(a.getAttribute('href') || ''));
    async function pushTo(path) {
      // Change the address the way X's own links do, without a reload,
      // and accept it only if X actually swapped the page.
      const from = location.pathname + location.search;
      const old = [...document.querySelectorAll('article')];
      history.pushState(null, '', path);
      dispatchEvent(new PopStateEvent('popstate', { state: null }));
      const ok = !!(await waitFor(() => here() === path && old.every(el => !el.isConnected), 8000));
      if (ok) await sleep(2000);
      else history.replaceState(null, '', from);
      return ok;
    }
    async function goToLikes() {
      if (here() === historyLikesPath || here() === likesPath) return here();
      const inHistory = tabLink(historyLikesPath);
      // 1) History, through its sidebar link (or its Likes tab, if already open)
      if (!inHistory() && historyLink()) { historyLink().click(); await waitFor(inHistory); }
      if (inHistory() && await goTo(historyLikesPath, inHistory)) return historyLikesPath;
      // 2) older layout: a Likes tab on your profile
      if (await goToPosts() && await waitFor(tabLink(likesPath), 2500) &&
          await goTo(likesPath, tabLink(likesPath))) return likesPath;
      // 3) last resort: in-app navigation straight to History > Likes
      if (await pushTo(historyLikesPath)) return historyLikesPath;
      return null;
    }

    // Tweet id of an article, used to recognise items X puts back.
    const idOf = a => {
      const href = a.querySelector('time')?.closest('a')?.getAttribute('href') || '';
      const m = href.match(/\/status\/(\d+)/);
      return m ? m[1] : null;
    };

    // A repost shows a green repost button. X marks it with
    // data-testid="unretweet"; the aria-label check is a fallback in case
    // that marker changes. The "You reposted" label is only used for the
    // report printed when nothing gets removed.
    const repostBtn = a => a.querySelector('[data-testid="unretweet"]') ||
      [...a.querySelectorAll('[role="group"] button')]
        .find(b => /\b(reposted|retweeted)\b/i.test(b.getAttribute('aria-label') || ''));
    const repostLabel = a => /\b(reposted|retweeted)\b/i
      .test(a.querySelector('[data-testid="socialContext"]')?.textContent || '');
    const closeMenu = () => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      document.body.click();
    };
    let menuMiss = 0, stuck = 0;                          // repost problems, for the report

    const isPost = a => a.querySelector('[data-testid="caret"]') && !repostBtn(a);
    const isRetweet = a => !!repostBtn(a);
    const isLike = a => a.querySelector('[data-testid="unlike"]');

    const actPost = async (a) => {
      a.querySelector('[data-testid="caret"]').click(); await sleep(700);
      const del = [...document.querySelectorAll('[role="menuitem"]')].find(el => /^delete$/i.test(el.textContent.trim()));
      if (!del) { document.body.click(); return false; }
      del.click(); await sleep(600);
      const ok = document.querySelector('[data-testid="confirmationSheetConfirm"]');
      if (!ok) return false;
      ok.click(); return true;
    };
    const actRetweet = async (a) => {
      const btn = repostBtn(a);
      if (!btn) return false;
      btn.click();
      // Wait for the menu, then pick "Undo repost" by its id or its text.
      const undo = await waitFor(() =>
        document.querySelector('[data-testid="unretweetConfirm"]') ||
        [...document.querySelectorAll('[role="menuitem"]')].find(el => /undo (repost|retweet)/i.test(el.textContent)), 3000);
      if (!undo) { menuMiss++; closeMenu(); await sleep(300); return false; }
      undo.click();
      // Count it only once the button is no longer green (or the entry is gone).
      const done = !!(await waitFor(() => !a.isConnected || !repostBtn(a), 3000));
      if (!done) stuck++;
      return done;
    };
    const actLike = async (a) => {
      a.querySelector('[data-testid="unlike"]').click();
      await sleep(1200);
      return !a.querySelector('[data-testid="unlike"]');  // count it only if the heart actually turned off
    };

    // ---------- replies ----------
    // The Replies tab mixes your replies with your own top-level posts and
    // the posts you replied to. A post of yours counts as a reply only if
    // the item right above it is OLDER: the tab runs newest-first, so an
    // older item above it can only be the post it answers. Each item is
    // judged once, the first time it's seen, and the post left above a
    // deleted reply is never trusted again, so deleting a reply can't make
    // a top-level post below it look like a reply.
    const isOwn = a => [...(a.querySelector('[data-testid="User-Name"]')?.querySelectorAll('a') || [])]
      .some(l => (l.getAttribute('href') || '').toLowerCase() === postsPath);
    const hasLabel = a => !!a.querySelector('[data-testid="socialContext"]');   // "Pinned", "You reposted"
    const topLevel = list => list.filter(a => !a.parentElement?.closest('article'));   // ignore nested cards
    const replyOf = new Map(), orphans = new Set();
    const classifyReplies = arts => topLevel(arts).forEach((a, i, top) => {
      const id = idOf(a);
      if (!id || replyOf.has(id)) return;
      const prev = top[i - 1], pid = prev ? idOf(prev) : null;
      replyOf.set(id, !!(pid && isOwn(a) && !hasLabel(a) && !hasLabel(prev) &&
        !orphans.has(pid) && BigInt(pid) < BigInt(id)));
    });
    const isReply = a => replyOf.get(idOf(a)) === true;
    const actReply = async (a) => {
      const list = topLevel([...document.querySelectorAll('article')]);
      const i = list.indexOf(a);
      const pid = i > 0 ? idOf(list[i - 1]) : null;
      if (pid) orphans.add(pid);                        // never trust the post above it again
      return actPost(a);
    };

    let note = '';
    async function process(kind, path, isCandidate, act, max, prepare) {
      let n = 0, fail = 0, stagnant = 0, reverts = 0;
      const acted = new Set(), skip = new Set();
      const seen = new Set(), found = new Set(), labeled = new Set();   // for the report
      setStatus(`Looking for ${kind.toLowerCase()}…`);
      window.scrollTo(0, 0); await sleep(1500);           // every pass starts from the top
      while (n < max && !stopped()) {
        if (here() !== path) {                            // never act on any other page
          note = ' The page changed mid-run.';
          window.__stopCleanup = true; break;
        }
        const arts = [...document.querySelectorAll('article')];
        if (prepare) prepare(arts);                       // let a pass judge items in page order
        for (const a of arts) {
          const i = idOf(a);
          if (!i) continue;
          seen.add(i);
          if (isCandidate(a)) found.add(i);
          if (kind === 'Reposts' && repostLabel(a)) labeled.add(i);
        }
        const art = arts.find(a => isCandidate(a) && matches(a) && !skip.has(idOf(a)));
        if (!art) {
          setStatus(n ? `${kind} removed: ${n}. Looking for more…` : `Looking for ${kind.toLowerCase()}…`);
          const y = window.scrollY;
          window.scrollBy(0, 1500); await sleep(1800);
          if (window.scrollY === y) { if (++stagnant > 5) break; } else stagnant = 0;
          continue;
        }
        stagnant = 0;
        const id = idOf(art);
        if (id && acted.has(id)) {
          // We already removed this one, but X put it back, which usually
          // means a rate limit. Uncount it, skip it, and slow down.
          acted.delete(id); skip.add(id); n--;
          console.warn(`${kind}: X put one back (likely a rate limit).`);
          if (++reverts >= 3) {
            note = ' X kept putting items back, which usually means a rate limit. Try again later with a slower pace.';
            window.__stopCleanup = true; break;
          }
          setStatus('X is pushing back. Pausing 30s…');
          await pause(30000);
          continue;
        }
        const ok = await act(art);
        if (ok) {
          if (id) acted.add(id);
          n++; fail = 0;
          setStatus(`${kind} removed: ${n}`); console.log(`${kind}: ${n}`);
          await pause(delay);
        } else {
          if (id) skip.add(id);                           // move on instead of retrying the same one
          await sleep(400);
          if (++fail > 10) { console.warn(`${kind}: stopping (couldn't act / selectors changed).`); break; }
        }
      }
      if (n === 0 && !stopped()) {
        // Nothing removed: say what this pass saw, so the cause is easy to spot.
        let report = `${kind}: removed 0. Checked ${seen.size} items; ${found.size} looked removable`;
        if (kind === 'Reposts') {
          report += `; ${labeled.size} were labeled as your reposts`;
          if (menuMiss) report += `; ${menuMiss} had no "Undo repost" option`;
          if (stuck) report += `; ${stuck} stayed reposted after Undo`;
        }
        console.warn(report + '.');
        note = note || ' The console shows why nothing was removed.';
      }
      return n;
    }

    const totals = {};
    try {
      if (!handle) {
        alert('Could not find your profile link. Make the browser window wider (X hides it in narrow layouts) and run the script again.');
      } else {
        if (targets.includes('posts')) {
          if (await goToPosts()) totals.posts = await process('Posts', postsPath, isPost, actPost, limit);
          else alert('Could not open your Posts tab. Open your profile and run the script again.');
        }
        if (!stopped() && targets.includes('replies')) {
          if (await goToTab(repliesPath)) totals.replies = await process('Replies', repliesPath, isReply, actReply, limit, classifyReplies);
          else alert('Could not open your Replies tab. Open it and run the script again.');
        }
        if (!stopped() && targets.includes('retweets')) {
          if (await goToTab(repostsPath)) totals.reposts = await process('Reposts', repostsPath, isRetweet, actRetweet, limit);
          else alert('Could not open your Reposts tab. Open it and run the script again.');
        }
        if (!stopped() && targets.includes('likes')) {
          const likesAt = await goToLikes();
          if (likesAt) totals.likes = await process('Likes', likesAt, isLike, actLike, limit);
          else alert('Could not open your likes. Open x.com/i/history/likes yourself and run the script again with Likes selected.');
        }
      }
    } catch (e) { console.error('X Cleanup error:', e); }

    const wasStopped = stopped();
    const summary = Object.entries(totals).map(([k, v]) => `${v} ${k}`).join(', ') || 'nothing';
    setStatus(`${wasStopped ? 'Stopped' : 'Done'}. Removed: ${summary}.${note}`);
    console.log(`%cX Cleanup ${wasStopped ? 'stopped' : 'finished'}. Removed: ${summary}.${note}`, 'color:#00ba7c;font-weight:bold');
    window.__xCleanupRunning = false;
    window.__stopCleanup = false;

    const removeBox = () => { const b = document.getElementById('x-cleanup-box'); if (b) b.remove(); };
    const AUTO_CLOSE_SECS = note ? 15 : 6;               // longer when there is a warning to read
    const btn = document.getElementById('x-cleanup-stop');
    if (btn) {
      btn.style.background = '#536471';
      btn.onclick = removeBox;
      let left = AUTO_CLOSE_SECS;
      btn.textContent = `Close (${left})`;
      const tick = setInterval(() => {
        if (!document.getElementById('x-cleanup-box')) { clearInterval(tick); return; }
        if (--left <= 0) { clearInterval(tick); removeBox(); } else btn.textContent = `Close (${left})`;
      }, 1000);
    } else { setTimeout(removeBox, AUTO_CLOSE_SECS * 1000); }
  }
})();
