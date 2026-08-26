const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
  private getHeaders(authRequired = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authRequired) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error(`HTTP error ${response.status}`);
    }

    if (!response.ok) {
      if (data && typeof data === 'object' && 'message' in data && typeof (data as Record<string, unknown>).message === 'string') {
        throw new Error((data as Record<string, string>).message);
      }
      throw new Error(`HTTP error ${response.status}`);
    }

    return data as T;
  }

  private async request<T>(url: string, options: RequestInit, authRequired = true): Promise<T> {
    let response: Response;
    try {
      const defaultHeaders = this.getHeaders(authRequired);
      response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers as Record<string, string>),
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Network failure: ${error.message}`);
      }
      throw new Error('A network connection error occurred.');
    }
    return this.handleResponse<T>(response);
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
    return this.request<AuthResponse>(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(body),
    }, false);
  }

  async signIn(body: { email: string; password?: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      body: JSON.stringify(body),
    }, false);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request<{ success: boolean; message: string }>(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
      }, true);
    } finally {
      this.removeToken();
    }
  }

  async getMe(): Promise<{ success: boolean; user: UserResponse }> {
    return this.request<{ success: boolean; user: UserResponse }>(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
    }, true);
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

    return this.request<NotesResponse>(url, {
      method: 'GET',
    }, true);
  }

  async createNote(body: { title: string; content: string; tags?: string[]; isPinned?: boolean }): Promise<NotesResponse> {
    return this.request<NotesResponse>(`${API_BASE_URL}/notes`, {
      method: 'POST',
      body: JSON.stringify(body),
    }, true);
  }

  async updateNote(id: string, body: { title?: string; content?: string; tags?: string[]; isPinned?: boolean }): Promise<NotesResponse> {
    return this.request<NotesResponse>(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, true);
  }

  async deleteNote(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
    }, true);
  }

  async exportNotes(): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/notes/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export notes');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async importNotes(notes: Array<{ title: string; content: string; tags?: string[]; isPinned?: boolean }>): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`${API_BASE_URL}/notes/import`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }, true);
  }
}

export const api = new ApiClient();
