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

  const isSupportedRef = useRef(false);
  const listeningRef = useRef(false);
  const lastShakeTimeRef = useRef(0);
  const peakIntensityRef = useRef(0);
  const shakeCountRef = useRef(0);
  const intensityWindowRef = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickStartTimeRef = useRef<number>(0);
  const clickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect support and HTTPS
  useEffect(() => {
    const isSecure =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" || window.location.hostname === "localhost");
    const hasDeviceMotion = typeof window !== "undefined" && "DeviceMotionEvent" in window;

    isSupportedRef.current = hasDeviceMotion && isSecure;

    if (!hasDeviceMotion || !isSecure) {
      setIsClickMode(true);
      setPermissionState("unsupported");
    } else if (
      typeof (window as unknown as Record<string, unknown>).DeviceMotionEvent !== "undefined" &&
      "requestPermission" in ((window as unknown as Record<string, unknown>).DeviceMotionEvent as Record<string, unknown>)
    ) {
      // iOS 13+ needs explicit permission
      setPermissionState("prompt");
    } else {
      // Android / other browsers
      setPermissionState("granted");
    }
  }, []);

  const calculateIntensity = useCallback((deltaSum: number): number => {
    // Map deltaSum (typical range 0-50) to 0-100
    const raw = Math.min((deltaSum / 35) * 100, 100);
    // Smooth with sliding window
    intensityWindowRef.current.push(raw);
    if (intensityWindowRef.current.length > 10) {
      intensityWindowRef.current.shift();
    }
    const avg = intensityWindowRef.current.reduce((a, b) => a + b, 0) / intensityWindowRef.current.length;
    return Math.round(avg);
  }, []);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (!listeningRef.current) return;

      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;

      // Calculate magnitude of acceleration
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // Simple threshold-based detection
      const now = Date.now();
      const timeSinceLastShake = now - lastShakeTimeRef.current;

      // Threshold: ~15-20 m/s² deviation from gravity (~9.8)
      // Using a simpler approach: detect significant change
      if (magnitude > 20 && timeSinceLastShake > 150) {
        lastShakeTimeRef.current = now;
        shakeCountRef.current += 1;
        setShakeCount(shakeCountRef.current);

        const intensity = calculateIntensity(magnitude - 9.8);
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
        const response = await DeviceMotionEventCtor.requestPermission();
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
      return true;
    } catch {
      setPermissionState("denied");
      setIsClickMode(true);
      return false;
    }
  }, []);

  const startListening = useCallback(() => {
    if (isClickMode) return;
    listeningRef.current = true;
    window.addEventListener("devicemotion", handleMotion);
  }, [isClickMode, handleMotion]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    window.removeEventListener("devicemotion", handleMotion);
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
    clickStartTimeRef.current = Date.now();
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
