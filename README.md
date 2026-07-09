# 北极星

一个可部署到 GitHub Pages 的股票观察、筛选与综合分析工具。

## 使用方式

打开页面后：

1. 在左侧 `FMP API Key` 输入自己的 Financial Modeling Prep API key。
2. 点击 `搜索股票` 添加股票。
3. 点击 `刷新数据` 同步行情和财务指标。

API key 会保存在访问者自己的浏览器 `localStorage` 里，不需要提交到 GitHub。

## 部署到 GitHub Pages

把本仓库推送到 GitHub 后，在仓库 `Settings -> Pages` 中选择：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`

保存后等待几分钟，GitHub 会生成公开网址。
