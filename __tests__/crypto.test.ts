import {
  generateKeyPair,
  generateGroupKey,
  encryptForGroup,
  decryptFromGroup,
  wrapGroupKey,
  unwrapGroupKey,
  storeSecretKey,
  getStoredSecretKey,
  deleteStoredSecretKey,
  getOrCreateDeviceId,
} from '../lib/crypto';
import * as SecureStore from 'expo-secure-store';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('key pair generation', () => {
  it('generates base64-encoded public and secret keys', () => {
    const pair = generateKeyPair();
    expect(pair.publicKey).toBeTruthy();
    expect(pair.secretKey).toBeTruthy();
    // NaCl box keys are 32 bytes → 44 chars base64
    expect(pair.publicKey.length).toBe(44);
    expect(pair.secretKey.length).toBe(44);
  });

  it('generates unique key pairs each time', () => {
    const pair1 = generateKeyPair();
    const pair2 = generateKeyPair();
    expect(pair1.publicKey).not.toBe(pair2.publicKey);
    expect(pair1.secretKey).not.toBe(pair2.secretKey);
  });
});

describe('group key generation', () => {
  it('generates a base64-encoded 32-byte key', () => {
    const key = generateGroupKey();
    expect(key).toBeTruthy();
    expect(key.length).toBe(44);
  });
});

describe('group encryption / decryption', () => {
  it('encrypts and decrypts a message', () => {
    const groupKey = generateGroupKey();
    const plaintext = 'Hello night crew!';
    const encrypted = encryptForGroup(plaintext, groupKey);
    expect(encrypted).not.toBe(plaintext);

    const decrypted = decryptFromGroup(encrypted, groupKey);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for the same message (random nonce)', () => {
    const groupKey = generateGroupKey();
    const plaintext = 'Same message';
    const a = encryptForGroup(plaintext, groupKey);
    const b = encryptForGroup(plaintext, groupKey);
    expect(a).not.toBe(b);
  });

  it('fails to decrypt with wrong key', () => {
    const key1 = generateGroupKey();
    const key2 = generateGroupKey();
    const encrypted = encryptForGroup('secret', key1);
    expect(() => decryptFromGroup(encrypted, key2)).toThrow('Decryption failed');
  });

  it('handles unicode content', () => {
    const groupKey = generateGroupKey();
    const plaintext = 'Pints at the pub 🍺🎉';
    const encrypted = encryptForGroup(plaintext, groupKey);
    const decrypted = decryptFromGroup(encrypted, groupKey);
    expect(decrypted).toBe(plaintext);
  });
});

describe('group key wrapping / unwrapping', () => {
  it('wraps and unwraps a group key between two key pairs', () => {
    const sender = generateKeyPair();
    const recipient = generateKeyPair();
    const groupKey = generateGroupKey();

    const wrapped = wrapGroupKey(groupKey, recipient.publicKey, sender.secretKey);
    expect(wrapped).not.toBe(groupKey);

    const unwrapped = unwrapGroupKey(wrapped, sender.publicKey, recipient.secretKey);
    expect(unwrapped).toBe(groupKey);
  });

  it('fails to unwrap with wrong recipient key', () => {
    const sender = generateKeyPair();
    const recipient = generateKeyPair();
    const wrong = generateKeyPair();
    const groupKey = generateGroupKey();

    const wrapped = wrapGroupKey(groupKey, recipient.publicKey, sender.secretKey);
    expect(() => unwrapGroupKey(wrapped, sender.publicKey, wrong.secretKey)).toThrow(
      'Key unwrapping failed',
    );
  });

  it('fails to unwrap with wrong sender public key', () => {
    const sender = generateKeyPair();
    const recipient = generateKeyPair();
    const wrong = generateKeyPair();
    const groupKey = generateGroupKey();

    const wrapped = wrapGroupKey(groupKey, recipient.publicKey, sender.secretKey);
    expect(() => unwrapGroupKey(wrapped, wrong.publicKey, recipient.secretKey)).toThrow(
      'Key unwrapping failed',
    );
  });
});

describe('secure storage helpers', () => {
  it('stores and retrieves a secret key', async () => {
    await storeSecretKey('test-secret-key');
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('e2e_secret_key', 'test-secret-key');

    mockSecureStore.getItemAsync.mockResolvedValueOnce('test-secret-key');
    const result = await getStoredSecretKey();
    expect(result).toBe('test-secret-key');
  });

  it('deletes a stored secret key', async () => {
    await deleteStoredSecretKey();
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('e2e_secret_key');
  });

  it('creates a device ID on first call and returns the same one after', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce(null);
    const deviceId = await getOrCreateDeviceId();
    expect(deviceId).toBeTruthy();
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('e2e_device_id', deviceId);

    mockSecureStore.getItemAsync.mockResolvedValueOnce(deviceId);
    const sameId = await getOrCreateDeviceId();
    expect(sameId).toBe(deviceId);
  });
});
