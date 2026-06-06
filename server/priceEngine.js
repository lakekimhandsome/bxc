const { getMarketState, updateMarketState } = require('./db');

const MIN_PRICE = 1000;
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

function tickPrice() {
  const market = getMarketState();
  const previousPrice = market.current_price;
  const event = pickRareEvent() || pickEvent();
  const rawPrice = event.apply(previousPrice);
  const newPrice = clampPrice(rawPrice);
  const message = event.message();

  const result = updateMarketState(newPrice, previousPrice, event.type, message);

  return {
    price: newPrice,
    previousPrice,
    changePct: result.changePct,
    eventType: event.type,
    eventMessage: message,
  };
}

function startPriceEngine(io) {
  const interval = setInterval(() => {
    const update = tickPrice();
    io.emit('price:update', update);
  }, TICK_INTERVAL_MS);

  return () => clearInterval(interval);
}

function getCurrentPriceInfo() {
  const market = getMarketState();
  const changePct = market.previous_price > 0
    ? ((market.current_price - market.previous_price) / market.previous_price) * 100
    : 0;

  return {
    price: market.current_price,
    previousPrice: market.previous_price,
    changePct,
    eventType: market.last_event,
    eventMessage: market.last_event_message,
  };
}

module.exports = {
  MIN_PRICE,
  TICK_INTERVAL_MS,
  tickPrice,
  startPriceEngine,
  getCurrentPriceInfo,
};
