'use client';

import { authApi, type ApiChatMessage, type ApiChatUser, type ApiCurrentUserChatKey, type ApiEncryptedBody } from '@/lib/api';

const CHAT_KEY_DB_NAME = 'wanderleaf-chat-keys';
const CHAT_KEY_STORE_NAME = 'keys';
const CHAT_KEY_VERSION = 1;
const PUBLIC_KEY_ALGORITHM = 'RSA-OAEP-256';
const MESSAGE_CIPHER_ALGORITHM = 'AES-GCM';
const BACKUP_KDF_ALGORITHM = 'PBKDF2-SHA256';
const MESSAGE_SCHEMA_VERSION = 1;
const BACKUP_SCHEMA_VERSION = 1;
const IV_LENGTH_BYTES = 12;
const BACKUP_ITERATIONS = 600000;

type StoredChatKeyPair = {
  userId: string;
  publicKey: string;
  privateKey: string;
  algorithm: string;
  version: number;
};

type ChatKeyBackupPayload = {
  public_key: string;
  key_algorithm: string;
  key_version: number;
  encrypted_private_key: string;
  backup_iv: string;
  backup_salt: string;
  backup_kdf: string;
  backup_kdf_iterations: number;
  backup_cipher: string;
  backup_version: number;
};

export type ResolvedChatMessage = ApiChatMessage & {
  resolved_body: string;
  decryption_error: string | null;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function ensureCryptoAvailable() {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('This browser does not support secure chat encryption.');
  }
  return window.crypto;
}

function toBase64(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

function fromBase64(value: string) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function openChatKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(CHAT_KEY_DB_NAME, CHAT_KEY_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Failed to open chat key storage.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CHAT_KEY_STORE_NAME)) {
        db.createObjectStore(CHAT_KEY_STORE_NAME, { keyPath: 'userId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function readStoredKeyPair(userId: string): Promise<StoredChatKeyPair | null> {
  const db = await openChatKeyDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHAT_KEY_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CHAT_KEY_STORE_NAME);
    const request = store.get(userId);
    request.onerror = () => reject(request.error ?? new Error('Failed to read chat key.'));
    request.onsuccess = () => resolve((request.result as StoredChatKeyPair | undefined) ?? null);
  });
}

async function writeStoredKeyPair(record: StoredChatKeyPair): Promise<void> {
  const db = await openChatKeyDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHAT_KEY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CHAT_KEY_STORE_NAME);
    const request = store.put(record);
    request.onerror = () => reject(request.error ?? new Error('Failed to save chat key.'));
    request.onsuccess = () => resolve();
  });
}

async function generateKeyPairRecord(userId: string): Promise<StoredChatKeyPair> {
  const crypto = ensureCryptoAvailable();
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    userId,
    publicKey: toBase64(publicKey),
    privateKey: toBase64(privateKey),
    algorithm: PUBLIC_KEY_ALGORITHM,
    version: 1,
  };
}

async function deriveWrappingKey(password: string, saltBase64: string, iterations: number) {
  const crypto = ensureCryptoAvailable();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromBase64(saltBase64),
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function importPublicKey(spkiBase64: string) {
  return ensureCryptoAvailable().subtle.importKey(
    'spki',
    fromBase64(spkiBase64),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );
}

async function importPrivateKey(pkcs8Base64: string) {
  return ensureCryptoAvailable().subtle.importKey(
    'pkcs8',
    fromBase64(pkcs8Base64),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt']
  );
}

async function buildBackupPayload(record: StoredChatKeyPair, password: string): Promise<ChatKeyBackupPayload> {
  const crypto = ensureCryptoAvailable();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const saltBase64 = toBase64(salt);
  const wrappingKey = await deriveWrappingKey(password, saltBase64, BACKUP_ITERATIONS);
  const encryptedPrivateKey = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    wrappingKey,
    fromBase64(record.privateKey)
  );

  return {
    public_key: record.publicKey,
    key_algorithm: record.algorithm,
    key_version: record.version,
    encrypted_private_key: toBase64(encryptedPrivateKey),
    backup_iv: toBase64(iv),
    backup_salt: saltBase64,
    backup_kdf: BACKUP_KDF_ALGORITHM,
    backup_kdf_iterations: BACKUP_ITERATIONS,
    backup_cipher: MESSAGE_CIPHER_ALGORITHM,
    backup_version: BACKUP_SCHEMA_VERSION,
  };
}

function getParticipantEncryptionMap(participants: ApiChatUser[]) {
  return participants.reduce<Record<string, NonNullable<ApiChatUser['chat_encryption']>>>((map, participant) => {
    if (participant.chat_encryption) {
      map[String(participant.id)] = participant.chat_encryption;
    }
    return map;
  }, {});
}

export async function hasLocalChatKey(userId: string) {
  return Boolean(await readStoredKeyPair(userId));
}

async function getStoredKeyPairOrThrow(userId: string): Promise<StoredChatKeyPair> {
  const stored = await readStoredKeyPair(userId);
  if (!stored) {
    throw new Error('This device has not recovered your secure chat key yet. Please sign in again to unlock chat.');
  }
  return stored;
}

export async function syncChatKeyAfterLogin(userId: string, password: string) {
  if (!password) {
    throw new Error('Password is required to unlock secure chat.');
  }

  const existing = await readStoredKeyPair(userId);
  const remote = await authApi.getMyChatKey();

  if (existing && remote.has_backup && existing.publicKey === remote.public_key) {
    return existing;
  }

  if (!remote.has_backup || !remote.public_key || !remote.encrypted_private_key) {
    const newRecord = await generateKeyPairRecord(userId);
    const backupPayload = await buildBackupPayload(newRecord, password);
    await authApi.registerMyChatKey(backupPayload);
    await writeStoredKeyPair(newRecord);
    return newRecord;
  }

  if (remote.backup_kdf !== BACKUP_KDF_ALGORITHM || remote.backup_cipher !== MESSAGE_CIPHER_ALGORITHM) {
    throw new Error('This account uses an unsupported secure chat backup format.');
  }

  const wrappingKey = await deriveWrappingKey(password, remote.backup_salt, remote.backup_kdf_iterations);
  try {
    const decryptedPrivateKey = await ensureCryptoAvailable().subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fromBase64(remote.backup_iv),
      },
      wrappingKey,
      fromBase64(remote.encrypted_private_key)
    );

    const record: StoredChatKeyPair = {
      userId,
      publicKey: remote.public_key,
      privateKey: toBase64(decryptedPrivateKey),
      algorithm: remote.key_algorithm,
      version: remote.key_version,
    };
    await importPrivateKey(record.privateKey);
    await writeStoredKeyPair(record);
    return record;
  } catch {
    throw new Error('Unable to unlock secure chat keys on this device.');
  }
}

export async function ensureLocalChatKeyAvailable(userId: string) {
  return getStoredKeyPairOrThrow(userId);
}

export async function encryptChatTextMessage(
  plaintext: string,
  participants: ApiChatUser[],
  senderId: string
): Promise<ApiEncryptedBody> {
  const normalizedText = plaintext.trim();
  if (!normalizedText) {
    throw new Error('Message cannot be empty.');
  }

  const senderKey = await getStoredKeyPairOrThrow(senderId);
  const participantKeys = getParticipantEncryptionMap(participants);
  const missingKeys = participants.filter((participant) => !participantKeys[String(participant.id)]);
  if (missingKeys.length > 0) {
    throw new Error('Secure chat is not ready for all participants on this conversation yet.');
  }

  const crypto = ensureCryptoAvailable();
  const aesKey = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    encoder.encode(normalizedText)
  );

  const wrappedKeys: ApiEncryptedBody['wrapped_keys'] = {};
  for (const participant of participants) {
    const participantId = String(participant.id);
    const publicKey = await importPublicKey(participantKeys[participantId].public_key);
    const wrappedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAesKey);
    wrappedKeys[participantId] = {
      wrapped_key: toBase64(wrappedKey),
      key_version: participantKeys[participantId].version,
    };
  }

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    wrapped_keys: wrappedKeys,
    algorithm: MESSAGE_CIPHER_ALGORITHM,
    key_algorithm: PUBLIC_KEY_ALGORITHM,
    version: MESSAGE_SCHEMA_VERSION,
    sender_key_version: senderKey.version,
  };
}

export async function decryptChatMessageBody(
  message: ApiChatMessage,
  currentUserId: string
): Promise<{ resolvedBody: string; error: string | null }> {
  if (!message.is_encrypted || !message.encrypted_body) {
    return {
      resolvedBody: message.body,
      error: null,
    };
  }

  try {
    const localKey = await getStoredKeyPairOrThrow(currentUserId);
    const wrappedKeyData = message.encrypted_body.wrapped_keys[String(currentUserId)];
    if (!wrappedKeyData?.wrapped_key) {
      return {
        resolvedBody: '',
        error: 'This device cannot decrypt the message.',
      };
    }

    const crypto = ensureCryptoAvailable();
    const privateKey = await importPrivateKey(localKey.privateKey);
    const rawAesKey = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      fromBase64(wrappedKeyData.wrapped_key)
    );
    const aesKey = await crypto.subtle.importKey(
      'raw',
      rawAesKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fromBase64(message.encrypted_body.iv),
      },
      aesKey,
      fromBase64(message.encrypted_body.ciphertext)
    );

    return {
      resolvedBody: decoder.decode(plaintext),
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        resolvedBody: '',
        error: error.message,
      };
    }
    return {
      resolvedBody: '',
      error: 'This device could not decrypt the message.',
    };
  }
}

export async function resolveChatMessage(message: ApiChatMessage, currentUserId: string): Promise<ResolvedChatMessage> {
  const { resolvedBody, error } = await decryptChatMessageBody(message, currentUserId);
  return {
    ...message,
    resolved_body: resolvedBody,
    decryption_error: error,
  };
}

export async function resolveChatMessages(
  messages: ApiChatMessage[],
  currentUserId: string
): Promise<ResolvedChatMessage[]> {
  return Promise.all(messages.map((message) => resolveChatMessage(message, currentUserId)));
}
