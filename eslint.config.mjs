import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"
import eslintConfigPrettier from "eslint-config-prettier"

// Native flat config from eslint-config-next (Next 16). Replaces the previous
// FlatCompat wrapper, which crashed under ESLint 9 (`Converting circular
// structure to JSON ... property 'react' closes the circle`) — the eslintrc
// validator can't serialize eslint-plugin-react's self-referential config.
/**
 * Files allowed to create `Student` rows directly. Each entry is a deliberate
 * exception, not an oversight. Exported so the vitest backstop in
 * `src/tests/school-dashboard/listings/student-intake-invariant.test.ts` shares
 * exactly one list with the lint rule and the two cannot drift apart.
 */
export const STUDENT_CREATE_ALLOWLIST = [
  // THE core itself: the one place a Student row is supposed to be born.
  "src/lib/student-provisioning.ts",
  // Demo/tenant seeds mint their own shadow Applications inline (calling the
  // full 12-step core ~1000x would slow every deploy's prebuild).
  "prisma/seeds/**",
  // Replays an existing snapshot whose rows already carry Applications --
  // routing it through the core would double-provision.
  "src/lib/backup-service.ts",
  // Ops/migration scripts operate on already-provisioned rows.
  "scripts/**",
  "src/tests/**",
  // createDraftStudent: a wizard draft is deliberately Application-less until
  // completeStudentWizard runs provisionStudent. Drafts carry a non-null
  // `wizardStep`, which is what exempts them from the invariant.
  "src/components/school-dashboard/listings/students/wizard/actions.ts",
]

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      // Every student must be born from an Application, tagged with the
      // AdmissionChannel it came through -- see content/docs-en/admission.mdx
      // ("Student intake -- four channels, one pipeline"). That invariant is
      // only maintained by `provisionStudent`, which mints (or reuses) the
      // Application and links it. Downstream code already relies on it:
      // `deriveIsSelfOnboarded` in listings/students/actions.ts reads
      // `student.application.channel`, and reads `undefined` for any student
      // created behind the core's back.
      //
      // Matches `<anything>.student.create/upsert/createMany(...)`, so it
      // catches `db.`, `tx.` and `prisma.` receivers alike.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.property.name='student'][callee.property.name=/^(create|upsert|createMany)$/]",
          message:
            "Do not create Student rows directly -- call provisionStudent() from @/lib/student-provisioning so the student gets an Application, a student code, a login and fee assignments. If this is a genuine exception (seed, ops script, snapshot replay), add the file to the allowlist in eslint.config.mjs and say why.",
        },
      ],
    },
  },
  {
    files: STUDENT_CREATE_ALLOWLIST,
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  eslintConfigPrettier, // Must be last to disable conflicting rules
]

export default eslintConfig
