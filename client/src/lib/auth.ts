interface User {
  id: string;
  name: string;
  email: string;
  familyId?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch {
          this.logout();
        }
      }
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.setAuth(data);
    return data;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    this.setAuth(data);
    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      this.user = data.user;
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(this.user));
      }
      return this.user;
    } catch {
      this.logout();
      return null;
    }
  }

  private setAuth(data: AuthResponse): void {
    this.token = data.token;
    this.user = data.user;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_user', JSON.stringify(this.user));
    }
  }

  logout(): void {
    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  updateUser(userData: Partial<User>): void {
    if (this.user) {
      this.user = { ...this.user, ...userData };
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(this.user));
      }
    }
  }
}

export const authService = new AuthService();
export type { User, AuthResponse };
