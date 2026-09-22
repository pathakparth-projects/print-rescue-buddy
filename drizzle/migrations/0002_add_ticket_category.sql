ALTER TABLE public.tickets
ADD COLUMN category text NOT NULL DEFAULT 'Hardware';

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_category_check
CHECK (category IN ('Hardware', 'Software', 'Access'));

UPDATE public.tickets
SET category = CASE
  WHEN lower(title || ' ' || description) ~ '(password|login|log in|account|permission|access|locked out|mfa|2fa|credential)' THEN 'Access'
  WHEN lower(title || ' ' || description) ~ '(software|app|application|browser|email|outlook|excel|word|windows|macos|update|install)' THEN 'Software'
  ELSE 'Hardware'
END;