const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { validatePassword, hashPassword, verifyPassword } = require('./auth');

const DATA_PATH = path.join(__dirname, '..', 'data', 'game.json');

const SHOP_ITEMS = [
  {
    id: 'default',
    name: '기본 복실이',
    emoji: '🐱',
    price: 0,
    rarity: 'common',
    starter: true,
    description: '모든 복실이 컬렉션의 시작점. 당신의 첫 번째 복실이 친구이다.',
  },
  {
    id: 'sleepy',
    name: '잠든 복실이',
    emoji: '😴',
    price: 10000,
    rarity: 'common',
    description: '24시간 낮잠 모드. 깨우면 하품을 하며 다시 잠든다.',
  },
  {
    id: 'playful',
    name: '장난치는 복실이',
    emoji: '😼',
    price: 100000000,
    rarity: 'uncommon',
    description: '장난감을 물고 도망가는 것이 특기. 집안 어지럽히기 챔피언.',
  },
  {
    id: 'golden',
    name: '황금 복실이',
    emoji: '✨',
    price: 25968000000,
    rarity: 'rare',
    description: '24K 황금으로 만들어진 복실이. 실제 복실이 크기의 순금의 가격이다.',
  },
  {
    id: 'studying',
    name: '공부하는 복실이',
    emoji: '📚',
    price: 1000000000000,
    rarity: 'epic',
    description: '안경을 쓰고 밤새 공부한다. 시험 전날이면 더욱 열심히 책을 넘긴다.',
  },
  {
    id: 'king',
    name: '왕 복실이',
    emoji: '👑',
    price: '10000000000000000',
    rarity: 'epic',
    description: '황금 왕관을 쓴 고귀한 복실이. 모든 츄르를 자기 것이라 주장한다.',
  },
  {
    id: 'bicycle',
    name: '자전거 타는 복실이',
    emoji: '🚲',
    price: '100000000000000000000',
    rarity: 'epic',
    description: '미니 자전거를 타고 집안을 질주한다. 브레이크는 장식품이다.',
  },
  {
    id: 'angry',
    name: '화난 복실이',
    emoji: '😾',
    price: '1000000000000000000000000',
    rarity: 'rare',
    description: '츄르를 늦게 주면 이 표정이 된다. 사실 화난 척하는 애교쟁이다.',
  },
  {
    id: 'motorcycle',
    name: '바이크 타는 복실이',
    emoji: '🏍️',
    price: '10000000000000000000000000000',
    rarity: 'legendary',
    description: '가죽 재킷을 입고 바이크를 탄다. 짖는 소리가 엔진 소리처럼 들린다.',
  },
  {
    id: 'genius',
    name: '천재 복실이',
    emoji: '🧠',
    price: '100000000000000000000000000000000',
    rarity: 'legendary',
    description: '체스, 수학, 코딩을 모두 마스터했다. 사실상 복실이계의 아인슈타인.',
  },
  {
    id: 'baby',
    name: '아기 복실이',
    emoji: '🍼',
    price: '1000000000000000000000000000000000000',
    rarity: 'uncommon',
    description: '세상에서 가장 작고 귀여운 복실이. 보는 것만으로 심장이 녹는다.',
  },
  {
    id: 'rich',
    name: '부자 복실이',
    emoji: '💰',
    price: '10000000000000000000000000000000000000000',
    rarity: 'legendary',
    description: '금괴 산 위에서 잠든다. 매일 아침 자산 가치를 확인하는 습관이 있다.',
  },
  {
    id: 'dragon',
    name: '드래곤 복실이',
    emoji: '🐉',
    price: '100000000000000000000000000000000000000000000',
    rarity: 'legendary',
    description: '작은 날개와 뿔을 달았다. 불을 뿜는 대신 따뜻한 허그를 내뿜는다.',
  },
  {
    id: 'pilot',
    name: '전투기 조종사 복실이',
    emoji: '🛩️',
    price: '1000000000000000000000000000000000000000000000000',
    rarity: 'legendary',
    description: '조종복을 입고 하늘을 난다. 사실 비행기는 종이접기 전투기다.',
  },
  {
    id: 'guitarist',
    name: '기타리스트 복실이',
    emoji: '🎸',
    price: '10000000000000000000000000000000000000000000000000000',
    rarity: 'legendary',
    description: '록스타의 꿈을 품은 복실이. 기타 솔로 대신 야옹 솔로를 연주한다.',
  },
  {
    id: 'chainsaw',
    name: '체인소맨 복실이',
    emoji: '🪚',
    price: '100000000000000000000000000000000000000000000000000000000',
    rarity: 'mythic',
    description: '머리가 체인소인 복실이. 나무를 자르는 대신 츄르 포장지를 자른다.',
  },
  {
    id: 'space',
    name: '우주 복실이',
    emoji: '🚀',
    price: '1000000000000000000000000000000000000000000000000000000000000',
    rarity: 'mythic',
    description: '우주복을 입고 별을 정복했다. 중력이 없어도 뛰어다닌다.',
  },
  {
    id: 'god',
    name: '신 복실이',
    emoji: '⚡',
    price: '10000000000000000000000000000000000000000000000000000000000000000',
    rarity: 'mythic',
    description: '복실이 신화의 정점. 번개를 두른 채 모든 츄르를 관장한다.',
  },
  {
    id: 'trumpeter',
    name: '트럼페터 복실이',
    emoji: '🎺',
    price: '100000000000000000000000000000000000000000000000000000000000000000000',
    rarity: 'mythic',
    description: '황금 트럼펫으로 승리의 팡파르를 연주한다. 야옹도 화음이 맞는다.',
  },
  {
    id: 'hellchang',
    name: '헬창 복실이',
    emoji: '💪',
    price: '1000000000000000000000000000000000000000000000000000000000000000000000000',
    rarity: 'mythic',
    description: '1대수원짜리 근육의 정수. 벤치프레스 대신 주인님을 들어 올린다.',
  },
];

const RARITY_LABELS = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
  mythic: '신화',
};

const TOTAL_SHOP_ITEMS = SHOP_ITEMS.length;
const BOKSIL_IMAGE_DIR = '/images/boksil';

function getBoksilImageUrl(itemId) {
  return `${BOKSIL_IMAGE_DIR}/${itemId}.png`;
}

function parsePrice(price) {
  if (typeof price === 'bigint') return price;
  if (typeof price === 'string') return BigInt(price);
  return BigInt(Math.floor(price));
}

function canAfford(cash, price) {
  return BigInt(Math.floor(cash)) >= parsePrice(price);
}

const STARTING_CASH = 10000000;
const INITIAL_PRICE = 1000;
const MIN_NICKNAME_LENGTH = 2;
const MAX_NICKNAME_LENGTH = 12;

let data = null;
let saveTimer = null;

function defaultData() {
  const initialPrice = INITIAL_PRICE;
  return {
    users: {},
    userItems: {},
    market: {
      currentPrice: initialPrice,
      previousPrice: initialPrice,
      lastEvent: 'normal',
      lastEventMessage: '복실코인 상장!',
      updatedAt: new Date().toISOString(),
    },
    priceHistory: [
      { price: initialPrice, changePct: 0, eventType: 'normal', eventMessage: '복실코인 상장!', recordedAt: new Date().toISOString() },
    ],
  };
}

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      data = JSON.parse(raw);
    } else {
      data = defaultData();
      saveData(true);
    }
  } catch {
    data = defaultData();
    saveData(true);
  }
}

function saveData(immediate = false) {
  if (immediate) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  }, 100);
}

function initDb() {
  loadData();
}

function validateNickname(nickname) {
  const trimmed = nickname.trim();
  if (trimmed.length < MIN_NICKNAME_LENGTH || trimmed.length > MAX_NICKNAME_LENGTH) {
    throw new Error(`닉네임은 ${MIN_NICKNAME_LENGTH}~${MAX_NICKNAME_LENGTH}자여야 합니다.`);
  }
  if (!/^[\w가-힣]+$/.test(trimmed)) {
    throw new Error('닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.');
  }
  return trimmed;
}

function createUser(nickname, password) {
  const trimmed = validateNickname(nickname);
  validatePassword(password);

  const existing = Object.values(data.users).find((u) => u.nickname === trimmed);
  if (existing) {
    throw new Error('이미 사용 중인 닉네임입니다.');
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  data.users[id] = {
    id,
    nickname: trimmed,
    passwordHash: hashPassword(password),
    cash: STARTING_CASH,
    bxc: 0,
    bxcCost: 0,
    createdAt: now,
    lastSeen: now,
  };
  data.userItems[id] = ['default'];
  saveData();
  return getUserById(id);
}

function ensureDefaultItem(userId) {
  if (!data.userItems[userId]) {
    data.userItems[userId] = ['default'];
    saveData();
    return;
  }
  if (!data.userItems[userId].includes('default')) {
    data.userItems[userId].unshift('default');
    saveData();
  }
}

function authenticateUser(nickname, password) {
  const trimmed = validateNickname(nickname);
  validatePassword(password);

  const existing = Object.values(data.users).find((u) => u.nickname === trimmed);

  if (!existing) {
    return createUser(trimmed, password);
  }

  if (!existing.passwordHash) {
    existing.passwordHash = hashPassword(password);
    saveData();
    return getUserById(existing.id);
  }

  if (!verifyPassword(password, existing.passwordHash)) {
    throw new Error('비밀번호가 일치하지 않습니다.');
  }

  return getUserById(existing.id);
}

function getUserById(id) {
  const user = data.users[id];
  if (!user) return null;
  ensureDefaultItem(id);
  const { passwordHash, ...safeUser } = user;
  const items = data.userItems[id] || [];
  return {
    ...safeUser,
    items,
    collectionCount: items.length,
    collectionTotal: TOTAL_SHOP_ITEMS,
    collectionPct: Math.round((items.length / TOTAL_SHOP_ITEMS) * 100),
  };
}

function getUserByNickname(nickname) {
  const user = Object.values(data.users).find((u) => u.nickname === nickname.trim());
  if (!user) return null;
  return getUserById(user.id);
}

function updateLastSeen(userId) {
  if (data.users[userId]) {
    data.users[userId].lastSeen = new Date().toISOString();
    saveData();
  }
}

function getCashRankings(limit = 20) {
  return Object.values(data.users)
    .sort((a, b) => b.cash - a.cash)
    .slice(0, limit)
    .map(({ nickname, cash, bxc }) => ({ nickname, cash, bxc }));
}

function getCollectionRankings(limit = 20) {
  return Object.values(data.users)
    .map((user) => {
      ensureDefaultItem(user.id);
      const count = (data.userItems[user.id] || []).length;
      return {
        nickname: user.nickname,
        collectionCount: count,
        collectionTotal: TOTAL_SHOP_ITEMS,
        collectionPct: Math.round((count / TOTAL_SHOP_ITEMS) * 100),
      };
    })
    .sort((a, b) => {
      if (b.collectionPct !== a.collectionPct) return b.collectionPct - a.collectionPct;
      if (b.collectionCount !== a.collectionCount) return b.collectionCount - a.collectionCount;
      return a.nickname.localeCompare(b.nickname, 'ko');
    })
    .slice(0, limit);
}

function getRankings(limit = 20) {
  return {
    cash: getCashRankings(limit),
    collection: getCollectionRankings(limit),
  };
}

function getMarketState() {
  return {
    current_price: data.market.currentPrice,
    previous_price: data.market.previousPrice,
    last_event: data.market.lastEvent,
    last_event_message: data.market.lastEventMessage,
    updated_at: data.market.updatedAt,
  };
}

function updateMarketState(price, previousPrice, eventType, eventMessage) {
  const changePct = previousPrice > 0 ? ((price - previousPrice) / previousPrice) * 100 : 0;

  data.market = {
    currentPrice: price,
    previousPrice,
    lastEvent: eventType,
    lastEventMessage: eventMessage,
    updatedAt: new Date().toISOString(),
  };

  data.priceHistory.push({
    price,
    changePct,
    eventType,
    eventMessage,
    recordedAt: new Date().toISOString(),
  });

  if (data.priceHistory.length > 500) {
    data.priceHistory = data.priceHistory.slice(-500);
  }

  saveData();
  return { price, changePct, eventType, eventMessage };
}

function getPriceHistory(limit = 100) {
  return data.priceHistory.slice(-limit).map((h) => ({
    price: h.price,
    change_pct: h.changePct,
    event_type: h.eventType,
    event_message: h.eventMessage,
    recorded_at: h.recordedAt,
  }));
}

function executeTrade(userId, type, percent) {
  const user = data.users[userId];
  if (!user) throw new Error('사용자를 찾을 수 없습니다.');

  const price = data.market.currentPrice;
  const pct = percent / 100;

  if (type === 'buy') {
    const spendAmount = user.cash * pct;
    if (spendAmount <= 0) {
      throw new Error('매수할 현금이 없습니다.');
    }
    const bxcAmount = spendAmount / price;
    user.cash -= spendAmount;
    user.bxc += bxcAmount;
    user.bxcCost = (user.bxcCost || 0) + spendAmount;
    saveData();
    return { type: 'buy', spent: spendAmount, bxcGained: bxcAmount, price };
  }

  if (type === 'sell') {
    const sellBxc = user.bxc * pct;
    if (sellBxc <= 0) {
      throw new Error('매도할 BXC가 없습니다.');
    }
    const costBasis = user.bxcCost || 0;
    const costSold = user.bxc > 0 ? costBasis * (sellBxc / user.bxc) : 0;
    const gainAmount = sellBxc * price;
    user.cash += gainAmount;
    user.bxc -= sellBxc;
    user.bxcCost = costBasis - costSold;
    saveData();
    return { type: 'sell', bxcSold: sellBxc, gained: gainAmount, price };
  }

  throw new Error('잘못된 거래 유형입니다.');
}

function purchaseItem(userId, itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) throw new Error('존재하지 않는 아이템입니다.');
  if (item.starter || parsePrice(item.price) === 0n) {
    throw new Error('구매할 수 없는 아이템입니다.');
  }

  const items = data.userItems[userId] || [];
  if (items.includes(itemId)) throw new Error('이미 보유한 아이템입니다.');

  const user = data.users[userId];
  if (!user) throw new Error('사용자를 찾을 수 없습니다.');
  if (!canAfford(user.cash, item.price)) throw new Error('현금이 부족합니다.');

  const price = parsePrice(item.price);
  const cash = BigInt(Math.floor(user.cash));
  user.cash = Number(cash - price);
  data.userItems[userId].push(itemId);
  saveData();
  return item;
}

function getShopItems() {
  return SHOP_ITEMS.map((item) => ({
    ...item,
    image: getBoksilImageUrl(item.id),
    rarityLabel: RARITY_LABELS[item.rarity],
  }));
}

module.exports = {
  initDb,
  createUser,
  authenticateUser,
  getUserById,
  getUserByNickname,
  updateLastSeen,
  getRankings,
  getCashRankings,
  getCollectionRankings,
  TOTAL_SHOP_ITEMS,
  getMarketState,
  updateMarketState,
  getPriceHistory,
  executeTrade,
  purchaseItem,
  getShopItems,
  SHOP_ITEMS,
  RARITY_LABELS,
  STARTING_CASH,
  INITIAL_PRICE,
};
