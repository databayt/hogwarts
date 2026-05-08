-- Add per-school transportation settings + service-account API tokens (Phase 4)

-- CreateTable
CREATE TABLE "transportation_settings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "defaultPickupBufferMinutes" INTEGER NOT NULL DEFAULT 10,
    "defaultMonthlyFee" DECIMAL(10,2),
    "notifyGuardiansOnTripStart" BOOLEAN NOT NULL DEFAULT true,
    "notifyGuardiansOnTripFinish" BOOLEAN NOT NULL DEFAULT true,
    "notifyGuardiansOnTripCancel" BOOLEAN NOT NULL DEFAULT true,
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 15,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transportation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transportation_settings_schoolId_key" ON "transportation_settings"("schoolId");

-- AddForeignKey
ALTER TABLE "transportation_settings" ADD CONSTRAINT "transportation_settings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "school_api_tokens" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "school_api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_api_tokens_tokenHash_key" ON "school_api_tokens"("tokenHash");
CREATE INDEX "school_api_tokens_schoolId_deletedAt_idx" ON "school_api_tokens"("schoolId", "deletedAt");
CREATE INDEX "school_api_tokens_tokenPrefix_idx" ON "school_api_tokens"("tokenPrefix");

-- AddForeignKey
ALTER TABLE "school_api_tokens" ADD CONSTRAINT "school_api_tokens_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
