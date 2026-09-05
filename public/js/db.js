// public/js/db.js - Hardened IndexedDB with WebKit Eviction Protection
const DB_NAME = 'ProductivityEngineDB';
const DB_VERSION = 1;

export class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    await this.ensurePersistence();
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const stores = [
          'problems', 'principles', 'proofs',
          'visions', 'horizons',
          'objectives', 'projects',
          'tasks', 'linked_notes',
          'assets', 'links', 'free_notes'
        ];
        stores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            db.createObjectStore(s, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this);
      };
      request.onerror = (e) => reject(e);
    });
  }

  /**
   * Safari ITP Eviction Defense: Requests persistent storage
   */
  async ensurePersistence() {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      const estimate = await navigator.storage.estimate();
      return {
        persisted: isPersisted,
        usageMb: ((estimate.usage || 0) / (1024 * 1024)).toFixed(1),
        quotaMb: ((estimate.quota || 0) / (1024 * 1024)).toFixed(1)
      };
    }
    return { persisted: false, usageMb: '0.0', quotaMb: '0.0' };
  }

  async put(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      if (!item.id) item.id = crypto.randomUUID();
      item.updatedAt = new Date().toISOString();
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
}

export const db = new Database();