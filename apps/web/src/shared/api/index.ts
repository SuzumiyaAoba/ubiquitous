// APIクライアントのPublic API
export { apiClient, ApiError } from "./client";
export type { ApiRequestOptions } from "./client";

export { contextsApi } from "./contexts";
export { termsApi } from "./terms";
export type { TermSearchOptions } from "./terms";
export { searchApi } from "./search";
export type { SearchOptions, SearchResult, Suggestion, IndexStats, HealthStatus } from "./search";
export { relationshipsApi } from "./relationships";
export { discussionsApi } from "./discussions";
export type {
  CreateThreadDto,
  UpdateThreadDto,
  CreateCommentDto,
  ThreadSearchOptions,
} from "./discussions";
