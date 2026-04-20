const fs = require('fs');
const TurndownService = require('turndown');

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

function isValidDate(dateString) {
    const d = new Date(dateString);
    return d instanceof Date && !isNaN(d);
}

function safeYamlString(str) {
    if (!str) return '';
    return String(str).replace(/\n/g, ' ').replace(/'/g, "''");
}

async function extractPosts() {
    const dataPath = './halo-extract/extensions.data';
    const outputDir = 'src/content/blog';

    if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

    console.log('Reading extensions.data...');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const records = JSON.parse(rawData);

    const posts = [];
    const snapshotsByPost = {};
    const categoryMap = {};
    const tagMap = {};

    records.forEach(record => {
        try {
            const decodedData = JSON.parse(Buffer.from(record.data, 'base64').toString('utf8'));
            if (record.name.startsWith('/registry/content.halo.run/posts/')) {
                posts.push(decodedData);
            } else if (record.name.startsWith('/registry/content.halo.run/snapshots/')) {
                const postId = decodedData.spec.subjectRef?.name;
                const content = decodedData.spec.contentPatch || decodedData.spec.rawPatch || decodedData.spec.raw || '';
                if (postId && content) {
                    if (!snapshotsByPost[postId]) snapshotsByPost[postId] = [];
                    snapshotsByPost[postId].push(content);
                }
            } else if (record.name.startsWith('/registry/content.halo.run/categories/')) {
                categoryMap[decodedData.metadata.name] = decodedData.spec.displayName;
            } else if (record.name.startsWith('/registry/content.halo.run/tags/')) {
                tagMap[decodedData.metadata.name] = decodedData.spec.displayName;
            }
        } catch (e) {}
    });

    console.log(`Processing ${posts.length} posts with Turndown...`);

    let count = 0;
    posts.forEach(post => {
        let title = post.spec.title ? post.spec.title.trim() : '';
        if (!title) title = '未命名文章 - ' + post.metadata.name.substring(0, 8);
        const id = post.metadata.name;
        let pubDate = post.spec.publishTime || post.metadata.creationTimestamp;
        if (!isValidDate(pubDate)) pubDate = new Date().toISOString();
        const description = (typeof post.spec.excerpt === 'string') ? post.spec.excerpt : (post.status.excerpt || '');
        const heroImage = post.spec.cover || '';
        const categories = (post.spec.categories || []).map(catId => categoryMap[catId]).filter(Boolean);
        const tags = (post.spec.tags || []).map(tagId => tagMap[tagId]).filter(Boolean);

        const candidates = snapshotsByPost[id] || [];
        let htmlContent = '';
        candidates.forEach(c => {
            if (!c.startsWith('[{') && c.length > htmlContent.length) htmlContent = c;
        });

        // 将 HTML 转换为 Markdown
        let markdownContent = '';
        try {
            if (htmlContent) {
                // 预处理：修复一些可能导致挤压的 HTML 标签
                let processedHtml = htmlContent
                    .replace(/<br\s*\/?>/g, '\n');
                
                markdownContent = turndownService.turndown(processedHtml);
            }
        } catch (e) {
            markdownContent = htmlContent; // 回退
        }

        const frontmatter = `---
title: '${safeYamlString(title)}'
description: '${safeYamlString(description).substring(0, 250)}'
pubDate: '${pubDate}'
heroImage: '${heroImage}'
categories: ${JSON.stringify(categories)}
tags: ${JSON.stringify(tags)}
---

${markdownContent}`;

        fs.writeFileSync(`${outputDir}/${id}.md`, frontmatter);
        count++;
    });

    console.log(`\nSuccessfully converted ${count} posts to clean Markdown.`);
}

extractPosts();
