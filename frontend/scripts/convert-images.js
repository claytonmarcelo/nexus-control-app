import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../src/assets');

// Converter hero.png para hero.webp
sharp(path.join(assetsDir, 'hero.png'))
  .webp({ quality: 80 })
  .toFile(path.join(assetsDir, 'hero.webp'))
  .then(() => {
    console.log('✅ hero.png convertido para hero.webp com sucesso');
  })
  .catch(err => {
    console.error('❌ Erro ao converter imagem:', err);
    process.exit(1);
  });
