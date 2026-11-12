import { useSyncExternalStore } from "react";
import type { CalcMode } from "@/lib/math-api";

// Parâmetros necessários para reabrir um cálculo exatamente como foi feito
export type HistoryParams = {
  expression: string;
  variables: string;
  derivativeOrder: number;
  limitPoint: string;
  limitDirection: string;
  tangentPoint: string;
  isDefiniteIntegral: boolean;
  lowerBound: string;
  upperBound: string;
};

export type HistoryEntry = {
  id: string;
  createdAt: number;
  mode: CalcMode;
  operation: string;
  params: HistoryParams;
  result: string;
  latex: string;
};

const STORAGE_KEY = "ddx:history:v1";
const MAX_ENTRIES = 30;

const EMPTY: HistoryEntry[] = [];
let cache: { raw: string | null; value: HistoryEntry[] } = {
  raw: null,
  value: EMPTY,
};
const listeners = new Set<() => void>();

function readSnapshot(): HistoryEntry[] {
  if (typeof window === "undefined") return EMPTY;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }

  // Mantém a mesma referência enquanto nada mudou (exigência do useSyncExternalStore)
  if (raw === cache.raw) return cache.value;

  let value = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) value = parsed as HistoryEntry[];
  } catch {
    value = EMPTY;
  }

  cache = { raw, value };
  return value;
}

function write(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(subscribe, readSnapshot, () => EMPTY);
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "createdAt">) {
  const current = readSnapshot();
  const signature = JSON.stringify([entry.mode, entry.operation, entry.params]);
  const withoutDuplicate = current.filter(
    (item) => JSON.stringify([item.mode, item.operation, item.params]) !== signature
  );

  const next: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };

  write([next, ...withoutDuplicate].slice(0, MAX_ENTRIES));
}

export function removeHistoryEntry(id: string) {
  write(readSnapshot().filter((item) => item.id !== id));
}

export function clearHistory() {
  write([]);
}