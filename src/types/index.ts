/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Shared application types used across client (React) and server (Express).
 * Keep this file free of runtime code to allow tree-shaking and server-side reusability.
 */

/* =========================
   Utility & Foundation
   ========================= */

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type EntityId = Brand<string, 'EntityId'>;
export type ISODateString = Brand<string, 'ISODateString'>;

export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Result type for explicit success/error handling without exceptions.
 */
export type Ok<T> = { ok: true; value: T };
export type Err<E = unknown> = { ok: false; error: E };
export type Result<T, E = unknown> = Ok<T> | Err<E>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/* =========================
   Responsive UI Helpers
   ========================= */

/**
 * UI breakpoints for responsive props.
 * Keep in sync with CSS framework tokens (if any).
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Responsive prop that can be a single value or a map of breakpoints.
 * Example:
 *   width: '100%' or { xs: '100%', md: 640 }
 */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

/**
 * Spacing scale token (example; consumer can map to CSS variables).
 */
export type SpaceScale = 0 | 2 | 4 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;

/* =========================
   Core Domain Models
   ========================= */

export type Role = 'ADMIN' | 'USER';

export interface BaseEntity {
  id: EntityId;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  /** Soft delete timestamp; null means active */
  deletedAt?: ISODateString | null;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: Role;
  /** Optional avatar URL */
  avatarUrl?: string | null;
  emailVerifiedAt?: ISODateString | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix timestamp (seconds) when the access token expires */
  expiresAt: number;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface SignupInput extends Credentials {
  name: string;
}

export interface AuthUser {
  user: User;
  tokens: AuthTokens;
}

/**
 * JWT payload (do not include secrets).
 */
export interface JwtPayload {
  sub: EntityId;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

/* =========================
   Website Generation Domain
   ========================= */

/**
 * Description of the website the user wants to generate.
 */
export interface WebsiteSpec {
  /** Free-form description provided by user, e.g., "A blog platform with user auth and comments" */
  description: string;
  /** Optional set of features to guide generation. */
  features?: string[];
  /** Target audience or niche for better defaults. */
  audience?: string;
}

export type TechStack = 'react-express';

export interface GenerationInput {
  spec: WebsiteSpec;
  techStack: TechStack;
  /** Optional project name; default derived from description */
  name?: string;
}

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

export interface GenerationJob extends BaseEntity {
  input: GenerationInput;
  status: JobStatus;
  progress: number; // 0..100
  error?: ApiError | null;
  resultId?: EntityId | null;
}

export interface GeneratedArtifact {
  /** Relative path within the generated project */
  path: string;
  /** The file's content; may be omitted for large binaries */
  content?: string;
  /** MIME type when downloadable or previewed */
  mimeType?: string;
  /** SHA-256 or similar checksum for integrity */
  checksum?: string;
}

export interface GenerationResult extends BaseEntity {
  jobId: EntityId;
  /** Summarized outcome and key decisions taken by the generator */
  summary: string;
  /** Set of generated files */
  artifacts: GeneratedArtifact[];
  /** Optional instructions for running the project locally */
  instructions?: string;
}

/* =========================
   API Contracts
   ========================= */

export interface PaginationParams {
  page?: number; // 1-based
  pageSize?: number; // default sensible value (e.g., 20)
}

export interface SortParam<TField extends string = string> {
  field: TField;
  direction?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT';

export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** Optional machine-readable detail */
  details?: Record<string, unknown>;
  /** Optional field-level errors for validation issues */
  fieldErrors?: FieldError[];
  /** Optional correlation ID for tracing across services/requests */
  correlationId?: string;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

/* =========================
   Async & UI State
   ========================= */

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T, E = ApiError> {
  status: AsyncStatus;
  data?: T;
  error?: E;
}

/* =========================
   Express Helpers
   ========================= */

/**
 * Typed Express request body/query/params payloads.
 * These mirror Express types without importing the library on the type layer.
 */
export interface TypedRequest<
  TBody = unknown,
  TQuery extends Record<string, any> = Record<string, any>,
  TParams extends Record<string, string> = Record<string, string>,
> {
  body: TBody;
  query: TQuery;
  params: TParams;
  headers: Record<string, string | string[] | undefined>;
}

export interface TypedResponse<T = unknown> {
  status: (code: number) => TypedResponse<T>;
  json: (body: T | ApiResponse<T>) => void;
  send: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

/* =========================
   Events & Analytics
   ========================= */

export type AnalyticsEventName =
  | 'auth_login'
  | 'auth_signup'
  | 'gen_job_created'
  | 'gen_job_succeeded'
  | 'gen_job_failed'
  | 'page_view';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  userId?: EntityId;
  properties?: Record<string, unknown>;
  timestamp?: ISODateString;
}

/* =========================
   Environment typing
   ========================= */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'test' | 'production';
      PORT?: string;
      /** Secret key for JWT signing */
      JWT_SECRET?: string;
      /** Application base URL (e.g., for generating absolute links) */
      APP_BASE_URL?: string;
      /** CORS allowed origins (comma-separated) */
      CORS_ORIGINS?: string;
    }
  }
}

/* =========================
   Guards / Type Predicates
   ========================= */

/**
 * Narrow any to ApiError at runtime boundary.
 */
export function isApiError(input: unknown): input is ApiError {
  if (!input || typeof input !== 'object') return false;
  const i = input as Record<string, unknown>;
  return (
    typeof i.code === 'string' &&
    typeof i.message === 'string' &&
    // Optional fields are either undefined or of valid shapes
    (i.details === undefined || typeof i.details === 'object') &&
    (i.fieldErrors === undefined ||
      (Array.isArray(i.fieldErrors) &&
        i.fieldErrors.every(
          (f) =>
            f &&
            typeof f === 'object' &&
            typeof (f as any).field === 'string' &&
            typeof (f as any).message === 'string',
        ))) &&
    (i.correlationId === undefined || typeof i.correlationId === 'string')
  );
}

/**
 * Utility to create a typed ApiError ensuring minimal shape.
 */
export function createApiError(partial: Partial<ApiError> & Pick<ApiError, 'code' | 'message'>): ApiError {
  return {
    details: undefined,
    fieldErrors: undefined,
    correlationId: undefined,
    ...partial,
  };
}