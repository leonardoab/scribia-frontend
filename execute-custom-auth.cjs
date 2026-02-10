const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://apnfbdkerddhkkzqstmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4'
);

async function testCustomAuthSystem() {
  console.log('🔧 Testando sistema de autenticação customizado...\n');

  try {
    // 1. Testar função de cadastro
    console.log('1️⃣ Testando cadastro...');
    const signupResult = await supabase.rpc('scribia_signup', {
      p_nome_completo: 'Teste Usuario',
      p_email: 'teste@exemplo.com',
      p_senha: '123456',
      p_cpf: '12345678901',
      p_whatsapp: '11999999999'
    });

    if (signupResult.error) {
      console.log('❌ Erro no cadastro:', signupResult.error);
    } else {
      console.log('✅ Cadastro realizado:', signupResult.data);
    }

    // 2. Testar função de login
    console.log('\n2️⃣ Testando login...');
    const loginResult = await supabase.rpc('scribia_login', {
      p_email: 'teste@exemplo.com',
      p_senha: '123456'
    });

    if (loginResult.error) {
      console.log('❌ Erro no login:', loginResult.error);
    } else {
      console.log('✅ Login realizado:', loginResult.data);
      
      // 3. Testar função de buscar usuário
      if (loginResult.data.success && loginResult.data.user) {
        console.log('\n3️⃣ Testando busca de usuário...');
        const getUserResult = await supabase.rpc('scribia_get_user', {
          p_user_id: loginResult.data.user.id
        });

        if (getUserResult.error) {
          console.log('❌ Erro ao buscar usuário:', getUserResult.error);
        } else {
          console.log('✅ Usuário encontrado:', getUserResult.data);
        }

        // 4. Testar função de verificar admin
        console.log('\n4️⃣ Testando verificação de admin...');
        const isAdminResult = await supabase.rpc('scribia_is_admin', {
          p_user_id: loginResult.data.user.id
        });

        if (isAdminResult.error) {
          console.log('❌ Erro ao verificar admin:', isAdminResult.error);
        } else {
          console.log('✅ É admin?', isAdminResult.data);
        }

        // 5. Testar atribuição de admin
        console.log('\n5️⃣ Testando atribuição de admin...');
        const assignAdminResult = await supabase.rpc('scribia_assign_admin_role', {
          p_user_email: 'teste@exemplo.com'
        });

        if (assignAdminResult.error) {
          console.log('❌ Erro ao atribuir admin:', assignAdminResult.error);
        } else {
          console.log('✅ Admin atribuído:', assignAdminResult.data);
        }

        // 6. Verificar novamente se é admin
        console.log('\n6️⃣ Verificando admin novamente...');
        const isAdminResult2 = await supabase.rpc('scribia_is_admin', {
          p_user_id: loginResult.data.user.id
        });

        if (isAdminResult2.error) {
          console.log('❌ Erro ao verificar admin:', isAdminResult2.error);
        } else {
          console.log('✅ É admin agora?', isAdminResult2.data);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  console.log('\n🎉 Teste concluído!');
}

testCustomAuthSystem();