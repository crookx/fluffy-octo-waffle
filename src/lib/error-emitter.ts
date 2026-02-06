'use client';

import type { FirestorePermissionError } from './errors';

type Listener<T> = (data: T) => void;

type Events = {
  'permission-error': FirestorePermissionError;
};

class TypedEventEmitter<T extends Record<string, any>> {
  private listeners: { [K in keyof T]?: Listener<T[K]>[] } = {};

  on<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  off<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event]!.filter(l => l !== listener);
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event]!.forEach(listener => listener(data));
  }
}

export const errorEmitter = new TypedEventEmitter<Events>();
