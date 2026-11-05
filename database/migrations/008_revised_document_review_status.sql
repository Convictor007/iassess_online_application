-- Track citizen-resubmitted documents distinctly while assessors review them.
ALTER TABLE document_reviews
  DROP CONSTRAINT IF EXISTS document_reviews_status_check;

ALTER TABLE document_reviews
  ADD CONSTRAINT document_reviews_status_check
  CHECK (status IN ('pending', 'approved', 'needs_revision', 'rejected', 'revised'));
