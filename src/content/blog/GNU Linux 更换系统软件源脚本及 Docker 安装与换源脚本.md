---
title: 'GNU/Linux 更换系统软件源脚本及 Docker 安装与换源脚本'
description: '记录 GNU/Linux 更换系统软件源，以及 Docker 安装与镜像源配置脚本。'
pubDate: '2025-10-28T08:25:02.358447085Z'
heroImage: ''
categories: ["芝士"]
tags: ["Linux", "Docker", "软件源", "Shell"]
---

前言：我们日常在进行docker拉取镜像时，因为仓库在国外，拉取速度是十分缓慢（而且极有可能会失败），我们就可以修改docker镜像源来加速。这里我提供一个一键换源脚本

```bash
bash <(curl -sSL https://linuxmirrors.cn/docker.sh)
```

注意wsl安装的用户，执行一下命令，因为以上命令wsl老版本并不支持

```bash
curl -sSL -o docker.sh https://linuxmirrors.cn/docker.sh
sudo bash docker.sh
```

执行完可以删除脚本：

```bash
rm docker.sh
```
