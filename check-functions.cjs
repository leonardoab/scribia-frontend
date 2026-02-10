const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://apnfbdkerddhkkzqstmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4'
);

async function checkFunctions() {
  console.log('🔍 Verificando funções disponíveis...\n');

  const functions = [
    'scribia_signup',
    'scribia_login', 
    'scribia_get_user',
    'scribia_assign_admin_role',
    'scribia_is_admin'
  ];

  for (const func of functions) {
    try {
      console.log(`Testando função: ${func}`);
      
      // Tentar chamar a função com parâmetros vazios para ver se existe
      const { data, error } = await supabase.rpc(func, {});
      
      if (error) {
        if (error.code === 'PGRST202') {
          console.log(`❌ Função ${func} NÃO EXISTE`);
        } else {
          console.log(`✅ Função ${func} EXISTE (erro esperado nos parâmetros)`);
        }
      } else {
        console.log(`✅ Função ${func} EXISTE e funcionou`);
      }
    } catch (err) {
      console.log(`❌ Erro ao testar ${func}:`, err.message);
    }
    console.log('');
  }

  // Verificar tabelas
  console.log('📊 Verificando tabelas...\n');
  
  try {
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('scribia_usuarios')
      .select('*')
      .limit(1);
    
    console.log('✅ Tabela scribia_usuarios:', errorUsuarios ? 'ERRO' : 'OK');
    
    const { data: roles, error: errorRoles } = await supabase
      .from('scribia_user_roles')
      .select('*')
      .limit(1);
    
    console.log('✅ Tabela scribia_user_roles:', errorRoles ? 'ERRO' : 'OK');
    
    const { data: assinaturas, error: errorAssinaturas } = await supabase
      .from('scribia_assinaturas')
      .select('*')
      .limit(1);
    
    console.log('✅ Tabela scribia_assinaturas:', errorAssinaturas ? 'ERRO' : 'OK');
    
  } catch (err) {
    console.error('❌ Erro ao verificar tabelas:', err);
  }
}

checkFunctions();