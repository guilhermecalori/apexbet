import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import {
  Home, Gamepad2, Rocket, Trophy, ShieldAlert,
  CheckCircle2, ArrowUpRight, ArrowDownLeft,
  Bomb, Diamond, Volume2, VolumeX, Copy,
  ChevronLeft, Users, Receipt, Zap, RotateCw,
  Lock, Eye, EyeOff, ShieldCheck, Loader2, Send,
  LogOut, UserCheck, AlertCircle, Search, Flame,
  Crown, Tv, Headphones, Wallet, ChevronRight, Play,
  Maximize2, RefreshCw, Info, User, TrendingUp,
  TrendingDown, BarChart3, Award, Layers, X, Activity
} from 'lucide-react';
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.hostname.startsWith('192.168.');
const SOCKET_URL = isLocal ? `http://${window.location.hostname}:3001` : 'https://apexbet-t7o2.onrender.com';
const socket = io(SOCKET_URL);
const buildPragmaticDemoUrl = (symbol) =>
  `https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=${symbol}&websiteUrl=https%3A%2F%2Fdemogamesfree.pragmaticplay.net&jurisdiction=99&lobby_url=https%3A%2F%2Fwww.pragmaticplay.com%2Fbr%2F&lang=PT&cur=BRL`;

// --- ÁUDIO SINTETIZADO ---
const soundFX = {
  enabled: true,
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },
  play(freq, type = 'sine', duration = 0.12, gainVal = 0.08) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  click() { this.play(540, 'triangle', 0.05, 0.05); },
  reelStop() { this.play(260, 'sine', 0.08, 0.09); },
  gem(step = 1) { this.play(480 + step * 65, 'sine', 0.18, 0.1); },
  bomb() { this.play(110, 'sawtooth', 0.45, 0.15); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.play(f, 'triangle', 0.22, 0.1), i * 80);
    });
  }
};

// --- CAPAS ILUSTRADAS FALLBACK ---
function RichPosterArt({ theme }) {
  switch (theme) {
    case 'tiger':
      return (
        <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <radialGradient id="bgTiger" cx="50%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="48%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#2a0606" />
            </radialGradient>
          </defs>
          <rect width="300" height="400" fill="url(#bgTiger)" />
          <circle cx="150" cy="176" r="78" fill="#f97316" stroke="#fef08a" strokeWidth="4" />
        </svg>
      );
    case 'crash':
      return (
        <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <rect width="300" height="400" fill="#2b0712" />
          <path d="M25 256 Q145 240 245 110" fill="none" stroke="#f43f5e" strokeWidth="10" strokeLinecap="round" />
        </svg>
      );
    case 'mines':
      return (
        <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <rect width="300" height="400" fill="#082f49" />
          <polygon points="150,86 228,150 150,256 72,150" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <rect width="300" height="400" fill="#1e1b4b" />
          <circle cx="150" cy="176" r="78" fill="#0f172a" stroke="#a855f7" strokeWidth="6" />
          <polygon points="150,140 159,164 185,164 164,179 172,204 150,189 128,204 136,179 115,164 141,164" fill="#ffffff" />
        </svg>
      );
  }
}

function GameCoverArt({ game, customCover, sizeClass }) {
  const candidates = [
    customCover,
    `/covers/${game?.id}.jpg`,
    `/covers/${game?.id}.png`,
    `/covers/${game?.id}.webp`
  ].filter(Boolean);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [game?.id, customCover]);

  if (idx < candidates.length) {
    return (
      <img
        src={candidates[idx]}
        alt={game?.title}
        onError={() => setIdx((prev) => prev + 1)}
        className={sizeClass || 'w-full h-full object-cover'}
      />
    );
  }

  return (
    <div className={sizeClass || 'w-full h-full'}>
      <RichPosterArt theme={game?.theme || 'tiger'} />
    </div>
  );
}

function ThemedSlotSymbol({ type, theme }) {
  const mainChar = {
    ox: '🐂',
    rabbit: '🐇',
    dragon: '🐉',
    mouse: '🐭',
    bandito: '💀'
  }[theme];

  switch (type) {
    case 'TIGER':
      if (mainChar) {
        return (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-red-700 border-2 border-yellow-200 flex flex-col items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.65)]">
            <span className="text-2xl leading-none">{mainChar}</span>
            <span className="text-[9px] font-black text-slate-950 mt-0.5">50X</span>
          </div>
        );
      }
      return (
        <svg viewBox="0 0 64 64" className="w-14 h-14 drop-shadow-[0_0_10px_rgba(245,158,11,0.75)]">
          <defs>
            <linearGradient id="tigerGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#tigerGrad)" stroke="#fef9c3" strokeWidth="2.5" />
          <path d="M17 24 L26 28 L17 32 Z M47 24 L38 28 L47 32 Z" fill="#78350f" />
          <path d="M23 41 Q32 48 41 41" stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <text x="32" y="21" textAnchor="middle" fill="#78350f" fontSize="11" fontWeight="900">王</text>
        </svg>
      );
    case 'INGOT':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow">
          <path d="M10 38 L19 21 L45 21 L54 38 L45 47 L19 47 Z" fill="#f59e0b" stroke="#fde047" strokeWidth="2.5" />
          <ellipse cx="32" cy="23" rx="13" ry="4.5" fill="#fef08a" />
        </svg>
      );
    case 'JADE':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow">
          <circle cx="32" cy="32" r="22" fill="none" stroke="#10b981" strokeWidth="9.5" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="#a7f3d0" strokeWidth="1.5" />
        </svg>
      );
    case 'ENVELOPE':
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow">
          <rect x="15" y="11" width="34" height="42" rx="5" fill="#dc2626" stroke="#fbbf24" strokeWidth="2.5" />
          <circle cx="32" cy="31" r="8" fill="#fbbf24" />
        </svg>
      );
    case 'WILD':
      return (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-amber-500 border-2 border-yellow-300 flex flex-col items-center justify-center shadow-[0_0_14px_rgba(217,70,239,0.5)]">
          <span className="text-[10px] font-black text-white tracking-wider leading-none">WILD</span>
          <span className="text-xs font-black text-yellow-300 leading-none mt-1">100X</span>
        </div>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" className="w-12 h-12">
          <circle cx="32" cy="32" r="22" fill="#eab308" stroke="#fef08a" strokeWidth="2.5" />
          <rect x="24" y="24" width="16" height="16" fill="#854d0e" rx="2" />
        </svg>
      );
  }
}

const SYM_POOL = ['COIN', 'ENVELOPE', 'JADE', 'INGOT', 'TIGER', 'WILD'];

const DOUBLE_ORDER = [
  { num: 0, color: 'white' },
  { num: 11, color: 'black' }, { num: 5, color: 'red' },
  { num: 10, color: 'black' }, { num: 6, color: 'red' },
  { num: 9, color: 'black' }, { num: 7, color: 'red' },
  { num: 8, color: 'black' }, { num: 1, color: 'red' },
  { num: 14, color: 'black' }, { num: 2, color: 'red' },
  { num: 13, color: 'black' }, { num: 3, color: 'red' },
  { num: 12, color: 'black' }, { num: 4, color: 'red' }
];

const GAMES_CATALOG = [
  { id: 'gates-olympus', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20olympgate'), theme: 'olympus', title: 'Gates of Olympus', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.50%', players: '3.890', ringColor: 'border-purple-400/60' },
  { id: 'fortune-tiger', mode: 'slots', theme: 'tiger', title: 'Fortune Tiger', provider: 'PG Soft', badge: 'SALDO REAL', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.81%', players: '3.412', ringColor: 'border-amber-400/60', slotFrameBg: 'from-[#7c1d0b] via-[#3a0d06] to-[#120907]' },
  { id: 'sweet-bonanza', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20fruitsw'), theme: 'sweet', title: 'Sweet Bonanza', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.48%', players: '2.985', ringColor: 'border-pink-400/60' },
  { id: 'gates-olympus-1000', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20olympx'), theme: 'olympus', title: 'Gates of Olympus 1000', provider: 'Pragmatic Play', badge: '1000X', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.50%', players: '2.740', ringColor: 'border-amber-400/60' },
  { id: 'aviator', mode: 'crash', theme: 'crash', title: 'Aviator', provider: 'Spribe', badge: 'SALDO REAL', badgeColor: 'bg-rose-600 text-white', rtp: '97.00%', players: '4.120', ringColor: 'border-rose-500/60' },
  { id: 'sugar-rush', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20sugarrush'), theme: 'sweet', title: 'Sugar Rush', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.50%', players: '2.190', ringColor: 'border-pink-400/60' },
  { id: 'sugar-rush-1000', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20sugarrushx'), theme: 'sweet', title: 'Sugar Rush 1000', provider: 'Pragmatic Play', badge: '1000X', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.53%', players: '2.040', ringColor: 'border-amber-400/60' },
  { id: 'fortune-ox', mode: 'slots', theme: 'ox', title: 'Fortune Ox', provider: 'PG Soft', badge: 'SALDO REAL', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.75%', players: '2.154', ringColor: 'border-red-400/60', slotFrameBg: 'from-[#7f1d1d] via-[#380909] to-[#110808]' },
  { id: 'big-bass', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs10bbbonanza'), theme: 'bass', title: 'Big Bass Bonanza', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.71%', players: '1.820', ringColor: 'border-cyan-400/60' },
  { id: 'big-bass-splash', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs10txbigbass'), theme: 'bass', title: 'Big Bass Splash', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.71%', players: '1.750', ringColor: 'border-sky-400/60' },
  { id: 'starlight-princess', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20starlight'), theme: 'princess', title: 'Starlight Princess', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.50%', players: '1.630', ringColor: 'border-fuchsia-400/60' },
  { id: 'starlight-princess-1000', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20starlightx'), theme: 'princess', title: 'Starlight Princess 1000', provider: 'Pragmatic Play', badge: '1000X', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.50%', players: '1.690', ringColor: 'border-amber-400/60' },
  { id: 'fortune-rabbit', mode: 'slots', theme: 'rabbit', title: 'Fortune Rabbit', provider: 'PG Soft', badge: 'SALDO REAL', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.75%', players: '2.340', ringColor: 'border-fuchsia-400/60', slotFrameBg: 'from-[#701a75] via-[#340a3b] to-[#120816]' },
  { id: 'zeus-hades', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs15godsofwar'), theme: 'olympus', title: 'Zeus vs Hades', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.07%', players: '1.590', ringColor: 'border-indigo-400/60' },
  { id: 'the-dog-house', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20doghouse'), theme: 'doghouse', title: 'The Dog House', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.51%', players: '1.410', ringColor: 'border-amber-400/60' },
  { id: 'the-dog-house-megaways', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vswaysdogs'), theme: 'doghouse', title: 'Dog House Megaways', provider: 'Pragmatic Play', badge: 'MEGAWAYS', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.55%', players: '1.520', ringColor: 'border-amber-400/60' },
  { id: 'sweet-bonanza-1000', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20fruitswx'), theme: 'sweet', title: 'Sweet Bonanza 1000', provider: 'Pragmatic Play', badge: '1000X', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.53%', players: '1.940', ringColor: 'border-pink-400/60' },
  { id: 'fruit-party', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs20fruitparty'), theme: 'sweet', title: 'Fruit Party', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.47%', players: '1.290', ringColor: 'border-pink-400/60' },
  { id: 'wolf-gold', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs25wolfgold'), theme: 'wolf', title: 'Wolf Gold', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.01%', players: '1.180', ringColor: 'border-indigo-400/60' },
  { id: 'wild-west-gold', mode: 'iframe', demoUrl: buildPragmaticDemoUrl('vs40wildwest'), theme: 'cowboy', title: 'Wild West Gold', provider: 'Pragmatic Play', badge: 'OFICIAL', badgeColor: 'bg-[#00e701] text-slate-950', rtp: '96.51%', players: '1.360', ringColor: 'border-amber-400/60' },
  { id: 'mines', mode: 'mines', theme: 'mines', title: 'Mines', provider: 'Originais', badge: 'SALDO REAL', badgeColor: 'bg-sky-400 text-slate-950', rtp: '97.00%', players: '2.610', ringColor: 'border-sky-400/60' },
  { id: 'fortune-dragon', mode: 'slots', theme: 'dragon', title: 'Fortune Dragon', provider: 'PG Soft', badge: 'SALDO REAL', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.74%', players: '1.870', ringColor: 'border-purple-400/60', slotFrameBg: 'from-[#581c87] via-[#2b0947] to-[#11081a]' },
  { id: 'double', mode: 'double', theme: 'double', title: 'Double', provider: 'Originais', badge: 'SALDO REAL', badgeColor: 'bg-purple-500 text-white', rtp: '96.50%', players: '1.940', ringColor: 'border-indigo-400/60' },
  { id: 'fortune-mouse', mode: 'slots', theme: 'mouse', title: 'Fortune Mouse', provider: 'PG Soft', badge: 'SALDO REAL', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.96%', players: '1.410', ringColor: 'border-amber-400/60', slotFrameBg: 'from-[#78350f] via-[#361706] to-[#120b06]' },
  { id: 'wild-bandito', mode: 'slots', theme: 'bandito', title: 'Wild Bandito', provider: 'PG Soft', badge: 'SALDO REAL', badgeColor: 'bg-amber-400 text-slate-950', rtp: '96.73%', players: '1.680', ringColor: 'border-rose-400/60', slotFrameBg: 'from-[#7f1d1d] via-[#360a10] to-[#12070a]' }
];

const PROVIDERS_FILTER = [
  { id: 'all', label: 'Todos os Jogos', count: GAMES_CATALOG.length },
  { id: 'Pragmatic Play', label: 'Pragmatic Play (Oficiais)', count: GAMES_CATALOG.filter((g) => g.provider === 'Pragmatic Play').length },
  { id: 'PG Soft', label: 'PG Soft (Usa Seu Saldo)', count: GAMES_CATALOG.filter((g) => g.provider === 'PG Soft').length },
  { id: 'Spribe', label: 'Spribe (Usa Seu Saldo)', count: GAMES_CATALOG.filter((g) => g.provider === 'Spribe').length },
  { id: 'Originais', label: 'Originais (Usa Seu Saldo)', count: GAMES_CATALOG.filter((g) => g.provider === 'Originais').length }
];

const INITIAL_LIVE_FEED = [
  { id: 1, game: 'Gates of Olympus', provider: 'Pragmatic', user: 'Ped***19', bet: 'R$ 50,00', mult: '15.00x', payout: 'R$ 750,00' },
  { id: 2, game: 'Fortune Tiger', provider: 'PG Soft', user: 'Gui***82', bet: 'R$ 20,00', mult: '8.00x', payout: 'R$ 160,00' },
  { id: 3, game: 'Aviator', provider: 'Spribe', user: 'Luc***99', bet: 'R$ 30,00', mult: '4.20x', payout: 'R$ 126,00' },
  { id: 4, game: 'Sweet Bonanza 1000', provider: 'Pragmatic', user: 'Mat***71', bet: 'R$ 15,00', mult: '12.00x', payout: 'R$ 180,00' },
  { id: 5, game: 'Fortune Ox', provider: 'PG Soft', user: 'Raf***04', bet: 'R$ 25,00', mult: '10.00x', payout: 'R$ 250,00' },
  { id: 6, game: 'Mines', provider: 'Originais', user: 'Bru***33', bet: 'R$ 40,00', mult: '3.45x', payout: 'R$ 138,00' }
];

const RANDOM_FEED_SAMPLES = [
  { game: 'Gates of Olympus 1000', provider: 'Pragmatic', user: 'Vin***42', bet: 'R$ 20,00', mult: '25.00x', payout: 'R$ 500,00' },
  { game: 'Fortune Rabbit', provider: 'PG Soft', user: 'Car***55', bet: 'R$ 15,00', mult: '10.00x', payout: 'R$ 150,00' },
  { game: 'Aviator', provider: 'Spribe', user: 'Thi***08', bet: 'R$ 30,00', mult: '5.10x', payout: 'R$ 153,00' },
  { game: 'Double', provider: 'Originais', user: 'Fel***91', bet: 'R$ 25,00', mult: '14.00x', payout: 'R$ 350,00' },
  { game: 'Fortune Tiger', provider: 'PG Soft', user: 'And***14', bet: 'R$ 50,00', mult: '8.00x', payout: 'R$ 400,00' },
  { game: 'Sugar Rush 1000', provider: 'Pragmatic', user: 'Leo***67', bet: 'R$ 10,00', mult: '15.00x', payout: 'R$ 150,00' }
];

const LINE_SVG_COORDS = [
  { x1: 20, y1: 132, x2: 290, y2: 132 },
  { x1: 20, y1: 44, x2: 290, y2: 44 },
  { x1: 20, y1: 220, x2: 290, y2: 220 },
  { x1: 20, y1: 35, x2: 290, y2: 230 },
  { x1: 20, y1: 230, x2: 290, y2: 35 }
];

const PAYLINES = [
  [[1, 0], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [0, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[2, 0], [1, 1], [0, 2]]
];

const VIP_TIERS = [
  { name: 'Bronze', min: 0, cashback: '0.5%', color: 'text-amber-600' },
  { name: 'Prata', min: 500, cashback: '1.0%', color: 'text-slate-300' },
  { name: 'Ouro', min: 2500, cashback: '2.0%', color: 'text-amber-400' },
  { name: 'Platina', min: 10000, cashback: '3.5%', color: 'text-cyan-400' },
  { name: 'Diamante', min: 50000, cashback: '5.0%', color: 'text-fuchsia-400' }
];

export default function App() {
  // === AUTENTICAÇÃO & BANCO ===
  const [authTab, setAuthTab] = useState('login');
  const [fullNameInput, setFullNameInput] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');

  // Dados do usuário logado
  const [joined, setJoined] = useState(false);
  const [userKey, setUserKey] = useState('');
  const [userName, setUserName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [balance, setBalance] = useState(0.0);
  const [transactions, setTransactions] = useState([]);
  const [sportBets, setSportBets] = useState([]);
  const [serverStats, setServerStats] = useState({ totalWagered: 0, totalDeposited: 0, totalWithdrawn: 0, totalWon: 0 });

  // Perfil UI
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [profileHistoryFilter, setProfileHistoryFilter] = useState('ALL');
  const [dailyLimit, setDailyLimit] = useState('Sem limite');

  const [view, setView] = useState('lobby');
  const [activeGameMeta, setActiveGameMeta] = useState(GAMES_CATALOG[0]);
  const [launchingGame, setLaunchingGame] = useState(null);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeContainerRef = useRef(null);

  const [providerFilter, setProviderFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveFeed, setLiveFeed] = useState(INITIAL_LIVE_FEED);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState(null);

  // === CAPAS PERSONALIZADAS ===
  const [customCovers, setCustomCovers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('apexbet_custom_covers') || '{}');
    } catch {
      return {};
    }
  });
  const [selectedCoverGameId, setSelectedCoverGameId] = useState('fortune-tiger');
  const [coverUrlInput, setCoverUrlInput] = useState('');

  // === SLOTS (PG SOFT INTEGRADO AO SALDO) ===
  const [grid, setGrid] = useState([
    ['ENVELOPE', 'JADE', 'ENVELOPE'],
    ['TIGER', 'TIGER', 'TIGER'],
    ['COIN', 'INGOT', 'WILD']
  ]);
  const [spinningCols, setSpinningCols] = useState([false, false, false]);
  const [turboSpin, setTurboSpin] = useState(false);
  const [slotBet, setSlotBet] = useState(5);
  const [lastWin, setLastWin] = useState(0);
  const [winningLines, setWinningLines] = useState([]);
  const [megaWinBanner, setMegaWinBanner] = useState(false);

  // === DOUBLE ===
  const [doubleBet, setDoubleBet] = useState(10);
  const [doubleColor, setDoubleColor] = useState('red');
  const [doubleSpinning, setDoubleSpinning] = useState(false);
  const [doubleOffset, setDoubleOffset] = useState(0);
  const [doubleHistory, setDoubleHistory] = useState([
    { num: 4, color: 'red' }, { num: 11, color: 'black' }, { num: 0, color: 'white' },
    { num: 2, color: 'red' }, { num: 13, color: 'black' }, { num: 7, color: 'red' }
  ]);

  // === MINES ===
  const [minesBet, setMinesBet] = useState(15);
  const [minesCount, setMinesCount] = useState(3);
  const [minesGame, setMinesGame] = useState({
    active: false,
    revealed: [],
    bombs: [],
    multiplier: 1.0,
    nextMultiplier: 1.12
  });

  // === CRASH (AVIATOR) ===
  const [crash, setCrash] = useState({ status: 'WAITING', multiplier: 1.0, history: [2.41, 1.18, 8.92, 1.54, 3.1] });
  const [crashBetInput, setCrashBetInput] = useState(15);
  const [autoCashout, setAutoCashout] = useState('');
  const [activeCrashBet, setActiveCrashBet] = useState(0);
  const [cashedOut, setCashedOut] = useState(false);
  const canvasRef = useRef(null);

  // === ESPORTES EM TEMPO REAL ===
  const [matches, setMatches] = useState([]);
  const [sportCategory, setSportCategory] = useState('Todos');
  const [sportSubTab, setSportSubTab] = useState('matches'); // 'matches' | 'mybets'
  const [liveSportsAlert, setLiveSportsAlert] = useState('');
  const [expandedMatchModal, setExpandedMatchModal] = useState(null);
  const [betSlip, setBetSlip] = useState([]); // [{ key, matchId, matchTitle, market, label, odd }]
  const [sportStake, setSportStake] = useState(20);

  // === CARTEIRA & COMPROVANTE PIX ===
  const [walletTab, setWalletTab] = useState('deposit');
  const [depositAmount, setDepositAmount] = useState('50');
  const [pixGenerated, setPixGenerated] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [receiptModal, setReceiptModal] = useState(null);

  // === ADMIN SECRETO ===
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [dbUsers, setDbUsers] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [myCustomBalance, setMyCustomBalance] = useState('150.00');
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    document.title = 'ApexBet.bet.br | Cassino Online e Apostas Esportivas';
    document.body.style.backgroundColor = '#090c10';
    document.body.style.margin = '0';
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const sample = RANDOM_FEED_SAMPLES[Math.floor(Math.random() * RANDOM_FEED_SAMPLES.length)];
      setLiveFeed((prev) => [{ ...sample, id: Date.now() }, ...prev.slice(0, 5)]);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('apexbet_session');
    if (saved) {
      try {
        const { loginKey, password } = JSON.parse(saved);
        if (loginKey && password) {
          socket.emit('auth:login', { loginKey, password });
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!spinningCols.some(Boolean)) return;
    const interval = setInterval(() => {
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell, cIdx) =>
            spinningCols[cIdx] ? SYM_POOL[Math.floor(Math.random() * SYM_POOL.length)] : cell
          )
        )
      );
    }, 65);
    return () => clearInterval(interval);
  }, [spinningCols]);

  useEffect(() => {
    const target = parseFloat(autoCashout);
    if (
      crash.status === 'RUNNING' &&
      activeCrashBet > 0 &&
      !cashedOut &&
      !isNaN(target) &&
      target >= 1.1 &&
      crash.multiplier >= target
    ) {
      cashoutCrash();
    }
  }, [crash.multiplier]);

  const syncUserFields = (userData) => {
    setBalance(userData.balance ?? 0);
    setTransactions(userData.transactions || []);
    setSportBets(userData.sportBets || []);
    if (userData.createdAt) setCreatedAt(userData.createdAt);
    setServerStats({
      totalWagered: userData.totalWagered || 0,
      totalDeposited: userData.totalDeposited || 0,
      totalWithdrawn: userData.totalWithdrawn || 0,
      totalWon: userData.totalWon || 0
    });
  };

  useEffect(() => {
    socket.on('server:boot', (data) => {
      setMatches(data.matches || []);
      if (data.crashState) setCrash(data.crashState);
    });

    socket.on('sports:tick', ({ matches: updatedMatches, liveAlert }) => {
      if (updatedMatches) {
        setMatches(updatedMatches);
        setExpandedMatchModal((prev) =>
          prev ? updatedMatches.find((m) => m.id === prev.id) || prev : null
        );
      }
      if (liveAlert) {
        setLiveSportsAlert(liveAlert);
        setTimeout(() => setLiveSportsAlert(''), 5500);
      }
    });

    socket.on('auth:error', (msg) => {
      setIsAuthenticating(false);
      setAuthError(msg);
      localStorage.removeItem('apexbet_session');
    });

    socket.on('auth:success', (userData) => {
      setIsAuthenticating(false);
      setAuthError('');
      setUserKey(userData.key);
      setUserName(userData.name);
      setAccountId(userData.accountId);
      syncUserFields(userData);
      setJoined(true);
    });

    socket.on('user:sync', (userData) => {
      syncUserFields(userData);
    });

    socket.on('wallet:withdrawReceipt', (tx) => {
      soundFX.win();
      setWithdrawAmount('');
      setReceiptModal(tx);
    });

    socket.on('slot:result', ({ grid: finalGrid, winAmount, winningLines: lines, isMegaWin, balance: newBal, transactions: newTxs }) => {
      const t1 = turboSpin ? 150 : 380;
      const t2 = turboSpin ? 280 : 720;
      const t3 = turboSpin ? 420 : 1080;

      setTimeout(() => {
        soundFX.reelStop();
        setGrid((prev) => [
          [finalGrid[0][0], prev[0][1], prev[0][2]],
          [finalGrid[1][0], prev[1][1], prev[1][2]],
          [finalGrid[2][0], prev[2][1], prev[2][2]]
        ]);
        setSpinningCols([false, true, true]);
      }, t1);

      setTimeout(() => {
        soundFX.reelStop();
        setGrid((prev) => [
          [finalGrid[0][0], finalGrid[0][1], prev[0][2]],
          [finalGrid[1][0], finalGrid[1][1], prev[1][2]],
          [finalGrid[2][0], finalGrid[2][1], prev[2][2]]
        ]);
        setSpinningCols([false, false, true]);
      }, t2);

      setTimeout(() => {
        soundFX.reelStop();
        setGrid(finalGrid);
        setSpinningCols([false, false, false]);
        setBalance(newBal);
        if (newTxs) setTransactions(newTxs);
        setLastWin(winAmount);
        setWinningLines(lines || []);

        if (winAmount > 0) {
          soundFX.win();
          confetti({ particleCount: isMegaWin ? 150 : 75, spread: 75, origin: { y: 0.6 } });
          if (isMegaWin) {
            setMegaWinBanner(true);
            setTimeout(() => setMegaWinBanner(false), 3000);
          }
        }
      }, t3);
    });

    socket.on('double:result', ({ rolledNumber, rolledColor, winAmount, balance: newBal, transactions: newTxs }) => {
      const targetIdx = DOUBLE_ORDER.findIndex((item) => item.num === rolledNumber);
      const tileWidth = 64;
      const totalPx = (4 * 15 + targetIdx) * tileWidth + (Math.random() * 24 - 12);
      setDoubleOffset(totalPx);

      setTimeout(() => {
        setDoubleSpinning(false);
        setBalance(newBal);
        if (newTxs) setTransactions(newTxs);
        setDoubleHistory((prev) => [{ num: rolledNumber, color: rolledColor }, ...prev.slice(0, 7)]);
        if (winAmount > 0) {
          soundFX.win();
          confetti({ particleCount: 80, spread: 60 });
          showToast(`Ganhou + R$ ${winAmount.toFixed(2)}!`);
        }
      }, 3200);
    });

    socket.on('mines:state', (state) => {
      soundFX.gem(state.revealed.length);
      setBalance(state.balance);
      setMinesGame({
        active: true,
        revealed: state.revealed,
        bombs: [],
        multiplier: state.multiplier,
        nextMultiplier: state.nextMultiplier
      });
    });

    socket.on('mines:gameover', ({ bombs, revealed, balance: newBal }) => {
      soundFX.bomb();
      setBalance(newBal);
      setMinesGame({ active: false, revealed, bombs, multiplier: 1.0, nextMultiplier: 1.0 });
    });

    socket.on('mines:cashedout', ({ winAmount, multiplier, bombs, revealed, balance: newBal, transactions: newTxs }) => {
      soundFX.win();
      confetti({ particleCount: 70, spread: 60 });
      setBalance(newBal);
      if (newTxs) setTransactions(newTxs);
      setMinesGame({ active: false, revealed, bombs, multiplier, nextMultiplier: 1.0 });
      showToast(`Retirado R$ ${winAmount.toFixed(2)} (${multiplier.toFixed(2)}x)!`);
    });

    socket.on('crash:tick', (state) => {
      setCrash(state);
      if (state.status === 'WAITING') {
        setActiveCrashBet(0);
        setCashedOut(false);
      }
    });

    socket.on('app:toast', (msg) => showToast(msg));

    socket.on('admin:state', ({ users, pendingDeposits: deps }) => {
      setDbUsers(users || []);
      setPendingDeposits(deps || []);
    });

    return () => socket.off();
  }, [turboSpin]);

  useEffect(() => {
    if (view !== 'crash' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 35; x < w; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 28; y < h; y += 36) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (crash.status === 'WAITING') return;

    const progress = Math.min((crash.multiplier - 1) / 4.2, 1);
    const startX = 24;
    const startY = h - 22;
    const endX = startX + progress * (w - 75);
    const endY = startY - Math.pow(progress, 1.35) * (h - 62);

    const isCrashed = crash.status === 'CRASHED';
    const strokeColor = isCrashed ? '#f43f5e' : '#e11d48';

    const grad = ctx.createLinearGradient(0, endY, 0, startY);
    grad.addColorStop(0, isCrashed ? 'rgba(244,63,94,0.15)' : 'rgba(225,29,72,0.35)');
    grad.addColorStop(1, 'rgba(9,12,16,0)');

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + endX) / 2, startY, endX, endY);
    ctx.lineTo(endX, startY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + endX) / 2, startY, endX, endY);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    if (!isCrashed) {
      ctx.save();
      ctx.translate(endX, endY);
      ctx.rotate(-0.35 * progress - 0.12);

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, -7);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(4, -2);
      ctx.lineTo(-5, -13);
      ctx.lineTo(-8, -2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }, [crash, view]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  };

  // --- CÁLCULO EM TEMPO REAL DO VOLUME RODADO & ESTATÍSTICAS DO PERFIL ---
  const computedWagered = Math.max(
    serverStats.totalWagered,
    transactions
      .filter((t) => t.amount < 0 && t.type !== 'WITHDRAW')
      .reduce((acc, t) => acc + Math.abs(t.amount), 0)
  );
  const computedDeposited = Math.max(
    serverStats.totalDeposited,
    transactions.filter((t) => t.type === 'DEPOSIT').reduce((acc, t) => acc + t.amount, 0)
  );
  const computedWithdrawn = Math.max(
    serverStats.totalWithdrawn,
    transactions.filter((t) => t.type === 'WITHDRAW').reduce((acc, t) => acc + Math.abs(t.amount), 0)
  );
  const computedWon = Math.max(
    serverStats.totalWon,
    transactions.filter((t) => t.amount > 0 && t.type !== 'DEPOSIT').reduce((acc, t) => acc + t.amount, 0)
  );

  const totalBetsCount = transactions.filter((t) => t.amount < 0 && t.type !== 'WITHDRAW').length;
  const biggestWin = transactions
    .filter((t) => t.amount > 0 && t.type !== 'DEPOSIT')
    .reduce((max, t) => Math.max(max, t.amount), 0);

  const currentVipIdx = VIP_TIERS.reduce((acc, tier, idx) => (computedWagered >= tier.min ? idx : acc), 0);
  const currentVip = VIP_TIERS[currentVipIdx];
  const nextVip = VIP_TIERS[currentVipIdx + 1] || null;
  const vipProgressPct = nextVip
    ? Math.min(100, Math.max(4, ((computedWagered - currentVip.min) / (nextVip.min - currentVip.min)) * 100))
    : 100;

  // --- GERENCIAMENTO DE CAPAS ORIGINAIS NO ADMIN ---
  const saveCustomCover = (gameId, dataOrUrl) => {
    const updated = { ...customCovers };
    if (dataOrUrl) updated[gameId] = dataOrUrl;
    else delete updated[gameId];
    setCustomCovers(updated);
    try {
      localStorage.setItem('apexbet_custom_covers', JSON.stringify(updated));
    } catch {}
    showToast(dataOrUrl ? 'Capa do jogo atualizada!' : 'Capa restaurada!');
  };

  const handleCoverFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => saveCustomCover(selectedCoverGameId, reader.result);
    reader.readAsDataURL(file);
  };

  const launchGame = (game) => {
    soundFX.click();
    setActiveGameMeta(game);
    setLastWin(0);
    setWinningLines([]);
    setLaunchingGame(game);

    setTimeout(() => {
      setLaunchingGame(null);
      if (game.mode === 'iframe') setIframeKey((k) => k + 1);
      setView(game.mode);
    }, 750);
  };

  const handleToggleFullscreen = () => {
    if (!iframeContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      iframeContainerRef.current.requestFullscreen().catch(() => {
        showToast('Seu navegador bloqueou a tela cheia automática.');
      });
    }
  };

  // --- SUBMIT LOGIN / CADASTRO ---
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (isAuthenticating) return;
    soundFX.click();
    setAuthError('');
    setLoginNotice('');

    if (!socket.connected) {
      setAuthError('Conectando ao servidor (aguarde ~30s se ele estava dormindo) e tente novamente.');
      socket.connect();
      return;
    }

    setIsAuthenticating(true);

    if (rememberMe) {
      localStorage.setItem('apexbet_session', JSON.stringify({ loginKey: loginInput, password: passwordInput }));
    } else {
      localStorage.removeItem('apexbet_session');
    }

    setTimeout(() => {
      if (authTab === 'register') {
        socket.emit('auth:register', {
          fullName: fullNameInput,
          loginKey: loginInput,
          password: passwordInput
        });
      } else {
        socket.emit('auth:login', {
          loginKey: loginInput,
          password: passwordInput
        });
      }
    }, 300);

    setTimeout(() => {
      setIsAuthenticating((prev) => {
        if (prev) setAuthError('O servidor demorou a responder. Toque em Entrar novamente.');
        return false;
      });
    }, 10000);
  };

  const handleLogout = () => {
    soundFX.click();
    localStorage.removeItem('apexbet_session');
    socket.emit('auth:logout');
    setJoined(false);
    setBalance(0);
    setTransactions([]);
    setSportBets([]);
    setBetSlip([]);
    setView('lobby');
  };

  const handleLogoTap = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 5) {
      socket.emit('admin:getState');
      setShowAdmin(true);
      setLogoClicks(0);
    }
  };

  const setMyOwnBalance = (newVal) => {
    socket.emit('admin:setUserBalance', { userKey, amount: newVal });
    showToast(`Seu saldo foi definido para R$ ${Number(newVal).toFixed(2)}`);
  };

  const addToMyOwnBalance = (delta) => {
    socket.emit('admin:addUserBalance', { userKey, delta });
    showToast(`+ R$ ${Number(delta).toFixed(2)} adicionado ao seu saldo`);
  };

  const checkFunds = (amount) => {
    if (amount <= 0) return false;
    if (balance < amount) {
      showToast('Saldo insuficiente. Faça um depósito PIX para jogar.');
      return false;
    }
    return true;
  };

  const spinSlot = () => {
    if (spinningCols.some(Boolean) || !checkFunds(slotBet)) return;
    soundFX.click();
    setWinningLines([]);
    setLastWin(0);
    setSpinningCols([true, true, true]);
    socket.emit('slot:spin', slotBet);
  };

  const spinDouble = () => {
    const val = Number(doubleBet);
    if (doubleSpinning || !checkFunds(val)) return;
    soundFX.click();
    setDoubleSpinning(true);
    setDoubleOffset(0);
    setTimeout(() => {
      socket.emit('double:spin', { bet: val, color: doubleColor });
    }, 50);
  };

  const startMines = () => {
    const val = Number(minesBet);
    if (!checkFunds(val)) return;
    soundFX.click();
    socket.emit('mines:start', { bet: val, minesCount: Number(minesCount) });
  };

  const placeCrashBet = () => {
    const val = Number(crashBetInput);
    if (crash.status !== 'WAITING' || activeCrashBet > 0 || !checkFunds(val)) return;
    soundFX.click();
    setActiveCrashBet(val);
    socket.emit('crash:bet', { amount: val });
  };

  const cashoutCrash = () => {
    if (crash.status !== 'RUNNING' || activeCrashBet <= 0 || cashedOut) return;
    soundFX.win();
    const win = +(activeCrashBet * crash.multiplier).toFixed(2);
    setCashedOut(true);
    socket.emit('crash:cashout', { winAmount: win, multiplier: crash.multiplier });
    confetti({ particleCount: 65, spread: 55 });
  };

  // --- BOLETIM DE APOSTAS ESPORTIVAS (SIMPLES E MÚLTIPLA) ---
  const toggleSportSelection = (match, market, label, odd) => {
    if (match.suspended) {
      showToast('Mercado temporariamente suspenso (Gol / Lance ao vivo).');
      return;
    }
    soundFX.click();
    const key = `${match.id}-${market}-${label}`;
    setBetSlip((prev) => {
      const exists = prev.find((s) => s.key === key);
      if (exists) {
        return prev.filter((s) => s.key !== key);
      }
      // Substitui outra seleção do mesmo jogo para permitir múltipla válida
      const filtered = prev.filter((s) => s.matchId !== match.id);
      return [
        ...filtered,
        {
          key,
          matchId: match.id,
          matchTitle: `${match.home} x ${match.away}`,
          market,
          label,
          odd: Number(odd)
        }
      ];
    });
  };

  const confirmSportBet = () => {
    const stake = Number(sportStake);
    if (betSlip.length === 0 || !checkFunds(stake)) return;
    soundFX.click();
    socket.emit('sports:bet', {
      selections: betSlip,
      stake
    });
    setBetSlip([]);
    setSportSubTab('mybets');
    showToast('Bilhete esportivo confirmado em tempo real!');
  };

  const handleGeneratePix = (e) => {
    e.preventDefault();
    const val = Number(depositAmount);
    if (val < 5) {
      showToast('Valor mínimo de depósito PIX é R$ 5,00');
      return;
    }
    soundFX.click();
    setPixGenerated(true);
    socket.emit('wallet:requestDeposit', { amount: val });
    showToast('QR Code PIX gerado! Aguardando pagamento...');
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const val = Number(withdrawAmount);
    if (!pixKey.trim()) {
      showToast('Informe uma chave PIX válida.');
      return;
    }
    if (!checkFunds(val)) return;
    socket.emit('wallet:withdraw', { pixKey, amount: val });
  };

  const doubleStrip = Array.from({ length: 6 }, () => DOUBLE_ORDER).flat();

  const filteredGames = GAMES_CATALOG.filter((g) => {
    const matchesProv = providerFilter === 'all' || g.provider === providerFilter;
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProv && matchesSearch;
  });

  const filteredMatches = matches.filter((m) =>
    sportCategory === 'Todos' ? true : m.sport === sportCategory
  );

  const combinedSportOdd = +betSlip.reduce((acc, s) => acc * s.odd, 1).toFixed(2);
  const openSportBetsCount = sportBets.filter((b) => b.status === 'OPEN').length;

  const filteredProfileTxs = transactions.filter((tx) => {
    if (profileHistoryFilter === 'ALL') return true;
    if (profileHistoryFilter === 'BETS') return tx.amount < 0 && tx.type !== 'WITHDRAW';
    if (profileHistoryFilter === 'WINS') return tx.amount > 0 && tx.type !== 'DEPOSIT';
    if (profileHistoryFilter === 'PIX') return tx.type === 'DEPOSIT' || tx.type === 'WITHDRAW';
    return true;
  });

  // =========================================================================
  // TELA DE LOGIN / CADASTRO
  // =========================================================================
  if (!joined) {
    return (
      <div className="min-h-screen w-full bg-[#07090d] text-white flex flex-col justify-between font-sans select-none">
        <div className="bg-[#0d1118] border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Lock size={12} />
              <span className="font-mono text-slate-300">apexbet<span className="text-[#00e701] font-bold">.bet.br</span></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-[#00e701]" /> Ambiente Criptografado SSL 256-bit
              </span>
              <span className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-black text-slate-300">
                18+
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl w-full mx-auto px-4 py-8 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between bg-gradient-to-br from-[#12261b] via-[#11161f] to-[#0c1017] border border-slate-800/90 rounded-3xl p-8 h-full">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#00e701]/15 border border-[#00e701]/30 text-[#00e701] text-xs font-extrabold px-3 py-1 rounded-full mb-5">
                <ShieldCheck size={14} /> Operadora Autorizada • Portaria SPA/MF
              </div>
              <h1 className="text-3xl font-black tracking-tight leading-tight text-white">
                Pragmatic Play, PG Soft & Esportes ao Vivo com <span className="text-[#00e701]">PIX Imediato</span>.
              </h1>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Jogue os maiores sucessos licenciados do Brasil: Gates of Olympus, Sweet Bonanza, Sugar Rush, Fortune Tiger, Aviator e apostas esportivas ao vivo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="bg-[#090c10]/80 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-black text-[#00e701]">SAQUE PIX 24/7</p>
                <p className="text-[11px] text-slate-400 mt-1">Transferência direta para a chave CPF do titular.</p>
              </div>
              <div className="bg-[#090c10]/80 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-black text-amber-400">ESPORTES EM TEMPO REAL</p>
                <p className="text-[11px] text-slate-400 mt-1">Futebol, NBA, Tênis, CS2 e UFC com Cash Out ao vivo.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center gap-1">
                <span className="text-3xl font-black tracking-tight text-white">APEX</span>
                <span className="text-3xl font-black tracking-tight text-[#00e701]">BET</span>
                <span className="ml-1 text-[10px] font-extrabold bg-[#00e701]/15 text-[#00e701] border border-[#00e701]/30 px-1.5 py-0.5 rounded">
                  .BR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Apostas Esportivas & Cassino Online Autorizado</p>
            </div>

            <div className="bg-[#11161f] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl">
              <div className="grid grid-cols-2 bg-[#090c10] p-1 rounded-xl border border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setAuthError(''); setLoginNotice(''); }}
                  className={`py-2 rounded-lg text-xs font-extrabold transition ${
                    authTab === 'login' ? 'bg-[#1a2230] text-white shadow' : 'text-slate-500'
                  }`}
                >
                  Entrar na Conta
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); setLoginNotice(''); }}
                  className={`py-2 rounded-lg text-xs font-extrabold transition ${
                    authTab === 'register' ? 'bg-[#1a2230] text-white shadow' : 'text-slate-500'
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              {authError && (
                <div className="mb-4 bg-rose-500/10 border border-rose-500/40 text-rose-400 text-[11px] font-semibold px-3 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {loginNotice && (
                <div className="mb-4 bg-[#00e701]/10 border border-[#00e701]/40 text-[#00e701] text-[11px] font-semibold px-3 py-2.5 rounded-xl">
                  {loginNotice}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                {authTab === 'register' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      Nome Completo (Titular PIX)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Guilherme Santos"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full bg-[#090c10] border border-slate-700/90 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00e701] transition"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">CPF ou E-mail</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00 ou seu@email.com"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full bg-[#090c10] border border-slate-700/90 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00e701] transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-slate-300">Senha</label>
                    {authTab === 'login' && (
                      <button
                        type="button"
                        onClick={() => setLoginNotice('Enviamos um código de recuperação para o seu e-mail/SMS cadastrado.')}
                        className="text-[11px] text-[#00e701] hover:underline font-semibold"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-[#090c10] border border-slate-700/90 rounded-xl pl-3.5 pr-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00e701] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-[#090c10] border-slate-700 accent-[#00e701]"
                    />
                    Manter sessão ativa
                  </label>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <UserCheck size={12} className="text-[#00e701]" /> KYC Ativo
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full bg-[#00e701] hover:bg-[#00c801] disabled:opacity-70 text-slate-950 font-black py-3.5 rounded-xl text-sm transition shadow-lg shadow-[#00e701]/15 flex items-center justify-center gap-2"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> AUTENTICANDO...
                    </>
                  ) : authTab === 'login' ? (
                    'ENTRAR NA PLATAFORMA'
                  ) : (
                    'CONCLUIR CADASTRO'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <footer className="bg-[#0b0e14] border-t border-slate-800/70 px-5 py-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">18+ PROIBIDO PARA MENORES</span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">JOGUE COM RESPONSABILIDADE</span>
          </div>
          <p className="text-[10px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
            APEX BRASIL ENTRETENIMENTO LTDA • CNPJ 54.819.302/0001-48 • Operação autorizada nos termos da Lei nº 14.790/2023 e Portaria SPA/MF.
          </p>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // PLATAFORMA PRINCIPAL
  // =========================================================================
  return (
    <div className="min-h-screen w-full bg-[#090c10] text-white pb-24 lg:pb-0 font-sans select-none flex flex-col">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#11161f] border border-[#00e701] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 whitespace-nowrap">
          <CheckCircle2 size={16} className="text-[#00e701]" /> {toast}
        </div>
      )}

      {launchingGame && (
        <div className="fixed inset-0 z-50 bg-[#07090d]/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="max-w-xs w-full text-center space-y-5">
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-widest uppercase text-amber-400">
              {launchingGame.provider === 'Pragmatic Play' && 'PRAGMATIC PLAY® OFFICIAL SERVER'}
              {launchingGame.provider === 'PG Soft' && 'POCKET GAMES SOFT™ • CARTEIRA INTEGRADA'}
              {launchingGame.provider === 'Spribe' && 'SPRIBE GAMING • CARTEIRA INTEGRADA'}
              {launchingGame.provider === 'Originais' && 'APEX ORIGINALS RNG • CARTEIRA INTEGRADA'}
            </div>

            <div className="w-32 h-40 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-2xl">
              <GameCoverArt game={launchingGame} customCover={customCovers[launchingGame.id]} />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">{launchingGame.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {launchingGame.mode === 'iframe'
                  ? 'Abrindo cliente oficial Pragmatic Play (Modo Demo BRL)...'
                  : `Conectando à sua carteira (Saldo R$ ${balance.toFixed(2)})...`}
              </p>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00e701] to-amber-400 w-full animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      )}

      {megaWinBanner && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6">
          <div className="bg-gradient-to-b from-amber-400 to-amber-600 p-1 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.7)]">
            <div className="bg-[#11161f] rounded-[22px] px-8 py-6 text-center">
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase">Multiplicador 10X</span>
              <h2 className="text-3xl font-black text-white mt-1">GRANDE GANHO</h2>
              <p className="text-3xl font-black text-[#00e701] mt-2">
                + R$ {lastWin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* === HEADER GLOBAL === */}
      <header className="bg-[#11161f]/95 backdrop-blur border-b border-slate-800/80 px-4 lg:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div onClick={handleLogoTap} className="cursor-pointer flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-white">APEX</span>
              <span className="font-black text-xl tracking-tight text-[#00e701]">BET</span>
              <span className="ml-1 text-[9px] font-extrabold bg-emerald-500/15 text-[#00e701] border border-[#00e701]/30 px-1.5 py-0.5 rounded">
                .BR
              </span>
            </div>

            <nav className="hidden lg:flex items-center gap-1 bg-[#090c10] p-1 rounded-xl border border-slate-800/80">
              {[
                { id: 'lobby', label: 'Cassino', icon: Flame },
                { id: 'slots', label: 'PG Soft', icon: Gamepad2 },
                { id: 'crash', label: 'Aviator', icon: Rocket },
                { id: 'sports', label: 'Esportes ao Vivo', icon: Trophy },
                { id: 'profile', label: 'Meu Perfil', icon: User }
              ].map((navItem) => {
                const Icon = navItem.icon;
                const active = view === navItem.id;
                return (
                  <button
                    key={navItem.id}
                    onClick={() => { soundFX.click(); setView(navItem.id); }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                      active
                        ? 'bg-[#1a2230] text-[#00e701] shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={14} /> {navItem.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { soundFX.enabled = muted; setMuted(!muted); }}
              className="p-2 rounded-xl bg-[#090c10] border border-slate-800 text-slate-400 hover:text-white transition"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Botão do Perfil no Topo */}
            <div
              onClick={() => { soundFX.click(); setView('profile'); }}
              className={`flex items-center gap-2 bg-[#090c10] border px-3 py-1.5 rounded-xl cursor-pointer transition ${
                view === 'profile' ? 'border-[#00e701]' : 'border-slate-800 hover:border-slate-700'
              }`}
              title="Abrir Meu Perfil"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-[#00e701]/40 flex items-center justify-center text-[11px] font-black text-[#00e701]">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-[11px] font-bold text-white block leading-none">{userName}</span>
                <span className="text-[9px] text-amber-400 font-bold">VIP {currentVip.name}</span>
              </div>
            </div>

            <div
              onClick={() => setView('wallet')}
              className="bg-[#090c10] px-3.5 py-1.5 rounded-xl border border-slate-800 text-right cursor-pointer hover:border-slate-700 transition"
            >
              <span className="text-[9px] text-slate-400 block leading-none mb-0.5">BRL • Conta Real</span>
              <span className="font-extrabold text-white text-sm tracking-tight">
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={() => { setWalletTab('deposit'); setView('wallet'); }}
              className="bg-[#00e701] hover:bg-[#00c801] text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl transition shadow-lg shadow-[#00e701]/15 flex items-center gap-1"
            >
              <Wallet size={14} className="hidden sm:inline" />
              <span className="hidden sm:inline">DEPOSITAR</span>
              <span className="sm:hidden">PIX</span>
            </button>
          </div>
        </div>
      </header>

      {/* === CORPO PRINCIPAL: SIDEBAR + CONTEÚDO === */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto flex">
        <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-[#0d1118] border-r border-slate-800/80 p-4 sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto">
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2.5 mb-2">
                Menu Principal
              </p>
              <div className="space-y-1">
                {[
                  { id: 'lobby', label: 'Lobby do Cassino', icon: Home },
                  { id: 'sports', label: 'Esportes ao Vivo', icon: Trophy, badge: `${matches.length} AO VIVO` },
                  { id: 'wallet', label: 'Carteira & PIX', icon: Wallet },
                  { id: 'profile', label: 'Meu Perfil & Estatísticas', icon: User }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { soundFX.click(); setView(item.id); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                        view === item.id
                          ? 'bg-[#00e701]/15 text-[#00e701] border border-[#00e701]/30'
                          : 'text-slate-300 hover:bg-[#151b26]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon size={16} /> {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-black bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2.5 mb-2">
                Provedores Oficiais
              </p>
              <div className="space-y-1">
                {PROVIDERS_FILTER.filter((p) => p.id !== 'all').map((prov) => (
                  <button
                    key={prov.id}
                    onClick={() => {
                      soundFX.click();
                      setProviderFilter(prov.id);
                      setView('lobby');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                      providerFilter === prov.id && view === 'lobby'
                        ? 'bg-[#1a2230] text-[#00e701]'
                        : 'text-slate-400 hover:bg-[#151b26] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{prov.label}</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 shrink-0">
                      {prov.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Resumo Rápido de Rollover na Sidebar */}
            <div
              onClick={() => setView('profile')}
              className="bg-gradient-to-br from-[#14291e] to-[#11161f] border border-[#00e701]/25 rounded-2xl p-3.5 cursor-pointer hover:border-[#00e701]/50 transition"
            >
              <div className="flex items-center justify-between text-[#00e701] text-xs font-black">
                <span className="flex items-center gap-1.5"><Crown size={15} /> VIP {currentVip.name}</span>
                <span>{vipProgressPct.toFixed(0)}%</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5 font-bold">
                Já rodou: R$ {computedWagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#00e701] rounded-full" style={{ width: `${vipProgressPct}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/15 transition"
            >
              <LogOut size={15} /> Sair da Conta
            </button>
          </div>
        </aside>

        {/* Área Central de Conteúdo */}
        <main className="flex-1 p-4 lg:p-6 max-w-md lg:max-w-none mx-auto w-full">
          {/* =================================================================
              PÁGINA DE PERFIL COMPLETA
             ================================================================= */}
          {view === 'profile' && (
            <div className="max-w-5xl mx-auto space-y-5">
              {/* Cabeçalho do Perfil + Botão Sair da Conta */}
              <div className="bg-gradient-to-r from-[#13241c] via-[#11161f] to-[#11161f] border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00e701] to-emerald-700 text-slate-950 flex items-center justify-center text-2xl font-black shadow-lg shadow-[#00e701]/20 shrink-0">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-black text-white">{userName}</h1>
                      <span className="text-[10px] font-black bg-[#00e701]/15 text-[#00e701] border border-[#00e701]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck size={12} /> Conta Verificada KYC
                      </span>
                      <span className={`text-[10px] font-black bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full ${currentVip.color}`}>
                        ★ Nível {currentVip.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                      <span className="font-mono">ID #{accountId}</span>
                      <span>•</span>
                      <span>
                        Chave: {showSensitiveData ? userKey : `${userKey.slice(0, 3)}***${userKey.slice(-4)}`}
                      </span>
                      <button
                        onClick={() => setShowSensitiveData(!showSensitiveData)}
                        className="text-[#00e701] hover:underline font-semibold flex items-center gap-1"
                      >
                        {showSensitiveData ? <><EyeOff size={12} /> Ocultar</> : <><Eye size={12} /> Mostrar</>}
                      </button>
                      <span>•</span>
                      <span>Membro desde {createdAt || '2026'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center">
                  <button
                    onClick={() => { setWalletTab('deposit'); setView('wallet'); }}
                    className="bg-[#00e701] hover:bg-[#00c801] text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    + Depositar
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <LogOut size={15} /> Sair da Conta
                  </button>
                </div>
              </div>

              {/* Card Principal: Quanto Já Rodou de Dinheiro (Rollover / Volume Total) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 bg-[#11161f] border border-amber-500/40 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <BarChart3 size={15} /> Volume Total Movimentado (Quanto já rodou)
                      </span>
                      <span className="text-[10px] bg-amber-500/15 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                        {totalBetsCount} apostas realizadas
                      </span>
                    </div>
                    <p className="text-3xl sm:text-4xl font-black text-white mt-2 tracking-tight">
                      R$ {computedWagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Soma total apostada em PG Soft, Aviator, Mines, Double e Esportes ao Vivo.
                    </p>
                  </div>

                  {/* Barra de Nível VIP */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className={currentVip.color}>Nível Atual: {currentVip.name} (Cashback {currentVip.cashback})</span>
                      <span className="text-slate-400">
                        {nextVip
                          ? `Faltam R$ ${(nextVip.min - computedWagered).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${nextVip.name}`
                          : 'Nível Máximo Atingido!'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#090c10] rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-[#00e701] to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${vipProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Cards Financeiros */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                  <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Saldo Disponível</span>
                    <span className="text-lg font-black text-[#00e701] mt-1 block">
                      R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Livre para saque PIX</span>
                  </div>

                  <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Ganho em Prêmios</span>
                    <span className="text-lg font-black text-amber-400 mt-1 block">
                      R$ {computedWon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Maior prêmio: R$ {biggestWin.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Depositado</span>
                    <span className="text-lg font-black text-white mt-1 block">
                      R$ {computedDeposited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Via PIX Instantâneo</span>
                  </div>

                  <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Sacado</span>
                    <span className="text-lg font-black text-sky-400 mt-1 block">
                      R$ {computedWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Pago na chave titular</span>
                  </div>
                </div>
              </div>

              {/* Segurança, Jogo Responsável & Dados da Conta */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <UserCheck size={16} className="text-[#00e701]" /> Informações Cadastrais & Segurança
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Titular da Conta</span>
                      <span className="font-bold text-white">{userName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Identificador Único</span>
                      <span className="font-mono text-slate-200">#{accountId}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Documento / Login</span>
                      <span className="font-bold text-white">{showSensitiveData ? userKey : '••••••••••••'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Verificação Facial & CPF</span>
                      <span className="text-[#00e701] font-extrabold">Aprovado (SPA/MF)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Autenticação 2FA</span>
                      <span className="text-emerald-400 font-bold">Ativa</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Award size={16} className="text-amber-400" /> Jogo Responsável & Limites
                    </h3>
                    <p className="text-xs text-slate-400">
                      Defina um limite diário de apostas para manter seu entretenimento saudável e controlado.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {['R$ 100', 'R$ 500', 'R$ 1.000', 'Sem limite'].map((lim) => (
                        <button
                          key={lim}
                          onClick={() => {
                            setDailyLimit(lim);
                            showToast(`Limite diário atualizado para: ${lim}`);
                          }}
                          className={`py-2 rounded-xl text-[11px] font-extrabold border transition ${
                            dailyLimit === lim
                              ? 'bg-[#00e701]/20 border-[#00e701] text-[#00e701]'
                              : 'bg-[#090c10] border-slate-800 text-slate-400'
                          }`}
                        >
                          {lim}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-rose-600/20"
                  >
                    <LogOut size={16} /> SAIR DA MINHA CONTA AGORA
                  </button>
                </div>
              </div>

              {/* Extrato Completo de Apostas e Movimentações */}
              <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Extrato Detalhado de Apostas & Transações ({filteredProfileTxs.length})
                  </h3>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {[
                      { id: 'ALL', label: 'Tudo' },
                      { id: 'BETS', label: 'Apostas' },
                      { id: 'WINS', label: 'Prêmios' },
                      { id: 'PIX', label: 'Depósitos / Saques' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setProfileHistoryFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition ${
                          profileHistoryFilter === tab.id
                            ? 'bg-[#00e701] text-slate-950'
                            : 'bg-[#090c10] text-slate-400 border border-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredProfileTxs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Nenhuma movimentação encontrada neste filtro.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {filteredProfileTxs.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between bg-[#090c10] border border-slate-800/80 px-3.5 py-2.5 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${tx.amount >= 0 ? 'bg-[#00e701]/15 text-[#00e701]' : 'bg-slate-800 text-slate-300'}`}>
                            {tx.amount >= 0 ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{tx.title}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{tx.time} • {tx.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-black ${tx.amount >= 0 ? 'text-[#00e701]' : 'text-white'}`}>
                            {tx.amount >= 0 ? `+ R$ ${tx.amount.toFixed(2)}` : `- R$ ${Math.abs(tx.amount).toFixed(2)}`}
                          </p>
                          <span className="text-[10px] text-slate-400">{tx.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === PLAYER OFICIAL PRAGMATIC PLAY === */}
          {view === 'iframe' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#11161f] border border-slate-800 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setView('lobby')}
                    className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl font-bold transition"
                  >
                    <ChevronLeft size={16} /> Voltar
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{activeGameMeta.title}</span>
                      <span className="text-[10px] font-black bg-[#00e701]/15 text-[#00e701] border border-[#00e701]/30 px-2 py-0.5 rounded">
                        PRAGMATIC PLAY OFICIAL • DEMO BRL
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIframeKey((k) => k + 1)}
                    className="flex items-center gap-1.5 text-xs bg-[#090c10] hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-bold transition"
                  >
                    <RefreshCw size={14} /> <span className="hidden sm:inline">Reiniciar Demo</span>
                  </button>
                  <button
                    onClick={handleToggleFullscreen}
                    className="flex items-center gap-1.5 text-xs bg-[#00e701] hover:bg-[#00c801] text-slate-950 px-3 py-1.5 rounded-xl font-black transition"
                  >
                    <Maximize2 size={14} /> <span>Tela Cheia</span>
                  </button>
                </div>
              </div>

              <div
                ref={iframeContainerRef}
                className="w-full h-[72vh] lg:h-[calc(100vh-155px)] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative"
              >
                <iframe
                  key={iframeKey}
                  src={activeGameMeta.demoUrl}
                  title={activeGameMeta.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* === LOBBY CASSINO === */}
          {view === 'lobby' && (
            <div className="space-y-6">
              {balance === 0 && (
                <div
                  onClick={() => { setWalletTab('deposit'); setView('wallet'); }}
                  className="bg-[#11161f] border border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                      <Wallet size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Sua carteira está com saldo R$ 0,00</p>
                      <p className="text-[11px] text-slate-400">Deposite via PIX a partir de R$ 5,00 para jogar com saldo real</p>
                    </div>
                  </div>
                  <span className="bg-[#00e701] text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shrink-0">
                    Depositar
                  </span>
                </div>
              )}

              {/* Banners */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                  onClick={() => launchGame(GAMES_CATALOG[0])}
                  className="bg-gradient-to-r from-[#26114d] via-[#17112b] to-[#11161f] border border-purple-500/40 rounded-2xl p-5 relative overflow-hidden cursor-pointer group"
                >
                  <div className="relative z-10 max-w-[68%]">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#00e701] text-slate-950 px-2 py-0.5 rounded">
                      16 JOGOS REAIS • PRAGMATIC PLAY
                    </span>
                    <h2 className="text-lg lg:text-xl font-black text-white mt-2 leading-snug">
                      Gates of Olympus, Sweet Bonanza & Sugar Rush
                    </h2>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-purple-300 mt-3 group-hover:translate-x-1 transition">
                      Jogar Gates of Olympus <ChevronRight size={14} />
                    </span>
                  </div>
                  <div className="w-24 h-28 rounded-xl overflow-hidden border border-purple-400/50 absolute right-4 bottom-3 shadow-xl group-hover:scale-105 transition">
                    <GameCoverArt game={GAMES_CATALOG[0]} customCover={customCovers[GAMES_CATALOG[0].id]} />
                  </div>
                </div>

                <div
                  onClick={() => setView('sports')}
                  className="hidden lg:block bg-gradient-to-r from-[#0e3322] via-[#111c19] to-[#11161f] border border-[#00e701]/40 rounded-2xl p-5 relative overflow-hidden cursor-pointer group"
                >
                  <div className="relative z-10 max-w-[72%]">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded">
                      AO VIVO AGORA • {matches.length} EVENTOS
                    </span>
                    <h2 className="text-xl font-black text-white mt-2 leading-snug">
                      Futebol, NBA, Tênis, CS2 & UFC em Tempo Real
                    </h2>
                    <p className="text-xs text-slate-300/80 mt-1">
                      Odds dinâmicas ao vivo, apostas múltiplas e Cash Out instantâneo.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-[#00e701] mt-3 group-hover:translate-x-1 transition">
                      Ir para Esportes ao Vivo <ChevronRight size={14} />
                    </span>
                  </div>
                  <Trophy size={72} className="text-[#00e701]/20 absolute right-5 bottom-4" />
                </div>
              </div>

              {/* Filtro de Provedores */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {PROVIDERS_FILTER.map((prov) => (
                    <button
                      key={prov.id}
                      onClick={() => { soundFX.click(); setProviderFilter(prov.id); }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition flex items-center gap-1.5 ${
                        providerFilter === prov.id
                          ? 'bg-[#00e701] text-slate-950 shadow-lg shadow-[#00e701]/15'
                          : 'bg-[#11161f] text-slate-300 border border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span>{prov.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          providerFilter === prov.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {prov.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative md:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar Olympus, Sugar, Tiger..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#11161f] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00e701]"
                  />
                </div>
              </div>

              {/* Grade de Jogos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Flame size={15} className="text-amber-400" />
                    {providerFilter === 'all' ? 'Catálogo Completo do Cassino' : `Jogos • ${providerFilter}`}
                  </h3>
                  <span className="text-[11px] text-slate-500">{filteredGames.length} títulos</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                  {filteredGames.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => launchGame(game)}
                      className={`group relative aspect-[3/4] rounded-2xl bg-[#11161f] border ${game.ringColor} overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1 active:scale-95 transition-all duration-200`}
                    >
                      <div className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-300">
                        <GameCoverArt game={game} customCover={customCovers[game.id]} />
                      </div>

                      <div className="relative z-10 flex items-center justify-between gap-1 p-2">
                        <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md ${game.badgeColor}`}>
                          {game.badge}
                        </span>
                        <span className="text-[8px] font-extrabold bg-black/70 backdrop-blur-sm text-slate-100 px-1.5 py-0.5 rounded border border-white/15 truncate">
                          {game.provider === 'Pragmatic Play' ? 'PRAGMATIC' : game.provider.toUpperCase()}
                        </span>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/85 to-transparent px-2.5 pt-8 pb-2">
                        <p className="text-xs sm:text-[13px] font-black text-white leading-tight truncate drop-shadow">
                          {game.title}
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-slate-300 mt-0.5">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00e701]" /> {game.players}
                          </span>
                          <span className="font-mono text-amber-300">{game.rtp}</span>
                        </div>
                      </div>

                      <div className="hidden lg:flex absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center z-20">
                        <div className="w-12 h-12 rounded-full bg-[#00e701] text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(0,231,1,0.75)]">
                          <Play size={22} className="fill-slate-950 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destaques Esportivos Ao Vivo no Lobby */}
              {matches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Tv size={15} className="text-rose-500" /> Esportes ao Vivo (Tempo Real)
                    </h3>
                    <button
                      onClick={() => setView('sports')}
                      className="text-[11px] font-bold text-[#00e701] hover:underline"
                    >
                      Ver todos os jogos ({matches.length}) →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {matches.slice(0, 2).map((m) => (
                      <div key={m.id} className="bg-[#11161f] border border-slate-800 rounded-2xl p-3.5">
                        <div className="flex justify-between items-center text-[10px] mb-2">
                          <span className="text-slate-400 font-semibold">{m.sport} • {m.league}</span>
                          <span className="text-rose-500 font-bold flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> {m.time}
                          </span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-xs mb-3">
                          <span>{m.home}</span>
                          <span className="bg-[#090c10] px-2.5 py-0.5 rounded text-[#00e701] font-mono font-black">
                            {m.score}
                          </span>
                          <span>{m.away}</span>
                        </div>
                        <div className={`grid ${m.oddDraw ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                          {[
                            { label: m.home, tag: '1', odd: m.oddHome },
                            ...(m.oddDraw ? [{ label: 'Empate', tag: 'X', odd: m.oddDraw }] : []),
                            { label: m.away, tag: '2', odd: m.oddAway }
                          ].map((opt) => (
                            <button
                              key={opt.tag}
                              onClick={() => {
                                toggleSportSelection(m, 'Resultado Final', opt.label, opt.odd);
                                setView('sports');
                              }}
                              className="p-2 rounded-xl bg-[#090c10] hover:border-[#00e701] border border-slate-800 flex justify-between items-center text-xs transition"
                            >
                              <span className="text-slate-500 font-bold">{opt.tag}</span>
                              <span className="font-extrabold text-[#00e701]">{opt.odd.toFixed(2)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feed de Ganhadores */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Users size={15} className="text-[#00e701]" /> Últimos Ganhadores na Plataforma
                  </h3>
                  <span className="text-[10px] text-[#00e701] flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e701] animate-pulse" /> Ao vivo
                  </span>
                </div>

                <div className="bg-[#11161f] border border-slate-800/90 rounded-2xl overflow-hidden text-xs">
                  <div className="grid grid-cols-4 lg:grid-cols-6 px-4 py-2.5 bg-[#0d1118] border-b border-slate-800 text-[10px] font-bold uppercase text-slate-500">
                    <span>Jogo</span>
                    <span className="hidden lg:block">Provedor</span>
                    <span>Jogador</span>
                    <span className="hidden lg:block">Aposta</span>
                    <span className="text-center">Mult.</span>
                    <span className="text-right">Pagamento</span>
                  </div>
                  {liveFeed.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-4 lg:grid-cols-6 px-4 py-2.5 border-b border-slate-800/50 last:border-none items-center text-[11px]"
                    >
                      <span className="font-bold text-white truncate">{row.game}</span>
                      <span className="hidden lg:block text-slate-400">{row.provider}</span>
                      <span className="text-slate-400 font-mono">{row.user}</span>
                      <span className="hidden lg:block text-slate-400">{row.bet}</span>
                      <span className="text-center font-mono text-amber-300">{row.mult}</span>
                      <span className="text-right font-extrabold text-[#00e701]">{row.payout}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === CABINE PG SOFT === */}
          {view === 'slots' && (
            <div className="max-w-sm mx-auto space-y-3">
              <button onClick={() => setView('lobby')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-bold">
                <ChevronLeft size={16} /> Voltar ao Cassino
              </button>

              <div className={`bg-gradient-to-b ${activeGameMeta.slotFrameBg || 'from-[#7c1d0b] via-[#3a0d06] to-[#120907]'} border-2 border-amber-400/70 rounded-[28px] p-4 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden`}>
                <div className="flex flex-col items-center text-center mb-2">
                  <span className="text-[9px] font-black tracking-widest uppercase bg-black/50 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full mb-1.5">
                    POCKET GAMES SOFT™ • {activeGameMeta.mode === 'slots' ? activeGameMeta.title : 'Fortune Tiger'}
                  </span>
                  <div className="w-20 h-24 rounded-xl overflow-hidden border border-amber-400/60 shadow-lg">
                    <GameCoverArt
                      game={activeGameMeta.mode === 'slots' ? activeGameMeta : GAMES_CATALOG[1]}
                      customCover={customCovers[(activeGameMeta.mode === 'slots' ? activeGameMeta : GAMES_CATALOG[1]).id]}
                    />
                  </div>
                </div>

                <div className="relative bg-[#090c10] p-3 rounded-2xl border-2 border-amber-400 shadow-inner">
                  <div className="grid grid-cols-3 gap-2">
                    {grid.map((row, rIdx) =>
                      row.map((symbol, cIdx) => {
                        const isCellWinner = winningLines.some((lIdx) =>
                          PAYLINES[lIdx].some(([lr, lc]) => lr === rIdx && lc === cIdx)
                        );
                        return (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className={`h-20 rounded-xl flex items-center justify-center border transition-all duration-150 ${
                              isCellWinner
                                ? 'bg-amber-500/25 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.45)] scale-[1.03]'
                                : 'bg-[#151a24] border-slate-800/90'
                            } ${spinningCols[cIdx] ? 'blur-[2px] opacity-85' : ''}`}
                          >
                            <ThemedSlotSymbol type={symbol} theme={activeGameMeta.mode === 'slots' ? activeGameMeta.theme : 'tiger'} />
                          </div>
                        );
                      })
                    )}
                  </div>

                  {winningLines.length > 0 && (
                    <svg viewBox="0 0 310 265" className="w-full h-full absolute inset-0 pointer-events-none">
                      {winningLines.map((lIdx) => {
                        const c = LINE_SVG_COORDS[lIdx];
                        return (
                          <line
                            key={lIdx}
                            x1={c.x1}
                            y1={c.y1}
                            x2={c.x2}
                            y2={c.y2}
                            stroke="#fde047"
                            strokeWidth="5"
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </svg>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5 bg-black/60 border border-amber-400/30 rounded-xl p-2 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Saldo</span>
                    <span className="text-xs font-black text-white">R$ {balance.toFixed(2)}</span>
                  </div>
                  <div className="border-x border-white/10">
                    <span className="text-[9px] text-slate-400 block uppercase">Aposta</span>
                    <span className="text-xs font-black text-amber-300">R$ {slotBet.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Ganho</span>
                    <span className={`text-xs font-black ${lastWin > 0 ? 'text-[#00e701]' : 'text-amber-400'}`}>
                      R$ {lastWin.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 px-1">
                  <button
                    onClick={() => setTurboSpin(!turboSpin)}
                    className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border text-[9px] font-black transition ${
                      turboSpin ? 'bg-amber-400 text-slate-950 border-yellow-200' : 'bg-black/60 text-slate-300 border-white/15'
                    }`}
                  >
                    <Zap size={14} /> TURBO
                  </button>

                  <button
                    onClick={() => setSlotBet((b) => Math.max(2, b - 5))}
                    className="w-10 h-10 rounded-full bg-black/60 border border-white/20 font-black text-lg text-amber-300"
                  >
                    -
                  </button>

                  <button
                    onClick={spinSlot}
                    disabled={spinningCols.some(Boolean)}
                    className="w-20 h-20 rounded-full bg-gradient-to-b from-emerald-300 via-[#00e701] to-emerald-700 p-1 shadow-[0_0_25px_rgba(0,231,1,0.5)] active:scale-95 transition disabled:opacity-50"
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-[#00e701] to-emerald-600 flex items-center justify-center border border-white/50">
                      <RotateCw size={30} className={`text-slate-950 stroke-[2.8] ${spinningCols.some(Boolean) ? 'animate-spin' : ''}`} />
                    </div>
                  </button>

                  <button
                    onClick={() => setSlotBet((b) => Math.min(500, b + 5))}
                    className="w-10 h-10 rounded-full bg-black/60 border border-white/20 font-black text-lg text-amber-300"
                  >
                    +
                  </button>

                  <button
                    onClick={() => setSlotBet(10)}
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-black/60 border border-white/15 text-[9px] font-black text-amber-300"
                  >
                    <span>MAX</span>
                    <span>R$10</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === AVIATOR CRASH === */}
          {view === 'crash' && (
            <div className="max-w-xl mx-auto space-y-3">
              <button onClick={() => setView('lobby')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-bold">
                <ChevronLeft size={16} /> Voltar ao Cassino
              </button>

              <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-white">Aviator • Spribe (Saldo R$ {balance.toFixed(2)})</span>
                  <span className="text-[10px] text-[#00e701] font-bold">● Provably Fair</span>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2">
                  {crash.history?.map((h, idx) => (
                    <span
                      key={idx}
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                        h >= 10 ? 'bg-amber-500/20 text-amber-300' : h >= 2 ? 'bg-purple-500/20 text-purple-300' : 'bg-sky-500/15 text-sky-400'
                      }`}
                    >
                      {h.toFixed(2)}x
                    </span>
                  ))}
                </div>

                <div className="h-52 lg:h-64 bg-[#090c10] rounded-2xl border border-slate-800 relative overflow-hidden mb-4 flex items-center justify-center">
                  <canvas ref={canvasRef} width={520} height={240} className="w-full h-full absolute inset-0" />
                  <div className="relative z-10 text-center">
                    <span
                      className={`text-5xl font-black tracking-tight block ${
                        crash.status === 'CRASHED' ? 'text-rose-500' : crash.status === 'RUNNING' ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {crash.multiplier.toFixed(2)}x
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest mt-1 block text-rose-400">
                      {crash.status === 'WAITING' && 'Aguardando apostas...'}
                      {crash.status === 'CRASHED' && 'Voou para longe!'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#090c10] border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Valor (R$)</span>
                      <input
                        type="number"
                        value={crashBetInput}
                        onChange={(e) => setCrashBetInput(e.target.value)}
                        className="w-full bg-[#11161f] border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Auto-Saque (x)</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 2.00"
                        value={autoCashout}
                        onChange={(e) => setAutoCashout(e.target.value)}
                        className="w-full bg-[#11161f] border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-center text-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 15, 30, 50].map((v) => (
                      <button
                        key={v}
                        onClick={() => setCrashBetInput(v)}
                        className="bg-[#11161f] hover:bg-slate-800 border border-slate-800 py-1.5 rounded-lg text-[11px] font-bold text-slate-300"
                      >
                        R$ {v}
                      </button>
                    ))}
                  </div>

                  {crash.status === 'WAITING' ? (
                    <button
                      onClick={placeCrashBet}
                      disabled={activeCrashBet > 0}
                      className="w-full bg-[#00e701] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black py-3.5 rounded-xl text-sm"
                    >
                      {activeCrashBet > 0 ? `APOSTA REGISTRADA (R$ ${activeCrashBet})` : `APOSTAR R$ ${crashBetInput}`}
                    </button>
                  ) : (
                    <button
                      onClick={cashoutCrash}
                      disabled={crash.status !== 'RUNNING' || activeCrashBet === 0 || cashedOut}
                      className="w-full bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black py-3.5 rounded-xl text-sm"
                    >
                      {cashedOut
                        ? 'LUCRO RETIRADO!'
                        : activeCrashBet > 0
                        ? `SACAR R$ ${(activeCrashBet * crash.multiplier).toFixed(2)}`
                        : 'AGUARDE A PRÓXIMA'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === DOUBLE === */}
          {view === 'double' && (
            <div className="max-w-xl mx-auto space-y-3">
              <button onClick={() => setView('lobby')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-bold">
                <ChevronLeft size={16} /> Voltar ao Cassino
              </button>

              <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">Double • Saldo R$ {balance.toFixed(2)}</span>
                  <div className="flex gap-1.5">
                    {doubleHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
                          item.color === 'white'
                            ? 'bg-white text-slate-950'
                            : item.color === 'red'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-white border border-slate-700'
                        }`}
                      >
                        {item.num}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative h-24 bg-[#090c10] rounded-xl border border-slate-800 overflow-hidden flex items-center">
                  <div className="w-1 h-full bg-amber-400 absolute left-1/2 -translate-x-1/2 z-20 shadow-[0_0_10px_#fbbf24]" />
                  <div
                    className="flex gap-2 px-[50%]"
                    style={{
                      transform: `translateX(-${doubleOffset}px)`,
                      transition: doubleSpinning ? 'transform 3.1s cubic-bezier(0.12, 0.85, 0.2, 1)' : 'none'
                    }}
                  >
                    {doubleStrip.map((tile, idx) => (
                      <div
                        key={idx}
                        className={`w-14 h-16 rounded-xl shrink-0 flex items-center justify-center font-black text-base ${
                          tile.color === 'white'
                            ? 'bg-white text-slate-950'
                            : tile.color === 'red'
                            ? 'bg-rose-600 text-white'
                            : 'bg-[#1a2230] text-white border border-slate-700'
                        }`}
                      >
                        {tile.num === 0 ? '★' : tile.num}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDoubleColor('red')}
                    className={`py-3 rounded-xl font-black text-xs border-2 transition ${
                      doubleColor === 'red' ? 'bg-rose-600 border-white text-white' : 'bg-rose-600/30 border-transparent text-rose-300'
                    }`}
                  >
                    Vermelho 2x
                  </button>
                  <button
                    onClick={() => setDoubleColor('white')}
                    className={`py-3 rounded-xl font-black text-xs border-2 transition ${
                      doubleColor === 'white' ? 'bg-white border-amber-400 text-slate-950' : 'bg-white/20 border-transparent text-white'
                    }`}
                  >
                    Branco 14x
                  </button>
                  <button
                    onClick={() => setDoubleColor('black')}
                    className={`py-3 rounded-xl font-black text-xs border-2 transition ${
                      doubleColor === 'black' ? 'bg-slate-800 border-white text-white' : 'bg-slate-800/40 border-transparent text-slate-400'
                    }`}
                  >
                    Preto 2x
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={doubleBet}
                    onChange={(e) => setDoubleBet(e.target.value)}
                    className="w-1/3 bg-[#090c10] border border-slate-800 rounded-xl px-3 py-3 text-sm font-black text-center"
                  />
                  <button
                    onClick={spinDouble}
                    disabled={doubleSpinning}
                    className="flex-1 bg-[#00e701] disabled:opacity-40 text-slate-950 font-black py-3.5 rounded-xl text-sm"
                  >
                    {doubleSpinning ? 'GIRANDO...' : 'APOSTAR NA RODADA'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === MINES === */}
          {view === 'mines' && (
            <div className="max-w-md mx-auto space-y-3">
              <button onClick={() => setView('lobby')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-bold">
                <ChevronLeft size={16} /> Voltar ao Cassino
              </button>

              <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black uppercase text-sky-400">Mines • Saldo R$ {balance.toFixed(2)}</span>
                  {minesGame.active && (
                    <span className="text-xs font-black text-[#00e701]">
                      Atual: {minesGame.multiplier.toFixed(2)}x (Próx: {minesGame.nextMultiplier.toFixed(2)}x)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-2 bg-[#090c10] p-3 rounded-xl border border-slate-800 mb-4">
                  {Array.from({ length: 25 }).map((_, idx) => {
                    const isRevealed = minesGame.revealed.includes(idx);
                    const isBomb = !minesGame.active && minesGame.bombs[idx];

                    return (
                      <button
                        key={idx}
                        disabled={!minesGame.active || isRevealed}
                        onClick={() => socket.emit('mines:reveal', idx)}
                        className={`aspect-square rounded-xl flex items-center justify-center transition transform active:scale-90 border ${
                          isBomb
                            ? 'bg-rose-500/20 border-rose-500'
                            : isRevealed
                            ? 'bg-[#00e701]/15 border-[#00e701]'
                            : 'bg-[#161d29] hover:bg-[#1e2738] border-slate-800'
                        }`}
                      >
                        {isBomb && <Bomb size={20} className="text-rose-500" />}
                        {!isBomb && isRevealed && <Diamond size={20} className="text-[#00e701]" />}
                      </button>
                    );
                  })}
                </div>

                {!minesGame.active ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Aposta (R$)</label>
                        <input
                          type="number"
                          value={minesBet}
                          onChange={(e) => setMinesBet(e.target.value)}
                          className="w-full bg-[#090c10] border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Minas</label>
                        <select
                          value={minesCount}
                          onChange={(e) => setMinesCount(e.target.value)}
                          className="w-full bg-[#090c10] border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold"
                        >
                          {[1, 3, 5, 10, 15, 20].map((n) => (
                            <option key={n} value={n}>{n} Minas</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={startMines}
                      className="w-full bg-[#00e701] text-slate-950 font-black py-3.5 rounded-xl text-sm"
                    >
                      COMEÇAR RODADA
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => socket.emit('mines:cashout')}
                    disabled={minesGame.revealed.length === 0}
                    className="w-full bg-amber-500 disabled:opacity-40 text-slate-950 font-black py-3.5 rounded-xl text-sm"
                  >
                    {minesGame.revealed.length === 0
                      ? 'SELECIONE UMA CASA'
                      : `RETIRAR R$ ${(minesBet * minesGame.multiplier).toFixed(2)} (${minesGame.multiplier.toFixed(2)}x)`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              ESPORTES EM TEMPO REAL COMPLETO
             ================================================================= */}
          {view === 'sports' && (
            <div className="space-y-4">
              {/* Barra de Lance / Gol ao Vivo */}
              {liveSportsAlert && (
                <div className="bg-gradient-to-r from-emerald-500/20 via-[#00e701]/15 to-emerald-500/20 border border-[#00e701] text-white px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-between animate-pulse">
                  <span className="flex items-center gap-2">
                    <Activity size={16} className="text-[#00e701]" /> LANCE AO VIVO: {liveSportsAlert}
                  </span>
                  <span className="text-[10px] text-[#00e701]">ODDS ATUALIZADAS</span>
                </div>
              )}

              {/* Cabeçalho e Sub-abas (Jogos ao Vivo vs Minhas Apostas) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11161f] border border-slate-800 rounded-2xl p-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Trophy size={16} className="text-[#00e701]" /> Esportes ao Vivo • Tempo Real
                    <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                      LIVE
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cronômetro ao vivo, odds dinâmicas, apostas múltiplas e Cash Out instantâneo
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#090c10] p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setSportSubTab('matches')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition ${
                      sportSubTab === 'matches' ? 'bg-[#00e701] text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Eventos ao Vivo ({matches.length})
                  </button>
                  <button
                    onClick={() => setSportSubTab('mybets')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                      sportSubTab === 'mybets' ? 'bg-[#00e701] text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Meus Bilhetes</span>
                    {openSportBetsCount > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                        {openSportBetsCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {sportSubTab === 'matches' ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                  {/* Lista de Jogos ao Vivo */}
                  <div className="xl:col-span-8 space-y-3">
                    {/* Filtro de Modalidades */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {['Todos', 'Futebol', 'Basquete', 'Tênis', 'eSports', 'UFC / MMA'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { soundFX.click(); setSportCategory(cat); }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                            sportCategory === cat
                              ? 'bg-[#00e701] text-slate-950'
                              : 'bg-[#11161f] text-slate-300 border border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {filteredMatches.map((m) => (
                        <div
                          key={m.id}
                          className={`bg-[#11161f] border rounded-2xl p-4 transition ${
                            m.suspended ? 'border-amber-500/70' : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Topo: Modalidade + Liga + Relógio ao Vivo */}
                          <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-800 text-slate-200 font-extrabold px-2 py-0.5 rounded text-[10px]">
                                {m.sport}
                              </span>
                              <span className="text-slate-400 font-semibold">{m.league}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {m.suspended && (
                                <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                                  MERCADO SUSPENSO
                                </span>
                              )}
                              <span className="text-rose-500 font-black font-mono flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                {m.time}
                              </span>
                            </div>
                          </div>

                          {/* Placar ao Vivo */}
                          <div className="flex justify-between items-center font-black text-sm sm:text-base mb-2.5 bg-[#090c10] px-3.5 py-2.5 rounded-xl border border-slate-800/80">
                            <span className="truncate max-w-[38%]">{m.home}</span>
                            <span className="bg-[#11161f] border border-[#00e701]/40 px-3 py-1 rounded-lg text-xs sm:text-sm text-[#00e701] font-mono">
                              {m.score}
                            </span>
                            <span className="truncate max-w-[38%] text-right">{m.away}</span>
                          </div>

                          {/* Estatísticas ao Vivo */}
                          {m.stats && (
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3 px-1">
                              <span>Posse: {m.stats.possessionHome}% / {m.stats.possessionAway}%</span>
                              <span>Ataques/Pts: {m.stats.shotsHome} - {m.stats.shotsAway}</span>
                              {m.sport === 'Futebol' && (
                                <span>Escanteios: {m.stats.cornersHome} - {m.stats.cornersAway}</span>
                              )}
                            </div>
                          )}

                          {/* Odds Principais + Botão Todos os Mercados */}
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 grid ${m.oddDraw ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                              {[
                                { label: m.home, tag: '1', odd: m.oddHome, trend: m.trendHome },
                                ...(m.oddDraw ? [{ label: 'Empate', tag: 'X', odd: m.oddDraw, trend: m.trendDraw }] : []),
                                { label: m.away, tag: '2', odd: m.oddAway, trend: m.trendAway }
                              ].map((opt) => {
                                const selKey = `${m.id}-Resultado Final-${opt.label}`;
                                const isSelected = betSlip.some((s) => s.key === selKey);
                                return (
                                  <button
                                    key={opt.tag}
                                    disabled={m.suspended}
                                    onClick={() => toggleSportSelection(m, 'Resultado Final', opt.label, opt.odd)}
                                    className={`p-2.5 rounded-xl border flex justify-between items-center text-xs transition ${
                                      isSelected
                                        ? 'bg-[#00e701] border-[#00e701] text-slate-950 font-black'
                                        : 'bg-[#090c10] hover:border-slate-600 border-slate-800 text-slate-200'
                                    } disabled:opacity-40`}
                                  >
                                    <span className={isSelected ? 'text-slate-900 font-black' : 'text-slate-500 font-bold'}>
                                      {opt.tag}
                                    </span>
                                    <span className="flex items-center gap-1 font-extrabold">
                                      {opt.trend === 'up' && <TrendingUp size={12} className={isSelected ? 'text-slate-950' : 'text-[#00e701]'} />}
                                      {opt.trend === 'down' && <TrendingDown size={12} className={isSelected ? 'text-slate-950' : 'text-rose-500'} />}
                                      <span className={isSelected ? 'text-slate-950' : 'text-[#00e701]'}>
                                        {opt.odd.toFixed(2)}
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => { soundFX.click(); setExpandedMatchModal(m); }}
                              className="px-3 py-2.5 rounded-xl bg-[#1a2230] hover:bg-slate-700 border border-slate-700 text-[11px] font-black text-amber-300 shrink-0"
                              title="Abrir todos os mercados deste jogo"
                            >
                              +9 Mercados
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Boletim de Apostas (Simples & Múltipla) */}
                  <div className="xl:col-span-4 bg-[#11161f] border border-slate-800 rounded-2xl p-4 sticky top-20 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                      <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Layers size={15} className="text-[#00e701]" />
                        Boletim ({betSlip.length})
                      </span>
                      {betSlip.length > 0 && (
                        <button
                          onClick={() => setBetSlip([])}
                          className="text-[11px] text-rose-400 hover:underline font-bold"
                        >
                          Limpar tudo
                        </button>
                      )}
                    </div>

                    {betSlip.length === 0 ? (
                      <div className="text-center py-8 space-y-2">
                        <Trophy size={28} className="mx-auto text-slate-600" />
                        <p className="text-xs font-bold text-slate-300">Seu boletim está vazio</p>
                        <p className="text-[11px] text-slate-500">
                          Clique em qualquer odd ao vivo para montar uma aposta Simples ou Múltipla.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-[#00e701]/10 border border-[#00e701]/30 rounded-xl px-3 py-1.5 flex justify-between items-center text-[11px]">
                          <span className="font-extrabold text-[#00e701]">
                            {betSlip.length > 1 ? `APOSTA MÚLTIPLA (${betSlip.length} JOGOS)` : 'APOSTA SIMPLES'}
                          </span>
                          <span className="font-mono font-black text-white">Odd Total: {combinedSportOdd}x</span>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {betSlip.map((sel) => (
                            <div key={sel.key} className="bg-[#090c10] border border-slate-800 rounded-xl p-2.5 text-xs">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <p className="text-[10px] text-slate-400">{sel.matchTitle}</p>
                                  <p className="font-bold text-white mt-0.5">{sel.market}: <span className="text-[#00e701]">{sel.label}</span></p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-amber-400 font-mono">{sel.odd.toFixed(2)}</span>
                                  <button
                                    onClick={() => setBetSlip((prev) => prev.filter((x) => x.key !== sel.key))}
                                    className="text-slate-500 hover:text-rose-400"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Valor da Aposta (R$)
                          </label>
                          <input
                            type="number"
                            value={sportStake}
                            onChange={(e) => setSportStake(e.target.value)}
                            className="w-full bg-[#090c10] border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-black text-white"
                          />
                          <div className="grid grid-cols-4 gap-1.5 mt-2">
                            {[10, 25, 50, 100].map((v) => (
                              <button
                                key={v}
                                onClick={() => setSportStake(v)}
                                className="bg-[#090c10] hover:bg-slate-800 border border-slate-800 py-1 rounded-lg text-[11px] font-bold text-slate-300"
                              >
                                R$ {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-[#090c10] border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                          <span className="text-slate-400">Retorno Potencial</span>
                          <span className="text-base font-black text-[#00e701]">
                            R$ {(Number(sportStake || 0) * combinedSportOdd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <button
                          onClick={confirmSportBet}
                          className="w-full bg-[#00e701] hover:bg-[#00c801] text-slate-950 font-black py-3.5 rounded-xl text-xs shadow-lg shadow-[#00e701]/20"
                        >
                          CONFIRMAR BILHETE (R$ {Number(sportStake || 0).toFixed(2)})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Aba Meus Bilhetes com Cash Out ao Vivo */
                <div className="space-y-3 max-w-3xl mx-auto">
                  {sportBets.length === 0 ? (
                    <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-8 text-center">
                      <p className="text-xs text-slate-400">Você ainda não realizou nenhuma aposta esportiva.</p>
                    </div>
                  ) : (
                    sportBets.map((ticket) => (
                      <div key={ticket.id} className="bg-[#11161f] border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">#{ticket.id} • {ticket.type}</span>
                            <span className="text-[10px] text-slate-500">{ticket.createdAt}</span>
                          </div>
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              ticket.status === 'OPEN'
                                ? 'bg-amber-500/20 text-amber-300'
                                : ticket.status === 'WON'
                                ? 'bg-[#00e701]/20 text-[#00e701]'
                                : ticket.status === 'CASHED_OUT'
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {ticket.status === 'OPEN' && 'AO VIVO • EM ABERTO'}
                            {ticket.status === 'WON' && 'BILHETE GANHO'}
                            {ticket.status === 'CASHED_OUT' && 'ENCERRADO (CASH OUT)'}
                            {ticket.status === 'LOST' && 'NÃO VENCEDOR'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {ticket.selections.map((sel, i) => (
                            <div key={i} className="flex justify-between text-xs bg-[#090c10] px-3 py-2 rounded-xl">
                              <div>
                                <p className="text-[10px] text-slate-400">{sel.matchTitle}</p>
                                <p className="font-bold text-white">{sel.market}: <span className="text-[#00e701]">{sel.label}</span></p>
                              </div>
                              <span className="font-mono font-black text-amber-400 self-center">@{Number(sel.odd).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                          <div>
                            <span className="text-slate-400">Apostado: </span>
                            <span className="font-black text-white">R$ {Number(ticket.stake).toFixed(2)}</span>
                            <span className="text-slate-500 mx-2">|</span>
                            <span className="text-slate-400">Retorno: </span>
                            <span className="font-black text-[#00e701]">R$ {Number(ticket.potentialWin).toFixed(2)}</span>
                          </div>

                          {ticket.status === 'OPEN' && (
                            <button
                              onClick={() => socket.emit('sports:cashout', { ticketId: ticket.id })}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition"
                            >
                              CASH OUT R$ {Number(ticket.cashoutValue || ticket.stake * 0.9).toFixed(2)}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* === CARTEIRA PIX === */}
          {view === 'wallet' && (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-white">{userName}</p>
                  <p className="text-[10px] text-slate-400">ID #{accountId} • {userKey}</p>
                </div>
                <button
                  onClick={() => setView('profile')}
                  className="bg-slate-800 hover:bg-slate-700 text-[#00e701] text-[11px] font-bold px-3 py-1.5 rounded-xl transition"
                >
                  Ver Meu Perfil
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#11161f] p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => { setWalletTab('deposit'); setPixGenerated(false); }}
                  className={`py-2 rounded-lg text-xs font-extrabold ${
                    walletTab === 'deposit' ? 'bg-[#00e701] text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Depositar PIX
                </button>
                <button
                  onClick={() => setWalletTab('withdraw')}
                  className={`py-2 rounded-lg text-xs font-extrabold ${
                    walletTab === 'withdraw' ? 'bg-[#00e701] text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Sacar via PIX
                </button>
              </div>

              {walletTab === 'deposit' ? (
                <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4 space-y-3">
                  {!pixGenerated ? (
                    <form onSubmit={handleGeneratePix} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                          Valor do Depósito (Mín. R$ 5,00)
                        </label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full bg-[#090c10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-black text-white"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[20, 50, 100, 250].map((v) => (
                          <button
                            type="button"
                            key={v}
                            onClick={() => setDepositAmount(String(v))}
                            className="bg-[#090c10] border border-slate-800 py-1.5 rounded-lg text-xs font-bold text-slate-300"
                          >
                            R$ {v}
                          </button>
                        ))}
                      </div>
                      <button className="w-full bg-[#00e701] text-slate-950 font-black py-3 rounded-xl text-xs">
                        GERAR QR CODE PIX
                      </button>
                    </form>
                  ) : (
                    <div className="text-center space-y-3">
                      <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full">
                        Aguardando compensação • R$ {Number(depositAmount).toFixed(2)}
                      </span>
                      <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-xl flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-950">
                          <rect x="10" y="10" width="25" height="25" />
                          <rect x="65" y="10" width="25" height="25" />
                          <rect x="10" y="65" width="25" height="25" />
                          <rect x="42" y="15" width="12" height="12" />
                          <rect x="45" y="45" width="15" height="15" />
                          <rect x="68" y="68" width="20" height="20" />
                          <rect x="15" y="45" width="18" height="10" />
                        </svg>
                      </div>
                      <button
                        onClick={() => showToast('Código PIX Copia e Cola copiado!')}
                        className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Copy size={14} /> Copiar Código PIX
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4">
                  <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chave PIX de Destino</label>
                      <input
                        type="text"
                        placeholder="CPF, Celular ou E-mail"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="w-full bg-[#090c10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Valor R$"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-1/2 bg-[#090c10] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                      />
                      <button className="flex-1 bg-[#00e701] text-slate-950 font-black rounded-xl text-xs">
                        CONFIRMAR SAQUE
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-[#11161f] border border-slate-800 rounded-2xl p-4">
                <h3 className="text-xs font-extrabold uppercase text-slate-400 mb-3">
                  Histórico de Movimentações
                </h3>
                {transactions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Nenhuma movimentação registrada nesta conta ainda.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {transactions.slice(0, 15).map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => tx.type === 'WITHDRAW' && setReceiptModal(tx)}
                        className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 last:border-none cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${tx.amount >= 0 ? 'bg-[#00e701]/10 text-[#00e701]' : 'bg-slate-800 text-slate-300'}`}>
                            {tx.amount >= 0 ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{tx.title}</p>
                            <p className="text-[10px] text-slate-500">{tx.time} • {tx.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-extrabold ${tx.amount >= 0 ? 'text-[#00e701]' : 'text-white'}`}>
                            {tx.amount >= 0 ? `+ R$ ${tx.amount.toFixed(2)}` : `- R$ ${Math.abs(tx.amount).toFixed(2)}`}
                          </p>
                          <span className="text-[10px] text-[#00e701] font-semibold">{tx.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Todos os Mercados da Partida ao Vivo */}
      {expandedMatchModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#11161f] border border-slate-800 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase">
                  {expandedMatchModal.sport} • {expandedMatchModal.time}
                </span>
                <h3 className="text-sm font-black text-white">
                  {expandedMatchModal.home} {expandedMatchModal.score} {expandedMatchModal.away}
                </h3>
              </div>
              <button
                onClick={() => setExpandedMatchModal(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 text-xs">
              {/* Mercado 1: Resultado Final */}
              <div className="bg-[#090c10] p-3 rounded-2xl border border-slate-800">
                <p className="text-[11px] font-extrabold text-slate-400 mb-2">Resultado Final</p>
                <div className={`grid ${expandedMatchModal.oddDraw ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {[
                    { label: expandedMatchModal.home, odd: expandedMatchModal.oddHome },
                    ...(expandedMatchModal.oddDraw ? [{ label: 'Empate', odd: expandedMatchModal.oddDraw }] : []),
                    { label: expandedMatchModal.away, odd: expandedMatchModal.oddAway }
                  ].map((o) => (
                    <button
                      key={o.label}
                      onClick={() => toggleSportSelection(expandedMatchModal, 'Resultado Final', o.label, o.odd)}
                      className="p-2.5 rounded-xl bg-[#11161f] border border-slate-700 hover:border-[#00e701] flex justify-between font-bold"
                    >
                      <span className="truncate">{o.label}</span>
                      <span className="text-[#00e701]">{o.odd.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mercado 2: Total de Gols / Pontos (Over / Under) */}
              {expandedMatchModal.extraMarkets && (
                <>
                  <div className="bg-[#090c10] p-3 rounded-2xl border border-slate-800">
                    <p className="text-[11px] font-extrabold text-slate-400 mb-2">Total de Gols / Pontos (Over/Under)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => toggleSportSelection(expandedMatchModal, 'Total Over/Under', 'Mais de 2.5', expandedMatchModal.extraMarkets.over25)}
                        className="p-2.5 rounded-xl bg-[#11161f] border border-slate-700 hover:border-[#00e701] flex justify-between font-bold"
                      >
                        <span>Mais (Over)</span>
                        <span className="text-[#00e701]">{expandedMatchModal.extraMarkets.over25.toFixed(2)}</span>
                      </button>
                      <button
                        onClick={() => toggleSportSelection(expandedMatchModal, 'Total Over/Under', 'Menos de 2.5', expandedMatchModal.extraMarkets.under25)}
                        className="p-2.5 rounded-xl bg-[#11161f] border border-slate-700 hover:border-[#00e701] flex justify-between font-bold"
                      >
                        <span>Menos (Under)</span>
                        <span className="text-[#00e701]">{expandedMatchModal.extraMarkets.under25.toFixed(2)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mercado 3: Ambas Marcam */}
                  <div className="bg-[#090c10] p-3 rounded-2xl border border-slate-800">
                    <p className="text-[11px] font-extrabold text-slate-400 mb-2">Ambas Equipes Pontuam / Marcam</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => toggleSportSelection(expandedMatchModal, 'Ambas Marcam', 'Sim', expandedMatchModal.extraMarkets.bttsYes)}
                        className="p-2.5 rounded-xl bg-[#11161f] border border-slate-700 hover:border-[#00e701] flex justify-between font-bold"
                      >
                        <span>Sim</span>
                        <span className="text-[#00e701]">{expandedMatchModal.extraMarkets.bttsYes.toFixed(2)}</span>
                      </button>
                      <button
                        onClick={() => toggleSportSelection(expandedMatchModal, 'Ambas Marcam', 'Não', expandedMatchModal.extraMarkets.bttsNo)}
                        className="p-2.5 rounded-xl bg-[#11161f] border border-slate-700 hover:border-[#00e701] flex justify-between font-bold"
                      >
                        <span>Não</span>
                        <span className="text-[#00e701]">{expandedMatchModal.extraMarkets.bttsNo.toFixed(2)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mercado 4: Dupla Chance */}
                  <div className="bg-[#090c10] p-3 rounded-2xl border border-slate-800">
                    <p className="text-[11px] font-extrabold text-slate-400 mb-2">Dupla Chance</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '1X', odd: expandedMatchModal.extraMarkets.dc1X },
                        { label: '12', odd: expandedMatchModal.extraMarkets.dc12 },
                        { label: 'X2', odd: expandedMatchModal.extraMarkets.dcX2 }
                      ].map((dc) => (
                        <button
                          key={dc.label}
                          onClick={() => toggleSportSelection(expandedMatchModal, 'Dupla Chance', dc.label, dc.odd)}
                          className="p-2.5 rounded-xl bg-[#11161f] border border-slate-700 hover:border-[#00e701] flex justify-between font-bold"
                        >
                          <span>{dc.label}</span>
                          <span className="text-[#00e701]">{dc.odd.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mercado 5: Handicap */}
                  <div className="bg-[#090c10] p-3 rounded-2xl border border-slate-800">
                    <p className="text-[11px] font-extrabold text-slate-400 mb-2">Handicap Asiático</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => toggleSportSelection(expandedMatchModal, 'Handicap', `${expandedMatchModal.home} (-1.5)`, expandedMatchModal.extraMarkets.handicapHome)}
                        className="p-2.5 rounded-xl bg-[#11161f] border border-slate-700 hover:border-[#00e701] flex justify-between font-bold"
                      >
                        <span className="truncate">{expandedMatchModal.home} -1.5</span>
                        <span className="text-[#00e701]">{expandedMatchModal.extraMarkets.handicapHome.toFixed(2)}</span>
                      </button>
                      <button
                        onClick={() => toggleSportSelection(expandedMatchModal, 'Handicap', `${expandedMatchModal.away} (+1.5)`, expandedMatchModal.extraMarkets.handicapAway)}
                        className="p-2.5 rounded-xl bg-[#11161f] border border-slate-700 hover:border-[#00e701] flex justify-between font-bold"
                      >
                        <span className="truncate">{expandedMatchModal.away} +1.5</span>
                        <span className="text-[#00e701]">{expandedMatchModal.extraMarkets.handicapAway.toFixed(2)}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setExpandedMatchModal(null)}
              className="w-full bg-[#00e701] text-slate-950 font-black py-3 rounded-xl text-xs"
            >
              CONCLUIR SELEÇÃO ({betSlip.length} NO BOLETIM)
            </button>
          </div>
        </div>
      )}

      {/* Navegação Inferior Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#11161f] border-t border-slate-800/90 grid grid-cols-5 py-2.5 z-40">
        {[
          { id: 'lobby', label: 'Cassino', icon: Home },
          { id: 'slots', label: 'PG Soft', icon: Gamepad2 },
          { id: 'crash', label: 'Aviator', icon: Rocket },
          { id: 'sports', label: 'Esportes', icon: Trophy },
          { id: 'profile', label: 'Perfil', icon: User }
        ].map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { soundFX.click(); setView(item.id); }}
              className={`flex flex-col items-center text-[10px] font-bold transition ${
                active ? 'text-[#00e701]' : 'text-slate-500'
              }`}
            >
              <Icon size={18} className="mb-1" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Modal Comprovante PIX */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-xs w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <span className="font-black text-sm flex items-center gap-1.5 text-emerald-700">
                <Receipt size={16} /> COMPROVANTE PIX
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                CONCLUÍDO
              </span>
            </div>
            <div className="text-center my-4">
              <span className="text-[11px] text-slate-500 block">Valor Transferido</span>
              <span className="text-2xl font-black text-slate-950">
                R$ {Math.abs(receiptModal.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Chave Destino:</span>
                <span className="font-bold">{receiptModal.key || 'Chave Cadastrada'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Instituição:</span>
                <span className="font-bold">APEX PAY PAGAMENTOS LTDA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Autenticação:</span>
                <span className="font-mono text-[10px]">{receiptModal.id}</span>
              </div>
            </div>
            <button
              onClick={() => setReceiptModal(null)}
              className="w-full mt-5 bg-slate-900 text-white font-bold py-3 rounded-xl text-xs"
            >
              FECHAR COMPROVANTE
            </button>
          </div>
        </div>
      )}

      {/* PAINEL SECRETO DO ADMINISTRADOR (5 CLIQUES NO LOGO APEXBET) */}
      {showAdmin && (
        <div className="fixed inset-0 bg-[#090c10]/95 z-50 p-5 overflow-y-auto">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <span className="font-black text-[#00e701] flex items-center gap-2 text-sm">
                <ShieldAlert size={18} /> CONTROLE DA BANCA
              </span>
              <button onClick={() => setShowAdmin(false)} className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg">
                Fechar
              </button>
            </div>

            <div className="space-y-4">
              {pendingDeposits.length > 0 && (
                <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/40">
                  <p className="text-xs font-black text-amber-300 mb-2">Depósitos PIX Gerados ({pendingDeposits.length})</p>
                  <div className="space-y-2">
                    {pendingDeposits.map((dep) => (
                      <div key={dep.id} className="flex items-center justify-between bg-[#090c10] p-2.5 rounded-lg text-xs">
                        <div>
                          <p className="font-bold text-white">{dep.userName}</p>
                          <p className="text-[#00e701] font-extrabold">R$ {dep.amount.toFixed(2)} • {dep.time}</p>
                        </div>
                        <button
                          onClick={() => socket.emit('admin:approveDeposit', { depositId: dep.id })}
                          className="bg-[#00e701] text-slate-950 font-black px-3 py-1.5 rounded-lg"
                        >
                          Aprovar PIX
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#11161f] p-3.5 rounded-xl border border-[#00e701]/40">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-300">Meu Saldo Atual</p>
                  <span className="text-sm font-black text-[#00e701]">
                    R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-xs font-black mb-2.5">
                  <button onClick={() => addToMyOwnBalance(50)} className="bg-emerald-500/20 text-[#00e701] border border-[#00e701]/30 py-2 rounded-lg">
                    +R$ 50
                  </button>
                  <button onClick={() => addToMyOwnBalance(150)} className="bg-emerald-500/20 text-[#00e701] border border-[#00e701]/30 py-2 rounded-lg">
                    +R$ 150
                  </button>
                  <button onClick={() => addToMyOwnBalance(500)} className="bg-emerald-500/20 text-[#00e701] border border-[#00e701]/30 py-2 rounded-lg">
                    +R$ 500
                  </button>
                  <button onClick={() => setMyOwnBalance(0)} className="bg-rose-600/25 text-rose-400 border border-rose-500/30 py-2 rounded-lg">
                    Zerar
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={myCustomBalance}
                    onChange={(e) => setMyCustomBalance(e.target.value)}
                    className="flex-1 bg-[#090c10] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold"
                  />
                  <button
                    onClick={() => setMyOwnBalance(myCustomBalance)}
                    className="bg-[#00e701] text-slate-950 px-3.5 py-2 rounded-lg text-xs font-black"
                  >
                    Definir Saldo
                  </button>
                </div>
              </div>

              <div className="bg-[#11161f] p-3.5 rounded-xl border border-amber-500/40 space-y-2.5">
                <p className="text-xs font-black text-amber-300">Capas dos Jogos (Foto Original)</p>
                <select
                  value={selectedCoverGameId}
                  onChange={(e) => setSelectedCoverGameId(e.target.value)}
                  className="w-full bg-[#090c10] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold"
                >
                  {GAMES_CATALOG.map((g) => (
                    <option key={g.id} value={g.id}>{g.title} ({g.provider})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cole o link https://... da imagem"
                    value={coverUrlInput}
                    onChange={(e) => setCoverUrlInput(e.target.value)}
                    className="flex-1 bg-[#090c10] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!coverUrlInput.trim()) return;
                      saveCustomCover(selectedCoverGameId, coverUrlInput.trim());
                      setCoverUrlInput('');
                    }}
                    className="bg-[#00e701] text-slate-950 font-black px-3 rounded-lg text-xs"
                  >
                    Aplicar
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-center py-2 rounded-lg text-xs font-bold cursor-pointer">
                    Escolher Foto do Dispositivo
                    <input type="file" accept="image/*" onChange={handleCoverFileUpload} className="hidden" />
                  </label>
                  {customCovers[selectedCoverGameId] && (
                    <button
                      type="button"
                      onClick={() => saveCustomCover(selectedCoverGameId, null)}
                      className="bg-rose-600/25 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-lg text-xs font-bold"
                    >
                      Restaurar
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#11161f] p-3.5 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-slate-400 mb-2">Próxima Jogada (PG Soft / Double / Mines / Esportes)</p>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <button onClick={() => { socket.emit('admin:setRig', 'FORCE_WIN'); showToast('Próxima jogada: GANHO'); }} className="bg-[#00e701] text-slate-950 py-2 rounded-lg">
                    Forçar Ganho
                  </button>
                  <button onClick={() => { socket.emit('admin:setRig', 'FORCE_LOSE'); showToast('Próxima jogada: PERDA'); }} className="bg-rose-600 py-2 rounded-lg">
                    Forçar Perda
                  </button>
                  <button onClick={() => { socket.emit('admin:setRig', 'NORMAL'); showToast('Modo normal ativado'); }} className="bg-slate-700 py-2 rounded-lg">
                    Normal
                  </button>
                </div>
              </div>

              <div className="bg-[#11161f] p-3.5 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-slate-400 mb-2">Controle do Aviator</p>
                <button onClick={() => socket.emit('admin:explodeNow')} className="w-full bg-rose-600 font-black py-2.5 rounded-lg text-xs">
                  FAZER VOAR AGORA
                </button>
              </div>

              <div className="bg-[#11161f] p-3.5 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-slate-400 mb-2">Notificação na Tela de Todos</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!adminMsg.trim()) return;
                    socket.emit('admin:broadcastToast', adminMsg);
                    setAdminMsg('');
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ex: Saque PIX de R$ 450,00 aprovado!"
                    value={adminMsg}
                    onChange={(e) => setAdminMsg(e.target.value)}
                    className="flex-1 bg-[#090c10] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button className="bg-amber-500 text-slate-950 font-black px-3 rounded-lg text-xs flex items-center gap-1">
                    <Send size={13} /> Enviar
                  </button>
                </form>
              </div>

              <div className="bg-[#11161f] p-3.5 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-slate-400 mb-2">Contas Cadastradas no Banco ({dbUsers.length})</p>
                {dbUsers.map((u) => (
                  <div key={u.key} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-none text-xs">
                    <div>
                      <p className="font-bold flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${u.online ? 'bg-[#00e701]' : 'bg-slate-600'}`} />
                        {u.name} {u.key === userKey && <span className="text-[#00e701]">(Você)</span>}
                      </p>
                      <p className="text-[10px] text-slate-400">{u.key} • Saldo R$ {u.balance.toFixed(2)} • Rodou R$ {(u.totalWagered || 0).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => socket.emit('admin:setUserBalance', { userKey: u.key, amount: myCustomBalance })}
                      className="bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded font-bold"
                    >
                      Aplicar R$ {myCustomBalance}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}