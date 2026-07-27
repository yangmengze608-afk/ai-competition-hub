import fs from 'node:fs/promises';
import path from 'node:path';
import { dedupeCompetitions, normalizeCompetition } from './lib/competition.mjs';
import { fetchMlhCompetitions } from './sources/mlh.mjs';
import { fetchKaggleCompetitions } from './sources/kaggle.mjs';

const ROOT = process.cwd();
const JSON_PATH = path.join(ROOT, 'data/competitions.generated.json');
const JS_PATH = path.join(ROOT, 'data/competitions.generated.js');
const MANUAL_PATH = path.join(ROOT, 'data/competitions.manual.json');
const REPORT_PATH = path.join(ROOT, 'data/competition-sync-report.json');
const fetchedAt = new Date().toISOString();

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function previousForSource(previous, sourceName) {
  return (previous.competitions || []).filter((item) => item.sourceName === sourceName);
}

async function collectAdapter({ id, sourceName, fetcher }) {
  try {
    const output = await fetcher({ now: new Date() });
    const rawRecords = Array.isArray(output) ? output : output.records || [];
    const records = rawRecords.map((item) => normalizeCompetition(item, fetchedAt)).filter(Boolean);
    return {
      id,
      sourceName,
      status: records.length ? 'ok' : output?.skipped ? 'skipped' : 'empty',
      reason: output?.skipped || null,
      count: records.length,
      records,
    };
  } catch (error) {
    return { id, sourceName, status: 'failed', reason: error.message, count: 0, records: [] };
  }
}

const previous = await readJson(JSON_PATH, { competitions: [] });
const manual = await readJson(MANUAL_PATH, { competitions: [] });
const adapters = [
  { id: 'mlh', sourceName: 'Major League Hacking', fetcher: fetchMlhCompetitions },
  { id: 'kaggle', sourceName: 'Kaggle', fetcher: fetchKaggleCompetitions },
];

const results = [];
for (const adapter of adapters) {
  const result = await collectAdapter(adapter);
  if (!result.records.length) {
    const retained = previousForSource(previous, adapter.sourceName);
    if (retained.length) {
      result.records = retained;
      result.count = retained.length;
      result.retainedLastGood = true;
    }
  }
  results.push(result);
}

const manualRecords = (manual.competitions || [])
  .map((item) => normalizeCompetition(item, fetchedAt))
  .filter(Boolean);

let competitions = dedupeCompetitions([
  ...results.flatMap((result) => result.records),
  ...manualRecords,
]);

const cutoff = Date.now() - 90 * 86400000;
competitions = competitions.filter((item) => new Date(item.deadline).getTime() >= cutoff);

if (!competitions.length) {
  throw new Error('Sync produced zero competitions; refusing to overwrite last good snapshot.');
}

const payload = {
  version: '1.0.0',
  generatedAt: fetchedAt,
  live: true,
  count: competitions.length,
  sources: results.map(({ records, ...result }) => result),
  competitions,
};

const jsPayload = [
  'window.AI_DATA = window.AI_DATA || {};',
  `window.AI_DATA.competitions = ${JSON.stringify(competitions, null, 2)};`,
  'window.AI_DATA.liveMode = true;',
  `window.AI_DATA.syncMeta = ${JSON.stringify({
    version: payload.version,
    generatedAt: payload.generatedAt,
    count: payload.count,
    sources: payload.sources,
  }, null, 2)};`,
  '',
].join('\n');

await fs.mkdir(path.dirname(JSON_PATH), { recursive: true });
await fs.writeFile(JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
await fs.writeFile(JS_PATH, jsPayload, 'utf8');
await fs.writeFile(REPORT_PATH, `${JSON.stringify({ generatedAt: fetchedAt, count: competitions.length, sources: payload.sources }, null, 2)}\n`, 'utf8');

console.log(`Synced ${competitions.length} competitions.`);
for (const source of payload.sources) {
  console.log(`- ${source.id}: ${source.status}, ${source.count} records${source.retainedLastGood ? ' (retained last good)' : ''}`);
}
