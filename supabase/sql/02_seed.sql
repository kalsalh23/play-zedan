-- MOBILY BRO+ seed settings
insert into public.settings (key, value) values
  ('store_name', 'MOBILY BRO+'),
  ('store_tagline', 'بإدارة أيمن زيدان'),
  ('usd_rate', '15000'),
  ('markup_percent', '12'),
  ('shamcash_number', ''),
  ('shamcash_name', 'أيمن زيدان'),
  ('mc_username', ''),
  ('mc_password', ''),
  ('mc_purchase_password', ''),
  ('mc_demo', 'true'),
  ('install_banner', 'true'),
  ('admin_password_hash', encode(digest('zedan-admin-2026', 'sha256'), 'hex'))
on conflict (key) do nothing;
