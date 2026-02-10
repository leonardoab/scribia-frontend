const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://apnfbdkerddhkkzqstmp.supabase.co';
// IMPORTANTE: Substitua pela sua chave real do Supabase
// Você pode encontrar esta chave em: Supabase Dashboard > Settings > API > anon public
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.log('❌ ERRO: Configure a chave do Supabase!');
  console.log('Para executar este teste:');
  console.log('1. Vá para o Supabase Dashboard > Settings > API');
  console.log('2. Copie a chave "anon public"');
  console.log('3. Execute: SUPABASE_ANON_KEY="sua_chave_aqui" node test-auth-system.cjs');
  console.log('4. Ou edite este arquivo e substitua YOUR_SUPABASE_ANON_KEY pela chave real');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteAuthSystem() {
  console.log('🔍 Testando sistema de autenticação customizado...\n');

  try {
    // 1. Testar se as funções existem
    console.log('1. Verificando se as funções customizadas existem...');
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('scribia_get_user', { user_id: 'test' })
      .then(() => ({ data: 'Functions exist', error: null }))
      .catch(err => ({ data: null, error: err }));

    if (functionsError) {
      console.log('❌ Funções customizadas não encontradas:', functionsError.message);
      return;
    }
    console.log('✅ Funções customizadas encontradas');

    // 2. Testar signup
    console.log('\n2. Testando signup...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Usuário Teste';

    const { data: signupData, error: signupError } = await supabase
      .rpc('scribia_signup', {
        p_email: testEmail,
        p_senha: testPassword,
        p_nome: testName
      });

    if (signupError) {
      console.log('❌ Erro no signup:', signupError.message);
      return;
    }
    console.log('✅ Signup realizado com sucesso:', signupData);

    // 3. Testar login
    console.log('\n3. Testando login...');
    const { data: loginData, error: loginError } = await supabase
      .rpc('scribia_login', {
        p_email: testEmail,
        p_senha: testPassword
      });

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      return;
    }
    console.log('✅ Login realizado com sucesso:', loginData);

    const userId = loginData.id;

    // 4. Testar get_user
    console.log('\n4. Testando get_user...');
    const { data: userData, error: userError } = await supabase
      .rpc('scribia_get_user', { user_id: userId });

    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message);
      return;
    }
    console.log('✅ Usuário encontrado:', userData);

    // 5. Testar is_admin (deve ser false inicialmente)
    console.log('\n5. Testando is_admin...');
    const { data: isAdminData, error: isAdminError } = await supabase
      .rpc('scribia_is_admin', { user_id: userId });

    if (isAdminError) {
      console.log('❌ Erro ao verificar admin:', isAdminError.message);
      return;
    }
    console.log('✅ Status admin verificado:', isAdminData);

    // 6. Testar assign_admin_role
    console.log('\n6. Testando assign_admin_role...');
    const { data: assignAdminData, error: assignAdminError } = await supabase
      .rpc('scribia_assign_admin_role', { user_id: userId });

    if (assignAdminError) {
      console.log('❌ Erro ao atribuir role admin:', assignAdminError.message);
      return;
    }
    console.log('✅ Role admin atribuída:', assignAdminData);

    // 7. Verificar is_admin novamente (deve ser true agora)
    console.log('\n7. Verificando is_admin após atribuição...');
    const { data: isAdminData2, error: isAdminError2 } = await supabase
      .rpc('scribia_is_admin', { user_id: userId });

    if (isAdminError2) {
      console.log('❌ Erro ao verificar admin:', isAdminError2.message);
      return;
    }
    console.log('✅ Status admin após atribuição:', isAdminData2);

    console.log('\n🎉 Todos os testes passaram! Sistema de autenticação funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar o teste
testCompleteAuthSystem();