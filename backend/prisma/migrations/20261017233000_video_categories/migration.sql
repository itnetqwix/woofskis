-- Video categories reuse the contest Category catalog.
-- isActive defaults to true so existing rows stay selectable.
-- otherCategoryLabel stores the creator free-text for Other.
-- categoryId stays null for Other and for submissions created before this column.
-- ON DELETE RESTRICT blocks removing a category that a submission still references.
-- Contest category links stay ON DELETE SET NULL; the service refuses that delete
-- while any contest or submission still points at the category.

ALTER TABLE "categories" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "categories" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "categories_name_lower_key" ON "categories" (lower(btrim("name")));

ALTER TABLE "submissions" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "submissions" ADD COLUMN "otherCategoryLabel" TEXT;

CREATE INDEX "submissions_categoryId_idx" ON "submissions"("categoryId");

ALTER TABLE "submissions"
ADD CONSTRAINT "submissions_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
