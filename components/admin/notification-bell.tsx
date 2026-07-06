"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "@phosphor-icons/react";

const LAST_SEEN_KEY = "dmw-csm-notif-last-seen";
const POLL_MS = 5000;
const PANEL_ID = "admin-notification-panel";
const EXIT_MS = 160;

type NotificationItem = {
  id: string;
  service: string;
  region: string;
  customerType: string;
  createdAt: string;
};

type PanelPhase = "closed" | "entering" | "open" | "closing";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function NotificationBell() {
  const [phase, setPhase] = useState<PanelPhase>("closed");
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [lastSeen, setLastSeen] = useState("");
  const lastSeenRef = useRef("");
  const phaseRef = useRef(phase);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    lastSeenRef.current = lastSeen;
  }, [lastSeen]);

  const poll = useCallback(async (force = false) => {
    if (!force && phaseRef.current !== "closed") return;
    try {
      const res = await fetch(`/api/admin/notifications?since=${encodeURIComponent(lastSeenRef.current)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: { unreadCount: number; items: NotificationItem[] } = await res.json();
      setCount(data.unreadCount);
      setItems(data.items);
    } catch {
      // Transient network error; the next poll retries.
    }
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LAST_SEEN_KEY);
    } catch {
      // storage unavailable
    }
    // First visit on this browser: anchor to now so the badge doesn't flood
    // with every response submitted before the admin ever opened the bell.
    const initial = stored ?? new Date().toISOString();
    setLastSeen(initial);
    lastSeenRef.current = initial;
    try {
      localStorage.setItem(LAST_SEEN_KEY, initial);
    } catch {
      // storage unavailable
    }

    poll();
    const interval = setInterval(poll, POLL_MS);

    // Catch up immediately when the admin comes back to the tab, rather
    // than waiting out the rest of the poll interval.
    function handleVisibility() {
      if (document.visibilityState === "visible") poll();
    }
    function handleFocus() {
      poll();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [poll]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // Two-step mount so the browser paints the closed state before "is-open"
  // is applied — otherwise the transition has nothing to animate from.
  useEffect(() => {
    if (phase !== "entering") return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase("open"));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [phase]);

  const requestClose = useCallback(() => {
    setPhase((prev) => {
      if (prev !== "open" && prev !== "entering") return prev;
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => setPhase("closed"), EXIT_MS);
      return "closing";
    });
  }, []);

  useEffect(() => {
    if (phase === "closed") return;
    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current?.contains(event.target as Node) || buttonRef.current?.contains(event.target as Node)) {
        return;
      }
      requestClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, requestClose]);

  function toggle() {
    if (phase === "closed") {
      clearTimeout(closeTimerRef.current);
      setPhase("entering");
    } else {
      requestClose();
    }
  }

  function markAllRead() {
    const now = new Date().toISOString();
    setLastSeen(now);
    lastSeenRef.current = now;
    try {
      localStorage.setItem(LAST_SEEN_KEY, now);
    } catch {
      // storage unavailable
    }
    setCount(0);
  }

  // Clicking through to a specific response counts as having seen everything
  // up to and including it, so its dot (and anything older) clears too —
  // without pulling in still-newer unread items above it in the list. The
  // badge count can't be adjusted by a simple -1 here: advancing the cutoff
  // can clear many items at once (e.g. clicking the newest one clears all of
  // them), so re-poll for the real server-computed count instead of guessing.
  function markItemRead(createdAt: string) {
    if (createdAt <= lastSeenRef.current) return;
    setLastSeen(createdAt);
    lastSeenRef.current = createdAt;
    try {
      localStorage.setItem(LAST_SEEN_KEY, createdAt);
    } catch {
      // storage unavailable
    }
    poll(true);
  }

  const panelMounted = phase !== "closed";

  return (
    <div className="notification-bell">
      <button
        ref={buttonRef}
        type="button"
        className="notification-bell__trigger"
        aria-haspopup="true"
        aria-expanded={phase !== "closed"}
        aria-controls={PANEL_ID}
        aria-label={count > 0 ? `Notifications, ${count} unread submission${count === 1 ? "" : "s"}` : "Notifications"}
        onClick={toggle}
      >
        <Bell size={16} aria-hidden="true" />
        {count > 0 && <span className="notification-bell__badge">{count > 9 ? "9+" : count}</span>}
      </button>
      <span className="visually-hidden" role="status" aria-live="polite">
        {count > 0 ? `${count} new survey submission${count === 1 ? "" : "s"}` : ""}
      </span>

      {panelMounted && (
        <div
          id={PANEL_ID}
          className={`notification-panel${phase === "open" ? " is-open" : ""}`}
          ref={panelRef}
          aria-label="Notifications"
        >
          <div className="notification-panel__head">
            <span>Notifications</span>
            <button type="button" className="notification-panel__mark-read" onClick={markAllRead} disabled={count === 0}>
              Mark all as read
            </button>
          </div>
          {items.length === 0 ? (
            <p className="activity-empty">No submissions yet.</p>
          ) : (
            <ul className="notification-panel__list">
              {items.map((item) => {
                const unread = item.createdAt > lastSeen;
                return (
                  <li className={`notification-panel__item${unread ? " is-unread" : ""}`} key={item.id}>
                    <Link
                      href={`/admin/responses?highlight=${item.id}`}
                      className="notification-panel__item-link"
                      onClick={() => {
                        markItemRead(item.createdAt);
                        requestClose();
                      }}
                    >
                      <span className="notification-panel__dot" aria-hidden="true" />
                      <div className="notification-panel__body">
                        <div className="notification-panel__row">
                          <p className="notification-panel__title">{item.service}</p>
                          <span className="notification-panel__time">{timeAgo(item.createdAt)}</span>
                        </div>
                        <p className="notification-panel__desc">
                          {item.region} · {item.customerType.charAt(0) + item.customerType.slice(1).toLowerCase()}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/admin/responses" className="notification-panel__footer" onClick={requestClose}>
            View all responses
          </Link>
        </div>
      )}
    </div>
  );
}
