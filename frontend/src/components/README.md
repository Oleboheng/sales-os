# Frontend component architecture

Sales OS frontend organises UI by **domain**, not by technical layer alone.

## Directory layout
frontend/src/
├── pages/           # Route-level screens (orchestration)
├── services/        # API transport (api.js)
└── components/
├── opportunity/ # Opportunity profile / detail UI
└── shared/      # Domain-neutral primitives only (create when needed)
textAdd a domain folder only when the first component for that domain is extracted.
Do not pre-create empty folders for future ideas.

## Pages vs components

### Pages (`pages/`)

Own:

- route params
- page-level data load (e.g. profile fetch)
- layout / section composition
- coordinating refresh after child saves

Must not permanently accumulate hundreds of lines of feature JSX and feature state.
Prefer extracting coherent sections into domain components.

### Domain components (`components/<domain>/`)

Own one coherent business or UI responsibility.

Examples:

- `NextActionCard` — present next task / next_action
- `DecisionMakerPanel` — opportunity-scoped DM edit (planned)
- `ResearchPanel` — research form lifecycle (planned)

### Shared (`components/shared/`)

Only for **domain-neutral** UI reused by multiple domains.
Do not move a component to shared because it “might” be reused later.

### Services (`services/`)

HTTP / API access. Presentational components should not embed transport details when a page or feature component can own the call.

## Naming

- Files: PascalCase matching the default export (`NextActionCard.jsx`)
- Prefer suffix by role when helpful: `Card`, `Panel`, `Form`, `List`, `Summary`
- Domain folder names: lowercase singular noun (`opportunity`, `organisation`)

## Source-of-truth rules (frontend must respect)

| Concept | Owner | Notes |
|---------|--------|------|
| Organisation | Organisation entity | Shared org-level facts |
| People | Organisation → People | Multiple people per org; contact create ≠ DM |
| Decision Maker | Opportunity → status + person_id → Person | Authoritative relationship |
| Research | Opportunity → Research | Evidence only; does not own DM |
| Activities / Notes / Tasks | Opportunity-scoped records | As returned by profile APIs |

### Decision Maker

Authoritative fields:

- `opportunities.decision_maker_status`
- `opportunities.decision_maker_person_id`

Do **not** treat `people.is_decision_maker` as opportunity authority in new UI.
Legacy DB column may remain; it must not drive new components.

### Research

Research may note discovery evidence about a possible DM.
It must not present itself as the current opportunity Decision Maker.
Research completion ≠ Decision Maker identification.

### Future multi-opportunity

Not implemented in UI now. Preserve model:
Organisation
├── People[]
└── Opportunities[]
├── Research
├── Decision Maker → Person
└── other opportunity-specific intelligence
text## OpportunityDetail decomposition

Orchestrator: `pages/OpportunityDetail.jsx`

| Component | Status | Kind |
|-----------|--------|------|
| NextActionCard | **EXTRACTED** | Presentational |
| OpportunityHeader | Planned | Feature (stage + snapshot) |
| WhyThisProspectCard | Planned | Presentational |
| DecisionMakerSummaryCard | Planned | Presentational (read-only) |
| OperationsSummaryCard | Planned | Presentational |
| DecisionMakerPanel | Planned | Stateful feature (PUT DM API) |
| ResearchPanel | Planned | Stateful feature (save/complete) |
| ScoringPanel | Planned | Presentational |
| ActivitiesList | Planned | Presentational |
| NotesList | Planned | Presentational |
| AddTaskForm | Planned | Form |
| AddNoteForm | Planned | Form |

Extract **one component at a time**. Test build + visual parity after each extraction.
Do not extract Research or Decision Maker until lower-risk presentational pieces are done (unless prioritised deliberately).

## Where does a new component go?

1. Used on only one domain screen → `components/<domain>/`
2. Truly reused across domains with no domain logic → `components/shared/`
3. Only used as page glue / routing → keep in `pages/`
4. Unsure → keep in the domain folder; move to shared only after a second real consumer exists

## Rules against giant pages

- If a section has its own state, handlers, and JSX block, prefer a domain component.
- Pages coordinate; domain components implement.
- Prefer minimal props (data the section actually needs), not the entire profile object, unless orchestration cost is high.

## Related backend ownership (reminder)

Frontend components must call the existing authoritative APIs:

- Decision Maker → `PUT /api/opportunities/:id/decision-maker`
- Research → prospecting research routes
- Profile → `GET /api/opportunities/:id/profile`

Do not invent parallel sources of truth in the UI.
