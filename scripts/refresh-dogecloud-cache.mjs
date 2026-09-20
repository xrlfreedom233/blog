import { createHmac } from 'node:crypto';

const accessKey = process.env.DOGECLOUD_ACCESS_KEY;
const secretKey = process.env.DOGECLOUD_SECRET_KEY;

if (!accessKey || !secretKey) {
  throw new Error('Missing DOGECLOUD_ACCESS_KEY or DOGECLOUD_SECRET_KEY');
}

const SITE_URL = 'https://blog.xrlfreedom.top/';
const SITEMAP_URL = new URL('sitemap-index.xml', SITE_URL).href;
const MAX_PREFETCH_URLS = 1000;
const POLL_INTERVAL_MS = 3000;
const TASK_TIMEOUT_MS = 180000;

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

async function waitForTask(taskId, label) {
  const deadline = Date.now() + TASK_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const apiPath = `/cdn/refresh/query.json?id=${encodeURIComponent(taskId)}`;
    const data = await dogecloudApi(apiPath);
    const tasks = data?.tasks ?? [];

    if (tasks.some((task) => task.status === 'fail' || task.status === 'invalid')) {
      throw new Error(`${label} failed for one or more URLs`);
    }

    if (tasks.length > 0 && tasks.every((task) => task.status === 'done')) {
      console.log(`${label} completed`);
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`${label} did not complete within ${TASK_TIMEOUT_MS / 1000} seconds`);
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

  const uniqueUrls = [...new Set(urls)];

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
await waitForTask(refreshTaskId, 'DogeCloud directory refresh');

const prefetchUrls = await getSitemapUrls();
const prefetchTaskId = await createTask('prefetch', prefetchUrls);
console.log(`DogeCloud prefetch submitted for ${prefetchUrls.length} pages: ${prefetchTaskId}`);
await waitForTask(prefetchTaskId, 'DogeCloud page prefetch');
