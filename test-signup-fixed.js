import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupAfterFix() {
  console.log('🔧 Testando cadastro após correção...\n');

  try {
    // 1. Testar conexão
    console.log('1. Testando conexão...');
    const { data: testConnection } = await supabase.from('scribia_usuarios').select('count').limit(1);
    console.log('✅ Conexão OK\n');

    // 2. Cadastrar usuário de teste
    console.log('2. Cadastrando usuário...');
    const testEmail = `teste.corrigido.${Date.now()}@gmail.com`;
    const testData = {
      email: testEmail,
      password: '123456',
      options: {
        data: {
          nome_completo: 'Usuário Teste Corrigido',
          cpf: '123.456.789-00',
          whatsapp: '(11) 99999-9999'
        }
      }
    };

    console.log('📝 Dados:', testData);

    const { data: signupData, error: signupError } = await supabase.auth.signUp(testData);

    if (signupError) {
      console.error('❌ Erro no cadastro:', signupError);
      return;
    }

    console.log('✅ Usuário cadastrado:', signupData.user?.id);
    console.log('📧 Email confirmado:', signupData.user?.email_confirmed_at ? 'Sim' : 'Não');

    // 3. Aguardar trigger
    console.log('\n3. Aguardando trigger (3 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Verificar se foi salvo na tabela
    console.log('\n4. Verificando tabela scribia_usuarios...');
    const { data: userData, error: userError } = await supabase
      .from('scribia_usuarios')
      .select('*')
      .eq('id', signupData.user?.id)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
    } else if (userData) {
      console.log('✅ Usuário encontrado na tabela:');
      console.log('   - ID:', userData.id);
      console.log('   - Nome:', userData.nome_completo);
      console.log('   - Email:', userData.email);
      console.log('   - CPF:', userData.cpf);
      console.log('   - WhatsApp:', userData.whatsapp);
    } else {
      console.log('❌ Usuário NÃO encontrado na tabela');
    }

    // 5. Verificar assinatura
    console.log('\n5. Verificando assinatura...');
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('scribia_assinaturas')
      .select('*')
      .eq('usuario_id', signupData.user?.id)
      .single();

    if (subscriptionError) {
      console.error('❌ Erro ao buscar assinatura:', subscriptionError);
    } else if (subscriptionData) {
      console.log('✅ Assinatura encontrada:');
      console.log('   - Plano:', subscriptionData.plano);
      console.log('   - Status:', subscriptionData.status);
    } else {
      console.log('❌ Assinatura NÃO encontrada');
    }

    console.log('\n🏁 Teste concluído');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSignupAfterFix();