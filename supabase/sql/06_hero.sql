-- hero banner content (editable from admin settings)
insert into public.settings (key, value) values
  ('hero_badge', 'عرض محدود 🔥'),
  ('hero_title', 'خصومات حتى 20% على كل الأقسام'),
  ('hero_subtitle', 'شحن ببجي، فري فاير، تطبيقات التواصل والبطاقات — بأسعار الجملة والدفع عبر شام كاش'),
  ('hero_btn', 'تصفح العروض'),
  ('hero_link', '/categories')
on conflict (key) do nothing;
