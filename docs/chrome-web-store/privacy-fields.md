# Chrome Web Store Privacy Fields

## Single Purpose

在 X/Twitter 网页端本地识别并隐藏低质量账号内容，帮助用户减少垃圾营销、导流和重复内容干扰。

## Permission Justifications

### storage

保存用户的扩展设置、本地黑名单、本地白名单、本地统计和最近风险账号记录。所有数据均保存在用户浏览器本地。

### Host permission: https://x.com/*

在用户访问 X 网页端时注入内容脚本，扫描页面中的推文、评论和搜索结果，并根据本地规则隐藏、折叠或模糊命中的内容。

### Host permission: https://twitter.com/*

兼容仍使用 twitter.com 域名的页面，提供与 x.com 相同的本地内容净化能力。

## Data Usage Declaration

CleanX 不收集、不出售、不传输用户数据。

本扩展会在用户浏览器本地处理以下页面可见信息：

- X/Twitter 页面中显示的账号 handle、昵称和文本内容
- 用户手动添加的黑名单和白名单
- 本地过滤设置
- 本地统计数据
- 最近风险账号记录

这些信息仅保存在 `chrome.storage.local` 中，不会上传到开发者服务器或第三方服务。

## Remote Code

本扩展不加载远程代码。

## Authentication

本扩展不提供账号登录功能，也不读取 X/Twitter 登录凭证。

## Tracking

本扩展不做跨站跟踪，不采集浏览历史，不植入广告追踪。

## In-App Purchases

V0.1 不包含应用内购买、订阅或付费功能。
