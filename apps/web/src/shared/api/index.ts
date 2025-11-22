// APIクライアントのPublic API

export type { ApiRequestOptions } from "./client";
export { ApiError, apiClient } from "./client";

export type {
	AllMetrics,
	CoverageMetrics,
	ExportFormat,
	SystemMetrics,
	TopProposer,
	TopReviewer,
	UserActivityMetrics,
} from "./analytics";
export { analyticsApi } from "./analytics";
export { contextsApi } from "./contexts";
export type {
	CreateCommentDto,
	CreateThreadDto,
	ThreadSearchOptions,
	UpdateThreadDto,
} from "./discussions";
export { discussionsApi } from "./discussions";
export { relationshipsApi } from "./relationships";
export type {
	HealthStatus,
	IndexStats,
	SearchOptions,
	SearchResult,
	Suggestion,
} from "./search";
export { searchApi } from "./search";
export type { TermSearchOptions } from "./terms";
export { termsApi } from "./terms";
