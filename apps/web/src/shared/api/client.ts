/**
 * APIクライアントの基盤
 * すべてのAPI呼び出しの共通処理を提供
 */

import { env } from "@/shared/config";

/**
 * APIエラークラス
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API リクエストオプション
 */
export interface ApiRequestOptions extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
}

/**
 * APIクライアントの基本クラス
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * URLパラメータを生成
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildUrl(path: string, params?: any): string {
    const url = new URL(path, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * GETリクエスト
   */
  async get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    const { params, ...init } = options || {};
    const url = this.buildUrl(path, params);

    const response = await fetch(url, {
      ...init,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POSTリクエスト
   */
  async post<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    const { params, ...init } = options || {};
    const url = this.buildUrl(path, params);

    const response = await fetch(url, {
      ...init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUTリクエスト
   */
  async put<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    const { params, ...init } = options || {};
    const url = this.buildUrl(path, params);

    const response = await fetch(url, {
      ...init,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETEリクエスト
   */
  async delete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    const { params, ...init } = options || {};
    const url = this.buildUrl(path, params);

    const response = await fetch(url, {
      ...init,
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    return this.handleResponse<T>(response);
  }

  /**
   * レスポンスハンドリング
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    // 204 No Content の場合
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }
}

/**
 * シングルトンAPIクライアント
 */
export const apiClient = new ApiClient(env.apiUrl);
