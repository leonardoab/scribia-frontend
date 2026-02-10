const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://apnfbdkerddhkkzqstmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4'
);

async function createFunctions() {
  console.log('🔧 Criando funções do sistema de autenticação...\n');

  // 1. Primeiro, vamos adicionar os campos necessários à tabela scribia_usuarios
  console.log('1️⃣ Adicionando campos à tabela scribia_usuarios...');
  
  try {
    // Verificar se os campos já existem
    const { data: usuarios } = await supabase
      .from('scribia_usuarios')
      .select('*')
      .limit(1);
    
    if (usuarios && usuarios.length > 0) {
      const user = usuarios[0];
      console.log('Campos existentes:', Object.keys(user));
      
      // Verificar se senha_hash existe
      if (!user.hasOwnProperty('senha_hash')) {
        console.log('❌ Campo senha_hash não existe. Precisa ser adicionado via SQL.');
      } else {
        console.log('✅ Campo senha_hash já existe.');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar campos:', error);
  }

  // 2. Verificar se a extensão pgcrypto está habilitada
  console.log('\n2️⃣ Verificando extensão pgcrypto...');
  
  // 3. Criar um usuário de teste para verificar se o sistema funciona
  console.log('\n3️⃣ Testando inserção manual de usuário...');
  
  try {
    // Primeiro, vamos tentar inserir um usuário manualmente
    const testUser = {
      id: crypto.randomUUID(),
      nome_completo: 'Teste Usuario Manual',
      email: 'teste-manual@exemplo.com',
      cpf: '12345678901',
      whatsapp: '11999999999',
      email_verificado: true,
      criado_em: new Date().toISOString()
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('scribia_usuarios')
      .insert([testUser])
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir usuário:', insertError);
    } else {
      console.log('✅ Usuário inserido com sucesso:', insertResult);
      
      // Tentar criar role para este usuário
      console.log('\n4️⃣ Criando role para o usuário...');
      
      const { data: roleResult, error: roleError } = await supabase
        .from('scribia_user_roles')
        .insert([{
          user_id: testUser.id,
          role: 'user'
        }])
        .select();

      if (roleError) {
        console.log('❌ Erro ao criar role:', roleError);
      } else {
        console.log('✅ Role criada com sucesso:', roleResult);
      }

      // Tentar criar assinatura para este usuário
      console.log('\n5️⃣ Criando assinatura para o usuário...');
      
      const { data: subResult, error: subError } = await supabase
        .from('scribia_assinaturas')
        .insert([{
          usuario_id: testUser.id,
          plano: 'free',
          status: 'ativo'
        }])
        .select();

      if (subError) {
        console.log('❌ Erro ao criar assinatura:', subError);
      } else {
        console.log('✅ Assinatura criada com sucesso:', subResult);
      }
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  console.log('\n🎉 Teste de criação manual concluído!');
  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('1. As funções SQL precisam ser criadas via Supabase Dashboard');
  console.log('2. Acesse: https://supabase.com/dashboard/project/apnfbdkerddhkkzqstmp/sql');
  console.log('3. Execute o conteúdo do arquivo custom-auth-system-complete.sql');
  console.log('4. Depois execute este script novamente para testar');
}

createFunctions();