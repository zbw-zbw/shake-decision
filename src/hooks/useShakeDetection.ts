"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type PermissionState = "prompt" | "granted" | "denied" | "unsupported";
export type TangleLevel = "light" | "medium" | "heavy" | "extreme";

export interface ShakeResult {
  isShaking: boolean;
  shakeIntensity: number;
  shakeCount: number;
  isSupported: boolean;
  permissionState: PermissionState;
  requestPermission: () => Promise<boolean>;
  startListening: () => void;
  stopListening: () => void;
  tangleLevel: TangleLevel;
  tangleLabel: string;
  peakIntensity: number;
  isClickMode: boolean;
  debugInfo: string;
}

function getTangleLevel(intensity: number): { level: TangleLevel; label: string } {
  if (intensity <= 30) return { level: "light", label: "轻度纠结" };
  if (intensity <= 60) return { level: "medium", label: "中度纠结" };
  if (intensity <= 85) return { level: "heavy", label: "重度纠结" };
  return { level: "extreme", label: "极度纠结" };
}

export function useShakeDetection(): ShakeResult {
  const [isShaking, setIsShaking] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [shakeCount, setShakeCount] = useState(0);
  const [peakIntensity, setPeakIntensity] = useState(0);
  const [permissionState, setPermissionState] = useState<PermissionState>("prompt");
  const [isClickMode, setIsClickMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("初始化中...");

  const isSupportedRef = useRef(false);
  const listeningRef = useRef(false);
  const lastShakeTimeRef = useRef(0);
  const peakIntensityRef = useRef(0);
  const shakeCountRef = useRef(0);
  const intensityWindowRef = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAccRef = useRef({ x: 0, y: 0, z: 0 });
  const clickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect support and HTTPS
  useEffect(() => {
    const isSecure =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" || window.location.hostname === "localhost");
    const hasDeviceMotion = typeof window !== "undefined" && "DeviceMotionEvent" in window;

    isSupportedRef.current = hasDeviceMotion && isSecure;

    setDebugInfo(
      `support=${hasDeviceMotion} secure=${isSecure} proto=${window.location.protocol}`
    );

    if (!hasDeviceMotion || !isSecure) {
      setIsClickMode(true);
      setPermissionState("unsupported");
      setDebugInfo((prev) => `${prev} mode=unsupported`);
    } else if (
      typeof (window as unknown as Record<string, unknown>).DeviceMotionEvent !== "undefined" &&
      "requestPermission" in ((window as unknown as Record<string, unknown>).DeviceMotionEvent as Record<string, unknown>)
    ) {
      // iOS 13+ needs explicit permission
      setPermissionState("prompt");
      setDebugInfo((prev) => `${prev} mode=ios-prompt`);
    } else {
      // Android / other browsers
      setPermissionState("granted");
      setDebugInfo((prev) => `${prev} mode=android-granted`);
    }
  }, []);

  const calculateIntensity = useCallback((deltaSum: number): number => {
    // deltaSum 范围约 8-50，映射到 0-100
    const raw = Math.min(((deltaSum - 5) / 30) * 100, 100);
    const curved = Math.pow(Math.max(raw, 0) / 100, 0.7) * 100;
    intensityWindowRef.current.push(curved);
    if (intensityWindowRef.current.length > 8) {
      intensityWindowRef.current.shift();
    }
    const avg = intensityWindowRef.current.reduce((a, b) => a + b, 0) / intensityWindowRef.current.length;
    return Math.round(Math.max(avg, 0));
  }, []);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      // eslint-disable-next-line no-console
      console.log("[devicemotion] listening=", listeningRef.current, "event=", event);
      if (!listeningRef.current) return;

      const acc = event.accelerationIncludingGravity;
      // eslint-disable-next-line no-console
      console.log("[devicemotion] acc=", acc);
      if (!acc) {
        setDebugInfo("acc is null");
        return;
      }

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;

      // 计算加速度变化量（去除重力的影响）
      const deltaX = Math.abs(x - lastAccRef.current.x);
      const deltaY = Math.abs(y - lastAccRef.current.y);
      const deltaZ = Math.abs(z - lastAccRef.current.z);
      const deltaSum = deltaX + deltaY + deltaZ;

      lastAccRef.current = { x, y, z };

      const now = Date.now();
      const timeSinceLastShake = now - lastShakeTimeRef.current;

      setDebugInfo(
        `x=${x.toFixed(1)} y=${y.toFixed(1)} z=${z.toFixed(1)} Δ=${deltaSum.toFixed(1)} t=${timeSinceLastShake}`
      );

      // 降低阈值到 5，让轻摇也能触发
      if (deltaSum > 5 && timeSinceLastShake > 120) {
        lastShakeTimeRef.current = now;
        shakeCountRef.current += 1;
        setShakeCount(shakeCountRef.current);

        const intensity = calculateIntensity(deltaSum);
        setShakeIntensity(intensity);
        setIsShaking(true);

        if (intensity > peakIntensityRef.current) {
          peakIntensityRef.current = intensity;
          setPeakIntensity(intensity);
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setIsShaking(false);
        }, 300);
      }
    },
    [calculateIntensity]
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const DeviceMotionEventCtor = (window as unknown as Record<string, unknown>).DeviceMotionEvent as {
        requestPermission?: () => Promise<string>;
      };

      if (DeviceMotionEventCtor?.requestPermission) {
        setDebugInfo("requesting permission...");
        const response = await DeviceMotionEventCtor.requestPermission();
        setDebugInfo(`permission response=${response}`);
        if (response === "granted") {
          setPermissionState("granted");
          setIsClickMode(false);
          return true;
        } else {
          setPermissionState("denied");
          setIsClickMode(true);
          return false;
        }
      }
      // No explicit permission needed
      setPermissionState("granted");
      setDebugInfo("no explicit permission needed");
      return true;
    } catch (e) {
      setPermissionState("denied");
      setIsClickMode(true);
      setDebugInfo(`permission error=${(e as Error).message}`);
      return false;
    }
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("[useShakeDetection] startListening called, listening=", listeningRef.current);
    listeningRef.current = true;
    setDebugInfo((prev) => `${prev} | startListening called`);
    try {
      // Remove first to avoid duplicate listeners (e.g. StrictMode double-run)
      window.removeEventListener("devicemotion", handleMotion);
      window.addEventListener("devicemotion", handleMotion, { passive: true });
      setDebugInfo((prev) => `${prev} | listener added`);
    } catch (e) {
      setDebugInfo((prev) => `${prev} | listener error=${(e as Error).message}`);
    }
  }, [handleMotion]);

  const stopListening = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("[useShakeDetection] stopListening called");
    listeningRef.current = false;
    try {
      window.removeEventListener("devicemotion", handleMotion);
    } catch {
      // ignore
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intensityWindowRef.current = [];
  }, [handleMotion]);

  // Click mode handlers
  const triggerClickShake = useCallback(
    (intensity?: number) => {
      const now = Date.now();
      shakeCountRef.current += 1;
      setShakeCount(shakeCountRef.current);

      const computedIntensity = intensity ?? Math.min(30 + shakeCountRef.current * 3, 95);
      setShakeIntensity(computedIntensity);
      setIsShaking(true);

      if (computedIntensity > peakIntensityRef.current) {
        peakIntensityRef.current = computedIntensity;
        setPeakIntensity(computedIntensity);
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsShaking(false);
      }, 300);
    },
    []
  );

  const startClickHold = useCallback(() => {
    triggerClickShake();
    clickIntervalRef.current = setInterval(() => {
      triggerClickShake();
    }, 100);
  }, [triggerClickShake]);

  const stopClickHold = useCallback(() => {
    if (clickIntervalRef.current) {
      clearInterval(clickIntervalRef.current);
      clickIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      if (clickIntervalRef.current) clearInterval(clickIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [stopListening]);

  const tangle = getTangleLevel(peakIntensity);

  return {
    isShaking,
    shakeIntensity,
    shakeCount,
    isSupported: isSupportedRef.current,
    permissionState,
    requestPermission,
    startListening,
    stopListening,
    tangleLevel: tangle.level,
    tangleLabel: tangle.label,
    peakIntensity,
    isClickMode,
    debugInfo,
  };
}

// Export click handlers separately for PC mode
export function useClickShake(
  onShake: (intensity: number) => void
): {
  startClickHold: () => void;
  stopClickHold: () => void;
  triggerClick: () => void;
} {
  const clickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);

  const triggerClick = useCallback(() => {
    countRef.current += 1;
    const intensity = Math.min(25 + countRef.current * 4, 98);
    onShake(intensity);
  }, [onShake]);

  const startClickHold = useCallback(() => {
    triggerClick();
    clickIntervalRef.current = setInterval(() => {
      triggerClick();
    }, 100);
  }, [triggerClick]);

  const stopClickHold = useCallback(() => {
    if (clickIntervalRef.current) {
      clearInterval(clickIntervalRef.current);
      clickIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (clickIntervalRef.current) clearInterval(clickIntervalRef.current);
    };
  }, []);

  return { startClickHold, stopClickHold, triggerClick };
}
