import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://apnfbdkerddhkkzqstmp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSimpleUser() {
  console.log('🚀 Criando usuário organizador simples...\n');

  // Gerar email único para evitar conflitos
  const timestamp = Date.now();
  const email = `organizador${timestamp}@scribia.com`;
  
  try {
    console.log('📧 Email do organizador:', email);
    console.log('🔑 Senha: organizador123\n');
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: 'organizador123',
      options: {
        data: {
          nome_completo: 'Organizador Teste',
          cpf: '123.456.789-00',
          whatsapp: '+55 11 99999-9999'
        }
      }
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      console.error('Detalhes:', error);
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('ID do usuário:', data.user?.id);
    
    // Aguardar um pouco para o trigger processar
    console.log('\n⏳ Aguardando processamento do trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se o usuário foi criado na tabela scribia_usuarios
    const { data: userData, error: userError } = await supabase
      .from('scribia_usuarios')
      .select('*')
      .eq('id', data.user?.id)
      .single();
    
    if (userError) {
      console.log('⚠️  Usuário não encontrado na tabela scribia_usuarios:', userError.message);
    } else {
      console.log('✅ Usuário encontrado na tabela scribia_usuarios');
      console.log('Nome:', userData.nome_completo);
      console.log('Email:', userData.email);
    }
    
    // Verificar assinatura
    const { data: subData, error: subError } = await supabase
      .from('scribia_assinaturas')
      .select('*')
      .eq('usuario_id', data.user?.id)
      .single();
    
    if (subError) {
      console.log('⚠️  Assinatura não encontrada:', subError.message);
    } else {
      console.log('✅ Assinatura criada');
      console.log('Plano:', subData.plano);
      console.log('Status:', subData.status);
    }
    
    console.log('\n🎉 Usuário organizador criado com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('Email:', email);
    console.log('Senha: organizador123');
    console.log('\n🔗 Para acessar:');
    console.log('1. Vá para: http://localhost:8080/login');
    console.log('2. Faça login com as credenciais acima');
    console.log('3. Depois acesse: http://localhost:8080/organizador');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
createSimpleUser();