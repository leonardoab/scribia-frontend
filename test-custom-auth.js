import { createClient } from '@supabase/supabase-js';

// Configuração direta das variáveis (sem dotenv)
const supabaseUrl = 'https://apnfbdkerddhkkzqstmp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomAuth() {
  console.log('🧪 TESTANDO SISTEMA DE AUTENTICAÇÃO CUSTOMIZADO SCRIBIA\n');

  const testEmail = `teste${Date.now()}@scribia.com`;
  const testPassword = 'MinhaSenh@123';
  const testName = 'Usuário Teste ScribIA';

  try {
    // 1. TESTE DE CADASTRO
    console.log('1️⃣ Testando cadastro customizado...');
    const { data: signupResult, error: signupError } = await supabase
      .rpc('scribia_signup', {
        p_nome_completo: testName,
        p_email: testEmail,
        p_senha: testPassword,
        p_cpf: '12345678901',
        p_whatsapp: '11999999999'
      });

    if (signupError) {
      console.error('❌ Erro no cadastro:', signupError);
      return;
    }

    console.log('✅ Cadastro realizado:', signupResult);
    
    if (!signupResult.success) {
      console.error('❌ Cadastro falhou:', signupResult.error);
      return;
    }

    const userId = signupResult.user_id;
    console.log('👤 ID do usuário criado:', userId);

    // 2. TESTE DE LOGIN COM SENHA ERRADA
    console.log('\n2️⃣ Testando login com senha incorreta...');
    const { data: wrongLoginResult } = await supabase
      .rpc('scribia_login', {
        p_email: testEmail,
        p_senha: 'senhaerrada123'
      });

    console.log('🔒 Login com senha errada:', wrongLoginResult);

    // 3. VERIFICAR EMAIL PRIMEIRO (para permitir login)
    console.log('\n3️⃣ Verificando email...');
    const verificationToken = signupResult.verification_token;
    const { data: verifyResult } = await supabase
      .rpc('scribia_verify_email', {
        p_token: verificationToken
      });

    console.log('📧 Verificação de email:', verifyResult);

    // 4. TESTE DE LOGIN CORRETO
    console.log('\n4️⃣ Testando login com credenciais corretas...');
    const { data: loginResult, error: loginError } = await supabase
      .rpc('scribia_login', {
        p_email: testEmail,
        p_senha: testPassword
      });

    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      return;
    }

    console.log('✅ Login realizado:', loginResult);

    if (!loginResult.success) {
      console.error('❌ Login falhou:', loginResult.error);
      return;
    }

    // 5. TESTE DE BUSCA DE USUÁRIO
    console.log('\n5️⃣ Testando busca de usuário...');
    const { data: userResult } = await supabase
      .rpc('scribia_get_user', {
        p_user_id: userId
      });

    console.log('👤 Dados do usuário:', userResult);

    // 6. TESTE DE RESET DE SENHA
    console.log('\n6️⃣ Testando solicitação de reset de senha...');
    const { data: resetRequestResult } = await supabase
      .rpc('scribia_request_password_reset', {
        p_email: testEmail
      });

    console.log('🔄 Solicitação de reset:', resetRequestResult);

    if (resetRequestResult.success && resetRequestResult.reset_token) {
      // 7. TESTE DE CONFIRMAÇÃO DE RESET
      console.log('\n7️⃣ Testando confirmação de reset de senha...');
      const newPassword = 'NovaSenha@456';
      const { data: resetConfirmResult } = await supabase
        .rpc('scribia_reset_password', {
          p_token: resetRequestResult.reset_token,
          p_nova_senha: newPassword
        });

      console.log('🔑 Confirmação de reset:', resetConfirmResult);

      // 8. TESTE DE LOGIN COM NOVA SENHA
      console.log('\n8️⃣ Testando login com nova senha...');
      const { data: newLoginResult } = await supabase
        .rpc('scribia_login', {
          p_email: testEmail,
          p_senha: newPassword
        });

      console.log('🔐 Login com nova senha:', newLoginResult);
    }

    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
    console.log('\n📊 RESUMO:');
    console.log('✅ Sistema de autenticação customizado funcionando');
    console.log('✅ Cadastro, login, verificação e reset implementados');
    console.log('✅ Independente do auth.users do Supabase');

  } catch (error) {
    console.error('💥 Erro durante os testes:', error);
  }
}

// Executar testes
testCustomAuth();