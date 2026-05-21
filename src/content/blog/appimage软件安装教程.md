---
title: 'appimage软件安装教程'
description: '记录 AppImage 软件添加执行权限、创建 desktop 启动项和刷新桌面数据库的基本步骤。'
pubDate: '2026-04-19T09:41:55.153134172Z'
heroImage: ''
categories: ["芝士"]
tags: ["Linux", "AppImage", "软件安装"]
---

appimage安装教程(注意：appimage包不能删)：

1.加执行权限

```bash
chmod +x Applications/WeChat_Dev_Tools_v2.01.2510280-2_x86_64_linux.AppImage 
```

2.添加desktop

```bash
cat > ~/.local/share/applications/wechat-devtools.desktop << 'EOF'
[Desktop Entry]
Name=WeChat DevTools
Exec=/home/freedom/Applications/WeChat_Dev_Tools_v2.01.2510280-2_x86_64_linux.AppImage
Icon=wechat
Type=Application
Categories=Development;
StartupNotify=true
EOF
```

3.更新配置

```bash
update-desktop-database ~/.local/share/applications/
```
