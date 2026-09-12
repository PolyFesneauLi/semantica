import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import React, { useState } from "react";

import { GRAPH_THEME } from "../src/workspaces/GraphWorkspace/graphTheme.ts";
import { resolveEdgeElementStyle } from "../src/workspaces/GraphWorkspace/graphSceneState.ts";
import {
  COMPACT_CHIP_FONT_MAX_PX,
  COMPACT_CHIP_FONT_MIN_PX,
  fitFontSizeToWidth,
} from "../src/workspaces/GraphWorkspace/fitCompactChrome.ts";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
});
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});

const { cleanup, createEvent, fireEvent, render } = await import("@testing-library/react");
const { useSceneOverlayChrome } = await import("../src/workspaces/GraphWorkspace/exploreOverlayChrome.ts");

test.afterEach(cleanup);

function CommandChromeProbe({
  draft,
}: {
  draft: number;
}) {
  const overlay = useSceneOverlayChrome();
  const setDirtyDraft = overlay.setDirtyDraft;
  const [value, setValue] = useState(draft);
  const [applied, setApplied] = useState(draft);
  const dirty = value !== applied;

  React.useEffect(() => {
    setDirtyDraft(dirty);
  }, [dirty, setDirtyDraft]);

  return (
    <div
      className="explore-command-chrome"
      data-expanded={overlay.expanded ? "true" : "false"}
      aria-expanded={overlay.expanded}
      onPointerEnter={overlay.onPointerEnter}
      onPointerLeave={overlay.onPointerLeave}
      onFocusCapture={overlay.onFocusCapture}
      onBlurCapture={overlay.onBlurCapture}
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          return;
        }
        setValue(applied);
        overlay.discardAndCollapse();
      }}
    >
      <div className="explore-command-compact" onPointerUp={overlay.onCompactPointerUp}>
        <span>61 nodes · 94 edges</span>
        <button type="button" aria-label="Open search">Search</button>
      </div>
      <div className="explore-command-dropdown" hidden={!overlay.expanded}>
        <input
          aria-label="Search graph nodes"
          placeholder="Search command, node, or concept"
          onChange={() => undefined}
        />
        <button type="button">Full Graph</button>
        <div className="explore-color-legend" role="group" aria-label="Node colors">
          <span className="explore-color-legend-item">PERSON</span>
        </div>
        <input
          aria-label="Ego depth"
          type="range"
          min={1}
          max={8}
          value={value}
          onChange={(event) => setValue(Number(event.currentTarget.value))}
        />
        <button
          type="button"
          onClick={() => {
            setApplied(value);
            overlay.confirmAndCollapse();
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

test("idle command chrome is one compact row until hover expands the dropdown", () => {
  const view = render(<CommandChromeProbe draft={3} />);
  const chrome = view.container.querySelector(".explore-command-chrome") as HTMLElement;
  assert.equal(chrome.getAttribute("data-expanded"), "false");
  assert.equal(view.queryByPlaceholderText("Search command, node, or concept")?.hasAttribute("hidden") || view.container.querySelector(".explore-command-dropdown")?.hasAttribute("hidden"), true);

  fireEvent.pointerEnter(chrome);
  assert.equal(chrome.getAttribute("data-expanded"), "true");
  assert.ok(view.getByPlaceholderText("Search command, node, or concept"));
  assert.ok(view.getByRole("group", { name: "Node colors" }));
  assert.ok(view.getByRole("button", { name: "Full Graph" }));
});

test("keyboard focus expands chrome and Escape discards an unconfirmed numeric draft", () => {
  const view = render(<CommandChromeProbe draft={3} />);
  const chrome = view.container.querySelector(".explore-command-chrome") as HTMLElement;
  fireEvent.focusIn(chrome);
  const slider = view.getByLabelText("Ego depth") as HTMLInputElement;
  fireEvent.change(slider, { target: { value: "6" } });
  assert.equal(slider.value, "6");
  fireEvent.keyDown(chrome, { key: "Escape" });
  assert.equal(chrome.getAttribute("data-expanded"), "false");
  fireEvent.pointerEnter(chrome);
  assert.equal((view.getByLabelText("Ego depth") as HTMLInputElement).value, "3");
});

test("coarse pointer tap pins the command dropdown", () => {
  const view = render(<CommandChromeProbe draft={3} />);
  const chrome = view.container.querySelector(".explore-command-chrome") as HTMLElement;
  const compact = view.container.querySelector(".explore-command-compact") as HTMLElement;
  const event = createEvent.pointerUp(compact);
  Object.defineProperty(event, "pointerType", { value: "touch" });
  fireEvent(compact, event);
  assert.equal(chrome.getAttribute("data-expanded"), "true");
  fireEvent.keyDown(chrome, { key: "Escape" });
  assert.equal(chrome.getAttribute("data-expanded"), "false");
});

test("canvas node selection recedes idle chrome without applying a numeric draft", () => {
  function NodeSelectProbe() {
    const overlay = useSceneOverlayChrome();
    return (
      <div>
        <div
          className="explore-command-chrome"
          data-expanded={overlay.expanded ? "true" : "false"}
          onPointerEnter={overlay.onPointerEnter}
        >
          <div className="explore-command-compact">Idle row</div>
          <div className="explore-command-dropdown" hidden={!overlay.expanded}>Dropdown</div>
        </div>
        <button type="button" onClick={() => overlay.collapseIfIdle()}>Select node</button>
      </div>
    );
  }

  const view = render(<NodeSelectProbe />);
  const chrome = view.container.querySelector(".explore-command-chrome") as HTMLElement;
  fireEvent.pointerEnter(chrome);
  assert.equal(chrome.getAttribute("data-expanded"), "true");
  fireEvent.click(view.getByRole("button", { name: "Select node" }));
  assert.equal(chrome.getAttribute("data-expanded"), "false");
});

test("Confirm applies the numeric draft and recedes the dropdown", () => {
  const view = render(<CommandChromeProbe draft={3} />);
  const chrome = view.container.querySelector(".explore-command-chrome") as HTMLElement;
  fireEvent.pointerEnter(chrome);
  fireEvent.change(view.getByLabelText("Ego depth"), { target: { value: "5" } });
  fireEvent.click(view.getByRole("button", { name: "Confirm" }));
  assert.equal(chrome.getAttribute("data-expanded"), "false");
  fireEvent.pointerEnter(chrome);
  assert.equal((view.getByLabelText("Ego depth") as HTMLInputElement).value, "5");
});

test("collapsed temporal chrome keeps Play reachable without the full scrubber", () => {
  function TemporalChromeProbe() {
    const overlay = useSceneOverlayChrome();
    const [playing, setPlaying] = useState(false);
    return (
      <div
        className="explore-temporal-chrome"
        data-expanded={overlay.expanded ? "true" : "false"}
        onPointerEnter={overlay.onPointerEnter}
        onPointerLeave={overlay.onPointerLeave}
      >
        <div className="explore-temporal-compact">
          <button
            id="temporal-play-btn"
            type="button"
            aria-label={playing ? "Pause Evolution" : "Play Evolution"}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <span>2026/09</span>
        </div>
        <div className="explore-temporal-dropdown" hidden={!overlay.expanded}>
          Temporal Scrubber
        </div>
      </div>
    );
  }

  const view = render(<TemporalChromeProbe />);
  const play = view.getByRole("button", { name: "Play Evolution" });
  const chrome = view.container.querySelector(".explore-temporal-chrome") as HTMLElement;
  assert.equal(chrome.getAttribute("data-expanded"), "false");
  fireEvent.click(play);
  assert.ok(view.getByRole("button", { name: "Pause Evolution" }));
  assert.equal(view.container.querySelector(".explore-temporal-dropdown")?.hasAttribute("hidden"), true);
});

test("hovered incident edges force arrows in overview LOD", () => {
  const attrs = {
    edgeType: "KNOWS",
    weight: 1,
    properties: {},
    size: 1,
    color: "#ffffff",
    arrowVisibilityPolicy: "contextual" as const,
  };
  const overview = resolveEdgeElementStyle(
    GRAPH_THEME,
    "overview",
    "neighbor",
    attrs,
    "alice",
    "bob",
    "full",
    "edge_1",
    "local-context",
    false,
  );
  const forced = resolveEdgeElementStyle(
    GRAPH_THEME,
    "overview",
    "neighbor",
    attrs,
    "alice",
    "bob",
    "full",
    "edge_1",
    "local-context",
    true,
  );
  assert.ok(overview.type === "line" || overview.type === "curve");
  assert.ok(forced.type === "arrow" || forced.type === "curvedArrow");
});

test("compact chip font stays at max when the row already fits", () => {
  assert.equal(
    fitFontSizeToWidth(COMPACT_CHIP_FONT_MIN_PX, COMPACT_CHIP_FONT_MAX_PX, () => false),
    COMPACT_CHIP_FONT_MAX_PX,
  );
});

test("compact chip font shrinks until the row fits one line", () => {
  const size = fitFontSizeToWidth(COMPACT_CHIP_FONT_MIN_PX, COMPACT_CHIP_FONT_MAX_PX, (candidate) => candidate > 9);
  assert.ok(size <= 9.1);
  assert.ok(size >= 8.5);
});

test("compact chip font stops at the minimum when even that overflows", () => {
  assert.equal(
    fitFontSizeToWidth(COMPACT_CHIP_FONT_MIN_PX, COMPACT_CHIP_FONT_MAX_PX, () => true),
    COMPACT_CHIP_FONT_MIN_PX,
  );
});
