---
title: 'Rustdesk服务器端部署（适用Linux）'
description: '记录 RustDesk 服务器端在 Linux 上的部署流程，包括端口、下载、解压、screen 启动 hbbs/hbbr 和公钥配置。'
pubDate: '2024-11-07T11:58:50Z'
heroImage: ''
categories: ["芝士"]
tags: ["RustDesk", "Linux", "服务器", "远程桌面"]
---

所需端口号：

*   **TCP (21115, 21116, 21117, 21118, 21119)**
*   **UDP (21116)** 

## 部署步骤

更新软件包管理：

```bash
sudo apt update -y
```

1. 创建一个空目录，用于安装 RustDesk。

```bash
mkdir ~/myApplication
```

2. 使用 `wget` 下载最新版本，解压并重命名目录。

```bash
wget ...
unzip rustdesk-server-linux-amd64.zip
mv amd64 RustDesk
```

3. 为了方便测试，这里使用 `screen` 开两个虚拟终端，并以前台模式挂起后端进程。

```bash
sudo apt install screen
```

解压后的目录结构大致如下：

```text
RustDesk
├── hbbr
├── hbbs
└── rustdesk-utils
```

4. 各个文件的作用：

*   hbbs: RustDesk的ID服务，用于分配和注册ID；
*   hbbr: RustDesk的中继服务，主要远程访问就是这个，如果直连远程不行，会使用hbbr进行流量中继。

之后，使用两个 `screen` 进行启动。

创建一个叫 `myHbbs` 的虚拟终端并运行 `hbbs`：

```bash
screen -R myHbbs
./hbbs
```

按 `Ctrl+a`，再按 `d` 返回主终端，然后启动 `hbbr`：

```bash
screen -R myHbbr
./hbbr
```

5. 查看 `RustDesk` 目录，可以发现多了一些数据库文件和证书文件：

```text
RustDesk
├── db_v2.sqlite3
├── db_v2.sqlite3-shm
├── db_v2.sqlite3-wal
├── hbbr
├── hbbs
├── id_ed25519
├── id_ed25519.pub
└── rustdesk-utils
```

拷贝 `.pub` 公钥文件，用于接下来的本地配置：

```bash
cat id_ed25519.pub
```

比如，我的公钥文件内容：

```text
C6bJn7*******************50nCK3y4=
```

接下来，就可以进行本地配置。
