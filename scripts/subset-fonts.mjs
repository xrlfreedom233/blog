// 生成本站专用的中文字体子集。
//
// 全站（含所有文章与组件 UI 文案）只用到约 1000 个字符，因此把 MiSans
// 裁剪成只含这些字的 woff2，既能保留统一的字形观感，又不会拖慢首屏。
//
// 使用：
//   npm run fonts            # 手动生成 / 更新子集
//
// 该脚本已接入 build 与 dev，正常无需手动执行：新增文章后只要构建，
// 子集就会自动重新生成。源字体缓存在 assets/fonts-src/（已 gitignore），
// 缺失时会自动从 GitHub 镜像下载；离线且已有产物时会跳过而不报错。

import subsetFont from 'subset-font';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcFontDir = join(root, 'assets/fonts-src');
const outDir = join(root, 'public/fonts');

const FONTS = [
  {
    file: 'MiSans-Regular.ttf',
    url: 'https://raw.githubusercontent.com/whjkd2005/MiSans-Fonts/main/MiSans-Regular.ttf',
    out: 'misans-regular.woff2',
  },
  {
    file: 'MiSans-Demibold.ttf',
    url: 'https://raw.githubusercontent.com/whjkd2005/MiSans-Fonts/main/MiSans-Demibold.ttf',
    out: 'misans-demibold.woff2',
  },
];

const SCAN_EXTENSIONS = new Set(['.md', '.mdx', '.astro', '.ts', '.js', '.mjs', '.json', '.css']);

// 额外保留的符号/标点，覆盖代码块、日期、箭头、全角标点等动态内容。
const EXTRA_CHARS =
  '\u3000\u3001\u3002\u3013\u3008\u3009\u300a\u300b\u300c\u300d\u300e\u300f' +
  '\u3010\u3011\u3014\u3015\u3016\u3017\uff01\uff02\uff03\uff04\uff05\uff06' +
  '\uff07\uff08\uff09\uff0a\uff0b\uff0c\uff0d\uff0e\uff0f\uff10\uff11\uff12' +
  '\uff13\uff14\uff15\uff16\uff17\uff18\uff19\uff1a\uff1b\uff1c\uff1d\uff1e' +
  '\uff1f\uff20\uff3b\uff3c\uff3d\uff3e\uff3f\uff40\uff5b\uff5c\uff5d\uff5e' +
  '\u00b7\u2014\u2026\u2018\u2019\u201c\u201d\u2022\u2192\u2190\u2191\u2193' +
  '\u21d4\u21d2\u2713\u2715\u00d7\u00f7\u00b0\u00b1\u2248\u2264\u2265\u221e' +
  '\u221a\u2122\u00a9\u00ae\u2116\u2103\u339e\u20ac\u00a3\u00a5\u00a2\u00a7' +
  '\u00b6\u2020\u2021';

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (SCAN_EXTENSIONS.has(extname(entry.name))) files.push(full);
  }
  return files;
}

function collectText() {
  const chars = new Set();
  for (const file of walk(join(root, 'src'))) {
    for (const ch of readFileSync(file, 'utf-8')) chars.add(ch);
  }
  for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c));
  for (const ch of EXTRA_CHARS) chars.add(ch);
  chars.delete('\n');
  chars.delete('\r');
  chars.delete('\t');
  return [...chars].sort().join('');
}

async function ensureSource(font) {
  const target = join(srcFontDir, font.file);
  if (existsSync(target)) return target;
  mkdirSync(srcFontDir, { recursive: true });
  console.log(`下载源字体 ${font.file} ...`);
  const res = await fetch(font.url);
  if (!res.ok) throw new Error(`下载失败 ${font.url}: ${res.status}`);
  writeFileSync(target, Buffer.from(await res.arrayBuffer()));
  return target;
}

async function main() {
  const text = collectText();
  const cjk = [...text].filter((c) => c >= '\u4e00' && c <= '\u9fff').length;
  console.log(`字符集：共 ${[...text].length} 个字符（其中汉字 ${cjk} 个）`);

  mkdirSync(outDir, { recursive: true });
  for (const font of FONTS) {
    const outPath = join(outDir, font.out);
    let src;
    try {
      src = await ensureSource(font);
    } catch (err) {
      // 离线等情况下拿不到源字体：只要已有产物就继续，避免阻断构建。
      if (existsSync(outPath) && statSync(outPath).size > 0) {
        console.warn(`  ! ${font.file} 获取失败，沿用已有 ${font.out}`);
        continue;
      }
      throw err;
    }
    const out = await subsetFont(readFileSync(src), text, { targetFormat: 'woff2' });
    writeFileSync(outPath, out);
    console.log(`  ${font.out}  ${(out.length / 1024).toFixed(1)} KB`);
  }
  console.log('字体子集生成完成。');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
