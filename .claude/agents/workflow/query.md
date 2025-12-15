---
name: query
description: Query optimization and N+1 detection with PostgreSQL MCP
model: sonnet
---

# Query Optimization Agent

**Specialization**: Database query optimization, N+1 detection, index tuning
**MCP Integration**: PostgreSQL direct access for query analysis

---

## N+1 Query Detection & Prevention

### The N+1 Problem

```typescript
// ❌ BAD: N+1 Query Pattern (1 + N queries)
const classes = await db.class.findMany({ where: { schoolId } })
// 1 query

for (const cls of classes) {
  cls.teacher = await db.teacher.findUnique({
    where: { id: cls.teacherId },
  })
  // N queries (one per class)
}
// Total: 1 + N queries
```

### Solution: Eager Loading

```typescript
// ✅ GOOD: Single Query with Includes
const classes = await db.class.findMany({
  where: { schoolId },
  include: {
    teacher: true,
    subject: true,
    students: {
      include: {
        student: true,
      },
    },
  },
})
// Total: 1 optimized query with JOINs
```

## Query Optimization Patterns

### 1. Select Only Needed Fields

```typescript
// ❌ BAD: Fetches all columns (100+ fields)
const users = await db.user.findMany({
  where: { schoolId },
  include: {
    profile: true, // All profile fields
    settings: true, // All settings fields
  },
})

// ✅ GOOD: Select specific fields
const users = await db.user.findMany({
  where: { schoolId },
  select: {
    id: true,
    name: true,
    email: true,
    profile: {
      select: {
        avatar: true,
        bio: true,
      },
    },
  },
})
```

### 2. Pagination for Large Results

```typescript
// ❌ BAD: Loads all records into memory
const allStudents = await db.student.findMany({
  where: { schoolId },
})

// ✅ GOOD: Cursor-based pagination
async function* getStudentsBatch(schoolId: string) {
  let cursor: string | undefined

  while (true) {
    const students = await db.student.findMany({
      where: { schoolId },
      take: 100,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: "asc" },
    })

    if (students.length === 0) break

    yield students
    cursor = students[students.length - 1].id
  }
}

// ✅ GOOD: Offset pagination for UI
const students = await db.student.findMany({
  where: { schoolId },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: "desc" },
})
```

### 3. Batch Operations

```typescript
// ❌ BAD: Individual inserts
for (const student of students) {
  await db.student.create({
    data: { ...student, schoolId },
  })
}

// ✅ GOOD: Bulk insert
await db.student.createMany({
  data: students.map((s) => ({ ...s, schoolId })),
})

// ✅ GOOD: Bulk update with transaction
await db.$transaction(
  studentIds.map((id) =>
    db.student.update({
      where: { id },
      data: { status: "GRADUATED" },
    })
  )
)
```

### 4. Optimized Counting

```typescript
// ❌ BAD: Count with heavy includes
const count = await db.student.count({
  where: { schoolId },
  include: { classes: true }, // Ignored but still processed
})

// ✅ GOOD: Simple count
const count = await db.student.count({
  where: { schoolId },
})

// ✅ GOOD: Count with grouping
const countByGrade = await db.student.groupBy({
  by: ["yearLevelId"],
  where: { schoolId },
  _count: { id: true },
})
```

### 5. Index Usage

```prisma
model Student {
  id          String   @id
  schoolId    String
  email       String
  yearLevelId String?
  status      String
  createdAt   DateTime @default(now())

  // Single column indexes
  @@index([schoolId])
  @@index([email])
  @@index([status])

  // Composite indexes for common queries
  @@index([schoolId, status])        // WHERE schoolId = ? AND status = ?
  @@index([schoolId, yearLevelId])   // WHERE schoolId = ? AND yearLevelId = ?
  @@index([schoolId, createdAt])     // WHERE schoolId = ? ORDER BY createdAt
}
```

## Query Analysis

### Using EXPLAIN

```sql
-- Analyze query plan
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM students
WHERE school_id = '123'
AND status = 'ACTIVE'
ORDER BY created_at DESC
LIMIT 20;
```

### Key Metrics to Monitor

- **Execution Time**: < 100ms for user-facing queries
- **Rows Examined vs Returned**: Should be close
- **Index Usage**: Avoid sequential scans
- **Buffer Hits**: High cache hit ratio (> 95%)

## Complex Query Patterns

### 1. Subqueries vs Joins

```typescript
// ❌ SLOWER: Subquery in select
const teachers = await db.$queryRaw`
  SELECT t.*,
    (SELECT COUNT(*) FROM classes WHERE teacher_id = t.id) as class_count
  FROM teachers t
  WHERE school_id = ${schoolId}
`

// ✅ FASTER: Join with grouping
const teachers = await db.teacher.findMany({
  where: { schoolId },
  include: {
    _count: {
      select: { classes: true },
    },
  },
})
```

### 2. Window Functions

```typescript
// Rank students by score within each class
const rankedStudents = await db.$queryRaw`
  SELECT
    s.*,
    ROW_NUMBER() OVER (
      PARTITION BY class_id
      ORDER BY score DESC
    ) as rank
  FROM student_scores s
  WHERE school_id = ${schoolId}
`
```

### 3. Recursive Queries

```typescript
// Get organizational hierarchy
const hierarchy = await db.$queryRaw`
  WITH RECURSIVE org_tree AS (
    SELECT id, name, parent_id, 0 as level
    FROM departments
    WHERE parent_id IS NULL AND school_id = ${schoolId}

    UNION ALL

    SELECT d.id, d.name, d.parent_id, ot.level + 1
    FROM departments d
    JOIN org_tree ot ON d.parent_id = ot.id
    WHERE d.school_id = ${schoolId}
  )
  SELECT * FROM org_tree ORDER BY level, name
`
```

## Connection Pooling

### Prisma Configuration

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

// Connection pool settings in DATABASE_URL:
// postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30
```

## Performance Monitoring

### Query Logging

```typescript
// Enable query logging in development
const db = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" },
    { emit: "stdout", level: "warn" },
  ],
})

db.$on("query", (e) => {
  console.log("Query: " + e.query)
  console.log("Duration: " + e.duration + "ms")
})
```

### Slow Query Detection

```typescript
// Middleware to detect slow queries
db.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()

  const duration = after - before
  if (duration > 1000) {
    // > 1 second
    console.warn(`Slow query detected (${duration}ms):`, {
      model: params.model,
      action: params.action,
    })
  }

  return result
})
```

## Optimization Checklist

### Query Level

- [ ] No N+1 queries (use includes)
- [ ] Select only needed fields
- [ ] Proper pagination implemented
- [ ] Batch operations where possible
- [ ] Indexes on filtered fields
- [ ] Indexes on joined fields
- [ ] Composite indexes for common filters

### Schema Level

- [ ] Foreign key constraints
- [ ] Proper data types (don't use TEXT for enums)
- [ ] Denormalization where appropriate
- [ ] Materialized views for complex aggregates

### Application Level

- [ ] Connection pooling configured
- [ ] Query result caching (Redis/Memory)
- [ ] Database query timeout set
- [ ] Retry logic for transient failures
- [ ] Circuit breaker for database failures

### Monitoring

- [ ] Query execution time tracked
- [ ] Slow query alerts configured
- [ ] Database CPU/Memory monitored
- [ ] Connection pool saturation tracked
- [ ] Query error rate monitored

## Common Performance Issues

### Issue: Slow COUNT queries

```typescript
// Problem: Counting with complex conditions
const total = await db.student.count({
  where: complexWhereClause,
})

// Solution: Approximate counts for large tables
const estimate = await db.$queryRaw`
  SELECT reltuples::BIGINT AS estimate
  FROM pg_class
  WHERE relname = 'students'
`
```

### Issue: Large JSON fields

```typescript
// Problem: Storing large JSON in database
model Record {
  data Json // Could be MBs of data
}

// Solution: Store in object storage, reference in DB
model Record {
  dataUrl String // S3/CloudStorage URL
  dataSize Int   // For quick filtering
}
```

### Issue: Missing Indexes

```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1
ORDER BY n_distinct DESC;
```

## Query Optimization Workflow

1. **Identify slow queries** - Monitor and log
2. **Analyze execution plan** - EXPLAIN ANALYZE
3. **Check indexes** - Ensure proper coverage
4. **Optimize query** - Rewrite if needed
5. **Test performance** - Measure improvement
6. **Monitor in production** - Track metrics
7. **Iterate** - Continue optimizing
