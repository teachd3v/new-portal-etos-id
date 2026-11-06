"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

const THRESHOLD = 68;
const MAX_PULL = 120;

function findBlockingOrScrollContext(target) {
  if (!(target instanceof Element)) return { blocked: true, scrollEl: null };

  // Never hijack form controls or explicit opt-out zones
  if (
    target.closest(
      'input, textarea, select, [contenteditable="true"], [data-no-ptr]'
    )
  ) {
    return { blocked: true, scrollEl: null };
  }

  let el = target;
  let primaryScrollEl = null;

  while (el && el !== document.body && el !== document.documentElement) {
    if (el instanceof HTMLElement) {
      const style = window.getComputedStyle(el);

      // Ignore touches inside elevated fixed overlays (modals, drawers, bottom nav, command palettes)
      if (style.position === "fixed") {
        const z = parseInt(style.zIndex, 10);
        if (!Number.isNaN(z) && z >= 40) {
          return { blocked: true, scrollEl: null };
        }
      }

      const overflowY = style.overflowY;
      const isScrollableY =
        (overflowY === "auto" ||
          overflowY === "scroll" ||
          overflowY === "overlay") &&
        el.scrollHeight > el.clientHeight + 1;

      if (isScrollableY) {
        if (el.scrollTop > 1) {
          return { blocked: true, scrollEl: el };
        }
        if (!primaryScrollEl) {
          primaryScrollEl = el;
        }
      }
    }
    el = el.parentElement;
  }

  if (
    window.scrollY > 1 ||
    (document.scrollingElement && document.scrollingElement.scrollTop > 1)
  ) {
    return { blocked: true, scrollEl: document.scrollingElement };
  }

  return {
    blocked: false,
    scrollEl: primaryScrollEl || document.scrollingElement,
  };
}

export default function PullToRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const [ready, setReady] = useState(false);

  const badgeRef = useRef(null);
  const iconWrapRef = useRef(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const gesture = {
      active: false,
      locked: false,
      startX: 0,
      startY: 0,
      pull: 0,
      readyFired: false,
      scrollEl: null,
    };

    const setBadgeVisual = (pullPx, animate = false) => {
      const badge = badgeRef.current;
      const iconWrap = iconWrapRef.current;
      if (!badge || !iconWrap) return;

      const progress = Math.min(1, pullPx / THRESHOLD);
      const y = Math.round(-44 + pullPx * 1.15);
      const scale = 0.72 + 0.28 * progress;
      const opacity = pullPx < 6 ? 0 : Math.min(1, (pullPx - 6) / 24);

      badge.style.transition = animate
        ? "transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 180ms ease"
        : "none";
      badge.style.transform = `translate3d(-50%, calc(env(safe-area-inset-top, 0px) + ${y}px), 0) scale(${scale})`;
      badge.style.opacity = String(opacity);

      if (!refreshingRef.current) {
        iconWrap.style.transform = `rotate(${Math.round(progress * 240)}deg)`;
      }
    };

    const handleTouchStart = (e) => {
      if (refreshingRef.current || e.touches.length !== 1) return;

      const { blocked, scrollEl } = findBlockingOrScrollContext(e.target);
      if (blocked) {
        gesture.active = false;
        return;
      }

      gesture.active = true;
      gesture.locked = false;
      gesture.startX = e.touches[0].clientX;
      gesture.startY = e.touches[0].clientY;
      gesture.pull = 0;
      gesture.readyFired = false;
      gesture.scrollEl = scrollEl;
    };

    const handleTouchMove = (e) => {
      if (!gesture.active || refreshingRef.current) return;
      if (e.touches.length !== 1) {
        gesture.active = false;
        setBadgeVisual(0, true);
        return;
      }

      const dx = e.touches[0].clientX - gesture.startX;
      const dy = e.touches[0].clientY - gesture.startY;

      if (!gesture.locked) {
        // Wait for minimal 2.5px movement to classify direction accurately
        if (Math.abs(dx) < 2.5 && Math.abs(dy) < 2.5) return;

        // Abort immediately on upward scroll or horizontal swipe (e.g. carousel)
        if (dy <= 0 || Math.abs(dx) * 1.15 >= Math.abs(dy)) {
          gesture.active = false;
          return;
        }

        if (gesture.scrollEl && gesture.scrollEl.scrollTop > 1) {
          gesture.active = false;
          return;
        }

        gesture.locked = true;
      }

      if (dy <= 0) {
        gesture.pull = 0;
        setBadgeVisual(0, false);
        if (gesture.readyFired) {
          gesture.readyFired = false;
          setReady(false);
        }
        return;
      }

      if (e.cancelable) {
        e.preventDefault();
      }

      const damped = Math.min(
        MAX_PULL,
        Math.round(MAX_PULL * (1 - Math.exp(-dy / 165)))
      );
      gesture.pull = damped;
      setBadgeVisual(damped, false);

      const isNowReady = damped >= THRESHOLD;
      if (isNowReady !== gesture.readyFired) {
        gesture.readyFired = isNowReady;
        setReady(isNowReady);
        if (isNowReady && typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(10);
          } catch {
            // Ignore vibration permission restrictions
          }
        }
      }
    };

    const finishGesture = () => {
      if (!gesture.active) return;
      const wasLocked = gesture.locked;
      const finalPull = gesture.pull;

      gesture.active = false;
      gesture.locked = false;
      gesture.pull = 0;

      if (!wasLocked) return;

      if (finalPull >= THRESHOLD) {
        if (
          typeof navigator !== "undefined" &&
          navigator.onLine === false &&
          window.location.pathname !== "/offline"
        ) {
          toast.error("Tidak ada koneksi internet");
          setReady(false);
          setBadgeVisual(0, true);
          return;
        }

        setRefreshing(true);
        refreshingRef.current = true;

        const badge = badgeRef.current;
        const iconWrap = iconWrapRef.current;
        if (badge) {
          badge.style.transition =
            "transform 200ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 150ms ease";
          badge.style.transform =
            "translate3d(-50%, calc(env(safe-area-inset-top, 0px) + 50px), 0) scale(1)";
          badge.style.opacity = "1";
        }
        if (iconWrap) {
          iconWrap.style.transform = "";
        }

        if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
          navigator.serviceWorker
            .getRegistration()
            .then((reg) => reg?.update())
            .catch(() => {});
        }

        setTimeout(() => {
          window.location.reload();
        }, 260);
      } else {
        setReady(false);
        setBadgeVisual(0, true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", finishGesture, { passive: true });
    window.addEventListener("touchcancel", finishGesture, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", finishGesture);
      window.removeEventListener("touchcancel", finishGesture);
    };
  }, []);

  return (
    <div
      ref={badgeRef}
      aria-hidden="true"
      style={{
        transform:
          "translate3d(-50%, calc(env(safe-area-inset-top, 0px) - 48px), 0) scale(0.72)",
        opacity: 0,
      }}
      className="fixed top-0 left-1/2 z-[9990] w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_24px_rgba(15,23,42,0.18)] flex items-center justify-center pointer-events-none will-change-transform md:hidden"
    >
      <div
        ref={iconWrapRef}
        className={`flex items-center justify-center transition-colors duration-150 ${
          refreshing || ready ? "text-sky-600" : "text-slate-500"
        }`}
      >
        <RefreshCw
          className={`w-[18px] h-[18px] ${refreshing ? "animate-spin" : ""}`}
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}
