const { getMarketState, updateMarketState } = require('./db');

const MIN_PRICE = 1;
const EQUILIBRIUM_PRICE = 100_000_000; // 1억 원
const MEAN_REVERSION_RATE = 0.06; // tick마다 1억까지 남은 log 거리의 6% 회귀
const TICK_INTERVAL_MS = 1000;
const RARE_EVENT_CHANCE = 0.001;

const RARE_EVENTS = {
  pump100: {
    type: 'pump100',
    message: () => '🚀 100배 펌프! 복실이 밈이 전 세계를 강타!',
    apply: (price) => price * (50 + Math.random() * 50),
  },
  rugpull: {
    type: 'rugpull',
    message: () => '💀 러그풀! 개발자가 사라졌다... 잠깐, 복실이가 돌아왔다!',
    apply: (price) => price * (0.001 + Math.random() * 0.009),
  },
};

const EVENTS = [
  {
    type: 'normal',
    weight: 75,
    message: () => '시장이 조용히 움직이고 있습니다.',
    apply: (price) => {
      const change = Math.random() * 0.3 - 0.15;
      return price * (1 + change);
    },
  },
  {
    type: 'bullish',
    weight: 7,
    message: () => '📈 대형 호재! 복실이가 글로벌 브랜드와 제휴했다!',
    apply: (price) => price * (1.5 + Math.random() * 1.5),
  },
  {
    type: 'bearish',
    weight: 7,
    message: () => '📉 대형 악재! 복실이 스캔들이 터졌다!',
    apply: (price) => price * (0.1 + Math.random() * 0.6),
  },
  {
    type: 'moon',
    weight: 3,
    message: () => '🌙 TO THE MOON! 복실이가 달로 간다!',
    apply: (price) => price * (3 + Math.random() * 8),
  },
  {
    type: 'delist',
    weight: 3,
    message: () => '⚠️ 상장폐지 위기! 거래소가 BXC 상장폐지를 검토 중!',
    apply: (price) => price * 0.05,
  },
];

function pickEvent() {
  const totalWeight = EVENTS.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const event of EVENTS) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }

  return EVENTS[0];
}

function pickRareEvent() {
  const roll = Math.random();

  if (roll < RARE_EVENT_CHANCE) return RARE_EVENTS.pump100;
  if (roll < RARE_EVENT_CHANCE * 2) return RARE_EVENTS.rugpull;

  return null;
}

function clampPrice(price) {
  return Math.max(MIN_PRICE, Math.round(price));
}

function applyMeanReversion(price) {
  const safe = Math.max(price, MIN_PRICE);
  const logTarget = Math.log(EQUILIBRIUM_PRICE);
  const logPrice = Math.log(safe);
  const logNext = logPrice + (logTarget - logPrice) * MEAN_REVERSION_RATE;
  let next = Math.exp(logNext);

  // ₩1 바닥에서 반올림으로 회귀가 막히지 않도록 최소 상승 보장
  if (Math.round(next) <= MIN_PRICE && EQUILIBRIUM_PRICE > MIN_PRICE) {
    next = MIN_PRICE + 1;
  }

  return next;
}

async function tickPrice() {
  const market = await getMarketState();
  const previousPrice = Number(market.current_price);
  const event = pickRareEvent() || pickEvent();
  const rawPrice = event.apply(previousPrice);
  const revertedPrice = applyMeanReversion(rawPrice);
  const newPrice = clampPrice(revertedPrice);
  const message = event.message();

  const result = await updateMarketState(newPrice, previousPrice, event.type, message);

  return {
    price: newPrice,
    previousPrice,
    changePct: result.changePct,
    eventType: event.type,
    eventMessage: message,
  };
}

function startPriceEngine(io) {
  const interval = setInterval(async () => {
    try {
      const update = await tickPrice();
      io.emit('price:update', update);
    } catch (err) {
      console.error('가격 엔진 오류:', err.message);
    }
  }, TICK_INTERVAL_MS);

  return () => clearInterval(interval);
}

async function getCurrentPriceInfo() {
  const market = await getMarketState();
  const currentPrice = Number(market.current_price);
  const previousPrice = Number(market.previous_price);

  const changePct = previousPrice > 0
    ? ((currentPrice - previousPrice) / previousPrice) * 100
    : 0;

  return {
    price: currentPrice,
    previousPrice,
    changePct,
    eventType: market.last_event,
    eventMessage: market.last_event_message,
  };
}

module.exports = {
  MIN_PRICE,
  EQUILIBRIUM_PRICE,
  TICK_INTERVAL_MS,
  tickPrice,
  startPriceEngine,
  getCurrentPriceInfo,
};