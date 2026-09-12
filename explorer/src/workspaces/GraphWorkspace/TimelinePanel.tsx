import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline";
import type { TimelineOptions } from "vis-timeline";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { GRAPH_THEME } from "./graphTheme";
import { useSceneOverlayChrome } from "./exploreOverlayChrome";
import { DEFAULT_MIN_DATE, resolvePlayStepMs, resolveScrubberBounds } from "./temporalScrubberBounds";

export interface TimelinePanelProps {
  onTimeChange: (time: Date) => void;
  minDate?: string;
  maxDate?: string;
}

const PLAYHEAD_ID = "playhead";
const PLAY_INTERVAL_MS = 500;
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const VIS_OVERRIDE_CSS = `
  .sem-timeline-wrap .vis-timeline { border: none !important; background: transparent !important; overflow: visible !important; }
  .sem-timeline-wrap .vis-panel.vis-background, .sem-timeline-wrap .vis-panel.vis-center { background: transparent !important; }
  .sem-timeline-wrap .vis-panel { border-color: ${GRAPH_THEME.ui.timeline.border} !important; }
  .sem-timeline-wrap .vis-time-axis .vis-text {
    color: ${GRAPH_THEME.ui.timeline.text} !important;
    font-size: 11px !important;
    font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
    padding-top: 3px !important;
  }
  .sem-timeline-wrap .vis-time-axis .vis-text.vis-major {
    color: ${GRAPH_THEME.ui.timeline.textStrong} !important;
    font-weight: 700 !important;
    font-size: 12px !important;
  }
  .sem-timeline-wrap .vis-time-axis .vis-grid.vis-minor { border-color: ${GRAPH_THEME.ui.timeline.gridMinor} !important; }
  .sem-timeline-wrap .vis-time-axis .vis-grid.vis-major { border-color: ${GRAPH_THEME.ui.timeline.gridMajor} !important; }
  .sem-timeline-wrap .vis-custom-time.${PLAYHEAD_ID} {
    background: ${GRAPH_THEME.ui.timeline.playheadSoft} !important;
    width: 2px !important;
    cursor: ew-resize !important;
    z-index: 5 !important;
  }
  .sem-timeline-wrap .vis-custom-time.${PLAYHEAD_ID} > .vis-custom-time-marker {
    background: ${GRAPH_THEME.ui.timeline.playhead} !important;
    color: ${GRAPH_THEME.ui.text.inverse} !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    border-radius: 3px !important;
    padding: 1px 5px !important;
    white-space: nowrap !important;
    box-shadow: 0 0 8px rgba(98, 226, 205, 0.45) !important;
  }
  .sem-timeline-wrap .vis-current-time { display: none !important; }
  .sem-timeline-wrap .vis-panel.vis-left { display: none !important; }
`;

function formatPlayheadLabel(value: Date): string {
  return `${value.getFullYear()}/${String(value.getMonth() + 1).padStart(2, "0")}`;
}

export function TimelinePanel({ onTimeChange, minDate, maxDate }: TimelinePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const playheadRef = useRef<Date>(DEFAULT_MIN_DATE);
  const appliedTimeRef = useRef<Date>(DEFAULT_MIN_DATE);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeChangeRef = useRef(onTimeChange);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayDate, setDisplayDate] = useState(formatPlayheadLabel(DEFAULT_MIN_DATE));
  const [timelineMounted, setTimelineMounted] = useState(false);
  const overlay = useSceneOverlayChrome();
  const setDirtyDraft = overlay.setDirtyDraft;

  onTimeChangeRef.current = onTimeChange;

  const now = useMemo(() => new Date(), []);
  const { minBound, maxBound, defaultTime } = useMemo(
    () => resolveScrubberBounds({ minDate, maxDate, now }),
    [maxDate, minDate, now],
  );

  const applyTime = useCallback((time: Date, options?: { preview?: boolean }) => {
    playheadRef.current = time;
    setDisplayDate(formatPlayheadLabel(time));
    timelineRef.current?.setCustomTime(time, PLAYHEAD_ID);
    onTimeChangeRef.current(time);
    if (!options?.preview) {
      appliedTimeRef.current = time;
    }
  }, []);

  useEffect(() => {
    playheadRef.current = defaultTime;
    appliedTimeRef.current = defaultTime;
    applyTime(defaultTime);
  }, [applyTime, defaultTime]);

  useEffect(() => {
    if (!overlay.expanded) {
      return;
    }
    setTimelineMounted(true);
  }, [overlay.expanded]);

  useEffect(() => {
    if (!timelineMounted || !containerRef.current) {
      return;
    }

    if (timelineRef.current) {
      timelineRef.current.setOptions({ min: minBound, max: maxBound, start: minBound, end: maxBound });
      timelineRef.current.setCustomTime(playheadRef.current, PLAYHEAD_ID);
      timelineRef.current.redraw();
      return;
    }

    const items = new DataSet([]);
    const options: TimelineOptions = {
      height: "100%",
      min: minBound,
      max: maxBound,
      start: minBound,
      end: maxBound,
      showCurrentTime: false,
      zoomable: true,
      moveable: true,
      zoomMin: ONE_DAY_MS,
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 80,
      showMajorLabels: true,
      showMinorLabels: true,
      orientation: { axis: "bottom" },
      margin: { item: 0, axis: 0 },
      selectable: false,
      stack: false,
    } as TimelineOptions;

    const nextTimeline = new Timeline(containerRef.current, items, options);
    timelineRef.current = nextTimeline;
    nextTimeline.addCustomTime(playheadRef.current, PLAYHEAD_ID);
    nextTimeline.on("timechange", (props: { id: string; time: Date }) => {
      if (props.id !== PLAYHEAD_ID) {
        return;
      }
      applyTime(props.time, { preview: true });
      setDirtyDraft(true);
    });
    nextTimeline.redraw();

    return () => {
      nextTimeline.destroy();
      timelineRef.current = null;
    };
  }, [applyTime, maxBound, minBound, setDirtyDraft, timelineMounted]);

  const restoreAppliedTime = useCallback(() => {
    applyTime(appliedTimeRef.current);
    overlay.setDirtyDraft(false);
  }, [applyTime, overlay]);

  const confirmPlayhead = useCallback(() => {
    applyTime(playheadRef.current);
    overlay.confirmAndCollapse();
  }, [applyTime, overlay]);

  const discardPlayhead = useCallback(() => {
    restoreAppliedTime();
    overlay.discardAndCollapse();
  }, [overlay, restoreAppliedTime]);

  const startPlay = useCallback(() => {
    if (playIntervalRef.current) {
      return;
    }
    playIntervalRef.current = setInterval(() => {
      const next = new Date(playheadRef.current.getTime() + resolvePlayStepMs(minBound, maxBound));
      if (next >= maxBound) {
        next.setTime(minBound.getTime());
      }
      applyTime(next);
    }, PLAY_INTERVAL_MS);
  }, [applyTime, maxBound, minBound]);

  const stopPlay = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((previous) => {
      if (previous) {
        stopPlay();
        return false;
      }
      startPlay();
      return true;
    });
  }, [startPlay, stopPlay]);

  useEffect(() => () => stopPlay(), [stopPlay]);

  useEffect(() => {
    if (!overlay.expanded) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      if (overlay.dirtyDraft) {
        discardPlayhead();
        return;
      }
      overlay.discardAndCollapse();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [discardPlayhead, overlay]);

  return (
    <div
      ref={overlay.rootRef}
      className="explore-temporal-chrome"
      data-expanded={overlay.expanded ? "true" : "false"}
      aria-expanded={overlay.expanded}
      onPointerEnter={overlay.onPointerEnter}
      onPointerLeave={overlay.onPointerLeave}
      onFocusCapture={overlay.onFocusCapture}
      onBlurCapture={overlay.onBlurCapture}
    >
      <style>{VIS_OVERRIDE_CSS}</style>
      <div className="explore-temporal-compact" onPointerUp={overlay.onCompactPointerUp}>
        <button
          id="temporal-play-btn"
          type="button"
          onClick={togglePlay}
          title={isPlaying ? "Pause Evolution" : "Play Evolution"}
          aria-label={isPlaying ? "Pause Evolution" : "Play Evolution"}
          style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${isPlaying ? GRAPH_THEME.ui.control.activeBorder : GRAPH_THEME.ui.control.defaultBorder}`, background: isPlaying ? GRAPH_THEME.ui.timeline.playheadSoft : GRAPH_THEME.ui.control.defaultBg, color: GRAPH_THEME.ui.timeline.playhead, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", boxShadow: isPlaying ? "0 0 10px rgba(98, 226, 205, 0.32)" : "none" }}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </button>
        <span style={{ fontSize: 10, color: isPlaying ? GRAPH_THEME.ui.timeline.playhead : GRAPH_THEME.ui.timeline.text, fontFamily: "monospace", letterSpacing: "0.04em", transition: "color 0.2s" }}>
          {displayDate}
        </span>
      </div>

      <div className="explore-temporal-dropdown" hidden={!overlay.expanded}>
        <div className="explore-temporal-dropdown-label">
          Temporal Scrubber · {minBound.getFullYear()}-{maxBound.getFullYear()}
        </div>
        <div className="sem-timeline-wrap" style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: 90 }}>
          <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", minHeight: 90 }} />
        </div>
        {overlay.dirtyDraft ? (
          <button type="button" className="explore-temporal-confirm" onClick={confirmPlayhead}>
            Confirm
          </button>
        ) : null}
      </div>
    </div>
  );
}
