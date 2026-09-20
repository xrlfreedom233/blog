import { createHmac } from 'node:crypto';

const accessKey = process.env.DOGECLOUD_ACCESS_KEY;
const secretKey = process.env.DOGECLOUD_SECRET_KEY;

if (!accessKey || !secretKey) {
  throw new Error('Missing DOGECLOUD_ACCESS_KEY or DOGECLOUD_SECRET_KEY');
}

const SITE_URL = 'https://blog.xrlfreedom.top/';
const SITEMAP_URL = new URL('sitemap-index.xml', SITE_URL).href;
const CRITICAL_ASSET_URLS = [
  new URL('fonts/misans-regular.woff2', SITE_URL).href,
  new URL('fonts/misans-demibold.woff2', SITE_URL).href,
];
const MAX_PREFETCH_URLS = 1000;
const POLL_INTERVAL_MS = 3000;
const REFRESH_WAIT_MS = 120000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    // 融合 CDN 会拆成多个上游任务；任一上游进入终态后即可开始提交预热。
    // 其余上游会继续异步处理，预热任务由多吉云在服务端接续执行。
    if (tasks.some((task) => ['done', 'fail', 'invalid'].includes(task.status))) {
      console.log('DogeCloud directory refresh has started propagating');
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  // 查询状态偶尔会长时间停留在 process，但刷新本身仍会执行。继续提交预热，
  // 避免仅因状态接口延迟而让部署失败并留下全站冷缓存。
  console.warn(`DogeCloud refresh is still processing after ${REFRESH_WAIT_MS / 1000} seconds`);
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

async function getSitemapUrls() {
  const response = await fetch(SITEMAP_URL, {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch sitemap: HTTP ${response.status}`);
  }

  const xml = await response.text();
  const siteOrigin = new URL(SITE_URL).origin;
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/gs)]
    .map((match) => decodeXml(match[1].trim()))
    .filter((url) => {
      try {
        return new URL(url).origin === siteOrigin;
      } catch {
        return false;
      }
    });

  const uniqueUrls = [...new Set([...urls, ...CRITICAL_ASSET_URLS])];

  if (uniqueUrls.length === 0) {
    throw new Error('The sitemap did not contain any same-origin URLs');
  }

  if (uniqueUrls.length > MAX_PREFETCH_URLS) {
    throw new Error(`Sitemap contains ${uniqueUrls.length} URLs; prefetch limit is ${MAX_PREFETCH_URLS}`);
  }

  return uniqueUrls;
}

const refreshTaskId = await createTask('path', [SITE_URL]);
console.log(`DogeCloud directory refresh submitted: ${refreshTaskId}`);
await waitForRefreshPropagation(refreshTaskId);

const prefetchUrls = await getSitemapUrls();
const prefetchTaskId = await createTask('prefetch', prefetchUrls);
console.log(`DogeCloud prefetch submitted for ${prefetchUrls.length} pages/assets: ${prefetchTaskId}`);
