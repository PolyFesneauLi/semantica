"""Default on-disk layout for extract / graph artifacts under ``output/``.

Mirrors the path under ``input/`` (when present) into::

    output/extract/.../<stem>_extract.<ext>
    output/graph/.../<stem>_graph.json

Override the root with ``SEMANTICA_OUTPUT_DIR`` (default ``output``).
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

_EXTRACT_EXT = {
    "json": ".json",
    "yaml": ".yaml",
    "table": ".txt",
    "rdf": ".ttl",
}


def output_root(explicit: Optional[str] = None) -> Path:
    """Return the artifact root directory (default: ``output``)."""
    return Path(
        explicit
        or os.environ.get("SEMANTICA_OUTPUT_DIR")
        or "output"
    )


def _strip_input_prefix(rel: Path) -> Path:
    parts = list(rel.parts)
    if parts and parts[0].lower() == "input":
        parts = parts[1:]
    return Path(*parts) if parts else Path(rel.name)


def relative_under_cwd(path: Path, *, cwd: Optional[Path] = None) -> Path:
    """Prefer a cwd-relative path; fall back to the basename."""
    base = (cwd or Path.cwd()).resolve()
    try:
        return path.resolve().relative_to(base)
    except ValueError:
        return Path(path.name)


def derive_artifact_path(
    input_file: Path,
    kind: str,
    *,
    fmt: str = "json",
    root: Optional[Path] = None,
    cwd: Optional[Path] = None,
) -> Path:
    """Map an input text file to ``output/{extract|graph}/...``.

    Parameters
    ----------
    input_file:
        Existing source file path (absolute or relative).
    kind:
        ``\"extract\"`` or ``\"graph\"``.
    fmt:
        Extract serialization format; ignored for ``graph`` (always ``.json``).
    """
    if kind not in ("extract", "graph"):
        raise ValueError(f"kind must be 'extract' or 'graph', got {kind!r}")

    rel = _strip_input_prefix(relative_under_cwd(input_file, cwd=cwd))
    stem = rel.stem
    parent = rel.parent
    if kind == "graph":
        filename = f"{stem}_graph.json"
    else:
        ext = _EXTRACT_EXT.get((fmt or "json").lower(), ".json")
        filename = f"{stem}_extract{ext}"

    base = root or output_root()
    out = base / kind
    if parent != Path("."):
        out = out / parent
    return out / filename


def derive_extract_path(input_file: Path, fmt: str = "json", **kwargs) -> Path:
    return derive_artifact_path(input_file, "extract", fmt=fmt, **kwargs)


def derive_graph_path(input_file: Path, **kwargs) -> Path:
    return derive_artifact_path(input_file, "graph", fmt="json", **kwargs)


def default_graph_for_extract_input(
    extract_input: Optional[str] = None,
    *,
    cwd: Optional[Path] = None,
) -> Optional[Path]:
    """If ``SEMANTICA_EXTRACT_INPUT`` points at a file, return its graph path."""
    raw = (extract_input or os.environ.get("SEMANTICA_EXTRACT_INPUT") or "").strip()
    if not raw or raw == "-":
        return None
    path = Path(raw)
    if not path.is_file():
        return None
    return derive_graph_path(path, cwd=cwd)
