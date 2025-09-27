import { useEffect, useRef, useState } from "react";

type Options = {
  /** URL untuk diping; pakai endpoint same-origin yang ringan dan tidak di-cache */
  pingUrl?: string;
  /** Interval ping (ms) */
  intervalMs?: number;
  /** Timeout tiap ping (ms) */
  timeoutMs?: number;
  /** Jalankan ping awal saat mount */
  immediate?: boolean;
};

export function useOnlineStatus(options: Options = {}) {
  const {
    pingUrl = `${import.meta.env.VITE_API_URL}/health`,       // saran: sediakan endpoint HEAD/GET yang always-200 di server kamu
    intervalMs = 20000,        // 20 detik
    timeoutMs = 3000,          // 3 detik
    immediate = true,
  } = options;

  const getInitialOnline = () =>
    typeof navigator !== "undefined" && "onLine" in navigator
      ? navigator.onLine
      : true; // default true kalau environment tidak expose navigator

  const [isOnline, setIsOnline] = useState<boolean>(getInitialOnline());
  const intervalRef = useRef<number | null>(null);

  // Listener native online/offline
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Heartbeat ke server (lebih reliabel dari sekadar navigator.onLine)
  useEffect(() => {
    let aborted = false;

    const ping = async () => {
      // gunakan AbortController untuk timeout
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);

      try {
        const res = await fetch(
          // cache-buster supaya tidak diambil dari cache
          `${pingUrl}${pingUrl.includes("?") ? "&" : "?"}cb=${Date.now()}`,
          {
            method: "HEAD",          // kalau server tidak izinkan HEAD, ganti ke GET
            cache: "no-store",
            signal: ctrl.signal,
            // penting: pakai same-origin agar status bisa dibaca tanpa masalah CORS
            // kalau cross-origin, pastikan CORS mengizinkan
          }
        );
        clearTimeout(t);
        if (aborted) return;
        setIsOnline(res.ok);
      } catch {
        clearTimeout(t);
        if (aborted) return;
        setIsOnline(false);
      }
    };

    // jalankan ping pertama saat mount/visibility change
    const handleVisible = () => {
      // hanya ping saat tab visible supaya hemat
      if (document.visibilityState === "visible") ping();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisible);
    }

    if (immediate) ping();

    intervalRef.current = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      ping();
    }, intervalMs) as unknown as number;

    return () => {
      aborted = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisible);
      }
    };
  }, [pingUrl, intervalMs, timeoutMs, immediate]);

  return isOnline;
}
