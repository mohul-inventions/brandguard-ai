export type UserRole = 'CREATOR' | 'BRAND_MANAGER' | 'REVIEWER' | 'ADMIN';

export type GuidelineCategory =
  | 'BRAND_VOICE'
  | 'TERMINOLOGY'
  | 'FACTUAL_ACCURACY'
  | 'PROMOTIONAL_CLAIMS'
  | 'BRAND_MESSAGING'
  | 'VISUAL_COMPLIANCE'
  | 'ACCESSIBILITY'
  | 'CONFIDENTIALITY';

export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingStatus = 'OPEN' | 'ACCEPTED' | 'DISMISSED' | 'FIXED' | 'NEEDS_REVIEW';

export type ReviewStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'REVISED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type ContentType =
  | 'BLOG'
  | 'SOCIAL_MEDIA'
  | 'ADVERTISEMENT'
  | 'EMAIL'
  | 'WEBSITE_COPY'
  | 'PRESS_RELEASE'
  | 'OTHER';

export interface FindingResult {
  category: GuidelineCategory;
  severity: IssueSeverity;
  title: string;
  excerpt: string;
  explanation: string;
  guidelineId?: string;
  guidelineRef?: string;
  sourceId?: string;
  sourceRef?: string;
  evidence: string;
  confidence: number;
  suggestedCorrection?: string;
  isUnverified?: boolean;
}

export interface AnalysisResponse {
  engineUsed: 'DEMO_DETERMINISTIC' | 'OPENAI' | 'GEMINI' | 'ANTHROPIC';
  disclaimer: string;
  findings: FindingResult[];
  categoryScores: Record<string, number>;
  overallScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}
