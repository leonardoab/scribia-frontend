const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://apnfbdkerddhkkzqstmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4'
);

async function fixForeignKey() {
  console.log('🔧 Corrigindo foreign key constraint...\n');

  try {
    // Primeiro, vamos verificar a estrutura atual da tabela
    console.log('1️⃣ Verificando estrutura atual...');
    
    const { data: roles, error: rolesError } = await supabase
      .from('scribia_user_roles')
      .select('*')
      .limit(1);
    
    if (rolesError) {
      console.log('❌ Erro ao acessar scribia_user_roles:', rolesError);
    } else {
      console.log('✅ Tabela scribia_user_roles acessível');
    }

    // Vamos tentar criar as funções SQL diretamente
    console.log('\n2️⃣ Criando função de cadastro...');
    
    // Como não podemos executar DDL via RPC, vamos criar uma função que simula o cadastro
    const signupSQL = `
      INSERT INTO public.scribia_usuarios (
        id, nome_completo, email, cpf, whatsapp, senha_hash, email_verificado, criado_em
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, crypt($5, gen_salt('bf')), true, now()
      ) RETURNING id, nome_completo, email, cpf, whatsapp, email_verificado, criado_em;
    `;

    console.log('📝 Para corrigir o sistema, você precisa executar no Supabase Dashboard:');
    console.log('');
    console.log('-- 1. Remover constraint antiga');
    console.log('ALTER TABLE public.scribia_user_roles DROP CONSTRAINT IF EXISTS scribia_user_roles_user_id_fkey;');
    console.log('');
    console.log('-- 2. Adicionar constraint correta');
    console.log('ALTER TABLE public.scribia_user_roles ADD CONSTRAINT scribia_user_roles_user_id_fkey');
    console.log('  FOREIGN KEY (user_id) REFERENCES public.scribia_usuarios(id) ON DELETE CASCADE;');
    console.log('');
    console.log('-- 3. Habilitar extensão pgcrypto');
    console.log('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    console.log('');
    console.log('Depois execute as funções do arquivo custom-auth-system-complete.sql');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixForeignKey();