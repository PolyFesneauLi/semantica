# Input samples

Place plain-text sample documents here for CLI smoke runs.

## Files

| File | Description |
|------|-------------|
| `alice_semantica.txt` | Tiny NER/relation smoke text (DeepSeek closed loop) |
| `acme_contract.txt` | Short contract / org relation sample |
| `odyssey/{section}_Odyssey_Title.txt` | English Wikipedia *Odyssey* article split by H2 (CC BY-SA; see `odyssey/SOURCE.md`) |
| `odyssey/Full_Odyssey_Title.txt` | Same corpus concatenated for the single-file extract CLI |


## Defaults

All extract/explorer knobs live in repo-root `.env` (`SEMANTICA_EXTRACT_*`, `SEMANTICA_EXPLORER_*`).
Command line only needs the path you want to change.

完整命令与参数表见仓库根目录 **[commands_reference.md](../commands_reference.md)**。

刷新 / 构建维基 demo 文本集（只抓一页）：

```powershell
# Odyssey
python scripts/build_wiki_corpus.py `
  --url https://en.wikipedia.org/wiki/Odyssey `
  --title Odyssey `
  --name-suffix Odyssey_Title `
  --output-dir input/odyssey

# Any other English Wikipedia title
python scripts/build_wiki_corpus.py `
  --url https://en.wikipedia.org/wiki/Iliad `
  --title Iliad `
  --name-suffix Iliad_Title `
  --output-dir input/iliad
```


## Usage

```powershell
cd D:\semantica
.\venv\Scripts\Activate.ps1

# uses SEMANTICA_EXTRACT_INPUT from .env
semantica extract

# or override only the input file
semantica extract input/acme_contract.txt

# Odyssey wiki demo corpus (single file; Full_ is long for LLM extract)
semantica extract input/odyssey/Full_Odyssey_Title.txt
semantica extract input/odyssey/Synopsis_Odyssey_Title.txt

# explorer uses SEMANTICA_EXPLORER_GRAPH / PORT / ALLOW_ANONYMOUS from .env
semantica-explorer
```
