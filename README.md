# AI Conf Tracker

面向人工智能研究者的会议投稿全生命周期追踪平台。项目覆盖 17 个会议，从摘要注册、论文提交一路追踪到 Rebuttal、录用通知、Camera-ready 和会议举办。

## 首版能力

- 7 个 CCF 人工智能 A 类、8 个 CCF 人工智能 B 类，以及精选扩展 ACM MM、WWW
- “下一节点 / 投稿截止 / 完整日历”三种首页视图
- 下一有效节点自动切换，窗口事件优先显示开放状态与关闭倒计时
- CCF 等级、研究方向、事件类型、开放状态、未来事件和关注状态筛选
- 原始时区保留与浏览器本地时区转换
- 完整会议时间线、来源、核验时间、可信状态与纠错入口
- 关注会议与本地投稿记录，支持 JSON 导入导出
- 单事件、整场会议和静态订阅源 ICS 导出
- YAML 数据校验、GitHub Pages 部署、官网变化自动发现

个人投稿数据只保存在当前浏览器的 `localStorage`，不会上传到服务器。

## 本地启动

要求 Node.js 22。

```bash
npm install
npm run dev
```

数据文件修改后，开发启动和正式构建都会自动生成前端 JSON。也可以手动执行：

```bash
npm run validate
npm run generate
npm test
npm run build
```

## 数据维护

每个会议维护在 `data/conferences/<id>.yml`。正式日期必须有官方来源和 `verified_at`，未知日期使用：

```yaml
kind: tbd
date_status: tbd
```

不要根据往届规律把推测值写成 `confirmed`。只有 `confirmed` 和 `tentative` 进入正式下一节点与倒计时；`estimated` 只作为参考。

## 自动发现页面变化

`.github/workflows/check-sources.yml` 每天 02:17 UTC 执行：

1. 从各届会议的 `sources` 读取官方页面 URL；
2. 下载页面，移除脚本、导航等噪声并提取正文；
3. 计算 SHA-256，与 `data/source-snapshots.json` 比较；
4. 发生变化时创建去重的 `[Source Changed]` Issue；
5. 写入最新快照并由 GitHub Actions 提交。

监控只负责发现变化，不会直接修改任何正式会议日期。首次执行建立基线，不会创建变化 Issue；访问失败会创建 `[Source Unreachable]` Issue。

## GitHub Pages

1. 新建仓库并推送本项目；
2. 在仓库 Settings → Pages 中把 Source 设为 **GitHub Actions**；
3. 推送 `main`，`deploy.yml` 会校验、测试、构建和部署；
4. 如需本地纠错链接指向自己的仓库，把 `.env.example` 复制为 `.env.local` 并填写仓库名。

Vite 在 GitHub Actions 中自动读取仓库名作为 `base`，详情页使用 `HashRouter`，刷新不会触发 GitHub Pages 404。

## 静态日历订阅源

构建后输出：

- `/ical/all.ics`
- `/ical/ccf-a.ics`
- `/ical/ccf-b.ics`
- `/ical/<conference-id>.ics`

## 数据范围说明

仓库包含 17 个会议的基础信息和标准生命周期节点。2026 年 8 月 3 日尚未由官网公布的未来日期均明确标为 `tbd`；界面不会为其生成虚假倒计时。ACM MM 与 WWW 的 `curated_extra` 为 `true`，避免误认为它们属于 CCF 人工智能类别。

节点可以通过可选的 `related_information` 数组附加主办方邮件或官方通知。每条信息包含标题、类型、来源说明、摘要、中文译文和可点击链接；存在该字段时，会议卡片和完整时间线会自动显示“相关信息”按钮。用户提供的邮件应明确标记为“用户提供”，关键信息使用 `**粗体**` 标记，且不得把未确认内容写成正式日期。
