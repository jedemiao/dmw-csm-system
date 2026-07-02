"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Manila",
});

export function LiveClock() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      setText(`${formatter.format(new Date())} GMT+8`);
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return <span data-live-clock>{text ?? " "}</span>;
}
