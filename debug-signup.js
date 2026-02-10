import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase (do arquivo .env)
const supabaseUrl = "https://apnfbdkerddhkkzqstmp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSignup() {
  console.log('🔍 Debug melhorado do cadastro...\n');

  try {
    // 1. Testar conexão
    console.log('1. Testando conexão com Supabase...');
    const { error: connectionError } = await supabase.from('scribia_usuarios').select('count').limit(1);
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError.message);
      return;
    }
    console.log('✅ Conexão com Supabase OK\n');

    // 2. Verificar quantos usuários existem
    console.log('2. Verificando usuários existentes...');
    const { data: existingUsers, error: countError } = await supabase
      .from('scribia_usuarios')
      .select('id, email, nome_completo');
    
    if (countError) {
      console.log('❌ Erro ao contar usuários:', countError.message);
    } else {
      console.log(`📊 Total de usuários na tabela: ${existingUsers?.length || 0}`);
      if (existingUsers && existingUsers.length > 0) {
        console.log('👥 Usuários existentes:');
        existingUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.nome_completo || 'Sem nome'})`);
        });
      }
    }

    // 3. Cadastrar usuário de teste
    console.log('\n3. Testando cadastro de usuário...');
    const testEmail = `teste.melhorado.${Date.now()}@gmail.com`;
    const testData = {
      email: testEmail,
      password: '123456',
      options: {
        data: {
          nome_completo: 'Usuário Teste Melhorado',
          cpf: '123.456.789-00',
          whatsapp: '(11) 99999-9999'
        }
      }
    };

    console.log('📝 Dados do teste:', testData);

    const { data: signupData, error: signupError } = await supabase.auth.signUp(testData);

    if (signupError) {
      console.error('❌ Erro no cadastro:', signupError.message);
      return;
    }

    console.log('✅ Usuário cadastrado no auth:', signupData.user?.id);
    console.log('📧 Email confirmado:', signupData.user?.email_confirmed_at ? 'Sim' : 'Não');

    // 4. Aguardar trigger com verificações intermediárias
    console.log('\n4. Aguardando trigger executar...');
    
    for (let i = 1; i <= 5; i++) {
      console.log(`   Verificação ${i}/5...`);
      
      const { data: userData, error: userError } = await supabase
        .from('scribia_usuarios')
        .select('*')
        .eq('id', signupData.user?.id);

      if (!userError && userData && userData.length > 0) {
        console.log('✅ SUCESSO! Usuário encontrado na tabela:');
        console.log('   - ID:', userData[0].id);
        console.log('   - Nome:', userData[0].nome_completo);
        console.log('   - Email:', userData[0].email);
        console.log('   - CPF:', userData[0].cpf);
        console.log('   - WhatsApp:', userData[0].whatsapp);
        
        // Verificar assinatura também
        const { data: subData } = await supabase
          .from('scribia_assinaturas')
          .select('*')
          .eq('usuario_id', signupData.user?.id);
          
        if (subData && subData.length > 0) {
          console.log('✅ Assinatura criada:', subData[0].plano, '-', subData[0].status);
        }
        
        console.log('\n🎉 Trigger funcionando corretamente!');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('❌ Usuário NÃO encontrado após 5 segundos');
    console.log('   O trigger não está funcionando corretamente');

    // 5. Verificar se há erros nos logs (se possível)
    console.log('\n5. Diagnóstico adicional...');
    
    // Tentar buscar todos os usuários novamente para ver se algo mudou
    const { data: allUsers } = await supabase
      .from('scribia_usuarios')
      .select('id, email, criado_em')
      .order('criado_em', { ascending: false })
      .limit(5);
      
    console.log('📋 Últimos 5 usuários criados:');
    if (allUsers && allUsers.length > 0) {
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.criado_em}`);
      });
    } else {
      console.log('   Nenhum usuário encontrado');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugSignup();