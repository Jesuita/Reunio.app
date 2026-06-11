-- Public bucket for staff avatars and org logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read, authenticated users can upload/update/delete
CREATE POLICY "avatars_public_read"   ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_insert"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_auth_update"   ON storage.objects FOR UPDATE USING    (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_auth_delete"   ON storage.objects FOR DELETE USING    (bucket_id = 'avatars' AND auth.role() = 'authenticated');
