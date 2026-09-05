// public/js/workers/crypto.worker.js - Dedicated Background Cryptography
self.onmessage = async (e) => {
  const { id, action, payload, passphrase } = e.data;

  try {
    if (action === 'ENCRYPT') {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const encodedData = enc.encode(JSON.stringify(payload));
      const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      self.postMessage({
        id,
        success: true,
        result: {
          cipherText: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
          iv: btoa(String.fromCharCode(...iv)),
          salt: btoa(String.fromCharCode(...salt)),
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (err) {
    self.postMessage({ id, success: false, error: err.message });
  }
};