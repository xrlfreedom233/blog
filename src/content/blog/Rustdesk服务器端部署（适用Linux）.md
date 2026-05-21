---
title: 'Rustdesk服务器端部署（适用Linux）'
description: '所需端口号： TCP (21115, 21116, 21117, 21118, 21119) UDP (21116) 更新软件包管理：sudo apt update -y 1 创建一个空目录，用于安装RustDesk mkdir ~/myApplication 2 使用wget进行下载最新版本 wg'
pubDate: '2024-11-07T11:58:50Z'
heroImage: ''
categories: ["芝士"]
tags: []
---

所需端口号：

*   **TCP (21115, 21116, 21117, 21118, 21119)**
*   **UDP (21116)** 

更新软件包管理：sudo apt update -y 1 创建一个空目录，用于安装RustDesk **mkdir ~/myApplication** 2 使用wget进行下载最新版本 **wget ...** 使用unzip解压 **unzip rustdesk-server-linux-amd64.zip**  重命名解压后文件（方便管理） **mv amd64 RustDesk** 3为了方便我们测试，这里使用`screen`双开两个虚拟终端，并以前台模式挂起后端进程：  安装screen **sudo apt install screen** 之后，在刚刚我们的RustDesk解压后的目录内，可以看到相关的文件： RustDesk ├── hbbr ├── hbbs └── rustdesk-utils 4 解释一下各个作用：

*   hbbs: RustDesk的ID服务，用于分配和注册ID；
*   hbbr: RustDesk的中继服务，主要远程访问就是这个，如果直连远程不行，会使用hbbr进行流量中继。

之后，我们使用两个screen进行启动： #创建一个叫myHbbs的虚拟终端：**screen -R myHbbs** #运行hbbs：**./hbbs**  紧接着，`Ctrl+a`和`d`返回主终端，启动hbbr。 \# 创建一个叫yHbb的虚拟终端： **screen -R myHbbr** \# 运行hbbr **./hbbr** 5查看这个**RustDesk**目录，就可以发现，多了一些数据库文件和一个证书文件： RustDesk ├── db\_v2.sqlite3 ├── db\_v2.sqlite3-shm ├── db\_v2.sqlite3-wal ├── hbbr ├── hbbs ├── id\_ed25519 ├── id\_ed25519.pub └── rustdesk-utils 我们需要拷贝`.pub`这个公钥文件，用于接下来的**本地配置**：**cat id\_ed25519.pub** 比如，我的公钥文件内容：`C6bJn7*******************50nCK3y4=` 接下来，我们可以进行本地的配置。