// ─── Enums ───────────────────────────────────────────────

export enum Industry {
  HEALTHCARE = "healthcare",
  EMERGENCY_SERVICES = "emergency_services",
  FOOD_HOSPITALITY = "food_hospitality",
  FINANCE = "finance",
  ENTERTAINMENT = "entertainment",
  VETERINARY = "veterinary",
}

export enum Profession {
  // Healthcare
  ICU_NURSE = "icu_nurse",
  PARAMEDIC = "paramedic",
  LD_NURSE = "ld_nurse",
  SURGICAL_TECH = "surgical_tech",

  // Emergency Services
  DISPATCHER = "dispatcher",
  FIREFIGHTER = "firefighter",
  AIR_TRAFFIC_CONTROLLER = "air_traffic_controller",

  // Food & Hospitality
  LINE_COOK = "line_cook",
  BARTENDER = "bartender",

  // Veterinary
  VET_ER_TECH = "vet_er_tech",

  // Finance
  STOCK_TRADER = "stock_trader",

  // Entertainment
  EVENT_PRODUCER = "event_producer",
}

export enum SessionStatus {
  WAITING = "waiting",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
}

export enum EventSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum EventType {
  PATIENT_CHANGE = "patient_change",
  NEW_ARRIVAL = "new_arrival",
  EQUIPMENT_FAILURE = "equipment_failure",
  ORDER_RUSH = "order_rush",
  COMPLICATION = "complication",
  ENVIRONMENTAL = "environmental",
  COMMUNICATION = "communication",
  TIME_PRESSURE = "time_pressure",
}

export enum ResponseOutcome {
  OPTIMAL = "optimal",
  ACCEPTABLE = "acceptable",
  SUBOPTIMAL = "suboptimal",
  CRITICAL_ERROR = "critical_error",
}

// ─── Core Interfaces ─────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  selectedIndustry?: Industry;
  selectedProfession?: Profession;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndustryConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  professions: ProfessionConfig[];
}

export interface EventTemplate {
  eventType: EventType;
  severityMin: EventSeverity;
  severityMax: EventSeverity;
  descriptionTemplate: string;
  odysseyPromptTemplate: string;
}

export interface ProfessionConfig {
  id: string;
  name: string;
  slug: string;
  industry: Industry;
  description: string;
  icon: string;
  baseScenarioPrompt: string;
  eventTemplates: EventTemplate[];
}

export interface TrainingSession {
  id: string;
  userId: string;
  profession: Profession;
  status: SessionStatus;
  odysseyStreamId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  finalScore: number | null;
}

export interface ScenarioEvent {
  id: string;
  sessionId: string;
  sequenceNumber: number;
  eventType: EventType;
  severity: EventSeverity;
  description: string;
  odysseyPrompt: string;
  injectedAt: Date;
  responseDeadlineMs: number | null;
  resolved: boolean;
}

export interface TraineeResponse {
  id: string;
  eventId: string;
  sessionId: string;
  responseText: string;
  responseAction: string;
  outcome: ResponseOutcome;
  scoreImpact: number;
  feedback: string;
  respondedAt: Date;
}

export interface ScoreBreakdown {
  [category: string]: number;
}

export interface SessionScore {
  id: string;
  sessionId: string;
  overallScore: number;
  reactionTimeAvg: number;
  criticalErrorCount: number;
  optimalResponseRate: number;
  breakdown: ScoreBreakdown;
}

// ─── API Request / Response Types ────────────────────────

// POST /api/training/start
export interface StartTrainingRequest {
  profession: Profession;
}

export interface StartTrainingResponse {
  session: TrainingSession;
}

// POST /api/training/respond
export interface SubmitResponseRequest {
  eventId: string;
  responseText: string;
}

export interface SubmitResponseResponse {
  response: TraineeResponse;
  currentScore: number;
}

// GET /api/training/:id/results
export interface GetSessionResultsResponse {
  session: TrainingSession;
  events: ScenarioEvent[];
  responses: TraineeResponse[];
  score: SessionScore;
}

// ─── WebSocket Events ────────────────────────────────────

export type ScenarioEventPayload = ScenarioEvent;

export interface ScenarioUpdatePayload {
  eventId: string;
  resolved?: boolean;
  responseDeadlineMs?: number;
}

export interface ScoreUpdatePayload {
  sessionId: string;
  currentScore: number;
}

export interface SessionStatusPayload {
  sessionId: string;
  status: SessionStatus;
}

export interface SimulationPromptPayload {
  sessionId: string;
  prompt: string;
}

export type WsEvent =
  | { type: "scenario:event"; data: ScenarioEventPayload }
  | { type: "scenario:update"; data: ScenarioUpdatePayload }
  | { type: "score:update"; data: ScoreUpdatePayload }
  | { type: "session:status"; data: SessionStatusPayload }
  | { type: "simulation:prompt"; data: SimulationPromptPayload };

export type WsEventType = WsEvent["type"];
