const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { validatePassword, hashPassword, verifyPassword } = require('./auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
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
    id: 'avocado',
    name: '아보카도 복실이',
    emoji: '🥑',
    price: '602214076000000000000000',
    rarity: 'epic',
    description: '아보가드로 수만큼 비싼 슈퍼푸드. 건강에는 좋지만 지갑엔 치명적이다.',
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
    description: '1000무량대수원짜리 근육의 정수. 벤치프레스 대신 주인님을 들어 올린다.',
  },
  {
    id: 'captain',
    name: '대장 복실이',
    emoji: '🎖️',
    price: '10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    rarity: 'mythic',
    description: '1구골원짜리 복실이계의 최종 보스. 모든 복실이가 경례하는 유일한 대장.',
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

const STARTING_CASH = 10000000;
const INITIAL_PRICE = 1000;
const MIN_NICKNAME_LENGTH = 2;
const MAX_NICKNAME_LENGTH = 12;
const ALLOWED_TRADE_PERCENTS = [10, 25, 50, 100];
const MAX_CHAT_LENGTH = 200;
const CHAT_HISTORY_LIMIT = 100;
const CHAT_DB_LIMIT = 300;

function validateTradePercent(percent) {
  const pct = Number(percent);
  if (!Number.isFinite(pct) || !ALLOWED_TRADE_PERCENTS.includes(pct)) {
    throw new Error('잘못된 거래 비율입니다.');
  }
  return pct;
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

async function initDb() {
  await pool.query(`
    create table if not exists chat_messages (
      id text primary key default gen_random_uuid()::text,
      user_id text not null references users(id) on delete cascade,
      nickname text not null,
      message text not null,
      created_at timestamptz not null default now()
    )
  `);

  await pool.query(`
    create index if not exists chat_messages_created_at_idx
    on chat_messages (created_at desc)
  `);

  await pool.query(
    `insert into market
    (id, current_price, previous_price, last_event, last_event_message)
    values (1, $1, $1, 'normal', '복실코인 상장!')
    on conflict (id) do nothing`,
    [INITIAL_PRICE]
  );

  await pool.query(
    `insert into price_history
    (price, change_pct, event_type, event_message)
    select $1, 0, 'normal', '복실코인 상장!'
    where not exists (select 1 from price_history)`,
    [INITIAL_PRICE]
  );
}

function normalizeUser(row, items = []) {
  if (!row) return null;

  return {
    id: row.id,
    nickname: row.nickname,
    cash: Number(row.cash),
    bxc: Number(row.bxc),
    bxcCost: Number(row.bxc_cost),
    createdAt: row.created_at,
    lastSeen: row.last_seen,
    items,
    collectionCount: items.length,
    collectionTotal: TOTAL_SHOP_ITEMS,
    collectionPct: Math.round((items.length / TOTAL_SHOP_ITEMS) * 100),
  };
}

async function ensureDefaultItem(userId) {
  await pool.query(
    `insert into user_items (user_id, item_id)
    values ($1, 'default')
    on conflict do nothing`,
    [userId]
  );
}

async function getUserItems(userId) {
  await ensureDefaultItem(userId);

  const result = await pool.query(
    `select item_id from user_items where user_id = $1 order by item_id`,
    [userId]
  );

  return result.rows.map((row) => row.item_id);
}

async function createUser(nickname, password) {
  const trimmed = validateNickname(nickname);
  validatePassword(password);

  const existing = await pool.query(
    `select id from users where nickname = $1`,
    [trimmed]
  );

  if (existing.rows.length > 0) {
    throw new Error('이미 사용 중인 닉네임입니다.');
  }

  const id = uuidv4();
  const passwordHash = hashPassword(password);

  await pool.query(
    `insert into users
    (id, nickname, password_hash, cash, bxc, bxc_cost)
    values ($1, $2, $3, $4, 0, 0)`,
    [id, trimmed, passwordHash, STARTING_CASH]
  );

  await ensureDefaultItem(id);

  return getUserById(id);
}

async function authenticateUser(nickname, password) {
  const trimmed = validateNickname(nickname);
  validatePassword(password);

  const result = await pool.query(
    `select * from users where nickname = $1`,
    [trimmed]
  );

  const existing = result.rows[0];

  if (!existing) {
    return createUser(trimmed, password);
  }

  if (!verifyPassword(password, existing.password_hash)) {
    throw new Error('비밀번호가 일치하지 않습니다.');
  }

  return getUserById(existing.id);
}

async function getUserById(id) {
  const result = await pool.query(
    `select * from users where id = $1`,
    [id]
  );

  const user = result.rows[0];
  if (!user) return null;

  const items = await getUserItems(id);
  return normalizeUser(user, items);
}

async function getUserByNickname(nickname) {
  const trimmed = nickname.trim();

  const result = await pool.query(
    `select id from users where nickname = $1`,
    [trimmed]
  );

  const user = result.rows[0];
  if (!user) return null;

  return getUserById(user.id);
}

async function updateLastSeen(userId) {
  await pool.query(
    `update users set last_seen = now() where id = $1`,
    [userId]
  );
}

const CASH_RANKING_MIN = 10000000;

async function getCashRankings(limit = 20) {
  const result = await pool.query(
    `select nickname, cash, bxc
    from users
    where cash > $1
    order by cash desc
    limit $2`,
    [CASH_RANKING_MIN, limit]
  );

  return result.rows.map((row) => ({
    nickname: row.nickname,
    cash: Number(row.cash),
    bxc: Number(row.bxc),
  }));
}

async function getCollectionRankings(limit = 20) {
  const result = await pool.query(
    `select
      u.nickname,
      count(ui.item_id)::int as collection_count
    from users u
    left join user_items ui on u.id = ui.user_id
    group by u.id, u.nickname
    order by collection_count desc, u.nickname asc
    limit $1`,
    [limit]
  );

  return result.rows.map((row) => {
    const count = Number(row.collection_count);

    return {
      nickname: row.nickname,
      collectionCount: count,
      collectionTotal: TOTAL_SHOP_ITEMS,
      collectionPct: Math.round((count / TOTAL_SHOP_ITEMS) * 100),
    };
  });
}

async function getRankings(limit = 20) {
  return {
    cash: await getCashRankings(limit),
    collection: await getCollectionRankings(limit),
  };
}

async function getMarketState() {
  const result = await pool.query(
    `select * from market where id = 1`
  );

  const market = result.rows[0];

  return {
    current_price: Number(market.current_price),
    previous_price: Number(market.previous_price),
    last_event: market.last_event,
    last_event_message: market.last_event_message,
    updated_at: market.updated_at,
  };
}

async function updateMarketState(price, previousPrice, eventType, eventMessage) {
  const changePct = previousPrice > 0
    ? ((price - previousPrice) / previousPrice) * 100
    : 0;

  await pool.query(
    `update market
    set current_price = $1,
        previous_price = $2,
        last_event = $3,
        last_event_message = $4,
        updated_at = now()
    where id = 1`,
    [price, previousPrice, eventType, eventMessage]
  );

  await pool.query(
    `insert into price_history
    (price, change_pct, event_type, event_message)
    values ($1, $2, $3, $4)`,
    [price, changePct, eventType, eventMessage]
  );

  await pool.query(
    `delete from price_history
    where id not in (
      select id from price_history
      order by recorded_at desc
      limit 500
    )`
  );

  return { price, changePct, eventType, eventMessage };
}

async function getPriceHistory(limit = 100) {
  const result = await pool.query(
    `select price, change_pct, event_type, event_message, recorded_at
    from price_history
    order by recorded_at desc
    limit $1`,
    [limit]
  );

  return result.rows.reverse().map((row) => ({
    price: Number(row.price),
    change_pct: Number(row.change_pct),
    event_type: row.event_type,
    event_message: row.event_message,
    recorded_at: row.recorded_at,
  }));
}

async function executeTrade(userId, type, percent) {
  if (type !== 'buy' && type !== 'sell') {
    throw new Error('잘못된 거래 유형입니다.');
  }

  const validatedPercent = validateTradePercent(percent);
  const client = await pool.connect();

  try {
    await client.query('begin');

    const userResult = await client.query(
      `select * from users where id = $1 for update`,
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');

    const marketResult = await client.query(
      `select current_price from market where id = 1`
    );

    const price = Number(marketResult.rows[0].current_price);
    const cash = Number(user.cash);
    const bxc = Number(user.bxc);
    const bxcCost = Number(user.bxc_cost);
    const pct = validatedPercent / 100;

    if (type === 'buy') {
      const spendAmount = cash * pct;

      if (spendAmount <= 0 || spendAmount > cash) {
        throw new Error('매수할 현금이 없습니다.');
      }

      const bxcAmount = spendAmount / price;

      await client.query(
        `update users
        set cash = cash - $1,
            bxc = bxc + $2,
            bxc_cost = bxc_cost + $1
        where id = $3`,
        [spendAmount, bxcAmount, userId]
      );

      await client.query('commit');
      return { type: 'buy', spent: spendAmount, bxcGained: bxcAmount, price, percent: validatedPercent };
    }

    if (type === 'sell') {
      const sellBxc = bxc * pct;

      if (sellBxc <= 0 || sellBxc > bxc) {
        throw new Error('매도할 BXC가 없습니다.');
      }

      const costSold = bxc > 0 ? bxcCost * (sellBxc / bxc) : 0;
      const gainAmount = sellBxc * price;

      await client.query(
        `update users
        set cash = cash + $1,
            bxc = bxc - $2,
            bxc_cost = bxc_cost - $3
        where id = $4`,
        [gainAmount, sellBxc, costSold, userId]
      );

      await client.query('commit');
      return { type: 'sell', bxcSold: sellBxc, gained: gainAmount, price, percent: validatedPercent };
    }
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

async function purchaseItem(userId, itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) throw new Error('존재하지 않는 아이템입니다.');

  const itemPrice = item.price.toString();

  if (item.starter || itemPrice === '0') {
    throw new Error('구매할 수 없는 아이템입니다.');
  }

  const client = await pool.connect();

  try {
    await client.query('begin');

    const owned = await client.query(
      `select 1 from user_items where user_id = $1 and item_id = $2`,
      [userId, itemId]
    );

    if (owned.rows.length > 0) {
      throw new Error('이미 보유한 아이템입니다.');
    }

    const userResult = await client.query(
      `select cash from users where id = $1 for update`,
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');

    const affordResult = await client.query(
      `select ($1::numeric >= $2::numeric) as can_afford`,
      [user.cash, itemPrice]
    );

    if (!affordResult.rows[0].can_afford) {
      throw new Error('현금이 부족합니다.');
    }

    await client.query(
      `update users
      set cash = cash - $1::numeric
      where id = $2`,
      [itemPrice, userId]
    );

    await client.query(
      `insert into user_items (user_id, item_id)
      values ($1, $2)`,
      [userId, itemId]
    );

    await client.query('commit');
    return item;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

function validateChatMessage(message) {
  const trimmed = message.trim();

  if (!trimmed) {
    throw new Error('메시지를 입력해주세요.');
  }

  if (trimmed.length > MAX_CHAT_LENGTH) {
    throw new Error(`메시지는 ${MAX_CHAT_LENGTH}자 이하여야 합니다.`);
  }

  return trimmed;
}

async function getRecentChatMessages() {
  const result = await pool.query(
    `select id, user_id, nickname, message, created_at
    from chat_messages
    order by created_at desc
    limit $1`,
    [CHAT_HISTORY_LIMIT]
  );

  return result.rows
    .reverse()
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      nickname: row.nickname,
      text: row.message,
      createdAt: row.created_at,
    }));
}

async function saveChatMessage(userId, nickname, message) {
  const trimmed = validateChatMessage(message);

  const result = await pool.query(
    `insert into chat_messages (user_id, nickname, message)
    values ($1, $2, $3)
    returning id, user_id, nickname, message, created_at`,
    [userId, nickname, trimmed]
  );

  await pool.query(
    `with ranked as (
      select id, row_number() over (order by created_at desc) as rn
      from chat_messages
    )
    delete from chat_messages
    where id in (
      select id from ranked where rn > $1
    )`,
    [CHAT_DB_LIMIT]
  );

  const row = result.rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    text: row.message,
    createdAt: row.created_at,
  };
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
  getRecentChatMessages,
  saveChatMessage,
  MAX_CHAT_LENGTH,
  SHOP_ITEMS,
  RARITY_LABELS,
  STARTING_CASH,
  INITIAL_PRICE,
};