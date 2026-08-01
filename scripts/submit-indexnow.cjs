const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DOMAIN = 'https://aisaichang.cn';
const HOST = 'aisaichang.cn';
const KEY = 'e39fcde67c7542b764b4bc604c1b22d4';
const KEY_LOCATION = `${DOMAIN}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const ACCEPTED_STATUS = new Set([200, 202]);

function parseArgs(argv) {
  let sitemap = path.join(ROOT, '.seo-build', 'sitemap.xml');
  let dryRun = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--sitemap' && argv[index + 1]) {
      sitemap = path.resolve(ROOT, argv[index + 1]);
      index += 1;
    } else if (argument === '--dry-run') {
      dryRun = true;
    }
  }
  return { sitemap, dryRun };
}

function parseSitemap(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Sitemap not found: ${filePath}`);
  const xml = fs.readFileSync(filePath, 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  if (!urls.length) throw new Error('Sitemap contains no <loc> entries.');
  if (urls.length > 10000) throw new Error(`IndexNow accepts at most 10,000 URLs per request; received ${urls.length}.`);

  const unique = [...new Set(urls)];
  if (unique.length !== urls.length) throw new Error('Sitemap contains duplicate URLs.');

  for (const value of unique) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== HOST) {
      throw new Error(`URL does not belong to ${HOST}: ${value}`);
    }
    if (url.hash) throw new Error(`Hash URLs cannot be submitted: ${value}`);
  }
  return unique;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function verifyKeyFile() {
  const delays = [0, 5000, 15000, 30000];
  let lastError = null;
  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt]) await sleep(delays[attempt]);
    try {
      const response = await fetch(KEY_LOCATION, {
        headers: { 'user-agent': 'AI-Saichang-IndexNow/0.8' },
        signal: AbortSignal.timeout(15000),
      });
      const body = (await response.text()).trim();
      if (response.ok && body === KEY) return;
      lastError = new Error(`Key verification returned HTTP ${response.status} with unexpected content.`);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`IndexNow key file is not publicly verifiable at ${KEY_LOCATION}: ${lastError?.message || 'unknown error'}`);
}

async function submit(urlList) {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };
  const delays = [0, 5000, 15000];
  let lastResult = null;

  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt]) await sleep(delays[attempt]);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'user-agent': 'AI-Saichang-IndexNow/0.8',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      const text = await response.text();
      lastResult = { status: response.status, text: text.trim() };
      if (ACCEPTED_STATUS.has(response.status)) return lastResult;
      if (![403, 429, 500, 502, 503, 504].includes(response.status)) break;
    } catch (error) {
      lastResult = { status: 0, text: error.message };
    }
  }

  throw new Error(`IndexNow submission failed: HTTP ${lastResult?.status ?? 0}${lastResult?.text ? ` — ${lastResult.text}` : ''}`);
}

async function main() {
  const { sitemap, dryRun } = parseArgs(process.argv.slice(2));
  const urlList = parseSitemap(sitemap);
  const payloadSummary = {
    host: HOST,
    keyLocation: KEY_LOCATION,
    urlCount: urlList.length,
    firstUrl: urlList[0],
    lastUrl: urlList[urlList.length - 1],
  };

  if (dryRun) {
    const localKeyPath = path.join(ROOT, `${KEY}.txt`);
    if (!fs.existsSync(localKeyPath)) throw new Error(`Local IndexNow key file is missing: ${localKeyPath}`);
    if (fs.readFileSync(localKeyPath, 'utf8').trim() !== KEY) throw new Error('Local IndexNow key file content does not match the configured key.');
    console.log(JSON.stringify({ dryRun: true, ...payloadSummary }, null, 2));
    return;
  }

  await verifyKeyFile();
  const result = await submit(urlList);
  console.log(JSON.stringify({ accepted: true, status: result.status, ...payloadSummary }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
