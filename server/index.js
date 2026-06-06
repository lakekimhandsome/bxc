const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const {
  initDb,
  authenticateUser,
  getUserById,
  updateLastSeen,
  getRankings,
  getPriceHistory,
  executeTrade,
  purchaseItem,
  getShopItems,
  STARTING_CASH,
} = require('./db');

const { startPriceEngine, getCurrentPriceInfo } = require('./priceEngine');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', game: '복실코인(BXC)' });
});

app.post('/api/login', async (req, res) => {
  try {
    const { nickname, password, userId } = req.body;

    let user;

    if (userId) {
      user = await getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: '세션이 만료되었습니다. 다시 로그인해주세요.' });
      }
    } else if (nickname && password) {
      user = await authenticateUser(nickname, password);
    } else {
      return res.status(400).json({ error: '닉네임과 비밀번호를 입력해주세요.' });
    }

    await updateLastSeen(user.id);

    const priceInfo = await getCurrentPriceInfo();

    res.json({
      user: formatUser(user, priceInfo.price),
      price: priceInfo,
      rankings: await getRankings(),
      priceHistory: await getPriceHistory(),
      shopItems: getShopItems(),
      startingCash: STARTING_CASH,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/rankings', async (_req, res) => {
  try {
    const rankings = await getRankings();
    res.json({ rankings: rankings.cash, collectionRankings: rankings.collection });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shop', (_req, res) => {
  res.json({ items: getShopItems() });
});

const sessions = new Map();

io.on('connection', (socket) => {
  socket.on('auth', async ({ userId }) => {
    try {
      const user = await getUserById(userId);

      if (!user) {
        socket.emit('error', { message: '인증 실패' });
        return;
      }

      sessions.set(socket.id, userId);
      await updateLastSeen(userId);

      const priceInfo = await getCurrentPriceInfo();

      socket.emit('init', {
        user: formatUser(user, priceInfo.price),
        price: priceInfo,
        rankings: await getRankings(),
        priceHistory: await getPriceHistory(),
        shopItems: getShopItems(),
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('trade', async ({ type, percent }) => {
    const userId = sessions.get(socket.id);

    if (!userId) {
      socket.emit('error', { message: '로그인이 필요합니다.' });
      return;
    }

    try {
      const result = await executeTrade(userId, type, percent);
      const user = await getUserById(userId);
      const priceInfo = await getCurrentPriceInfo();

      socket.emit('trade:success', {
        result,
        user: formatUser(user, priceInfo.price),
      });

      io.emit('rankings:update', {
        rankings: await getRankings(),
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('shop:buy', async ({ itemId }) => {
    const userId = sessions.get(socket.id);

    if (!userId) {
      socket.emit('error', { message: '로그인이 필요합니다.' });
      return;
    }

    try {
      const item = await purchaseItem(userId, itemId);
      const user = await getUserById(userId);
      const priceInfo = await getCurrentPriceInfo();

      socket.emit('shop:success', {
        item,
        user: formatUser(user, priceInfo.price),
      });

      io.emit('rankings:update', {
        rankings: await getRankings(),
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    sessions.delete(socket.id);
  });
});

function formatUser(user, currentPrice) {
  const bxcValue = user.bxc * currentPrice;
  const bxcCost = user.bxcCost || 0;
  const avgBuyPrice = user.bxc > 0 ? bxcCost / user.bxc : 0;
  const bxcProfit = bxcValue - bxcCost;

  const bxcProfitRate = avgBuyPrice > 0
    ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100
    : 0;

  const totalAssets = user.cash + bxcValue;

  return {
    id: user.id,
    nickname: user.nickname,
    cash: user.cash,
    bxc: user.bxc,
    bxcCost,
    avgBuyPrice,
    bxcValue,
    bxcProfit,
    bxcProfitRate,
    totalAssets,
    items: user.items,
    collectionCount: user.collectionCount,
    collectionTotal: user.collectionTotal,
    collectionPct: user.collectionPct,
  };
}

async function startServer() {
  try {
    await initDb();

    startPriceEngine(io);

    setInterval(async () => {
      try {
        io.emit('rankings:update', {
          rankings: await getRankings(),
        });
      } catch (err) {
        console.error('랭킹 업데이트 오류:', err.message);
      }
    }, 10000);

    server.listen(PORT, () => {
      console.log(`🐱 복실코인(BXC) 서버 실행 중: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('서버 시작 실패:', err);
    process.exit(1);
  }
}

startServer();

//meow