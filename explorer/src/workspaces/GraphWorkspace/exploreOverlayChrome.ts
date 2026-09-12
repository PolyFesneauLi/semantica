import { useCallback, useEffect, useRef, useState } from "react";

export const OVERLAY_LEAVE_DELAY_MS = 120;

export type OverlayExpandState = {
  hovered: boolean;
  focused: boolean;
  pinned: boolean;
  dirtyDraft: boolean;
  forceCollapsed: boolean;
};

export function isOverlayExpanded(state: OverlayExpandState): boolean {
  if (state.forceCollapsed) {
    return false;
  }
  return state.hovered || state.focused || state.pinned || state.dirtyDraft;
}

export function isCoarsePointerEvent(event: {
  pointerType?: string;
  nativeEvent?: { pointerType?: string };
}): boolean {
  const pointerType = event.pointerType || event.nativeEvent?.pointerType;
  return pointerType === "touch" || pointerType === "pen";
}

export function useSceneOverlayChrome() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dirtyDraft, setDirtyDraft] = useState(false);
  const [forceCollapsed, setForceCollapsed] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const leaveTimerRef = useRef<number | null>(null);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const expanded = isOverlayExpanded({
    hovered,
    focused,
    pinned,
    dirtyDraft,
    forceCollapsed,
  });

  const onPointerEnter = useCallback(() => {
    clearLeaveTimer();
    setForceCollapsed(false);
    setHovered(true);
  }, [clearLeaveTimer]);

  const onPointerLeave = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      setHovered(false);
      setForceCollapsed(false);
      leaveTimerRef.current = null;
    }, OVERLAY_LEAVE_DELAY_MS);
  }, [clearLeaveTimer]);

  const onFocusCapture = useCallback(() => {
    setForceCollapsed(false);
    setFocused(true);
  }, []);

  const onBlurCapture = useCallback((event: { currentTarget: HTMLElement; relatedTarget: EventTarget | null }) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    setFocused(false);
  }, []);

  const onCompactPointerUp = useCallback((event: { pointerType?: string }) => {
    if (!isCoarsePointerEvent(event)) {
      return;
    }
    setForceCollapsed(false);
    setPinned((current) => !current);
  }, []);

  const confirmAndCollapse = useCallback(() => {
    clearLeaveTimer();
    setDirtyDraft(false);
    setPinned(false);
    setHovered(false);
    setFocused(false);
    setForceCollapsed(true);
  }, [clearLeaveTimer]);

  const discardAndCollapse = useCallback(() => {
    confirmAndCollapse();
  }, [confirmAndCollapse]);

  const collapseIfIdle = useCallback(() => {
    if (dirtyDraft) {
      return;
    }
    clearLeaveTimer();
    setPinned(false);
    setHovered(false);
    setFocused(false);
    setForceCollapsed(true);
  }, [clearLeaveTimer, dirtyDraft]);

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer]);

  useEffect(() => {
    if (!pinned) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      if (event.target instanceof Node && root.contains(event.target)) {
        return;
      }
      setPinned(false);
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [pinned]);

  return {
    rootRef,
    expanded,
    hovered,
    focused,
    pinned,
    dirtyDraft,
    forceCollapsed,
    setDirtyDraft,
    onPointerEnter,
    onPointerLeave,
    onFocusCapture,
    onBlurCapture,
    onCompactPointerUp,
    confirmAndCollapse,
    discardAndCollapse,
    collapseIfIdle,
  };
}
