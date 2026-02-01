export type Language = "sv" | "en";

export interface SourceRef {
  type: "afs" | "scb";
  id: string;
  section?: string;
  page?: string;
}

// Error codes
export type ErrorCode =
  | "auth.unauthorized"
  | "auth.invalid_credentials"
  | "auth.session_expired"
  | "quota.exceeded"
  | "quota.limit_reached"
  | "validation.invalid_request"
  | "validation.missing_field"
  | "system.internal"
  | "system.database_error"
  | "system.not_found";

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message?: string;
    params?: Record<string, unknown>;
  };
}

// Database model types
export type UserStatus = "active" | "disabled";
export type MessageRole = "user" | "assistant" | "system";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  preferredLanguage: Language;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sourcesJson: unknown | null;
  tokensIn: number | null;
  tokensOut: number | null;
  createdAt: Date;
}

export interface Document {
  id: string;
  sourceUrl: string;
  title: string;
  checksum: string;
  version: string | null;
  ingestedAt: Date;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  section: string | null;
  page: string | null;
  embedding: number[] | null;
  createdAt: Date;
}

export interface UsagePeriod {
  id: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  tokenLimit: number;
  tokensUsed: number;
  requestLimit: number;
  requestsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}
