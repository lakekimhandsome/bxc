const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const STORAGE_KEY = 'bxc_user_id';

let socket = null;
let state = {
  user: null,
  price: null,
  rankings: { cash: [], collection: [] },
  shopItems: [],
  priceHistory: [],
};

let chart = null;
let toastTimer = null;

function toBigIntAmount(amount) {
  if (typeof amount === 'string') return BigInt(amount);
  return BigInt(Math.floor(Math.abs(amount)));
}

function formatKRW(amount) {
  return '₩' + toBigIntAmount(amount).toLocaleString('ko-KR');
}

const KOREAN_UNITS = [
  { name: '대수', digits: 72 },
  { name: '무량대수', digits: 68 },
  { name: '불가사의', digits: 64 },
  { name: '나유타', digits: 60 },
  { name: '아승기', digits: 56 },
  { name: '항하사', digits: 52 },
  { name: '극', digits: 48 },
  { name: '재', digits: 44 },
  { name: '정', digits: 40 },
  { name: '간', digits: 36 },
  { name: '구', digits: 32 },
  { name: '양', digits: 28 },
  { name: '자', digits: 24 },
  { name: '해', digits: 20 },
  { name: '경', digits: 16 },
  { name: '조', digits: 12 },
  { name: '억', digits: 8 },
  { name: '만', digits: 4 },
];

function formatKoreanMoney(amount) {
  let n = toBigIntAmount(amount);
  if (n === 0n) return '0원';

  let result = '';
  for (const unit of KOREAN_UNITS) {
    const divisor = 10n ** BigInt(unit.digits);
    if (n >= divisor) {
      result += (n / divisor).toString() + unit.name;
      n %= divisor;
    }
  }

  if (n > 0n) result += n.toString() + '원';
  else if (result) result += '원';

  return result || '0원';
}

function calcAvgBuyProfitRate(bxc, bxcCost, currentPrice) {
  if (bxc <= 0 || bxcCost <= 0) return null;
  const avgBuyPrice = bxcCost / bxc;
  return ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;
}

function setMoneyDisplay(valueEl, subEl, amount) {
  if (valueEl) valueEl.textContent = formatKRW(amount);
  if (subEl) subEl.textContent = formatKoreanMoney(amount);
}

function formatBXC(amount) {
  const n = Number(amount) || 0;
  if (n === 0) return '0 BXC';
  if (n >= 1) {
    return n.toLocaleString('ko-KR', { maximumFractionDigits: 4 }) + ' BXC';
  }
  if (n >= 0.0001) return n.toFixed(6) + ' BXC';
  return n.toExponential(2) + ' BXC';
}

function formatBXCPlain(amount) {
  const n = Number(amount) || 0;
  if (n === 0) return '0';
  if (n >= 1) return n.toLocaleString('ko-KR', { maximumFractionDigits: 8 });
  if (n >= 0.0001) return n.toFixed(8);
  return n.toExponential(4);
}

function showToast(message, type = 'success') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

function showError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.classList.add('hidden');
}

// ── Login ──
async function login(nickname, password) {
  const savedId = localStorage.getItem(STORAGE_KEY);
  const body = savedId ? { userId: savedId } : { nickname, password };

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    if (savedId) localStorage.removeItem(STORAGE_KEY);
    throw new Error(data.error);
  }

  localStorage.setItem(STORAGE_KEY, data.user.id);
  return data;
}

function enterGame(data) {
  state.user = data.user;
  state.price = data.price;
  state.rankings = data.rankings;
  state.shopItems = data.shopItems;
  state.priceHistory = data.priceHistory;

  $('#login-screen').classList.remove('active');
  $('#game-screen').classList.add('active');

  chart = new PriceChart($('#price-chart'));
  chart.setData(state.priceHistory);

  updateUI();
  renderShop();
  renderCollection();
  renderRankings();
  connectSocket();
}

function logout() {
  localStorage.removeItem(STORAGE_KEY);

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  state = {
    user: null,
    price: null,
    rankings: { cash: [], collection: [] },
    shopItems: [],
    priceHistory: [],
  };
  chart = null;

  $('#password-input').value = '';
  hideError($('#login-error'));

  $('#game-screen').classList.remove('active');
  $('#login-screen').classList.add('active');

  const loginBtn = $('#login-btn');
  loginBtn.disabled = false;
  loginBtn.textContent = '게임 시작';

  showToast('로그아웃되었습니다.');
}

// ── Socket ──
function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    socket.emit('auth', { userId: state.user.id });
  });

  socket.on('init', (data) => {
    state.user = data.user;
    state.price = data.price;
    state.rankings = data.rankings;
    state.priceHistory = data.priceHistory;
    state.shopItems = data.shopItems;
    chart.setData(state.priceHistory);
    updateUI();
    renderShop();
    renderCollection();
    renderRankings();
  });

  socket.on('price:update', (update) => {
    state.price = update;
    state.priceHistory.push({ price: update.price });
    if (state.priceHistory.length > 100) state.priceHistory.shift();

    updatePriceUI(update);
    chart.addPoint(update.price);
    updatePortfolio();

    if (update.eventType !== 'normal') {
      showEventBanner(update);
    }
  });

  socket.on('trade:success', ({ result, user }) => {
    state.user = user;
    updatePortfolio();
    renderShop();

    const msg = result.type === 'buy'
      ? `매수 완료! ${formatBXC(result.bxcGained)} (${formatKRW(result.spent)})`
      : `매도 완료! ${formatBXC(result.bxcSold)} → ${formatKRW(result.gained)}`;
    showToast(msg);
  });

  socket.on('shop:success', ({ item, user }) => {
    state.user = user;
    updatePortfolio();
    renderShop();
    renderCollection();
    renderRankings();

    const fullItem = state.shopItems.find((i) => i.id === item.id) || item;
    openBoksilViewer(fullItem);
  });

  socket.on('rankings:update', ({ rankings }) => {
    state.rankings = rankings;
    renderRankings();
  });

  socket.on('error', ({ message }) => {
    showToast(message, 'error');
  });
}

// ── UI Updates ──
function updateUI() {
  $('#player-nickname').textContent = state.user.nickname;
  updatePriceUI(state.price);
  updatePortfolio();
}

function updatePriceUI(price) {
  const priceEl = $('#current-price');
  const changeEl = $('#price-change');
  const prev = parseFloat(priceEl.dataset.price || price.price);

  setMoneyDisplay(priceEl, $('#current-price-sub'), price.price);
  priceEl.dataset.price = price.price;

  const pct = price.changePct || 0;
  const sign = pct >= 0 ? '+' : '';
  changeEl.textContent = `${sign}${pct.toFixed(2)}%`;
  changeEl.className = `price-change ${pct >= 0 ? 'up' : 'down'}`;

  if (price.price > prev) {
    priceEl.classList.add('flash-up');
    setTimeout(() => priceEl.classList.remove('flash-up'), 600);
  } else if (price.price < prev) {
    priceEl.classList.add('flash-down');
    setTimeout(() => priceEl.classList.remove('flash-down'), 600);
  }
}

function updatePortfolio() {
  const u = state.user;
  const price = state.price?.price || 0;
  const bxc = Number(u.bxc) || 0;
  const bxcValue = bxc * price;

  setMoneyDisplay($('#user-cash'), $('#user-cash-sub'), u.cash);
  $('#user-bxc').textContent = formatBXC(bxc);
  const bxcSub = $('#user-bxc-sub');
  if (bxcSub) bxcSub.textContent = bxc > 0 ? `${formatBXCPlain(bxc)} BXC` : '';
  setMoneyDisplay($('#user-bxc-value'), $('#user-bxc-value-sub'), bxcValue);
  setMoneyDisplay($('#user-total'), $('#user-total-sub'), u.cash + bxcValue);

  const profitEl = $('#user-bxc-profit');
  const cost = u.bxcCost || 0;
  const rate = calcAvgBuyProfitRate(bxc, cost, price);
  if (rate !== null) {
    const sign = rate >= 0 ? '+' : '';
    profitEl.textContent = `수익률 ${sign}${rate.toFixed(2)}%`;
    profitEl.className = `portfolio-profit ${rate >= 0 ? 'up' : 'down'}`;
  } else {
    profitEl.textContent = '';
    profitEl.className = 'portfolio-profit';
  }
}

function showEventBanner(update) {
  const banner = $('#event-banner');
  const text = $('#event-text');
  text.textContent = update.eventMessage;
  banner.className = `event-banner visible ${update.eventType}`;

  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => banner.classList.remove('visible'), 5000);
}

// ── Boksil thumb ──
let viewerKeyHandler = null;

function boksilItemSrc(item) {
  return item.image || `/images/boksil/${item.id}.png`;
}

function boksilThumbHtml(item, variant, owned) {
  const src = boksilItemSrc(item);
  const blurClass = owned ? '' : ' is-blurred';
  return `
    <div class="boksil-thumb boksil-thumb--${variant}${blurClass}">
      <img src="${src}" alt="${item.name}" class="boksil-img" loading="lazy">
      <span class="boksil-emoji-fallback" aria-hidden="true">${item.emoji}</span>
    </div>
  `;
}

function bindBoksilImages(root) {
  root.querySelectorAll('.boksil-thumb').forEach((thumb) => {
    const img = thumb.querySelector('.boksil-img');
    const fallback = thumb.querySelector('.boksil-emoji-fallback');
    if (!img || !fallback) return;

    const showFallback = () => {
      img.classList.add('is-hidden');
      fallback.classList.add('is-visible');
      if (thumb.classList.contains('is-blurred')) {
        thumb.classList.add('is-blurred-fallback');
      }
    };

    img.addEventListener('error', showFallback, { once: true });
    if (img.complete && img.naturalWidth === 0) showFallback();
  });
}

function openBoksilViewer(item) {
  const viewer = $('#boksil-viewer');
  const src = boksilItemSrc(item);
  const img = $('#boksil-viewer-img');

  img.src = src;
  img.alt = item.name;
  $('#boksil-viewer-title').textContent = item.name;
  $('#boksil-viewer-desc').textContent = item.description;

  const download = $('#boksil-viewer-download');
  download.href = src;
  download.download = `${item.name.replace(/\s+/g, '_')}.png`;

  viewer.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  viewerKeyHandler = (e) => {
    if (e.key === 'Escape') closeBoksilViewer();
  };
  document.addEventListener('keydown', viewerKeyHandler);
}

function closeBoksilViewer() {
  $('#boksil-viewer').classList.add('hidden');
  document.body.style.overflow = '';
  if (viewerKeyHandler) {
    document.removeEventListener('keydown', viewerKeyHandler);
    viewerKeyHandler = null;
  }
}

function initBoksilViewer() {
  $('#boksil-viewer-close').addEventListener('click', closeBoksilViewer);
  $('.boksil-viewer-backdrop').addEventListener('click', closeBoksilViewer);
}

function bindCollectionClicks(grid) {
  grid.querySelectorAll('.collection-item.owned.is-clickable').forEach((el) => {
    el.addEventListener('click', () => {
      const item = state.shopItems.find((i) => i.id === el.dataset.itemId);
      if (item) openBoksilViewer(item);
    });
  });
}

// ── Shop ──
function renderShop() {
  const grid = $('#shop-grid');
  grid.innerHTML = state.shopItems.map((item) => {
    const owned = state.user.items.includes(item.id);
    const isStarter = item.starter || item.price === 0 || item.price === '0';
    const btnLabel = isStarter ? '기본 제공' : (owned ? '보유 중' : '구매');
    const priceLabel = isStarter ? '무료' : formatKRW(item.price);
    const priceSub = isStarter ? '0원' : formatKoreanMoney(item.price);
    return `
      <div class="shop-item">
        ${boksilThumbHtml(item, 'shop', owned)}
        <div class="shop-info">
          <div class="shop-name">${item.name}</div>
          <div class="shop-desc">${item.description}</div>
          <div class="shop-meta">
            <span class="rarity-badge rarity-${item.rarity}">${item.rarityLabel}</span>
            <span class="shop-price-wrap">
              <span class="shop-price">${priceLabel}</span>
              <span class="money-sub">${priceSub}</span>
            </span>
          </div>
        </div>
        <button class="btn-shop ${owned || isStarter ? 'owned' : ''}"
                data-item="${item.id}"
                ${owned || isStarter ? 'disabled' : ''}>
          ${btnLabel}
        </button>
      </div>
    `;
  }).join('');

  bindBoksilImages(grid);

  grid.querySelectorAll('.btn-shop:not(.owned)').forEach((btn) => {
    btn.addEventListener('click', () => {
      socket.emit('shop:buy', { itemId: btn.dataset.item });
    });
  });
}

// ── Collection ──
function renderCollection() {
  const owned = state.user.items;
  const total = state.shopItems.length;
  const count = owned.length;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  $('#collection-count').textContent = `${count} / ${total}`;
  $('#collection-bar').style.width = `${pct}%`;
  $('#collection-pct').textContent = `${pct}%`;

  const grid = $('#collection-grid');
  grid.innerHTML = state.shopItems.map((item) => {
    const has = owned.includes(item.id);
    return `
      <div class="collection-item ${has ? 'owned is-clickable' : 'locked'}"
           ${has ? `data-item-id="${item.id}"` : ''}>
        ${boksilThumbHtml(item, 'collection', has)}
        <div class="collection-item-name">${item.name}</div>
        <div class="collection-item-rarity">
          <span class="rarity-badge rarity-${item.rarity}">${item.rarityLabel}</span>
        </div>
        <div class="collection-status">${has ? '✓ 보유' : '미보유'}</div>
      </div>
    `;
  }).join('');

  bindBoksilImages(grid);
  bindCollectionClicks(grid);
}

// ── Rankings ──
function renderRankingList(listEl, entries, type) {
  const rankClass = ['gold', 'silver', 'bronze'];

  listEl.innerHTML = entries.map((r, i) => {
    const isMe = r.nickname === state.user.nickname;
    const rc = i < 3 ? rankClass[i] : '';
    const valueHtml = type === 'cash'
      ? `
        <span class="ranking-cash-wrap">
          <span class="ranking-cash">${formatKRW(r.cash)}</span>
          <span class="money-sub">${formatKoreanMoney(r.cash)}</span>
        </span>
      `
      : `
        <span class="ranking-cash-wrap">
          <span class="ranking-value">${r.collectionPct}%</span>
          <span class="ranking-value-sub">${r.collectionCount} / ${r.collectionTotal}</span>
        </span>
      `;

    return `
      <div class="ranking-item ${isMe ? 'me' : ''}">
        <span class="ranking-rank ${rc}">${i + 1}</span>
        <span class="ranking-name">${r.nickname}${isMe ? ' (나)' : ''}</span>
        ${valueHtml}
      </div>
    `;
  }).join('');
}

function renderRankings() {
  const cashRankings = state.rankings.cash || [];
  const collectionRankings = state.rankings.collection || [];
  renderRankingList($('#ranking-cash-list'), cashRankings, 'cash');
  renderRankingList($('#ranking-collection-list'), collectionRankings, 'collection');
}

function initRankingTabs() {
  $$('.ranking-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.ranking-tab').forEach((t) => t.classList.remove('active'));
      $$('.ranking-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#ranking-${tab.dataset.ranking}-panel`).classList.add('active');
    });
  });
}

// ── Tabs ──
function initTabs() {
  $$('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.nav-tab').forEach((t) => t.classList.remove('active'));
      $$('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

// ── Trade ──
function initTrade() {
  $$('.btn-buy, .btn-sell').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!socket) return;
      socket.emit('trade', {
        type: btn.dataset.type,
        percent: parseInt(btn.dataset.percent, 10),
      });
    });
  });
}

// ── Init ──
function init() {
  const loginBtn = $('#login-btn');
  const nicknameInput = $('#nickname-input');
  const passwordInput = $('#password-input');
  const loginError = $('#login-error');

  loginBtn.addEventListener('click', async () => {
    hideError(loginError);
    loginBtn.disabled = true;
    loginBtn.textContent = '접속 중...';

    try {
      const nickname = nicknameInput.value.trim();
      const password = passwordInput.value;
      if (!nickname) throw new Error('닉네임을 입력해주세요.');
      if (!password) throw new Error('비밀번호를 입력해주세요.');
      const data = await login(nickname, password);
      enterGame(data);
    } catch (err) {
      showError(loginError, err.message);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = '게임 시작';
    }
  });

  nicknameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') passwordInput.focus();
  });

  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  const savedId = localStorage.getItem(STORAGE_KEY);
  if (savedId) {
    loginBtn.textContent = '재접속 중...';
    login(savedId).then(enterGame).catch(() => {
      loginBtn.textContent = '게임 시작';
    });
  }

  $('#logout-btn').addEventListener('click', () => {
    if (confirm('로그아웃 하시겠습니까?')) logout();
  });

  initTabs();
  initRankingTabs();
  initBoksilViewer();
  initTrade();
}

document.addEventListener('DOMContentLoaded', init);
