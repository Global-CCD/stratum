// public/js/cryptoSync.js - In-Browser WebCrypto AES-GCM (256-Bit) E2EE
export class CryptoSync {
  /**
   * Derives a cryptographic key from passphrase using PBKDF2
   */
  static async deriveKey(passphrase, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts plain JSON object into an armored payload
   */
  static async encryptPayload(jsonObject, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(jsonObject));

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedData
    );

    return {
      cipherText: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
      iv: btoa(String.fromCharCode(...iv)),
      salt: btoa(String.fromCharCode(...salt)),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Decrypts encrypted package back to JSON object
   */
  static async decryptPayload(encryptedPackage, passphrase) {
    const salt = new Uint8Array(atob(encryptedPackage.salt).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(encryptedPackage.iv).split('').map(c => c.charCodeAt(0)));
    const cipherText = new Uint8Array(atob(encryptedPackage.cipherText).split('').map(c => c.charCodeAt(0)));

    const key = await this.deriveKey(passphrase, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      cipherText
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedBuffer));
  }
}