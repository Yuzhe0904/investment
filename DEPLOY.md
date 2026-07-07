# 部署说明

当前项目是本地静态网页，所以你看到的是 `file://.../index.html`，别人不能通过互联网访问。

## 最快拿到公开网址

可以部署到任意静态托管平台：

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

需要上传这些文件：

- `index.html`
- `styles.css`
- `app.js`
- `.nojekyll`
- `README.md`

部署完成后，平台会给你一个 `https://...` 网址。

## 重要提醒

不要把 `fmp-config.js` 提交到公开仓库。这个文件只适合本地私用。

公开部署后，访问者可以在左侧 `FMP API Key` 输入自己的 key。key 会保存在访问者自己的浏览器里，不会进入 GitHub 仓库。

如果要让所有访问者共用你的数据源，应该改成：

- 前端页面不放 API key
- 新增一个后端接口代理 FMP 请求
- 后端读取环境变量里的 FMP API key
- 后端做缓存和限流，避免 FMP 额度被很快打满

## GitHub Pages 步骤

1. 在 GitHub 创建一个新仓库。
2. 把本地项目推送到仓库的 `main` 分支。
3. 打开仓库 `Settings -> Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，Folder 选择 `/root`。
6. 保存后等待几分钟，页面会显示 `https://用户名.github.io/仓库名/`。

## 数据残缺的常见原因

- FMP 当前套餐不支持某个接口或某只股票
- FMP 请求额度达到上限，返回 `429 Limit Reach`
- 股票刚加入时只有代码，还没成功刷新财务数据
- 某些公司本身缺少部分指标，例如目标价、ROIC、Piotroski 等

页面现在会把缺失值显示为 `-` 或 `待刷新`，不会再把缺失误显示成 `0`。
