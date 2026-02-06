import {
  Industry,
  EventType,
  EventSeverity,
  type IndustryConfig,
  type ProfessionConfig,
  type EventTemplate,
} from "./index";

// ─── Helper ──────────────────────────────────────────────

function t(
  eventType: EventType,
  severityMin: EventSeverity,
  severityMax: EventSeverity,
  descriptionTemplate: string,
  odysseyPromptTemplate: string,
): EventTemplate {
  return { eventType, severityMin, severityMax, descriptionTemplate, odysseyPromptTemplate };
}

// ─── Healthcare Professions ──────────────────────────────

const icuNurse: ProfessionConfig = {
  id: "icu_nurse",
  name: "ICU Nurse",
  slug: "icu-nurse",
  industry: Industry.HEALTHCARE,
  description: "Critical care nurse managing multiple patients in an intensive care unit with continuous monitoring and life-sustaining interventions.",
  icon: "🏥",
  baseScenarioPrompt: "nurse caring for patient",
  eventTemplates: [
    t(EventType.PATIENT_CHANGE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Patient oxygen dropping fast", "red vital signs"),
    t(EventType.PATIENT_CHANGE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Patient pulling IV lines", "patient thrashing"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Ventilator error code", "ventilator beeping"),
    t(EventType.NEW_ARRIVAL, EventSeverity.HIGH, EventSeverity.CRITICAL, "New ER admission arriving", "gurney arriving"),
    t(EventType.COMPLICATION, EventSeverity.CRITICAL, EventSeverity.CRITICAL, "Cardiac arrest V-fib", "flatline monitor"),
    t(EventType.COMMUNICATION, EventSeverity.LOW, EventSeverity.MEDIUM, "Phone: attending wants labs", "ringing phone"),
    t(EventType.TIME_PRESSURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Two meds due simultaneously", "medication alerts"),
    t(EventType.ENVIRONMENTAL, EventSeverity.LOW, EventSeverity.MEDIUM, "Blood spill near bed", "blood on floor"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Tension pneumothorax developing", "neck swelling"),
    t(EventType.PATIENT_CHANGE, EventSeverity.LOW, EventSeverity.MEDIUM, "Sudden headache visual changes", "patient grimacing"),
  ],
};

const paramedic: ProfessionConfig = {
  id: "paramedic",
  name: "Paramedic",
  slug: "paramedic",
  industry: Industry.HEALTHCARE,
  description: "Emergency medical technician responding to 911 calls, providing pre-hospital critical care and rapid transport decisions.",
  icon: "🚑",
  baseScenarioPrompt: "paramedic inside ambulance",
  eventTemplates: [
    t(EventType.PATIENT_CHANGE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Patient unresponsive losing airway", "patient unconscious"),
    t(EventType.NEW_ARRIVAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Second victim found: child", "injured child"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Anaphylaxis throat swelling fast", "swollen face"),
    t(EventType.ENVIRONMENTAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Aggressive bystander approaching crew", "angry bystander"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "IV pump malfunction", "IV pump error"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Trauma center on diversion", "radio crackling"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Patient crashing long transport", "vitals dropping"),
    t(EventType.COMPLICATION, EventSeverity.CRITICAL, EventSeverity.CRITICAL, "Cardiac arrest on scene", "defibrillator charging"),
    t(EventType.PATIENT_CHANGE, EventSeverity.LOW, EventSeverity.MEDIUM, "Patient refusing transport", "patient refusing"),
    t(EventType.ENVIRONMENTAL, EventSeverity.HIGH, EventSeverity.HIGH, "Fuel leak at crash scene", "fuel leaking"),
  ],
};

const ldNurse: ProfessionConfig = {
  id: "ld_nurse",
  name: "L&D Nurse",
  slug: "ld-nurse",
  industry: Industry.HEALTHCARE,
  description: "Labor and delivery nurse managing patients through childbirth, monitoring fetal status, and responding to obstetric emergencies.",
  icon: "👶",
  baseScenarioPrompt: "nurse in delivery room",
  eventTemplates: [
    t(EventType.PATIENT_CHANGE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Fetal late decelerations dropping", "monitor alarm"),
    t(EventType.COMPLICATION, EventSeverity.CRITICAL, EventSeverity.CRITICAL, "Suspected placental abruption bleeding", "bloody sheets"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Shoulder dystocia at delivery", "stalled delivery"),
    t(EventType.NEW_ARRIVAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Walk-in patient crowning now", "wheelchair arriving"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Fetal monitor losing signal", "monitor static"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "Anesthesia delayed patient hurting", "patient screaming"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Two patients pushing simultaneously", "second patient pushing"),
    t(EventType.PATIENT_CHANGE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Postpartum hemorrhage boggy fundus", "heavy bleeding"),
    t(EventType.ENVIRONMENTAL, EventSeverity.LOW, EventSeverity.LOW, "Family member about to faint", "father fainting"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Cord prolapse detected", "cord visible"),
  ],
};

const surgicalTech: ProfessionConfig = {
  id: "surgical_tech",
  name: "Surgical Tech",
  slug: "surgical-tech",
  industry: Industry.HEALTHCARE,
  description: "Surgical technologist assisting in the operating room, managing sterile fields, instruments, and anticipating surgeon needs during procedures.",
  icon: "🔪",
  baseScenarioPrompt: "surgery in operating room",
  eventTemplates: [
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Cautery unit not firing", "cautery sparking"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Unexpected arterial bleed", "blood pooling"),
    t(EventType.COMMUNICATION, EventSeverity.LOW, EventSeverity.MEDIUM, "Surgeon needs unlisted instrument", "hand outstretched"),
    t(EventType.ENVIRONMENTAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Sterile field contaminated", "drape contaminated"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Vitals crashing expedite closure", "monitors alarming"),
    t(EventType.PATIENT_CHANGE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Surgical site bleeding heavily", "bloody sponges"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.HIGH, "Sponge count off at close", "sponge missing"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.LOW, EventSeverity.MEDIUM, "Surgical light drifting off", "light shifting"),
    t(EventType.NEW_ARRIVAL, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Emergency add-on case incoming", "intercom buzzing"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Pathology needs specimen label", "phone ringing"),
  ],
};

// ─── Emergency Services Professions ──────────────────────

const dispatcher: ProfessionConfig = {
  id: "dispatcher",
  name: "Emergency Dispatcher",
  slug: "dispatcher",
  industry: Industry.EMERGENCY_SERVICES,
  description: "911 dispatch operator triaging emergency calls, dispatching appropriate units, and providing pre-arrival instructions to callers.",
  icon: "📞",
  baseScenarioPrompt: "dispatcher at 911 center",
  eventTemplates: [
    t(EventType.NEW_ARRIVAL, EventSeverity.HIGH, EventSeverity.CRITICAL, "Structure fire people trapped", "lines lighting up"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "Caller: language barrier emergency", "caller screaming"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Infant choking needs instructions", "baby choking call"),
    t(EventType.ENVIRONMENTAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Tornado warning calls flooding", "weather alert"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "CAD system freezing up", "screen freezing"),
    t(EventType.COMMUNICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Officer needs emergency backup", "panic button lit"),
    t(EventType.COMPLICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "No ambulance patient dying", "no units available"),
    t(EventType.NEW_ARRIVAL, EventSeverity.LOW, EventSeverity.MEDIUM, "Non-emergency clogging 911 line", "queue overflowing"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.HIGH, "Multiple units requesting dispatch", "radios overlapping"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Mass casualty incident reported", "mass casualty alert"),
  ],
};

const firefighter: ProfessionConfig = {
  id: "firefighter",
  name: "Firefighter",
  slug: "firefighter",
  industry: Industry.EMERGENCY_SERVICES,
  description: "Structural firefighter responding to fire calls, performing search and rescue, and managing hazardous scenes.",
  icon: "🧑‍🚒",
  baseScenarioPrompt: "firefighter at burning building",
  eventTemplates: [
    t(EventType.ENVIRONMENTAL, EventSeverity.HIGH, EventSeverity.CRITICAL, "Flashover conditions developing", "ceiling glowing orange"),
    t(EventType.COMPLICATION, EventSeverity.CRITICAL, EventSeverity.CRITICAL, "Floor collapse firefighter down", "floor collapsing"),
    t(EventType.NEW_ARRIVAL, EventSeverity.HIGH, EventSeverity.CRITICAL, "Child trapped inside structure", "child crying"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "SCBA low-air alarm active", "air alarm beeping"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "Lost radio with interior crew", "radio static"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Gas line compromised evacuate now", "gas hissing"),
    t(EventType.ENVIRONMENTAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Wind shift fire spreading", "wind shifting"),
    t(EventType.PATIENT_CHANGE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Firefighter heat exhaustion symptoms", "firefighter dizzy"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.HIGH, "Hydrant pressure dropping", "water pressure dropping"),
    t(EventType.NEW_ARRIVAL, EventSeverity.LOW, EventSeverity.MEDIUM, "Media breaching the perimeter", "news van arriving"),
  ],
};

const airTrafficController: ProfessionConfig = {
  id: "air_traffic_controller",
  name: "Air Traffic Controller",
  slug: "air-traffic-controller",
  industry: Industry.EMERGENCY_SERVICES,
  description: "ATC operator managing aircraft separation, sequencing arrivals and departures, and handling in-flight emergencies in controlled airspace.",
  icon: "✈️",
  baseScenarioPrompt: "controller in airport tower",
  eventTemplates: [
    t(EventType.COMPLICATION, EventSeverity.CRITICAL, EventSeverity.CRITICAL, "MAYDAY engine failure returning", "mayday flashing"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Two aircraft converging fast", "collision alert"),
    t(EventType.ENVIRONMENTAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Wind shear on final approach", "wind shear warning"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "Pilot read-back wrong runway", "wrong runway readback"),
    t(EventType.NEW_ARRIVAL, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Unauthorized VFR in airspace", "unknown aircraft"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.HIGH, EventSeverity.HIGH, "Primary radar going intermittent", "radar flickering"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Landing gear won't extend", "gear failure"),
    t(EventType.TIME_PRESSURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Holding aircraft low fuel", "low fuel report"),
    t(EventType.ENVIRONMENTAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Vehicle on active runway", "vehicle on runway"),
    t(EventType.COMMUNICATION, EventSeverity.LOW, EventSeverity.MEDIUM, "Frequency congestion jammed", "frequency jammed"),
  ],
};

// ─── Food & Hospitality Professions ──────────────────────

const lineCook: ProfessionConfig = {
  id: "line_cook",
  name: "Line Cook",
  slug: "line-cook",
  industry: Industry.FOOD_HOSPITALITY,
  description: "Professional line cook managing a station during peak service, handling multiple orders, timing, and quality under extreme pressure.",
  icon: "👨‍🍳",
  baseScenarioPrompt: "cook in busy kitchen",
  eventTemplates: [
    t(EventType.ORDER_RUSH, EventSeverity.HIGH, EventSeverity.CRITICAL, "Large party ticket fired", "ticket printing"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Flat-top losing temperature", "grill cooling down"),
    t(EventType.COMPLICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "VIP sent plate back", "plate returned"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.HIGH, "Ticket approaching complaint time", "timer flashing"),
    t(EventType.ENVIRONMENTAL, EventSeverity.LOW, EventSeverity.MEDIUM, "Grease fire on grill", "grease fire"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Allergy alert mid-cook", "allergy warning"),
    t(EventType.NEW_ARRIVAL, EventSeverity.LOW, EventSeverity.MEDIUM, "Surprise catering order called in", "phone ringing"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.HIGH, "Key protein 86'd mid-service", "empty fridge"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.HIGH, EventSeverity.HIGH, "Walk-in cooler temp alarm", "cooler alarm"),
    t(EventType.TIME_PRESSURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Three tables plating at once", "plates piling up"),
  ],
};

const bartender: ProfessionConfig = {
  id: "bartender",
  name: "Bartender",
  slug: "bartender",
  industry: Industry.FOOD_HOSPITALITY,
  description: "High-volume bartender managing a packed bar, crafting cocktails, handling tabs, and maintaining crowd control during peak hours.",
  icon: "🍸",
  baseScenarioPrompt: "bartender at crowded bar",
  eventTemplates: [
    t(EventType.ORDER_RUSH, EventSeverity.HIGH, EventSeverity.HIGH, "Service well fifteen deep", "tickets piling up"),
    t(EventType.COMPLICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "Customer disputing tab loudly", "customer arguing"),
    t(EventType.ENVIRONMENTAL, EventSeverity.LOW, EventSeverity.MEDIUM, "Glass shattered near customers", "glass shattering"),
    t(EventType.COMMUNICATION, EventSeverity.LOW, EventSeverity.MEDIUM, "Off-menu cocktail request mid-rush", "customer waving"),
    t(EventType.TIME_PRESSURE, EventSeverity.MEDIUM, EventSeverity.HIGH, "Large group near last call", "last call crowd"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.HIGH, "Drunk patron wants another", "drunk patron swaying"),
    t(EventType.NEW_ARRIVAL, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Private event arrived early", "group arriving"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Ice machine down", "ice machine broken"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Customer allergic reaction swelling", "throat swelling"),
    t(EventType.ENVIRONMENTAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Fight breaking out at bar", "fight breaking out"),
  ],
};

// ─── Veterinary ──────────────────────────────────────────

const vetErTech: ProfessionConfig = {
  id: "vet_er_tech",
  name: "Vet ER Tech",
  slug: "vet-er-tech",
  industry: Industry.VETERINARY,
  description: "Veterinary emergency technician triaging and treating critical animal patients in a 24-hour emergency animal hospital.",
  icon: "🐾",
  baseScenarioPrompt: "vet treating injured dog",
  eventTemplates: [
    t(EventType.NEW_ARRIVAL, EventSeverity.HIGH, EventSeverity.CRITICAL, "Dog hit by car arriving", "bleeding dog arriving"),
    t(EventType.PATIENT_CHANGE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Cat in respiratory distress", "cat gasping"),
    t(EventType.COMPLICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "Dog aggressive sedation wearing off", "dog snarling"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "Owner declining emergency surgery", "owner crying"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Anesthesia machine bad readings", "monitor flickering"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Suspected bloat distending fast", "abdomen swelling"),
    t(EventType.ENVIRONMENTAL, EventSeverity.LOW, EventSeverity.LOW, "Chain-reaction barking in ward", "dogs barking"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.HIGH, "Post-op bleeding through bandage", "bandage soaking red"),
    t(EventType.NEW_ARRIVAL, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Dog ate rat poison", "poison box chewed"),
    t(EventType.PATIENT_CHANGE, EventSeverity.LOW, EventSeverity.MEDIUM, "IV fluid bag running low", "IV bag empty"),
  ],
};

// ─── Finance ─────────────────────────────────────────────

const stockTrader: ProfessionConfig = {
  id: "stock_trader",
  name: "Stock Trader",
  slug: "stock-trader",
  industry: Industry.FINANCE,
  description: "Active day trader managing multiple positions across equities and options during volatile market conditions.",
  icon: "📈",
  baseScenarioPrompt: "trader watching stock screens",
  eventTemplates: [
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Flash crash 8% drop", "charts crashing red"),
    t(EventType.NEW_ARRIVAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Surprise Fed rate decision", "breaking news banner"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.HIGH, "Options expiring in minutes", "countdown ticking"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.HIGH, EventSeverity.CRITICAL, "Platform frozen mid-trade", "screen frozen"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Margin call from risk desk", "margin call alert"),
    t(EventType.ENVIRONMENTAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Circuit breaker trading halted", "trading halted"),
    t(EventType.COMPLICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "Earnings miss gap down", "stock gap down"),
    t(EventType.TIME_PRESSURE, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Three alerts firing simultaneously", "alerts stacking up"),
    t(EventType.NEW_ARRIVAL, EventSeverity.LOW, EventSeverity.MEDIUM, "SEC 13F filing alert", "SEC filing ping"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.HIGH, "Fat finger order 10x size", "wrong order size"),
  ],
};

// ─── Entertainment ───────────────────────────────────────

const eventProducer: ProfessionConfig = {
  id: "event_producer",
  name: "Event Production Manager",
  slug: "event-producer",
  industry: Industry.ENTERTAINMENT,
  description: "Live event production manager coordinating technical crews, talent, and logistics during a major live event.",
  icon: "🎭",
  baseScenarioPrompt: "crew setting up concert stage",
  eventTemplates: [
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.HIGH, EventSeverity.CRITICAL, "PA system cutting out", "speakers silent"),
    t(EventType.ENVIRONMENTAL, EventSeverity.MEDIUM, EventSeverity.HIGH, "Rain hitting exposed equipment", "rain starting"),
    t(EventType.COMMUNICATION, EventSeverity.HIGH, EventSeverity.HIGH, "Headliner stuck in traffic", "artist missing"),
    t(EventType.COMPLICATION, EventSeverity.MEDIUM, EventSeverity.HIGH, "Live video feed corrupted", "video glitching"),
    t(EventType.TIME_PRESSURE, EventSeverity.HIGH, EventSeverity.HIGH, "Set changeover running behind", "stage half cleared"),
    t(EventType.NEW_ARRIVAL, EventSeverity.LOW, EventSeverity.MEDIUM, "Fire marshal surprise inspection", "inspector arriving"),
    t(EventType.COMPLICATION, EventSeverity.HIGH, EventSeverity.CRITICAL, "Person collapsed in crowd", "person collapsed"),
    t(EventType.EQUIPMENT_FAILURE, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Lighting rig lost DMX signal", "lights going dark"),
    t(EventType.ENVIRONMENTAL, EventSeverity.LOW, EventSeverity.MEDIUM, "High wind hazard developing", "wind picking up"),
    t(EventType.COMMUNICATION, EventSeverity.MEDIUM, EventSeverity.MEDIUM, "Radio interference blocking comms", "radio interference"),
  ],
};

// ─── Industry Configurations ─────────────────────────────

export const INDUSTRIES: IndustryConfig[] = [
  {
    id: "healthcare",
    name: "Healthcare",
    slug: "healthcare",
    description: "Hospital and pre-hospital medical environments requiring rapid clinical decision-making.",
    icon: "🏥",
    professions: [icuNurse, paramedic, ldNurse, surgicalTech],
  },
  {
    id: "emergency_services",
    name: "Emergency Services",
    slug: "emergency-services",
    description: "High-stakes emergency response requiring split-second decisions and multi-agency coordination.",
    icon: "🚨",
    professions: [dispatcher, firefighter, airTrafficController],
  },
  {
    id: "food_hospitality",
    name: "Food & Hospitality",
    slug: "food-hospitality",
    description: "Fast-paced kitchen and bar environments where timing, quality, and composure are everything.",
    icon: "🍽️",
    professions: [lineCook, bartender],
  },
  {
    id: "veterinary",
    name: "Veterinary",
    slug: "veterinary",
    description: "Emergency animal hospital care with unique challenges of non-verbal patients and emotional owners.",
    icon: "🐾",
    professions: [vetErTech],
  },
  {
    id: "finance",
    name: "Finance",
    slug: "finance",
    description: "High-pressure trading environments where milliseconds and composure determine outcomes.",
    icon: "📊",
    professions: [stockTrader],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    slug: "entertainment",
    description: "Live event production where technical failures and logistics must be managed in real time.",
    icon: "🎭",
    professions: [eventProducer],
  },
];

// ─── Lookup Helpers ──────────────────────────────────────

export const ALL_PROFESSIONS: ProfessionConfig[] = INDUSTRIES.flatMap((i) => i.professions);

export function getIndustryBySlug(slug: string): IndustryConfig | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}

export function getProfessionBySlug(slug: string): ProfessionConfig | undefined {
  return ALL_PROFESSIONS.find((p) => p.slug === slug);
}

export function getProfessionById(id: string): ProfessionConfig | undefined {
  return ALL_PROFESSIONS.find((p) => p.id === id);
}

export function getProfessionsByIndustry(industry: Industry): ProfessionConfig[] {
  return ALL_PROFESSIONS.filter((p) => p.industry === industry);
}
