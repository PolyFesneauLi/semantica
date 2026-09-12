# Input samples

Place plain-text sample documents here for CLI smoke runs.

## Files

| File | Description |
|------|-------------|
| `alice_semantica.txt` | Tiny NER/relation smoke text (DeepSeek closed loop) |
| `acme_contract.txt` | Short contract / org relation sample |

## Defaults

All extract/explorer knobs live in repo-root `.env` (`SEMANTICA_EXTRACT_*`, `SEMANTICA_EXPLORER_*`).
Command line only needs the path you want to change.

完整命令与参数表见仓库根目录 **[commands_reference.md](../commands_reference.md)**。

## Usage

```powershell
cd D:\semantica
.\venv\Scripts\Activate.ps1

# uses SEMANTICA_EXTRACT_INPUT from .env
semantica extract

# or override only the input file
semantica extract input/acme_contract.txt

# explorer uses SEMANTICA_EXPLORER_GRAPH / PORT / ALLOW_ANONYMOUS from .env
semantica-explorer
```
