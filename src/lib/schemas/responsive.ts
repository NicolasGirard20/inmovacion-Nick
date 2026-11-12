import { z } from "zod";

export const responsiveIssueSchema = z.object({
  page: z.string(),
  url: z.string(),
  viewport: z.string(),
  severity: z.enum(["critical", "major", "minor"]),
  element: z.string(),
  description: z.string(),
  suggestedFix: z.string(),
});

export const responsiveReportSchema = z.object({
  summary: z.object({
    totalIssues: z.number(),
    critical: z.number(),
    major: z.number(),
    minor: z.number(),
    pagesAnalyzed: z.number(),
  }),
  issues: z.array(responsiveIssueSchema),
  recommendations: z.array(z.string()),
});

export type ResponsiveReport = z.infer<typeof responsiveReportSchema>;