import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
    throw error;
  }
}

async function getItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error retrieving ${key}:`, error);
    return null;
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
  }
}

export const storage = {
  async setTokens(tokens: Tokens): Promise<void> {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, tokens.access_token),
      setItem(REFRESH_TOKEN_KEY, tokens.refresh_token),
    ]);
  },

  async getTokens(): Promise<Tokens | null> {
    const [access_token, refresh_token] = await Promise.all([
      getItem(ACCESS_TOKEN_KEY),
      getItem(REFRESH_TOKEN_KEY),
    ]);

    if (!access_token || !refresh_token) {
      return null;
    }

    return { access_token, refresh_token };
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
    ]);
  },

  async setUser(user: UserData): Promise<void> {
    await setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<UserData | null> {
    const userStr = await getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as UserData;
    } catch {
      return null;
    }
  },

  async clearUser(): Promise<void> {
    await removeItem(USER_KEY);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      this.clearTokens(),
      this.clearUser(),
    ]);
  },
};
