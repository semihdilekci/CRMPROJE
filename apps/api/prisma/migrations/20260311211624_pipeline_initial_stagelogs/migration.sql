-- Data migration: Mevcut tüm Opportunity kayıtları için initial StageLog oluştur.
-- Her fırsat için stage='tanisma', changedById=fuar oluşturan kullanıcı.
-- gen_random_uuid() PostgreSQL 13+ built-in (pgcrypto gerekmez).

INSERT INTO "OpportunityStageLog" (id, stage, note, "lossReason", "createdAt", "opportunityId", "changedById")
SELECT
  gen_random_uuid()::text,
  'tanisma',
  NULL,
  NULL,
  o."createdAt",
  o.id,
  f."createdById"
FROM "Opportunity" o
JOIN "Fair" f ON f.id = o."fairId"
WHERE NOT EXISTS (
  SELECT 1 FROM "OpportunityStageLog" sl WHERE sl."opportunityId" = o.id
);
