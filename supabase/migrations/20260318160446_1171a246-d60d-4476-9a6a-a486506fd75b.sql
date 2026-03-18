DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::app_role
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'ahmad.alhaffar@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;