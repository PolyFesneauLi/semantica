## Why

`input/` 目前只有两段极短烟雾文本（`alice_semantica.txt`、`acme_contract.txt`），无法支撑 Odyssey 这类人物、地点、情节关系密集的抽取 / 图谱 demo。需要把 [English Wikipedia: Odyssey](https://en.wikipedia.org/wiki/Odyssey) **仅这一页** 做成模型可直接读取的纯文本集，文件名遵循 `{section}_Odyssey_Title`。

## What Changes

- 增加一次性、单 URL 的 Odyssey Wikipedia 抓取与清洗脚本：只请求该条目页（或该条目的 MediaWiki 纯文本抽取接口），**不跟链、不爬站、不 sitemap**。
- 将正文按 Wikipedia H2 切成 UTF-8 纯文本文件，文件名 `{sanitized-section}_Odyssey_Title.txt`（导语为 `Lead_Odyssey_Title.txt`），输出到 `input/odyssey/`。
- 另写一份可直接喂给现有 `semantica extract`（只读单文件）的拼接稿 `Full_Odyssey_Title.txt`，以及来源 / 许可 / 抓取日期清单。
- 更新 `input/README.md`（及必要时 `Commands_reference.md`）说明如何用该文本集跑抽取。
- 提交清洗后的文本快照，保证离线 demo 可复现；脚本用于刷新，不是通用维基爬虫，也不改 `semantica extract` / `WebIngestor` 的对外 API。

## Capabilities

### New Capabilities

- `odyssey-wiki-demo-corpus`: 从单一 Odyssey Wikipedia 条目生成 `{section}_Odyssey_Title` 模型可读 demo 文本集（范围、命名、清洗、归属）。

### Modified Capabilities

- （无。`openspec/specs/` 目前为空，且本次不改变 ingest / extract 的规格行为。）

## Impact

- **新增数据**：`input/odyssey/*.txt`（CC BY-SA 归属随仓库提交）。
- **新增脚本**：仓库内一次性构建脚本（复用 `ingest_web(..., method="url")` + Wikipedia 正文选择器 / 分段，不调用 `method="crawl"`）。
- **文档**：`input/README.md`；必要时 `Commands_reference.md` 增加一条 extract 示例。
- **测试**：对清洗 / 命名 / 单页约束做离线 HTML fixture 测试；不在 CI 里打 Wikipedia 直播。
- **非影响**：不新增 CLI 子命令；不修改 `WebIngestor` / `semantica extract` 签名；不抓取该条目以外的任何 URL。
