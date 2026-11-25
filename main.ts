// Warung Kilat's hand-in (Node 22, standard library only): the game is this
// directory's game/ folder — plain static files a desktop browser loads
// offline — and the program hands it in. It copies game/ and screenshots/
// from beside this file to /output and writes /output/dossier.json, the summary
// the judge reads, with the vendored make.fun library.
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

/** The entry is only hand-inable when its game and its screenshots are there. */
function checkEntry() {
  const index = join(here, 'game', 'index.html');
  if (!existsSync(index)) throw new Error('game/index.html is missing');
  const shots = join(here, 'screenshots');
  if (!existsSync(shots)) throw new Error('screenshots/ is missing');
  const files = readdirSync(shots).filter((name) => !name.startsWith('.'));
  if (files.length < 3 || files.length > 4) {
    throw new Error(`screenshots/ must hold 3 or 4 images, found ${files.length}`);
  }
  for (const name of files) {
    const size = statSync(join(shots, name)).size;
    if (size > DOSSIER_OPTIONS.screenshots.max_bytes) {
      throw new Error(`screenshot ${name} is ${size} bytes, over the 256 KiB cap`);
    }
  }
  return files;
}

function handIn() {
  const shots = checkEntry();
  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  const dossier = buildDossier(out, DOSSIER_OPTIONS);
  writeFileSync(join(out, 'dossier.json'), dossier);
  return { shots: shots.length, dossierBytes: Buffer.byteLength(dossier, 'utf8') };
}

const result = handIn();
console.log(`handed in ${result.shots} screenshots, dossier ${result.dossierBytes} bytes -> ${out}`);
