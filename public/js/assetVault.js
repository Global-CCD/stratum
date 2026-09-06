// public/js/assetVault.js - Content-Addressable Storage, Snapshots & LRU Eviction
export class AssetVaultEngine {
  static MAX_LOCAL_STORAGE_BYTES = 50 * 1024 * 1024; // 50MB Local Tier limit

  /**
   * Computes SHA-256 Content-Addressable Hash for any text/blob
   */
  static async computeContentHash(contentString) {
    const enc = new TextEncoder();
    const data = enc.encode(contentString || '');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Ingests full-page offline archival snapshot to prevent link-rot
   */
  static async storeOfflineSnapshot(db, url, htmlContent) {
    const hash = await this.computeContentHash(htmlContent);
    const existing = await db.getAll('assets');
    const duplicate = existing.find(a => a.file_hash_sha256 === hash);

    if (duplicate) {
      return { duplicate: true, asset: duplicate, message: 'Content-addressable match: deduplicated.' };
    }

    const assetRecord = {
      source_url: url,
      file_hash_sha256: hash,
      mime_type: 'text/html;charset=utf-8',
      byte_size: new Blob([htmlContent]).size,
      snapshot_data: htmlContent,
      storage_tier: 'LOCAL_PERSISTED',
      created_at: new Date().toISOString()
    };

    const saved = await db.put('assets', assetRecord);
    return { duplicate: false, asset: saved };
  }

  /**
   * Hybrid Storage Tiering: Simulates offloading cold blobs to Cloudflare R2
   */
  static async evaluateStorageTiering(db) {
    const assets = await db.getAll('assets');
    let totalBytes = assets.reduce((acc, a) => acc + (a.byte_size || 0), 0);
    const evicted = [];

    if (totalBytes > this.MAX_LOCAL_STORAGE_BYTES) {
      // Sort oldest first (LRU)
      assets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      for (const asset of assets) {
        if (totalBytes <= this.MAX_LOCAL_STORAGE_BYTES) break;
        // Offload payload to cold tier
        asset.storage_tier = 'R2_ENCRYPTED_COLD';
        totalBytes -= asset.byte_size || 0;
        delete asset.snapshot_data; // Clear local memory
        await db.put('assets', asset);
        evicted.push(asset.id);
      }
    }

    return { totalBytes, evictedCount: evicted.length };
  }
}