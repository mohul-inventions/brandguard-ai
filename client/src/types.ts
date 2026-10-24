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

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  workspaceId?: string;
  workspaceName?: string;
}

export interface SuggestedCorrection {
  id: string;
  findingId: string;
  originalText: string;
  proposedReplacement: string;
  reasoning: string;
  isApplied: boolean;
  appliedAt?: string;
}

export interface Finding {
  id: string;
  reviewId: string;
  versionNum: number;
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
  status: FindingStatus;
  isUnverified: boolean;
  suggestedCorrections?: SuggestedCorrection[];
  createdAt: string;
}

export interface ContentVersion {
  id: string;
  reviewId: string;
  versionNum: number;
  contentBody: string;
  summaryOfChanges?: string;
  createdById: string;
  createdBy?: { name: string; email: string; role: string };
  createdAt: string;
}

export interface Comment {
  id: string;
  reviewId: string;
  authorId: string;
  parentId?: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; email: string; role: string; avatarUrl?: string };
  replies?: Comment[];
}

export interface ApprovalDecision {
  id: string;
  reviewId: string;
  decidedById: string;
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  reason?: string;
  createdAt: string;
  decidedBy?: { id: string; name: string; role: string };
}

export interface ContentReview {
  id: string;
  workspaceId: string;
  creatorId: string;
  reviewerId?: string;
  title: string;
  contentType: ContentType;
  targetAudience?: string;
  channel?: string;
  status: ReviewStatus;
  complianceScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  currentVersionNum: number;
  imageAttachmentUrl?: string;
  notes?: string;
  isDemoRecord?: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  reviewer?: User;
  versions?: ContentVersion[];
  activeVersion?: ContentVersion;
  findings?: Finding[];
  activeFindings?: Finding[];
  comments?: Comment[];
  approvalDecisions?: ApprovalDecision[];
  _count?: { findings: number; comments: number; versions: number };
}

export interface BrandGuideline {
  id: string;
  workspaceId: string;
  title: string;
  category: GuidelineCategory;
  severity: IssueSeverity;
  description: string;
  ruleDetails: string;
  examplesToAvoid?: string;
  preferredReplacements?: string;
  isActive: boolean;
  version: number;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  versions?: any[];
}

export interface ApprovedSource {
  id: string;
  workspaceId: string;
  title: string;
  sourceType: string;
  content: string;
  referenceUrl?: string;
  owner: string;
  verificationDate: string;
  expirationDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  _count?: { findings: number };
}

export interface BrandAsset {
  id: string;
  workspaceId: string;
  name: string;
  assetType: 'LOGO' | 'COLOR_PALETTE' | 'IMAGE' | 'ICON' | 'TYPOGRAPHY';
  fileUrl?: string;
  description: string;
  usageRestrictions?: string;
  metadataJson?: string;
  status: 'APPROVED' | 'PENDING' | 'RETIRED';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  summary: {
    totalReviews: number;
    pendingApprovals: number;
    criticalIssues: number;
    avgComplianceScore: number;
  };
  charts: {
    scoreTrend: { date: string; title: string; score: number }[];
    severityBreakdown: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number };
    categoryBreakdown: { category: string; count: number }[];
  };
  recentReviews: ContentReview[];
  pendingList: ContentReview[];
  commonViolations: { title: string; category: string; count: number; severity: string }[];
  latestGuidelines: BrandGuideline[];
  teamActivity: any[];
}
