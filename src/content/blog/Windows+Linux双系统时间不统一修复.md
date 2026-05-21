---
title: 'Windows+Linux双系统时间不统一修复'
description: '记录 Windows 与 Linux 双系统时间不统一的问题，以及通过修改 Windows 注册表统一硬件时钟设置的方法。'
pubDate: '2025-10-11T00:57:43.704140829Z'
heroImage: ''
categories: ["芝士"]
tags: ["Windows", "Linux", "双系统", "时间同步"]
---

在windows中，Win+X,然后选择Powershell（管理员），输入下面命令即可修复。

```powershell
Reg add HKLM\SYSTEM\CurrentControlSet\Control\TimeZoneInformation /v RealTimeIsUniversal /t REG_DWORD /d 1
```
