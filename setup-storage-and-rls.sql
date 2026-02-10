-- ===========================
-- PASSO 2 e 3: Storage + RLS Security
-- ===========================

-- 1. Criar bucket de áudio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-palestras',
  'audio-palestras',
  false,
  524288000, -- 500MB
  ARRAY['audio/*', 'video/*']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Storage
CREATE POLICY "Users can upload own audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-palestras'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read own audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio-palestras'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio-palestras'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Corrigir RLS em todas as tabelas
-- EVENTOS
DROP POLICY IF EXISTS "Enable all for eventos" ON scribia_eventos;
DROP POLICY IF EXISTS "Enable read access for all users" ON scribia_eventos;

CREATE POLICY "eventos_select_own" ON scribia_eventos
  FOR SELECT USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "eventos_insert_own" ON scribia_eventos
  FOR INSERT WITH CHECK (usuario_id::text = auth.uid()::text);

CREATE POLICY "eventos_update_own" ON scribia_eventos
  FOR UPDATE USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "eventos_delete_own" ON scribia_eventos
  FOR DELETE USING (usuario_id::text = auth.uid()::text);

-- PALESTRAS
DROP POLICY IF EXISTS "Enable all for palestras" ON scribia_palestras;

CREATE POLICY "palestras_select_own" ON scribia_palestras
  FOR SELECT USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "palestras_insert_own" ON scribia_palestras
  FOR INSERT WITH CHECK (usuario_id::text = auth.uid()::text);

CREATE POLICY "palestras_update_own" ON scribia_palestras
  FOR UPDATE USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "palestras_delete_own" ON scribia_palestras
  FOR DELETE USING (usuario_id::text = auth.uid()::text);

-- LIVEBOOKS
DROP POLICY IF EXISTS "Enable all for livebooks" ON scribia_livebooks;

CREATE POLICY "livebooks_select_own" ON scribia_livebooks
  FOR SELECT USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "livebooks_insert_own" ON scribia_livebooks
  FOR INSERT WITH CHECK (usuario_id::text = auth.uid()::text);

CREATE POLICY "livebooks_update_own" ON scribia_livebooks
  FOR UPDATE USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "livebooks_delete_own" ON scribia_livebooks
  FOR DELETE USING (usuario_id::text = auth.uid()::text);

-- USUARIOS
DROP POLICY IF EXISTS "Enable read access for all users" ON scribia_usuarios;
DROP POLICY IF EXISTS "Enable update for all users" ON scribia_usuarios;

CREATE POLICY "users_select_own" ON scribia_usuarios
  FOR SELECT USING (id::text = auth.uid()::text);

CREATE POLICY "users_update_own" ON scribia_usuarios
  FOR UPDATE USING (id::text = auth.uid()::text);
