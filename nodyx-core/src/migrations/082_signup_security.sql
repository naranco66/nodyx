-- Migration 082 : seed initial de la blocklist email domains
--
-- L'infrastructure existait déjà :
--   - users.registration_ip est loggé depuis longtemps (auth.ts ligne 180)
--   - email_bans est la blocklist : la query du /register fait à la fois un
--     match exact ('toto@gmail.com') et un match domain
--     (split_part(email, '@', 2) → 'gmail.com'). Donc insérer juste un
--     domain dans email_bans suffit à bloquer tous les emails sur ce domain.
--
-- Cette migration ne fait QUE le seed : on ajoute à email_bans les domains
-- de mailers jetables les plus utilisés en 2026 + le domain qu'on vient
-- d'observer en pratique (immenseignite.info) sur 3 signups bots.

INSERT INTO email_bans (email, reason) VALUES
  ('immenseignite.info', 'Mailer jetable - observé sur 3 signups bots 2026-05-15'),
  ('mailinator.com',     'Mailer jetable public'),
  ('tempmail.com',       'Mailer jetable public'),
  ('temp-mail.org',      'Mailer jetable public'),
  ('10minutemail.com',   'Mailer jetable public'),
  ('guerrillamail.com',  'Mailer jetable public'),
  ('throwawaymail.com',  'Mailer jetable public'),
  ('yopmail.com',        'Mailer jetable public'),
  ('trashmail.com',      'Mailer jetable public'),
  ('dispostable.com',    'Mailer jetable public'),
  ('mintemail.com',      'Mailer jetable public'),
  ('maildrop.cc',        'Mailer jetable public'),
  ('getairmail.com',     'Mailer jetable public'),
  ('emailondeck.com',    'Mailer jetable public'),
  ('moakt.com',          'Mailer jetable public'),
  ('mohmal.com',         'Mailer jetable public'),
  ('inboxalias.com',     'Mailer jetable public'),
  ('mytemp.email',       'Mailer jetable public')
ON CONFLICT (email) DO NOTHING;
