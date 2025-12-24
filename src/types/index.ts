export type AppRole = 'admin' | 'innovator' | 'enterprise' | 'investor';
export type InnovationStatus = 'draft' | 'published' | 'featured' | 'archived';
export type InnovationCategory = 'ai' | 'healthtech' | 'fintech' | 'climatetech' | 'edtech' | 'saas' | 'hardware' | 'web3' | 'other';
export type ProblemStatus = 'draft' | 'open' | 'in_review' | 'matched' | 'closed';
export type SolutionStatus = 'draft' | 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected';
export type ProblemCategory = 'technology' | 'healthcare' | 'sustainability' | 'finance' | 'education' | 'infrastructure' | 'manufacturing' | 'agriculture' | 'other';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_name: string | null;
  organization_type: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Problem {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: ProblemCategory;
  industry: string | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  requirements: string[] | null;
  tags: string[] | null;
  status: ProblemStatus;
  ai_summary: string | null;
  ai_complexity_score: number | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Solution {
  id: string;
  problem_id: string;
  innovator_id: string;
  title: string;
  description: string;
  approach: string | null;
  technology_stack: string[] | null;
  timeline_weeks: number | null;
  estimated_cost: number | null;
  attachments: string[] | null;
  status: SolutionStatus;
  ai_match_score: number | null;
  ai_evaluation: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  problems?: Problem;
}

export type InvestmentStatus = 'proposed' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';

export interface Investment {
  id: string;
  investor_id: string;
  problem_id: string;
  solution_id: string | null;
  funding_amount: number;
  expected_roi: number | null;
  conditions: string | null;
  comments: string | null;
  status: InvestmentStatus;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  problems?: Problem;
  solutions?: Solution;
}

export interface Bookmark {
  id: string;
  user_id: string;
  problem_id: string | null;
  solution_id: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalProblems: number;
  totalSolutions: number;
  activeChallenges: number;
  matchRate: number;
}

export interface Innovation {
  id: string;
  innovator_id: string;
  title: string;
  tagline: string;
  category: InnovationCategory;
  description: string;
  cover_image_url: string;
  video_url: string | null;
  gallery_urls: string[] | null;
  pdf_urls: string[] | null;
  without_product: string;
  with_product: string;
  status: InnovationStatus;
  view_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}
