-- Add the denormalized hierarchy depth as nullable while existing rows are backfilled.
ALTER TABLE "tasks" ADD COLUMN "depth" INTEGER;

-- Derive one-based depths from the existing parent links so nested data remains correct.
WITH RECURSIVE "task_hierarchy" AS (
    SELECT "id", 1 AS "calculated_depth"
    FROM "tasks"
    WHERE "parent_task_id" IS NULL

    UNION ALL

    SELECT "child"."id", "parent"."calculated_depth" + 1
    FROM "tasks" AS "child"
    INNER JOIN "task_hierarchy" AS "parent"
        ON "child"."parent_task_id" = "parent"."id"
)
UPDATE "tasks"
SET "depth" = "task_hierarchy"."calculated_depth"
FROM "task_hierarchy"
WHERE "tasks"."id" = "task_hierarchy"."id";

ALTER TABLE "tasks" ALTER COLUMN "depth" SET DEFAULT 1;
ALTER TABLE "tasks" ALTER COLUMN "depth" SET NOT NULL;
