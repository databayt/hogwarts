# Epic and Story Decomposition - Bite-Sized Implementation Planning

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>This workflow transforms requirements into BITE-SIZED STORIES for limited context agents</critical>
<critical>EVERY story must be completable by a single limited context window dev agent in one session</critical>
<critical>Communicate all responses in {communication_language} and adapt deeply to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>
<critical>LIVING DOCUMENT: Write to epics.md continuously as you work - never wait until the end</critical>

<workflow>

<step n="0" goal="Load context and requirements">
<action>Welcome the {user_name} to the project inception high level epic and story planning.

Load required documents:

1. PRD.md (must exist - fuzzy match on name, might be a folder with an index and smaller sharded files also)
2. domain-brief.md (if exists)
3. product-brief.md (if exists)

Extract from PRD:

- Functional requirements
- Non-functional requirements
- Domain considerations
- Project type
- MVP scope vs growth features

If continuing from PRD workflow:
"Great! Now let's break down your requirements into actionable epics and bite-sized stories that development agents can implement independently."

If starting fresh:
"I'll help you transform your PRD into organized epics with implementable stories. Each story will be small enough for a single dev agent to complete in one session."</action>
</step>

<step n="1" goal="Form epics from natural groupings">
<action>Transform requirements into epics organically

INTENT: Find natural boundaries that make sense for THIS product

Look at the requirements and find patterns:

- Features that work together
- User journeys that connect
- Technical systems that relate
- Business capabilities that group
- Domain requirements that cluster (compliance, validation, etc.)

Examples of natural epic formation:

- Auth features → "User Management" epic
- Payment features → "Monetization" epic
- Social features → "Community" epic
- Admin features → "Administration" epic
- Compliance requirements → "Regulatory Compliance" epic
- API endpoints → "API Infrastructure" epic

But let the product guide you - don't force standard patterns

Each epic should:

- Have a clear business goal
- Be independently valuable
- Contain 3-8 related features
- Be completable in 1-2 sprints

Name epics based on value, not technical components:
GOOD: "User Onboarding", "Content Discovery", "Team Collaboration"
NOT: "Database", "Frontend", "API"

If domain considerations exist:

- Create dedicated compliance/validation epics
- Note special expertise needed per epic
- Flag epics with regulatory dependencies

Present epic groupings conversationally:
"Based on your requirements, I see these natural epic groupings:

1. [Epic Name] - [Brief description]
2. [Epic Name] - [Brief description]
3. [Epic Name] - [Brief description]

Does this organization make sense for how you think about the product?"</action>

<template-output>epics_structure</template-output>
</step>

<step n="2" goal="Decompose into bite-sized stories">
<critical>Small vertical sliced small stories are best for agentic dumb developers to implement without forgetting things</critical>

<action>Break each epic into small, implementable stories

INTENT: Create stories that one dev agent can complete independently

For each epic, decompose into stories that are:

- Small enough for single context window
- Clear enough for autonomous implementation
- Independent enough to develop in parallel when possible
- Specific enough to have clear acceptance criteria

GOOD story examples:

- "Create login API endpoint that accepts email/password and returns JWT"
- "Build user profile component with avatar upload to S3"
- "Add password reset email template and sending logic"
- "Implement rate limiting on auth endpoints (5 attempts per minute)"
- "Create HIPAA-compliant audit log for patient data access"
- "Build FDA 21 CFR Part 11 electronic signature component"

BAD story examples:

- "Build complete authentication system" (too big)
- "Handle user management" (too vague)
- "Make it secure" (not specific)
- "Integrate everything" (requires multiple contexts)

Story format:
"As a [user type], I want [specific feature], so that [clear value]"

Technical notes to include:

- Affected files/components if known
- Required endpoints/methods
- Data structures needed
- Specific validation rules
- Compliance requirements if applicable
- Dependencies on other stories

Domain-aware story creation:

- For healthcare: Include specific regulations per story
- For fintech: Note PCI/security requirements per story
- For govtech: Flag accessibility needs per story
- For aerospace: Include safety/validation requirements

Check each story:

- Can this be explained in <1000 words?
- Can one agent complete without another's output?
- Is the scope crystal clear?
- Are success criteria obvious?
- Are domain requirements specified?

If too big → split into smaller stories
If too vague → add specifics
If dependent → note the dependency clearly
If domain-critical → flag compliance needs</action>

<template-output>epic_1_stories</template-output>
<template-output>epic_2_stories</template-output>
<template-output>epic_3_stories</template-output>

<!-- Continue for each epic discovered -->
</step>

<step n="3" goal="Sequence for smart implementation">
<action>Order stories for successful development

INTENT: Create a logical flow that minimizes blockers and maximizes progress

Consider dependencies:
TECHNICAL:

- Authentication before protected features
- Data models before business logic
- Core features before enhancements
- API before frontend that uses it

DOMAIN:

- Compliance infrastructure before features
- Validation framework before clinical features
- Audit logging before financial transactions
- Safety systems before operational features

PRACTICAL:

- What gives visible progress early?
- What reduces risk soonest?
- What enables parallel work?
- What delivers value fastest?

Create implementation phases:

Phase 1 - Foundation:

- Core data models
- Authentication/authorization
- Basic infrastructure
- Essential APIs
- Compliance foundation (if domain requires)

Phase 2 - Core Features:

- MVP functionality
- Key user flows
- Basic UI/UX
- Critical integrations
- Domain validations (if applicable)

Phase 3 - Enhancement:

- Polish and refinement
- Additional features
- Performance optimization
- Extended functionality
- Advanced compliance features

Phase 4 - Growth:

- Analytics and monitoring
- Advanced features
- Scaling preparations
- Nice-to-have additions

For complex domains, add gates:

- "Gate: Security audit before payment processing"
- "Gate: Clinical validation before patient features"
- "Gate: Compliance review before launch"

Present the sequencing conversationally:
"Here's a smart implementation order:

**Phase 1 (Foundation) - Week 1-2:**

- Story 1.1: [Description]
- Story 1.2: [Description] (can parallel with 1.1)
- Story 1.3: [Description] (depends on 1.1)

**Phase 2 (Core) - Week 3-4:**
[Continue...]

This gives you something working by [milestone] and allows [X] stories to run in parallel."</action>

<template-output>implementation_sequence</template-output>
<template-output>development_phases</template-output>
<template-output>dependency_graph</template-output>
</step>

<step n="4" goal="Validate story sizing and clarity">
<action>Review all stories for dev agent compatibility

Run through each story and verify:

SIZE CHECK:

- Story description < 500 words
- Clear inputs and outputs defined
- Single responsibility principle
- No hidden complexity

CLARITY CHECK:

- Acceptance criteria explicit
- Technical approach clear
- No ambiguous requirements
- Success measurable

DEPENDENCY CHECK:

- Dependencies documented
- Can start with clear inputs
- Outputs well-defined
- Parallel opportunities noted

DOMAIN CHECK (if applicable):

- Compliance requirements stated
- Validation criteria defined
- Regulatory references included
- Special expertise noted

If any issues found:
"Story [X] seems too large. Let me split it:

- [Smaller story 1]
- [Smaller story 2]"

"Story [Y] needs clarification on [aspect]. How should we handle [specific question]?"

Final validation:
"All stories are now sized for 200k context limits.

- Total stories: [count]
- Can run in parallel: [count]
- Sequential dependencies: [count]
- Estimated completion: [timeframe]"</action>

<template-output>story_validation</template-output>
</step>

<step n="5" goal="Create development guidance">
<action>Add practical guidance for implementation teams

Create quick reference for development:

GETTING STARTED:
"Start with Phase 1 stories - multiple can run in parallel.
Key files to create first: [list]
Recommended agent allocation: [suggestion]"

DOMAIN GUIDANCE (if applicable):
"Critical compliance checkpoints:

- After story [X]: Run [validation]
- Before story [Y]: Review [regulation]
- Throughout: Maintain [audit trail]"

TECHNICAL NOTES:
"Architecture decisions needed:

- [Decision 1] affects stories [A, B, C]
- [Decision 2] blocks story [D]

Consider these patterns:

- [Pattern] for [epic]
- [Pattern] for [requirement]"

RISK MITIGATION:
"Watch out for:

- [Risk] in story [X]
- [Complexity] in epic [Y]
- [Dependency] between [A] and [B]"

SUCCESS METRICS:
"You'll know Phase 1 is complete when:

- [Measurable outcome]
- [Testable feature]
- [Validation passed]"</action>

<template-output>implementation_guidance</template-output>
</step>

<step n="6" goal="Finalize and prepare handoff">
<action>Complete the epics document and prepare for development

Review what we've created:
"We've successfully decomposed your requirements into:

- [x] epics
- [Y] total stories
- [Z] phases of development

Every story is sized for a single dev agent to complete independently."

Highlight key achievements:

- Stories respect 200k context limit
- Dependencies clearly mapped
- Domain requirements integrated
- Parallel development enabled

Save completed epics.md with:

- Full epic descriptions
- All stories with acceptance criteria
- Implementation sequence
- Development phases
- Dependency notes
- Domain compliance requirements (if applicable)</action>

<output>**✅ Epic Decomposition Complete, {user_name}!**

Your requirements are now organized into **{epic_count} epics** with **{story_count} bite-sized stories**.

**Created:**

- **epics.md** - Complete epic breakdown with implementable stories

**Key Stats:**

- Average story size: Fits in 200k context
- Parallel stories: {parallel_count} can run simultaneously
- Sequential chains: {sequential_count} dependency chains
- Estimated velocity: {velocity_estimate}

**Next Steps:**

1. Review epics.md for the complete breakdown
2. Start Phase 1 implementation with parallel stories
3. Use story IDs for tracking progress

Each story is crafted for a single dev agent to complete autonomously. No monoliths, no confusion, just clear implementation paths.

Ready to begin development with any story marked "can start immediately"!</output>
</step>

</workflow>
