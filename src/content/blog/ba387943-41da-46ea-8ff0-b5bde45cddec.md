---
title: 'Windows+Linux双系统时间不统一修复'
description: '在windows中，Win+X,然后选择Powershell（管理员），输入下面命令即可修复。 Reg add HKLM\SYSTEM\CurrentControlSet\Control\TimeZoneInformation /v RealTimeIsUniversal /t REG_DWORD '
pubDate: '2025-10-11T00:57:43.704140829Z'
heroImage: ''
categories: ["芝士"]
tags: []
---

在windows中，Win+X,然后选择Powershell（管理员），输入下面命令即可修复。



```
Reg add HKLM\SYSTEM\CurrentControlSet\Control\TimeZoneInformation /v RealTimeIsUniversal /t REG_DWORD /d 1
```
