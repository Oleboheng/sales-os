# Sales OS

> A purpose built sales assistant for small business outreach, turning prospects into researched, qualified opportunities with scoring and action recommendations.

Sales OS is a sales workflow application built to help small businesses run focused outbound outreach without turning the process into a complicated CRM.

It helps move a prospect through:

**Lead → Research → Qualification → Decision Maker → Outreach → Next Action**

The system keeps the information collected during that process connected so that research, qualification, scoring, and recommended actions can work together.

## Why I built it

Traditional CRM systems can be powerful, but they can also make simple sales actions feel unnecessarily heavy.

Sales OS was built around a simple principle:

> **If an action can be completed in 2–3 taps on a phone, it should not become a 10-field form.**

The current system is shaped around the outreach workflows I am actively running. It is intentionally purpose-built rather than pretending to be a fully generic CRM.

Different opportunities can require completely different research questions and evidence. Instead of forcing every opportunity into one rigid research form, Sales OS separates shared sales concepts from opportunity-specific research.

## What it currently does

- Organisations and reusable people records
- Sales opportunities and pipeline stages
- Prospect research workflows
- Opportunity-specific research types
- Decision-maker identification and tracking
- Interaction and activity history
- Notes and tasks
- Opportunity scoring
- Action intelligence
- Recommended next actions
- Prospecting queues
- Mobile-oriented execution workflows
- PostgreSQL-backed persistence
- JWT authentication
- Docker-based deployment

## Research architecture

The current model follows this structure:

```text
Organisation
    ↓
People
    ↓
Opportunity
    ├── Opportunity Type
    ↓
Shared Research
    ├── Lifecycle
    ├── Status
    ├── Completion
    └── Common Metadata
    ↓
Type-Specific Research

This allows the application to keep common sales concepts consistent while allowing different opportunity types to ask different research questions.

At the moment, those research workflows are intentionally implemented for the specific outreach use cases the system is being used for.

Scoring and action intelligence

Research is not collected just for the sake of storing information.

The information gathered during prospecting can affect qualification and scoring, which can then influence the actions the system recommends.

The intended flow is:

Research
   ↓
Qualification
   ↓
Scoring
   ↓
Signals
   ↓
Recommended Action

This means the application is designed to answer not only:

"What do we know about this prospect?"

but also:

"Given what we know, what should happen next?"

Current direction

The longer-term goal is to make research types configurable.

Instead of hard-coding every research workflow, future versions should allow a user to define their own research questions and evidence requirements while keeping the underlying scoring and recommendation contract consistent.

The project is therefore evolving incrementally:

Purpose-built workflows
        ↓
Reusable research architecture
        ↓
Configurable research types
        ↓
Consistent scoring
        ↓
Context-aware recommendations
Technology
Frontend: React, Vite, Tailwind CSS
Backend: Node.js, Fastify
Database: PostgreSQL
Authentication: JWT
Deployment: Docker Compose
Automation: n8n
Project structure
sales-os/
├── api/
│   ├── migrations/
│   └── src/
├── database/
│   └── migrations/
├── frontend/
│   └── src/
├── n8n/
├── scripts/
├── storage/
├── docker-compose.yml
└── README.md
Running locally
Requirements
Docker
Docker Compose
Git
Setup

Clone the repository:

git clone https://github.com/Oleboheng/sales-os.git
cd sales-os

Create your local environment file:

cp .env.example .env

Edit .env and provide your own database password and JWT secret.

Then start the application:

docker compose up -d --build

The exact ports can be configured through .env.

Important

Do not commit:

.env
Database runtime data
Database backups
Generated application data
Local credentials or secrets

The repository includes a .gitignore intended to keep these files out of version control.

Development philosophy

Sales OS is being developed around a few practical principles.

1. Keep the sales workflow fast
The application should help the salesperson move forward rather than create administrative work.

2. Keep organisations and people reusable
An organisation and its people should be useful sources of truth across opportunities rather than being repeatedly recreated.

3. Let research match the opportunity
Different sales opportunities can require different evidence. Research should be specific enough to be useful without forcing unrelated questions into every workflow.

4. Turn information into action
Research should contribute to qualification, scoring, and recommendations rather than becoming a passive database.

5. Evolve from real usage
The system is being developed incrementally around real outreach workflows. Abstractions are introduced when they solve an actual problem rather than being added only for theoretical flexibility.

Status

Sales OS is an actively evolving project.

The current implementation works for the outreach workflow it was designed for, while the architecture is being developed toward a more configurable sales assistant.

It is not presented as a finished universal CRM.

Contributing

The project is public, but the main branch is intended to remain under maintainer control.

If you would like to propose a change, open an issue or submit a pull request so the change can be reviewed before it is merged.

License

No open-source license has been added yet.

Until a license is added, the source code should not be assumed to be freely reusable or redistributable beyond the permissions granted by applicable GitHub functionality.

Built by Oleboheng Tladie / Soflas Developments.
