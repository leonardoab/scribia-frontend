// Teste simples sem dependências externas
const { createClient } = require('@supabase/supabase-js');

// Usar as mesmas variáveis que estão no .env
const supabaseUrl = 'https://ixqjqfqjqfqjqfqjqfqj.supabase.co'; // Substitua pela sua URL
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'; // Substitua pela sua chave

// Vamos usar as variáveis do processo se disponíveis
const url = process.env.VITE_SUPABASE_URL || supabaseUrl;
const key = process.env.VITE_SUPABASE_ANON_KEY || supabaseKey;

console.log('🔧 Testando cadastro (versão simples)...\n');
console.log('URL:', url ? 'Configurada' : 'Não configurada');
console.log('Key:', key ? 'Configurada' : 'Não configurada');

if (!url || !key) {
  console.error('❌ Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testSimpleSignup() {
  try {
    console.log('\n1. Testando conexão...');
    const { error: connectionError } = await supabase.from('scribia_usuarios').select('count').limit(1);
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError.message);
      return;
    }
    console.log('✅ Conexão OK');

    console.log('\n2. Cadastrando usuário...');
    const testEmail = `teste.simples.${Date.now()}@gmail.com`;
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: '123456',
      options: {
        data: {
          nome_completo: 'Usuário Teste Simples',
          cpf: '123.456.789-00',
          whatsapp: '(11) 99999-9999'
        }
      }
    });

    if (signupError) {
      console.error('❌ Erro no cadastro:', signupError.message);
      return;
    }

    console.log('✅ Usuário cadastrado:', signupData.user?.id);

    // Aguardar trigger
    console.log('\n3. Aguardando trigger (5 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verificar se foi salvo
    console.log('\n4. Verificando se foi salvo...');
    const { data: userData, error: userError } = await supabase
      .from('scribia_usuarios')
      .select('*')
      .eq('id', signupData.user?.id);

    if (userError) {
      console.error('❌ Erro ao verificar:', userError.message);
    } else if (userData && userData.length > 0) {
      console.log('✅ SUCESSO! Usuário encontrado:');
      console.log('   - Nome:', userData[0].nome_completo);
      console.log('   - Email:', userData[0].email);
      console.log('   - CPF:', userData[0].cpf);
    } else {
      console.log('❌ Usuário NÃO encontrado na tabela');
      console.log('   Isso confirma que o trigger não está funcionando');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSimpleSignup();