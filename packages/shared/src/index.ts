export type Language = "sv" | "en";

export interface SourceRef {
  type: "afs" | "scb";
  id: string;
  section?: string;
  page?: string;
}
