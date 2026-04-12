import nacl from 'tweetnacl';
import {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8,
} from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';

const SECRET_KEY_STORE_KEY = 'e2e_secret_key';
const DEVICE_ID_STORE_KEY = 'e2e_device_id';

export interface KeyPair {
  publicKey: string; // base64
  secretKey: string; // base64
}

/**
 * Generate an X25519 key pair for asymmetric encryption (NaCl box).
 * Returns base64-encoded public and secret keys.
 */
export function generateKeyPair(): KeyPair {
  const pair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(pair.publicKey),
    secretKey: encodeBase64(pair.secretKey),
  };
}

/**
 * Generate a random symmetric key for group encryption (NaCl secretbox).
 * Returns a base64-encoded 32-byte key.
 */
export function generateGroupKey(): string {
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  return encodeBase64(key);
}

/**
 * Encrypt a message with a group symmetric key (NaCl secretbox).
 * Returns a base64-encoded blob: nonce + ciphertext.
 */
export function encryptForGroup(plaintext: string, groupKeyB64: string): string {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageBytes = decodeUTF8(plaintext);
  const groupKey = decodeBase64(groupKeyB64);
  const encrypted = nacl.secretbox(messageBytes, nonce, groupKey);
  if (!encrypted) throw new Error('Encryption failed');

  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  return encodeBase64(combined);
}

/**
 * Decrypt a group-encrypted blob (NaCl secretbox).
 * Expects base64-encoded nonce + ciphertext.
 */
export function decryptFromGroup(ciphertextB64: string, groupKeyB64: string): string {
  const combined = decodeBase64(ciphertextB64);
  const groupKey = decodeBase64(groupKeyB64);
  const nonce = combined.slice(0, nacl.secretbox.nonceLength);
  const ciphertext = combined.slice(nacl.secretbox.nonceLength);
  const decrypted = nacl.secretbox.open(ciphertext, nonce, groupKey);
  if (!decrypted) throw new Error('Decryption failed — wrong key or tampered data');
  return encodeUTF8(decrypted);
}

/**
 * Wrap a group key for a specific recipient using their public key (NaCl box).
 * The sender uses their own secret key + recipient's public key.
 * Returns base64-encoded nonce + ciphertext.
 */
export function wrapGroupKey(
  groupKeyB64: string,
  recipientPublicKeyB64: string,
  senderSecretKeyB64: string,
): string {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const message = decodeBase64(groupKeyB64);
  const recipientPk = decodeBase64(recipientPublicKeyB64);
  const senderSk = decodeBase64(senderSecretKeyB64);
  const encrypted = nacl.box(message, nonce, recipientPk, senderSk);
  if (!encrypted) throw new Error('Key wrapping failed');

  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  return encodeBase64(combined);
}

/**
 * Unwrap a group key encrypted for this device (NaCl box.open).
 * Returns the base64-encoded group key.
 */
export function unwrapGroupKey(
  wrappedKeyB64: string,
  senderPublicKeyB64: string,
  recipientSecretKeyB64: string,
): string {
  const combined = decodeBase64(wrappedKeyB64);
  const senderPk = decodeBase64(senderPublicKeyB64);
  const recipientSk = decodeBase64(recipientSecretKeyB64);
  const nonce = combined.slice(0, nacl.box.nonceLength);
  const ciphertext = combined.slice(nacl.box.nonceLength);
  const decrypted = nacl.box.open(ciphertext, nonce, senderPk, recipientSk);
  if (!decrypted) throw new Error('Key unwrapping failed — wrong key or tampered data');
  return encodeBase64(decrypted);
}

/**
 * Persist the secret key to secure storage.
 * The public key is stored server-side; the secret key never leaves the device.
 */
export async function storeSecretKey(secretKeyB64: string): Promise<void> {
  await SecureStore.setItemAsync(SECRET_KEY_STORE_KEY, secretKeyB64);
}

/**
 * Retrieve the secret key from secure storage.
 */
export async function getStoredSecretKey(): Promise<string | null> {
  return SecureStore.getItemAsync(SECRET_KEY_STORE_KEY);
}

/**
 * Delete the secret key from secure storage.
 */
export async function deleteStoredSecretKey(): Promise<void> {
  await SecureStore.deleteItemAsync(SECRET_KEY_STORE_KEY);
}

/**
 * Persist a stable device ID to secure storage.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_STORE_KEY);
  if (!deviceId) {
    deviceId = encodeBase64(nacl.randomBytes(16));
    await SecureStore.setItemAsync(DEVICE_ID_STORE_KEY, deviceId);
  }
  return deviceId;
}
