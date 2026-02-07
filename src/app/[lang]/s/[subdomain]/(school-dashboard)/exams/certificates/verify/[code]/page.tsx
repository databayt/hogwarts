/**
 * Certificate Verification Page
 * Public-facing page to verify certificate authenticity
 */

import { verifyCertificate } from "@/components/school-dashboard/exams/certificates/actions"

interface VerifyPageProps {
  params: Promise<{
    code: string
  }>
}

export default async function CertificateVerifyPage({
  params,
}: VerifyPageProps) {
  const { code } = await params
  const result = await verifyCertificate({ code })

  if (!result.success) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="bg-destructive/10 rounded-full p-4">
          <svg
            className="text-destructive h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Certificate Not Found</h2>
        <p className="text-muted-foreground max-w-md text-center text-sm">
          The verification code is invalid or the certificate has been revoked.
        </p>
      </div>
    )
  }

  const cert = result.data!

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-green-100 p-4">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Certificate Verified</h2>
        <p className="text-muted-foreground text-sm">
          This certificate is authentic and currently {cert.status}.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-muted-foreground text-sm">Recipient</dt>
            <dd className="text-lg font-medium">{cert.recipientName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Exam</dt>
            <dd className="font-medium">{cert.examTitle}</dd>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-muted-foreground text-sm">Score</dt>
              <dd className="font-medium">{cert.score.toFixed(1)}%</dd>
            </div>
            {cert.grade && (
              <div>
                <dt className="text-muted-foreground text-sm">Grade</dt>
                <dd className="font-medium">{cert.grade}</dd>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-muted-foreground text-sm">Exam Date</dt>
              <dd className="font-medium">
                {new Date(cert.examDate).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Issued</dt>
              <dd className="font-medium">
                {new Date(cert.issuedAt).toLocaleDateString()}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">School</dt>
            <dd className="font-medium">{cert.schoolName}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
