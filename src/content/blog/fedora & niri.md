---
title: 'fedora & niri'
description: '记录 Fedora 与 niri 使用中的零散问题，包括显示模式切换、Emby Flatpak 字体乱码和触控板快捷键调试。'
pubDate: '2026-03-20T14:34:42.361694677Z'
heroImage: ''
categories: ["note"]
tags: ["Fedora", "niri", "Linux", "桌面环境"]
---

## 显示模式切换

待补充。

## Emby Flatpak 字体乱码

Emby 使用 Flatpak 安装后如果出现字体乱码，可以给应用配置 fontconfig：

```bash
mkdir -p ~/.var/app/media.emby.EmbyTheater/config/fontconfig

cat > ~/.var/app/media.emby.EmbyTheater/config/fontconfig/fonts.conf << 'EOF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>/run/host/fonts</dir>
  <dir>~/.var/app/media.emby.EmbyTheater/config/fontconfig/fonts</dir>
</fontconfig>
EOF
```

## 触控板快捷键

现在按 `Fn+F5` 就能切换触控板了。

整个过程总结一下，以后遇到类似问题可以参考：

1. `libinput debug-events` 确认内核有没有收到按键。
2. `wev` 确认 Wayland 层收到的实际键名和修饰键。
3. 再去 niri 配置里绑定。

`wev` 是 Wayland 下调试按键的利器，记住它。
