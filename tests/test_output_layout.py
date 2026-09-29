"""Tests for default output/extract and output/graph artifact paths."""

from pathlib import Path

from semantica.output_layout import (
    derive_extract_path,
    derive_graph_path,
    default_graph_for_extract_input,
    output_root,
)


def test_mirrors_input_tree(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("SEMANTICA_OUTPUT_DIR", raising=False)
    src = tmp_path / "input" / "odyssey" / "Background_Odyssey_Title.txt"
    src.parent.mkdir(parents=True)
    src.write_text("x", encoding="utf-8")

    assert derive_extract_path(src) == Path(
        "output/extract/odyssey/Background_Odyssey_Title_extract.json"
    )
    assert derive_graph_path(src) == Path(
        "output/graph/odyssey/Background_Odyssey_Title_graph.json"
    )


def test_top_level_input_file(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    src = tmp_path / "input" / "alice_semantica.txt"
    src.parent.mkdir(parents=True)
    src.write_text("x", encoding="utf-8")

    assert derive_extract_path(src, fmt="yaml") == Path(
        "output/extract/alice_semantica_extract.yaml"
    )
    assert derive_graph_path(src) == Path("output/graph/alice_semantica_graph.json")


def test_output_root_env(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("SEMANTICA_OUTPUT_DIR", "artifacts")
    src = tmp_path / "input" / "a.txt"
    src.parent.mkdir(parents=True)
    src.write_text("x", encoding="utf-8")

    assert output_root() == Path("artifacts")
    assert derive_graph_path(src) == Path("artifacts/graph/a_graph.json")


def test_default_graph_for_extract_input(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    src = tmp_path / "input" / "alice_semantica.txt"
    src.parent.mkdir(parents=True)
    src.write_text("x", encoding="utf-8")
    monkeypatch.setenv("SEMANTICA_EXTRACT_INPUT", str(src))

    assert default_graph_for_extract_input() == Path(
        "output/graph/alice_semantica_graph.json"
    )
