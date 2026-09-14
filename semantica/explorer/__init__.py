"""
Semantica Knowledge Explorer : CLI Entry Point

Provides the ``semantica-explorer`` command that loads a graph from a
JSON file, starts a FastAPI server, and optionally opens the browser.

Usage::

    semantica-explorer --graph my_graph.json --port 8000
    python -m semantica.explorer --graph my_graph.json
"""

import argparse
import sys
import webbrowser

from rich.console import Console
from rich.panel import Panel

_out = Console()
_err = Console(stderr=True)


def main(argv=None):
    """CLI entry point for the Knowledge Explorer server."""
    # Reconfigure stdout/stderr to UTF-8 on Windows before Rich captures them.
    # Avoids UnicodeEncodeError on box-drawing / checkmark characters under GBK.
    if sys.platform == "win32":
        if sys.stdout is not None and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr is not None and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    # Load project .env so SEMANTICA_EXPLORER_* defaults apply.
    try:
        from dotenv import load_dotenv
        from pathlib import Path as _Path

        env_path = _Path.cwd() / ".env"
        if env_path.is_file():
            load_dotenv(env_path, override=False)
    except ImportError:
        pass

    import os

    from semantica.output_layout import default_graph_for_extract_input

    derived = default_graph_for_extract_input()
    default_graph = (
        os.environ.get("SEMANTICA_EXPLORER_GRAPH")
        or os.environ.get("SEMANTICA_EXTRACT_GRAPH_OUTPUT")
        or (str(derived) if derived is not None else None)
    )
    default_port = int(os.environ.get("SEMANTICA_EXPLORER_PORT") or "8000")
    default_host = os.environ.get("SEMANTICA_EXPLORER_HOST") or "127.0.0.1"

    parser = argparse.ArgumentParser(
        prog="semantica-explorer",
        description="Semantica Knowledge Explorer — interactive dashboard for KG exploration",
    )
    parser.add_argument(
        "--graph", "-g",
        default=default_graph,
        required=default_graph is None,
        help="Path to a ContextGraph JSON file to load "
             "(env: SEMANTICA_EXPLORER_GRAPH, SEMANTICA_EXTRACT_GRAPH_OUTPUT, "
             "or derived from SEMANTICA_EXTRACT_INPUT).",
    )
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=default_port,
        help=f"Port to bind the server to (default: {default_port}).",
    )
    parser.add_argument(
        "--host",
        default=default_host,
        help=f"Host to bind the server to (default: {default_host}).",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not open the browser automatically.",
    )
    args = parser.parse_args(argv)


    import os
    if not os.path.isfile(args.graph):
        _err.print(f"[bold red]Error:[/bold red] graph file not found: {args.graph}")
        sys.exit(1)

    try:
        import uvicorn
    except ImportError:
        _err.print(
            "[bold red]Error:[/bold red] uvicorn is required.  Install with:\n"
            "  [dim]pip install semantica[explorer][/dim]"
        )
        sys.exit(1)

    from .session import GraphSession
    from .app import create_app

    with _out.status("[dim]Loading graph…[/dim]", spinner="dots"):
        session = GraphSession.from_file(args.graph)
    stats = session.get_stats()
    _out.print(
        f"[bold green]✓[/bold green] Graph loaded — "
        f"[cyan]{stats.get('node_count', 0)}[/cyan] nodes, "
        f"[cyan]{stats.get('edge_count', 0)}[/cyan] edges"
    )

    app = create_app(session=session)

    url = f"http://{args.host}:{args.port}"

    _LOOPBACK_HOSTS = {"127.0.0.1", "::1", "localhost"}
    if args.host not in _LOOPBACK_HOSTS:
        import os as _os
        if _os.environ.get("SEMANTICA_ALLOW_ANONYMOUS", "").strip().lower() == "true":
            _err.print(
                f"[bold yellow]Warning:[/bold yellow] Binding to "
                f"[cyan]{args.host}[/cyan] with SEMANTICA_ALLOW_ANONYMOUS=true "
                "exposes the Explorer to the network with no authentication — "
                "all graph data will be readable and writable by any host that "
                "can reach this port."
            )
        elif not _os.environ.get("SEMANTICA_API_KEY"):
            _err.print(
                f"[bold yellow]Warning:[/bold yellow] Binding to "
                f"[cyan]{args.host}[/cyan] but SEMANTICA_API_KEY is not set — "
                "protected routes will refuse all requests (503) until it is "
                "configured."
            )

    if not args.no_browser:
        import threading
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()

    _out.print(
        Panel(
            f"[cyan]API docs[/cyan]  {url}/docs\n[cyan]Health[/cyan]    {url}/api/health",
            title=f"[bold]Semantica Explorer[/bold] · [dim]{url}[/dim]",
            border_style="cyan",
            expand=False,
        )
    )

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
