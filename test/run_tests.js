// Asset Island jsdom テストスイート
// 実行: npm test （要 jsdom）
// 検証対象は ../index.html。回帰ケースの数字は CONTEXT.md の正規値と一致させること。
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function load(seed) {
  return new JSDOM(html, {
    url: 'https://poohredtem.github.io/asset-island/',
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse: seed ? ((w) => w.localStorage.setItem('assetIslandSave_v3', JSON.stringify(seed))) : undefined,
  });
}
function simSeed(mutate) {
  const sm = { charId: 'kotukotu', age: 30, salary: 350000, living: 200000, monthly: 80000, cash: 600000, invested: 500000, debt: 0, happy: 60, know: 40, deck: Array(35).fill(0.05), deckPos: 5, usedCards: [1, 2], cardIdx: -1, phase: 'plan', yearsContributed: 5, crashesHeld: 0, crashesSold: 0, lastResult: null, lastSummary: '', lastReturn: 0.05, yearStartTotal: 1100000, logged: false, endReason: '', ghosts: [{ name: '積立しなかった自分', monthly: 0, cash: 600000, invested: 500000 }, { name: '月5万円だけ積立した自分', monthly: 50000, cash: 600000, invested: 500000 }] };
  mutate(sm);
  return { cash: 1500000, funds: 9000000, stocks: 2500000, target: 45000000, monthlySaving: 120000, expectedReturn: 5, materials: 3, coins: 0, buildings: [], completed: [], visits: 3, lastVisit: '2026-11-07', lastAction: '2026-11-07', welcomed: true, sim: sm, voyageLog: [] };
}
function openSim(d) {
  const tab = [...d.querySelectorAll('button')].find((b) => /人生シミュレーション/.test(b.textContent) && !b.closest('#simRoot'));
  tab.click();
  return d.getElementById('simRoot');
}

(async () => {
  console.log('[初期表示と文言]');
  {
    const dom = load(); const d = dom.window.document;
    ok('版表記 v6.2.3', d.querySelector('.brand').textContent.includes('v6.2.3') && d.title.includes('v6.2.3'));
    ok('初期の純資産 ¥12,900,000', d.getElementById('netWorth').textContent.includes('12,900,000'));
    const footer = d.querySelector('.footer-note').textContent;
    ok('免責（投資助言ではない／教育・動機づけ／保証しない）', footer.includes('投資助言ではなく') && footer.includes('教育・動機づけ') && footer.includes('保証しません'));
    ok('初期表示は入力例の明示', d.body.textContent.includes('初期表示の金額は入力例です'));
    const presets = [...d.querySelectorAll('.preset-btn')].map((b) => b.textContent);
    ok('プリセット内訳の表示', presets[0].includes('現金30万・投信50万・株20万') && presets[1].includes('現金100万・投信700万・株200万') && presets[2].includes('現金300万・投信2,000万・株700万'));
    ok('スマホで資産入力が1列になるCSS', html.includes('.asset-grid{grid-template-columns:1fr'));
  }

  console.log('[マイ島 回帰ケース]');
  {
    const dom = load(); const w = dom.window, d = w.document, $ = (id) => d.getElementById(id);
    const set = (id, v) => { const el = $(id); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
    set('cashInput', 1500000); set('fundInput', 9000000); set('stockInput', 2500000);
    set('targetInput', 45000000); set('savingInput', 120000); set('returnInput', 5);
    $('saveAssetsBtn').click();
    ok('純資産 ¥13,000,000', $('netWorth').textContent.includes('13,000,000'));
    ok('STAGE 3', $('stagePill').textContent.includes('STAGE 3'));
    ok('クエスト 4/9', $('questCount').textContent.includes('4 / 9'));
    ok('到達目安 約11.9年', $('fireEta').textContent.includes('11.9'));
  }

  console.log('[シム状態の矛盾対策]');
  {
    const root1 = openSim(load(simSeed((sm) => { sm.phase = 'card'; sm.cardIdx = -1; })).window.document);
    ok('card＋番号なし → 計画画面に復帰', root1.textContent.includes('歳の計画'));
    const root2 = openSim(load(simSeed((sm) => { sm.phase = 'crash'; sm.lastReturn = null; })).window.document);
    ok('crash＋暴落率なし → 計画画面に復帰', root2.textContent.includes('歳の計画'));
    const root3 = openSim(load(simSeed((sm) => { sm.phase = 'card'; sm.cardIdx = 5; })).window.document);
    ok('正常な途中セーブはカード画面を復元', !!root3.querySelector('.event-card'));
  }

  console.log('[結果表示の安全化]');
  {
    const dom = load(simSeed((sm) => { sm.phase = 'cardResult'; sm.cardIdx = 3; sm.lastResult = { main: '<img src=x onerror="window.__pwn=1">', sub: '<b>太字</b>' }; }));
    const root = openSim(dom.window.document);
    const p = root.querySelector('.panel p');
    ok('細工した結果が実行されない', dom.window.__pwn === undefined && !p.querySelector('img') && !p.querySelector('b'));
    ok('細工した結果は文字として表示される', p.textContent.includes('<img src=x'));
  }

  console.log('[インポートのサイズ上限]');
  {
    const dom = load(); const w = dom.window, d = w.document, $ = (id) => d.getElementById(id);
    const input = $('importFile');
    const big = new w.File(['x'.repeat(1024 * 1024 + 10)], 'big.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [big], configurable: true });
    input.dispatchEvent(new w.Event('change', { bubbles: true }));
    ok('1MB超は理由つきで拒否', $('toast').textContent.includes('大きすぎます') && !$('importModal').classList.contains('open'));
    const good = new w.File([JSON.stringify({ app: 'Asset Island', state: { cash: 123000, funds: 0, stocks: 0 } })], 'save.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [good], configurable: true });
    input.dispatchEvent(new w.Event('change', { bubbles: true }));
    await sleep(400);
    ok('正常なセーブは取り込み確認が開く', $('importModal').classList.contains('open'));
  }

  console.log('[シム完走]');
  {
    const dom = load(); const d = dom.window.document;
    const root = openSim(d);
    const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
    q('[data-sim-char="fukugyo"]').click();
    q('[data-sim-action="start"]').click();
    let g = 0;
    while (g++ < 800) {
      if (q('.report-card')) break;
      const a = q('[data-sim-action="advance"]'); if (a) { a.click(); continue; }
      const chs = qa('[data-sim-action="choose"]'); if (chs.length) { chs[0].click(); continue; }
      const tm = q('[data-sim-action="toMarket"]'); if (tm) { tm.click(); continue; }
      const h = q('[data-sim-action="crashHold"]'); if (h) { h.click(); continue; }
      const ny = q('[data-sim-action="nextYear"]'); if (ny) { ny.click(); continue; }
      break;
    }
    ok('人生が最後まで進み、結果レポートが出る', !!q('.report-card'));
  }

  console.log(`\n結果: ${pass} パス / ${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('テスト実行エラー:', e); process.exit(1); });
