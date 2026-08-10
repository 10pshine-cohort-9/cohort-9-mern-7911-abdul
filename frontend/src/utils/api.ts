const API_BASE_URL = 'http://localhost:5000/api';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserResponse;
}

export interface NoteItem {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesResponse {
  success: boolean;
  count?: number;
  notes?: NoteItem[];
  note?: NoteItem;
  message?: string;
}

class ApiClient {
  private getHeaders(authRequired = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authRequired) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new Error(`HTTP error ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }

    return data as T;
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  async signUp(body: { name: string; email: string; password?: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(body),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async signIn(body: { email: string; password?: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(body),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    this.removeToken();
    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  async getMe(): Promise<{ success: boolean; user: UserResponse }> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });
    return this.handleResponse<{ success: boolean; user: UserResponse }>(response);
  }

  async getNotes(params?: { search?: string; isPinned?: boolean }): Promise<NotesResponse> {
    const query = new URLSearchParams();
    if (params?.search) {
      query.append('search', params.search);
    }
    if (params?.isPinned !== undefined) {
      query.append('isPinned', params.isPinned ? 'true' : 'false');
    }

    const queryString = query.toString();
    const url = `${API_BASE_URL}/notes${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(true),
    });
    return this.handleResponse<NotesResponse>(response);
  }

  async createNote(body: { title: string; content: string; tags?: string[]; isPinned?: boolean }): Promise<NotesResponse> {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(body),
    });
    return this.handleResponse<NotesResponse>(response);
  }

  async updateNote(id: string, body: { title?: string; content?: string; tags?: string[]; isPinned?: boolean }): Promise<NotesResponse> {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(body),
    });
    return this.handleResponse<NotesResponse>(response);
  }

  async deleteNote(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    return this.handleResponse<{ success: boolean; message: string }>(response);
  }
}

export const api = new ApiClient();
