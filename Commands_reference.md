# Commands Reference（本地闭环速查）

面向本仓库 fork 的 **DeepSeek 抽取 → ContextGraph → Explorer** 最短路径。  
不修改顶层 `README.md`；细节以本文件与 `.env` 为准。

---

## 1. 一次性准备

```powershell
cd D:\semantica
.\venv\Scripts\Activate.ps1
```

在仓库根目录维护 `.env`（已 gitignore，勿提交密钥）：

| 变量 | 作用 | 当前默认意图 |
|------|------|----------------|
| `DEEPSEEK_API_KEY` | DeepSeek API | 必填 |
| `SEMANTICA_EXTRACT_INPUT` | 默认输入文本路径 | `input/alice_semantica.txt` |
| `SEMANTICA_EXTRACT_MODE` | `ner` / `relations` / `triplets` / `events` / `all` | `all` |
| `SEMANTICA_EXTRACT_METHOD` | `pattern` / `ml` / `llm` | `llm` |
| `SEMANTICA_EXTRACT_PROVIDER` | `openai` / `anthropic` / `groq` / `deepseek` / … | `deepseek` |
| `SEMANTICA_EXTRACT_MODEL` | LLM 模型名 | `deepseek-chat` |
| `SEMANTICA_EXTRACT_CONFIDENCE` | 最低置信度 | `0.5` |
| `SEMANTICA_EXTRACT_FORMAT` | 抽取结果格式 | `json` |
| `SEMANTICA_EXTRACT_GRAPH_OUTPUT` | Explorer 用的 ContextGraph JSON | `demos/smoke_deepseek_graph.json` |
| `SEMANTICA_EXTRACT_OUTPUT` | （可选）原始抽取 JSON | 注释掉则只打 stdout |
| `SEMANTICA_EXPLORER_GRAPH` | Explorer 默认图文件 | 同上 graph 输出 |
| `SEMANTICA_EXPLORER_PORT` | 端口 | `8000` |
| `SEMANTICA_EXPLORER_HOST` | 绑定地址 | `127.0.0.1` |
| `SEMANTICA_ALLOW_ANONYMOUS` | 本机匿名访问图 API | `true` |
| `PYTHONUTF8` | Windows 控制台 UTF-8 | `1` |

CLI 启动时会自动 `load_dotenv(.env)`（已有进程环境变量优先，不覆盖）。

样例文本放在 `input/`（见 `input/README.md`）。

---

## 2. 最短闭环（推荐）

默认值都在 `.env` 时：

```powershell
semantica extract
semantica-explorer
```

浏览器打开：http://127.0.0.1:8000

只换输入文件时：

```powershell
semantica extract input/acme_contract.txt
semantica-explorer
```

等价写法：

```powershell
semantica explorer start
# 或
python -m semantica.explorer
```

---

## 3. `semantica extract` 参数

**位置参数**

| 参数 | 是否必填 | 说明 |
|------|----------|------|
| `INPUT_PATH` | 否* | 文本文件路径，或直接内联字符串；`-` 表示 stdin。未传则用 `SEMANTICA_EXTRACT_INPUT`。 |

\* 路径与 env 至少有一个。

**常用选项**（未写则用 `.env` / 内置默认）

| 选项 | Env | 可选值 / 说明 |
|------|-----|----------------|
| `--mode` | `SEMANTICA_EXTRACT_MODE` | `ner` `relations` `triplets` `events` `all` |
| `--method` | `SEMANTICA_EXTRACT_METHOD` | `pattern` `ml` `llm` |
| `--provider` | `SEMANTICA_EXTRACT_PROVIDER` | `method=llm` 时需要（可来自 env） |
| `--model` | `SEMANTICA_EXTRACT_MODEL` | 如 `deepseek-chat` |
| `--confidence` | `SEMANTICA_EXTRACT_CONFIDENCE` | `0.0`–`1.0` |
| `--format` | `SEMANTICA_EXTRACT_FORMAT` | `json` `yaml` `table` `rdf` |
| `--output` | `SEMANTICA_EXTRACT_OUTPUT` | 原始抽取结果文件 |
| `--graph-output` | `SEMANTICA_EXTRACT_GRAPH_OUTPUT` | ContextGraph JSON（给 Explorer） |
| `--temporal` | — | 仅 triplets 等路径的时间边界（flag） |

**原则：** 与 `.env` 相同的值不必再写在命令行。

示例（显式覆盖）：

```powershell
semantica extract input/alice_semantica.txt --method pattern
semantica extract input/acme_contract.txt --provider deepseek --model deepseek-chat
```

---

## 4. Explorer 参数

### `semantica-explorer` / `python -m semantica.explorer`

| 选项 | Env | 说明 |
|------|-----|------|
| `--graph` / `-g` | `SEMANTICA_EXPLORER_GRAPH`（或回退 `SEMANTICA_EXTRACT_GRAPH_OUTPUT`） | ContextGraph JSON；env 有则可不传 |
| `--port` / `-p` | `SEMANTICA_EXPLORER_PORT` | 默认 `8000` |
| `--host` | `SEMANTICA_EXPLORER_HOST` | 默认 `127.0.0.1` |
| `--no-browser` | — | 不自动开浏览器 |

本机看图请保留：

```env
SEMANTICA_ALLOW_ANONYMOUS=true
```

否则受保护的图 API 会 `503`。

### `semantica explorer start|stop|status|open`

```powershell
semantica explorer start          # 读 .env 的 graph/port
semantica explorer open           # 打开浏览器（默认 port 见命令 help）
semantica explorer status
semantica explorer stop
```

---

## 5. method / provider 速查

### NER / Relation 的 `--method`

| 值 | 含义 | 要 API key？ |
|----|------|--------------|
| `pattern` | 规则/模板 | 否 |
| `ml` | spaCy 等本地模型 | 否 |
| `llm` | 大模型 | **是**（配合 `--provider`） |

完整内置方法名见 `semantica/semantic_extract/methods.py` 的 `get_entity_method` / `get_relation_method`。

### `--provider`（`method=llm`）

| 值 | Env key |
|----|---------|
| `deepseek` | `DEEPSEEK_API_KEY` |
| `openai` | `OPENAI_API_KEY` |
| `anthropic` | `ANTHROPIC_API_KEY` |
| `groq` | `GROQ_API_KEY` |
| `gemini` / `ollama` / `novita` | 对应 `*_API_KEY` 或本地服务 |

---

## 6. 目录约定

```text
input/                          # 样例 / 待抽取纯文本
  alice_semantica.txt
  acme_contract.txt
demos/smoke_deepseek_graph.json # extract --graph-output 默认产物
.env                            # 密钥 + CLI/Explorer 默认参数
```

---

## 7. 排障

| 现象 | 处理 |
|------|------|
| `Provide INPUT_PATH or set SEMANTICA_EXTRACT_INPUT` | 传路径或写 `.env` |
| `method llm requires --provider` | 设 `SEMANTICA_EXTRACT_PROVIDER` 或 `--provider` |
| DeepSeek `401` | 检查 `DEEPSEEK_API_KEY` |
| Explorer 图 API `503` | `SEMANTICA_ALLOW_ANONYMOUS=true` 或配置 `SEMANTICA_API_KEY` |
| Windows 控制台乱码 / Rich 崩溃 | `.env` 中 `PYTHONUTF8=1`（Explorer 已做 stdout UTF-8） |
| `semantica` 找不到 | `.\venv\Scripts\Activate.ps1` |

健康检查（可选）：

```powershell
semantica doctor
semantica extract --help
semantica-explorer --help
```
