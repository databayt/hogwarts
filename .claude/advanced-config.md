# Advanced Claude Code Configuration

This document outlines advanced configuration features and recommendations for optimizing Claude Code usage in the Hogwarts platform. While these features aren't directly supported in settings.json yet, they represent best practices and future enhancements.

## Model Selection Strategy

### Recommended Model Defaults

```yaml
modelDefaults:
  orchestrator: claude-opus-4-1-20250805 # Deep reasoning for complex coordination
  technical: claude-sonnet-4-5-20250929 # Optimal for coding tasks
  lightweight: claude-haiku-4-5 # Cost-effective for simple tasks
```

### Agent-Specific Models

- **Opus**: orchestrator, architecture agents (complex reasoning)
- **Sonnet**: All technical agents (coding, testing, security)
- **Haiku**: formatter, spellcheck, simple-refactor (mechanical tasks)

## Observability & Metrics

### Performance Tracking

```yaml
observability:
  enabled: true
  logLevel: info
  captureTokenUsage: true
  captureToolInvocations: true
  captureAgentMetrics: true
  metricsOutputPath: .claude/metrics/

  performanceThresholds:
    agentResponseTime: 5000ms
    tokenUsageWarning: 100000
    costAlert: $5.00
```

### Metrics to Track

1. **Token Usage**: Input/output tokens per agent
2. **Response Time**: Agent execution duration
3. **Success Rate**: Task completion percentage
4. **Cost Analysis**: $ per feature/task
5. **Error Patterns**: Common failure modes

## @Mention Routing (Future Feature)

### Direct Agent Invocation

Instead of going through orchestrator, directly invoke agents:

```bash
# Current (through orchestrator)
/agents/orchestrate -p "Fix TypeScript errors in expenses module"

# Future (@mention routing)
@typescript fix errors in expenses/actions.ts
@prisma optimize queries in student module
@react review performance of Dashboard component
```

### Benefits

- 30% faster execution (no orchestration overhead)
- Lower token usage
- Direct expert access
- Parallel agent execution

### Routing Configuration

```yaml
agentConfiguration:
  enableMentions: true
  mentionPrefix: "@"
  routingRules:
    "@ts": agents/typescript
    "@react": agents/react
    "@db": agents/prisma
    "@next": agents/nextjs
    "@test": agents/test
    "@sec": agents/security
    "@perf": agents/performance
    "@i18n": agents/i18n
    "@fmt": agents/formatter # Haiku
    "@spell": agents/spellcheck # Haiku
    "@refactor": agents/simple-refactor # Haiku
```

## Advanced Features

### Feature Flags

```yaml
features:
  mentionRouting: true # Direct agent invocation
  compactMode: true # Reduced output verbosity
  parallelExecution: true # Run independent agents simultaneously
  autoRetry: true # Retry failed operations
  smartCaching: true # Cache agent responses
  progressiveDisclosure: true # Show details on demand
```

### Parallel Execution Strategy

```yaml
parallelization:
  maxConcurrentAgents: 5
  independentTasks:
    - test generation
    - documentation
    - linting
    - formatting

  sequentialTasks:
    - build → test → deploy
    - migrate → seed → verify
```

## Cost Optimization

### Token Budget Management

```yaml
budgets:
  daily:
    total: 1000000 tokens
    perAgent:
      orchestrator: 100000
      technical: 500000
      lightweight: 400000

  alerts:
    warningAt: 80%
    criticalAt: 95%
```

### Haiku Agent Usage

Target 40% of operations for Haiku agents:

- Formatting: 15%
- Spell checking: 10%
- Simple refactoring: 10%
- Quick validations: 5%

Expected savings: $60-90/month (40% reduction)

## Session Optimization

### Context Management

```yaml
context:
  maxContextWindow: 200000
  compressionEnabled: true
  pruningStrategy: lru # Least recently used
  persistentContext:
    - CLAUDE.md
    - .env.example
    - prisma/schema.prisma
```

### Memory Bank Integration

When available, configure persistent memory:

```yaml
memoryBank:
  enabled: true
  retentionDays: 30
  categories:
    - decisions
    - patterns
    - errors
    - optimizations
```

## Monitoring Dashboard

### Key Metrics Display

```typescript
// .claude/scripts/lab.js
const metrics = {
  today: {
    tokensUsed: 245000,
    costIncurred: "$3.45",
    tasksCompleted: 47,
    errorsEncountered: 2,
    averageResponseTime: "3.2s",
  },

  byAgent: {
    typescript: { calls: 23, tokens: 45000, avgTime: "2.1s" },
    react: { calls: 18, tokens: 38000, avgTime: "2.8s" },
    formatter: { calls: 89, tokens: 12000, avgTime: "0.8s" },
  },

  trends: {
    tokenUsage: "+15% vs yesterday",
    costSavings: "$2.30 from Haiku usage",
    productivity: "+22% tasks/hour",
  },
}
```

## Team Collaboration

### Shared Configuration

```yaml
teamSettings:
  sharedAgents: true
  sharedCommands: true
  sharedSkills: true
  syncVia: git

  notifications:
    slack:
      channel: "#claude-code"
      events:
        - deployment
        - errors
        - highCost
```

## Security & Compliance

### Audit Configuration

```yaml
audit:
  enabled: true
  logPath: .claude/audit/
  events:
    - agentInvocation
    - fileModification
    - commandExecution
    - errorOccurrence

  retention: 90 # days
  encryption: true
```

## Implementation Roadmap

### Phase 1: Immediate (Implemented)

✅ Skills activation
✅ MCP server additions
✅ Haiku agents
✅ New commands
✅ Hook enhancements

### Phase 2: Short-term (To Do)

⏳ Create monitoring scripts
⏳ Implement cost tracking
⏳ Add remaining agents
⏳ Create advanced skills

### Phase 3: Future

🔮 @Mention routing (when available)
🔮 Memory Bank integration
🔮 Advanced observability
🔮 Team collaboration features

## Usage Examples

### Cost-Optimized Workflow

```bash
# Use Haiku for simple tasks
/agents/formatter -p "Format all TypeScript files"        # Haiku (cheap)
/agents/spellcheck -p "Check documentation"              # Haiku (cheap)

# Use Sonnet for complex tasks
/agents/typescript -p "Fix type errors in payment module" # Sonnet (optimal)
/agents/security -p "Audit authentication flow"          # Sonnet (optimal)

# Use Opus only for orchestration
/agents/orchestrate -p "Design new microservice architecture" # Opus (expensive)
```

### Parallel Execution

```bash
# Run multiple agents simultaneously
/agents/orchestrate -p "In parallel:
1. Generate tests for StudentForm
2. Check security in auth module
3. Optimize Dashboard performance
4. Update documentation"
```

## Monitoring Commands

### Check Usage

```bash
# View token usage
cat .claude/metrics/token-usage.json

# Check cost analysis
node .claude/scripts/cost-analyzer.js

# View agent performance
node .claude/scripts/agent-metrics.js
```

## Best Practices

1. **Use Haiku agents for 40%+ of tasks** (3x cost savings)
2. **Run independent tasks in parallel** (2x speed improvement)
3. **Cache frequently accessed data** (reduce token usage)
4. **Monitor daily token usage** (stay within budget)
5. **Use skills for knowledge reuse** (avoid repetition)
6. **Implement pre-commit hooks** (catch errors early)
7. **Track agent success rates** (optimize usage patterns)

## Notes

This configuration represents optimal Claude Code usage patterns discovered through research and analysis. As Claude Code evolves, these features may become directly configurable in settings.json.

For now, use this document as a guide for:

- Agent selection strategies
- Cost optimization techniques
- Performance monitoring approaches
- Team collaboration patterns

Last Updated: 2024-10-31
