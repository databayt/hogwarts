/**
 * Suggest and create database indexes for performance
 * Run: npx tsx scripts/db-indexes.ts [--suggest|--apply]
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import pg from 'pg'

const { Pool } = pg

const program = new Command()
program
  .option('--suggest', 'Suggest missing indexes')
  .option('--apply', 'Apply suggested indexes')
  .option('--analyze', 'Analyze existing indexes')
  .parse()

const options = program.opts()

interface IndexSuggestion {
  table: string
  column: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  sql: string
}

const suggestions: IndexSuggestion[] = [
  // Foreign key indexes
  {
    table: 'students',
    column: 'schoolId',
    reason: 'Foreign key used in WHERE clauses frequently',
    priority: 'high',
    sql: 'CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(schoolId);'
  },
  {
    table: 'teachers',
    column: 'schoolId',
    reason: 'Foreign key used in WHERE clauses frequently',
    priority: 'high',
    sql: 'CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(schoolId);'
  },
  {
    table: 'classes',
    column: 'schoolId',
    reason: 'Foreign key used in WHERE clauses frequently',
    priority: 'high',
    sql: 'CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(schoolId);'
  },

  // Composite indexes for common queries
  {
    table: 'attendance',
    column: 'schoolId, date',
    reason: 'Common query: attendance by school and date',
    priority: 'high',
    sql: 'CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(schoolId, date);'
  },
  {
    table: 'student_classes',
    column: 'schoolId, classId',
    reason: 'Common query: students in class',
    priority: 'medium',
    sql: 'CREATE INDEX IF NOT EXISTS idx_student_classes_school_class ON student_classes(schoolId, classId);'
  },

  // Text search indexes
  {
    table: 'students',
    column: 'firstName, lastName',
    reason: 'Name-based search queries',
    priority: 'medium',
    sql: 'CREATE INDEX IF NOT EXISTS idx_students_name ON students(firstName, lastName);'
  },

  // Date range queries
  {
    table: 'invoices',
    column: 'createdAt',
    reason: 'Date range queries for invoices',
    priority: 'medium',
    sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(createdAt);'
  },
  {
    table: 'user_invoices',
    column: 'dueDate',
    reason: 'Query overdue invoices',
    priority: 'high',
    sql: 'CREATE INDEX IF NOT EXISTS idx_user_invoices_due_date ON user_invoices(dueDate);'
  },

  // Status/enum filters
  {
    table: 'subscriptions',
    column: 'status',
    reason: 'Filter active subscriptions',
    priority: 'low',
    sql: 'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);'
  },
]

async function analyzeIndexes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  const spinner = ora('Analyzing database indexes...').start()

  try {
    // Get existing indexes
    const result = await pool.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY pg_relation_size(indexname::regclass) DESC;
    `)

    spinner.succeed(chalk.green(`Found ${result.rows.length} indexes`))

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('📊 Existing Indexes'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    result.rows.forEach(row => {
      console.log(chalk.white(`${row.indexname} (${row.size})`))
      console.log(chalk.gray(`  ${row.indexdef}\n`))
    })

  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'))
    console.error(error)
  } finally {
    await pool.end()
  }
}

async function suggestIndexes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  const spinner = ora('Checking for missing indexes...').start()

  try {
    // Check which suggestions are already applied
    const existingIndexes = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public';
    `)

    const existingNames = new Set(existingIndexes.rows.map(r => r.indexname))

    const missing = suggestions.filter(s => {
      const indexName = s.sql.match(/idx_\w+/)?.[0]
      return indexName && !existingNames.has(indexName)
    })

    spinner.succeed(chalk.green(`Found ${missing.length} missing indexes`))

    if (missing.length === 0) {
      console.log(chalk.green('\n✅ All recommended indexes are already created\n'))
      return
    }

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('💡 Index Recommendations'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Group by priority
    const high = missing.filter(s => s.priority === 'high')
    const medium = missing.filter(s => s.priority === 'medium')
    const low = missing.filter(s => s.priority === 'low')

    if (high.length > 0) {
      console.log(chalk.red('🔴 High Priority:\n'))
      high.forEach(s => {
        console.log(chalk.white(`  ${s.table}.${s.column}`))
        console.log(chalk.gray(`  Reason: ${s.reason}`))
        console.log(chalk.blue(`  ${s.sql}\n`))
      })
    }

    if (medium.length > 0) {
      console.log(chalk.yellow('🟡 Medium Priority:\n'))
      medium.forEach(s => {
        console.log(chalk.white(`  ${s.table}.${s.column}`))
        console.log(chalk.gray(`  Reason: ${s.reason}`))
        console.log(chalk.blue(`  ${s.sql}\n`))
      })
    }

    if (low.length > 0) {
      console.log(chalk.gray('⚪ Low Priority:\n'))
      low.forEach(s => {
        console.log(chalk.white(`  ${s.table}.${s.column}`))
        console.log(chalk.gray(`  Reason: ${s.reason}`))
        console.log(chalk.blue(`  ${s.sql}\n`))
      })
    }

    console.log(chalk.cyan('To apply these indexes:'))
    console.log(chalk.gray('  npx tsx scripts/db-indexes.ts --apply\n'))

  } catch (error) {
    spinner.fail(chalk.red('Suggestion failed'))
    console.error(error)
  } finally {
    await pool.end()
  }
}

async function applyIndexes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  const spinner = ora('Applying indexes...').start()

  try {
    let applied = 0

    for (const suggestion of suggestions) {
      try {
        spinner.text = `Creating ${suggestion.table}.${suggestion.column}...`
        await pool.query(suggestion.sql)
        applied++
      } catch (error) {
        // Index might already exist, continue
      }
    }

    spinner.succeed(chalk.green(`Applied ${applied} indexes`))

  } catch (error) {
    spinner.fail(chalk.red('Apply failed'))
    console.error(error)
  } finally {
    await pool.end()
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log(chalk.red('❌ DATABASE_URL not set'))
    process.exit(1)
  }

  if (options.analyze) {
    await analyzeIndexes()
  } else if (options.suggest) {
    await suggestIndexes()
  } else if (options.apply) {
    await applyIndexes()
  } else {
    console.log(chalk.yellow('Usage:'))
    console.log(chalk.gray('  --analyze  Show existing indexes'))
    console.log(chalk.gray('  --suggest  Show missing indexes'))
    console.log(chalk.gray('  --apply    Create suggested indexes\n'))
  }
}

main()
