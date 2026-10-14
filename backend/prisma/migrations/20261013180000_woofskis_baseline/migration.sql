-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CREATOR');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CreatorActivityAction" AS ENUM ('REGISTERED', 'LOGGED_IN', 'SUBMISSION_UPLOADED', 'SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'SUBMISSION_FLAGGED', 'SUBMISSION_DELETED', 'BLOCKED', 'UNBLOCKED', 'WARNED');

-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('APPROVE', 'REJECT', 'FLAG', 'ISSUE_WARNING', 'SUSPEND_CREATOR');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "ChatAttachmentKind" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CREATOR',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatarObjectKey" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contests" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tagline" TEXT,
    "bannerUrl" TEXT,
    "bannerObjectKey" TEXT,
    "thumbnailUrl" TEXT,
    "status" "ContestStatus" NOT NULL DEFAULT 'DRAFT',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "votingClosesAt" TIMESTAMP(3),
    "prizeSummary" TEXT,
    "rules" JSONB,
    "autoAdvanceDelayMs" INTEGER NOT NULL DEFAULT 1800,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationSeconds" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejectionReason" TEXT,
    "moderatedById" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "tags" TEXT[],
    "communityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT,
    "voterFingerprint" TEXT,
    "voterIpHash" TEXT,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_warnings" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_activity_logs" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "action" "CreatorActivityAction" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "relatedSubmissionId" TEXT,
    "relatedContestId" TEXT,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "userLowId" TEXT NOT NULL,
    "userHighId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "friendshipId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT,
    "attachmentKey" TEXT,
    "attachmentKind" "ChatAttachmentKind",
    "attachmentMime" TEXT,
    "attachmentBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_reads" (
    "friendshipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_reads_pkey" PRIMARY KEY ("friendshipId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_accountStatus_idx" ON "users"("role", "accountStatus");

-- CreateIndex
CREATE INDEX "users_role_createdAt_idx" ON "users"("role", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "contests_status_idx" ON "contests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_objectKey_key" ON "submissions"("objectKey");

-- CreateIndex
CREATE INDEX "submissions_contestId_status_idx" ON "submissions"("contestId", "status");

-- CreateIndex
CREATE INDEX "submissions_creatorId_idx" ON "submissions"("creatorId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_submissionId_idx" ON "audit_logs"("submissionId");

-- CreateIndex
CREATE INDEX "ratings_submissionId_idx" ON "ratings"("submissionId");

-- CreateIndex
CREATE INDEX "ratings_voterFingerprint_submissionId_idx" ON "ratings"("voterFingerprint", "submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_submissionId_voterIpHash_key" ON "ratings"("submissionId", "voterIpHash");

-- CreateIndex
CREATE INDEX "comments_submissionId_createdAt_idx" ON "comments"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "creator_warnings_creatorId_createdAt_idx" ON "creator_warnings"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "creator_activity_logs_creatorId_createdAt_idx" ON "creator_activity_logs"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "creator_activity_logs_relatedContestId_idx" ON "creator_activity_logs"("relatedContestId");

-- CreateIndex
CREATE INDEX "creator_activity_logs_relatedSubmissionId_idx" ON "creator_activity_logs"("relatedSubmissionId");

-- CreateIndex
CREATE INDEX "friendships_userLowId_status_idx" ON "friendships"("userLowId", "status");

-- CreateIndex
CREATE INDEX "friendships_userHighId_status_idx" ON "friendships"("userHighId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_userLowId_userHighId_key" ON "friendships"("userLowId", "userHighId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_attachmentKey_key" ON "chat_messages"("attachmentKey");

-- CreateIndex
CREATE INDEX "chat_messages_friendshipId_createdAt_idx" ON "chat_messages"("friendshipId", "createdAt");

-- AddForeignKey
ALTER TABLE "contests" ADD CONSTRAINT "contests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_warnings" ADD CONSTRAINT "creator_warnings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_warnings" ADD CONSTRAINT "creator_warnings_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_activity_logs" ADD CONSTRAINT "creator_activity_logs_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_activity_logs" ADD CONSTRAINT "creator_activity_logs_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_userLowId_fkey" FOREIGN KEY ("userLowId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_userHighId_fkey" FOREIGN KEY ("userHighId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_friendshipId_fkey" FOREIGN KEY ("friendshipId") REFERENCES "friendships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_friendshipId_fkey" FOREIGN KEY ("friendshipId") REFERENCES "friendships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ====================================================================
-- Custom Domain Constraints and Triggers (Preserved from M06/M08/Chat)
-- ====================================================================

-- Friendship ordered pair check
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_ordered_pair_check" CHECK ("userLowId" < "userHighId");

-- Requester membership check
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_member_check" CHECK ("requesterId" = "userLowId" OR "requesterId" = "userHighId");

-- Chat message body check (char_length <= 2000)
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_body_check" CHECK (
    "body" IS NULL OR char_length("body") <= 2000
);

-- Chat message content check (body or attachment must be present)
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_content_check" CHECK (
    ("body" IS NOT NULL AND char_length(btrim("body")) > 0)
    OR "attachmentKey" IS NOT NULL
);

-- Chat message attachment metadata integrity check
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_attachment_check" CHECK (
    (
        "attachmentKey" IS NULL
        AND "attachmentKind" IS NULL
        AND "attachmentMime" IS NULL
        AND "attachmentBytes" IS NULL
    )
    OR (
        "attachmentKey" IS NOT NULL
        AND "attachmentKind" IS NOT NULL
        AND "attachmentMime" IS NOT NULL
        AND "attachmentBytes" IS NOT NULL
        AND "attachmentBytes" > 0
        AND "attachmentBytes" <= 104857600
        AND "attachmentKey" ~ '^chat/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|gif|mp4|webm|mov)$'
    )
);

-- Chat participant guard trigger function
CREATE OR REPLACE FUNCTION "chat_participant_guard"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    actor text;
    friendship_id text;
BEGIN
    friendship_id := NEW."friendshipId";
    IF TG_TABLE_NAME = 'chat_messages' THEN
        actor := NEW."senderId";
    ELSE
        actor := NEW."userId";
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "friendships" f
        WHERE f."id" = friendship_id
          AND f."status" = 'ACCEPTED'
          AND (f."userLowId" = actor OR f."userHighId" = actor)
    ) THEN
        RAISE EXCEPTION 'chat participant is not an accepted friend';
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger on chat_messages
CREATE TRIGGER "chat_messages_participant"
BEFORE INSERT OR UPDATE ON "chat_messages"
FOR EACH ROW EXECUTE FUNCTION "chat_participant_guard"();

-- Trigger on chat_reads
CREATE TRIGGER "chat_reads_participant"
BEFORE INSERT OR UPDATE ON "chat_reads"
FOR EACH ROW EXECUTE FUNCTION "chat_participant_guard"();
