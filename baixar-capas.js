import fs from 'fs';
import path from 'path';

const COVERS_DIR = path.resolve('client/public/covers');
fs.mkdirSync(COVERS_DIR, { recursive: true });

const GAMES = [
  { id: 'fortune-tiger', url: 'https://www.pgsoft.com/en/games/110/' },
  { id: 'fortune-ox', url: 'https://www.pgsoft.com/en/games/83/' },
  { id: 'fortune-rabbit', url: 'https://www.pgsoft.com/en/games/129/' },
  { id: 'fortune-dragon', url: 'https://www.pgsoft.com/en/games/149/' },
  { id: 'fortune-mouse', url: 'https://www.pgsoft.com/en/games/53/' },
  { id: 'wild-bandito', url: 'https://www.pgsoft.com/en/games/92/' },
  { id: 'gates-olympus', url: 'https://www.pragmaticplay.com/br/jogos/gates-of-olympus/' },
  { id: 'gates-olympus-1000', url: 'https://www.pragmaticplay.com/br/jogos/gates-of-olympus-1000/' },
  { id: 'sweet-bonanza', url: 'https://www.pragmaticplay.com/br/jogos/sweet-bonanza/' },
  { id: 'sweet-bonanza-1000', url: 'https://www.pragmaticplay.com/br/jogos/sweet-bonanza-1000/' },
  { id: 'sugar-rush', url: 'https://www.pragmaticplay.com/br/jogos/sugar-rush/' },
  { id: 'sugar-rush-1000', url: 'https://www.pragmaticplay.com/br/jogos/sugar-rush-1000/' },
  { id: 'big-bass', url: 'https://www.pragmaticplay.com/br/jogos/big-bass-bonanza/' },
  { id: 'big-bass-splash', url: 'https://www.pragmaticplay.com/br/jogos/big-bass-splash/' },
  { id: 'starlight-princess', url: 'https://www.pragmaticplay.com/br/jogos/starlight-princess/' },
  { id: 'starlight-princess-1000', url: 'https://www.pragmaticplay.com/br/jogos/starlight-princess-1000/' },
  { id: 'zeus-hades', url: 'https://www.pragmaticplay.com/br/jogos/zeus-vs-hades-gods-of-war/' },
  { id: 'the-dog-house', url: 'https://www.pragmaticplay.com/br/jogos/the-dog-house-megaways/' },
  { id: 'the-dog-house-megaways', url: 'https://www.pragmaticplay.com/br/jogos/the-dog-house-megaways/' },
  { id: 'fruit-party', url: 'https://www.pragmaticplay.com/br/jogos/fruit-party/' },
  { id: 'wolf-gold', url: 'https://www.pragmaticplay.com/br/jogos/wolf-gold/' },
  { id: 'wild-west-gold', url: 'https://www.pragmaticplay.com/br/jogos/wild-west-gold/' },
  { id: 'aviator', url: 'https://www.spribe.co/games/aviator' },
  { id: 'mines', url: 'https://spribe.co/games/mines' }
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

for (const game of GAMES) {
  try {
    const res = await fetch(game.url, { headers });
    const html = await res.text();
    const match =
      html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    if (!match?.[1]) {
      console.log(`⚠️ Capa não encontrada automaticamente para: ${game.id}`);
      continue;
    }

    const imgUrl = new URL(match[1], game.url).href;
    const imgRes = await fetch(imgUrl, { headers });
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    if (buffer.length > 1000) {
      fs.writeFileSync(path.join(COVERS_DIR, `${game.id}.jpg`), buffer);
      console.log(`✅ Baixado: ${game.id}.jpg (${Math.round(buffer.length / 1024)} KB)`);
    }
  } catch (err) {
    console.log(`❌ Erro em ${game.id}: ${err.message}`);
  }
}