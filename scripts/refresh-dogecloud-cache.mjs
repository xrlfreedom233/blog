import { createHmac } from 'node:crypto';

const accessKey = process.env.DOGECLOUD_ACCESS_KEY;
const secretKey = process.env.DOGECLOUD_SECRET_KEY;

if (!accessKey || !secretKey) {
  throw new Error('Missing DOGECLOUD_ACCESS_KEY or DOGECLOUD_SECRET_KEY');
}

const apiPath = '/cdn/refresh/add.json';
const urls = ['https://blog.xrlfreedom.top/'];
const body = new URLSearchParams({
  rtype: 'path',
  urls: JSON.stringify(urls),
}).toString();

const signature = createHmac('sha1', secretKey)
  .update(`${apiPath}\n${body}`, 'utf8')
  .digest('hex');

const response = await fetch(`https://api.dogecloud.com${apiPath}`, {
  method: 'POST',
  headers: {
    Authorization: `TOKEN ${accessKey}:${signature}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body,
});

const responseBody = await response.text();
let result;

try {
  result = JSON.parse(responseBody);
} catch {
  throw new Error(`DogeCloud returned a non-JSON response (HTTP ${response.status})`);
}

if (!response.ok || result.code !== 200) {
  throw new Error(`DogeCloud cache refresh failed: ${result.msg ?? `HTTP ${response.status}`}`);
}

console.log(`DogeCloud directory refresh submitted for ${urls.join(', ')}`);
