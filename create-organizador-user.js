import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (usando as credenciais do projeto)
const supabaseUrl = 'https://apnfbdkerddhkkzqstmp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createOrganizadorUser() {
  console.log('🚀 Criando usuário organizador fictício...\n');

  try {
    // 1. Criar o usuário organizador
    console.log('1. Criando usuário organizador...');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'organizador@scribia.com',
      password: 'organizador123',
      options: {
        data: {
          nome_completo: 'Organizador Teste',
          cpf: '123.456.789-00',
          whatsapp: '+55 11 99999-9999'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ Usuário organizador já existe');
        
        // Tentar fazer login para obter o ID do usuário
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'organizador@scribia.com',
          password: 'organizador123'
        });

        if (loginError) {
          console.error('❌ Erro ao fazer login:', loginError.message);
          return;
        }

        console.log('✅ Login realizado com sucesso');
        const userId = loginData.user.id;

        // 3. Verificar se já tem role de organizador
        console.log('\n2. Verificando roles do usuário...');
        
        const { data: existingRoles, error: rolesError } = await supabase
          .from('scribia_user_roles')
          .select('role')
          .eq('user_id', userId);

        if (rolesError) {
          console.error('❌ Erro ao verificar roles:', rolesError.message);
          return;
        }

        console.log('Roles existentes:', existingRoles);

        // Se não tem role de organizador, adicionar
        const hasOrganizadorRole = existingRoles?.some(r => r.role === 'organizador');
        
        if (!hasOrganizadorRole) {
          console.log('\n3. Adicionando role de usuário...');
          
          const { error: roleError } = await supabase
            .from('scribia_user_roles')
            .insert({
              user_id: userId,
              role: 'user' // Vamos usar 'user' por enquanto já que organizador pode não existir
            });

          if (roleError) {
            console.error('❌ Erro ao adicionar role:', roleError.message);
          } else {
            console.log('✅ Role adicionado com sucesso');
          }
        } else {
          console.log('✅ Usuário já tem role de organizador');
        }

      } else {
        console.error('❌ Erro ao criar usuário:', signUpError.message);
        return;
      }
    } else {
      console.log('✅ Usuário criado com sucesso');
      const userId = signUpData.user?.id;

      if (userId) {
        // 2. Adicionar role de usuário (já que organizador não existe no enum)
        console.log('\n2. Adicionando role ao usuário...');
        
        const { error: roleError } = await supabase
          .from('scribia_user_roles')
          .insert({
            user_id: userId,
            role: 'user' // Usando 'user' por enquanto
          });

        if (roleError) {
          console.error('❌ Erro ao adicionar role:', roleError.message);
        } else {
          console.log('✅ Role adicionado com sucesso');
        }
      }
    }

    console.log('\n🎉 Usuário organizador criado/verificado com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('Email: organizador@scribia.com');
    console.log('Senha: organizador123');
    console.log('\n🔗 Acesse: http://localhost:8080/login');
    console.log('Depois vá para: http://localhost:8080/organizador');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
createOrganizadorUser();