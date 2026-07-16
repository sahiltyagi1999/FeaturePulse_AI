import { EntitySchema } from "typeorm";
export interface AnalysisModel {
  id: string;
  appId: string;
  generatedAt: Date;
  prioritizedFixes?: any[];
  nextFeatureIdeas?: any[];
  summary?: string;
  competitorMentions?: any[];
  sentimentBreakdown?: { positive: number; neutral: number; negative: number };
  rawPromptUsed?: string;
}
export const AnalysisSchema = new EntitySchema<AnalysisModel>({
  name: "Analysis",
  tableName: "analyses",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    appId: { type: "uuid" },
    generatedAt: { type: Date, createDate: true },
    prioritizedFixes: { type: "jsonb", nullable: true },
    nextFeatureIdeas: { type: "jsonb", nullable: true },
    summary: { type: "text", nullable: true },
    competitorMentions: { type: "jsonb", nullable: true },
    sentimentBreakdown: { type: "jsonb", nullable: true },
    rawPromptUsed: { type: "text", nullable: true },
  },
  relations: {
    app: {
      type: "many-to-one",
      target: "App",
      joinColumn: { name: "appId" },
      onDelete: "CASCADE",
    },
  } as never,
});
