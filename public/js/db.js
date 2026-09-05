// public/js/db.js - Strict SoC IndexedDB Manager
const DB_NAME = 'ProductivityEngineDB';
const DB_VERSION = 1;

export class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Layer 1: Epistemic
        if (!db.objectStoreNames.contains('problems')) db.createObjectStore('problems', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('principles')) db.createObjectStore('principles', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('proofs')) db.createObjectStore('proofs', { keyPath: 'id' });

        // Layer 2: Directional
        if (!db.objectStoreNames.contains('visions')) db.createObjectStore('visions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('horizons')) db.createObjectStore('horizons', { keyPath: 'id' });

        // Layer 3: Operational
        if (!db.objectStoreNames.contains('objectives')) db.createObjectStore('objectives', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });

        // Layer 4: Tactical
        if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('linked_notes')) db.createObjectStore('linked_notes', { keyPath: 'id' });

        // Layer 5: Substrate
        if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('links')) db.createObjectStore('links', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('free_notes')) db.createObjectStore('free_notes', { keyPath: 'id' });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this);
      };
      request.onerror = (e) => reject(e);
    });
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

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }
}

export const db = new Database();
