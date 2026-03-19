export interface ScoringCriterion {
  name: string;
  weight: number;
  description: string;
}

export interface EvalTask {
  name: string;
  skill: string;
  description: string;
  prompt: string;
  timeout_seconds: number;
  max_turns: number;
  skill_focus: string; // what the skill is supposed to help with -- guides the judge
  scoring: {
    criteria: ScoringCriterion[];
  };
}

export type AgentModel = "sonnet" | "opus" | "codex";
export type Condition = "baseline" | "with-skill";

export interface AgentResult {
  model: AgentModel;
  condition: Condition;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  files: Record<string, string>; // path => content of all files in work dir after run
}

export interface EvalRun {
  id: string;
  taskName: string;
  timestamp: string;
  results: AgentResult[];
}

export interface CriterionScore {
  score: number;
  reasoning: string;
}

export interface SubmissionScore {
  submissionId: string;
  model: AgentModel;
  condition: Condition;
  judge: string;
  criteria: Record<string, CriterionScore>;
  weightedTotal: number;
}

export interface ScoredRun {
  runId: string;
  taskName: string;
  scores: SubmissionScore[];
}

export interface ReportRow {
  model: AgentModel;
  condition: Condition;
  criteriaScores: Record<string, number>; // averaged across judges and runs
  total: number;
  delta?: number; // improvement over baseline
}
