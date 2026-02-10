-- ============================================
-- MIGRAÇÃO: SUPORTAR MÚLTIPLOS ÁUDIOS
-- ============================================

-- 1. Adicionar nova coluna para array de URLs
ALTER TABLE public.scribia_palestras 
ADD COLUMN IF NOT EXISTS audio_urls TEXT[];

-- 2. Migrar dados existentes de audio_url para audio_urls
UPDATE public.scribia_palestras
SET audio_urls = ARRAY[audio_url]
WHERE audio_url IS NOT NULL AND audio_urls IS NULL;

-- 3. Comentário explicativo
COMMENT ON COLUMN public.scribia_palestras.audio_urls IS 'Array de URLs de áudios que serão transcritos e consolidados em uma única transcrição';
