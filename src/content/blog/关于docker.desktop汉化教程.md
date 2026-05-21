---
title: '关于docker.desktop汉化教程'
description: '记录 Docker Desktop 汉化包下载、替换 app.asar 和重启生效的基本步骤。'
pubDate: '2025-03-04T16:39:57Z'
heroImage: ''
categories: ["芝士"]
tags: ["Docker", "Docker Desktop", "汉化", "Windows"]
---

1. 在 GitHub 下载开源汉化包，注意要选对版本：<https://github.com/asxez/DockerDesktop-CN>
2. 退出 Docker Desktop。
3. 进入 Docker 安装目录下的资源目录：

```text
Docker\frontend\resources
```

4. 用下载的汉化包替换 `app.asar`，注意文件名需要改为 `app.asar`。
5. 重启 Docker Desktop，汉化生效。
