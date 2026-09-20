import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { basename, extname } from 'node:path';

const accessKey = process.env.DOGECLOUD_ACCESS_KEY;
const secretKey = process.env.DOGECLOUD_SECRET_KEY;
const beforeSha = process.env.BEFORE_SHA;
const currentSha = process.env.CURRENT_SHA;

if (!accessKey || !secretKey) {
  throw new Error('Missing DOGECLOUD_ACCESS_KEY or DOGECLOUD_SECRET_KEY');
}

if (!/^[0-9a-f]{40}$/i.test(beforeSha ?? '') || !/^[0-9a-f]{40}$/i.test(currentSha ?? '')) {
  throw new Error('Missing or invalid BEFORE_SHA/CURRENT_SHA');
}

const SITE_URL = 'https://blog.xrlfreedom.top/';
const POLL_INTERVAL_MS = 3000;
const REFRESH_WAIT_MS = 120000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function postPathToUrl(path) {
  const extension = extname(path);
  const filename = basename(path, extension);
  const slug = filename
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');

  if (!slug) throw new Error(`Unable to derive a slug from ${path}`);
  return new URL(`/blog/${encodeURIComponent(slug)}/`, SITE_URL).href;
}

function getChangedPostUrls() {
  if (/^0+$/.test(beforeSha)) {
    console.warn('GitHub did not provide a previous commit; skipping CDN refresh');
    return { refreshUrls: [], prefetchUrls: [] };
  }

  const output = execFileSync(
    'git',
    ['diff', '--name-status', '-z', beforeSha, currentSha, '--', 'src/content/blog'],
    { encoding: 'utf8' }
  );
  const fields = output.split('\0').filter(Boolean);
  const refreshPaths = [];
  const prefetchPaths = [];

  for (let index = 0; index < fields.length;) {
    const status = fields[index++];

    if (status.startsWith('R') || status.startsWith('C')) {
      const oldPath = fields[index++];
      const newPath = fields[index++];
      refreshPaths.push(oldPath, newPath);
      prefetchPaths.push(newPath);
      continue;
    }

    const path = fields[index++];
    if (!path) continue;
    refreshPaths.push(path);
    if (!status.startsWith('D')) prefetchPaths.push(path);
  }

  const isPost = (path) => /\.(md|mdx)$/i.test(path);
  return {
    refreshUrls: [...new Set(refreshPaths.filter(isPost).map(postPathToUrl))],
    prefetchUrls: [...new Set(prefetchPaths.filter(isPost).map(postPathToUrl))],
  };
}

async function dogecloudApi(apiPath, data) {
  const body = data ? new URLSearchParams(data).toString() : '';
  const signature = createHmac('sha1', secretKey)
    .update(`${apiPath}\n${body}`, 'utf8')
    .digest('hex');

  const response = await fetch(`https://api.dogecloud.com${apiPath}`, {
    method: data ? 'POST' : 'GET',
    headers: {
      Authorization: `TOKEN ${accessKey}:${signature}`,
      ...(data ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    ...(data ? { body } : {}),
  });

  const responseBody = await response.text();
  let result;

  try {
    result = JSON.parse(responseBody);
  } catch {
    throw new Error(`DogeCloud returned a non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok || result.code !== 200) {
    throw new Error(`DogeCloud API failed: ${result.msg ?? `HTTP ${response.status}`}`);
  }

  return result.data;
}

async function createTask(rtype, urls) {
  const data = await dogecloudApi('/cdn/refresh/add.json', {
    rtype,
    urls: JSON.stringify(urls),
  });

  if (!data?.task_id) {
    throw new Error(`DogeCloud did not return a task ID for ${rtype}`);
  }

  return data.task_id;
}

async function waitForRefreshPropagation(taskId) {
  const deadline = Date.now() + REFRESH_WAIT_MS;

  while (Date.now() < deadline) {
    const apiPath = `/cdn/refresh/query.json?id=${encodeURIComponent(taskId)}`;
    const data = await dogecloudApi(apiPath);
    const tasks = data?.tasks ?? [];

    if (tasks.some((task) => ['done', 'fail', 'invalid'].includes(task.status))) {
      console.log('DogeCloud article refresh has started propagating');
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  console.warn(`DogeCloud article refresh is still processing after ${REFRESH_WAIT_MS / 1000} seconds`);
}

const {
  refreshUrls: changedArticleUrls,
  prefetchUrls: changedArticlePrefetchUrls,
} = getChangedPostUrls();

if (changedArticleUrls.length === 0) {
  console.log('No changed blog posts; DogeCloud cache refresh skipped');
  process.exit(0);
}

const refreshUrls = [...new Set([SITE_URL, ...changedArticleUrls])];
const prefetchUrls = [...new Set([SITE_URL, ...changedArticlePrefetchUrls])];

const refreshTaskId = await createTask('url', refreshUrls);
console.log(
  `DogeCloud refresh submitted for the homepage and ${changedArticleUrls.length} changed article(s): ${refreshTaskId}`
);
await waitForRefreshPropagation(refreshTaskId);

const prefetchTaskId = await createTask('prefetch', prefetchUrls);
console.log(`DogeCloud prefetch submitted for ${prefetchUrls.length} targeted URL(s): ${prefetchTaskId}`);
