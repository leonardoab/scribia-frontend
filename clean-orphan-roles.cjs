const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://apnfbdkerddhkkzqstmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4'
);

async function cleanOrphanRoles() {
  console.log('🧹 Limpando registros órfãos...');
  
  // Deletar o registro órfão específico
  const { error } = await supabase
    .from('scribia_user_roles')
    .delete()
    .eq('user_id', '137466b7-a5c0-4544-af20-d90b4a685056');
    
  if (error) {
    console.log('❌ Erro ao deletar:', error.message);
  } else {
    console.log('✅ Registro órfão removido com sucesso');
  }
  
  // Verificar se ainda existem outros órfãos
  const { data: allRoles } = await supabase
    .from('scribia_user_roles')
    .select('user_id, role');
    
  console.log('\n🔍 Verificando outros possíveis órfãos...');
  
  for (const role of allRoles || []) {
    const { data: userExists } = await supabase
      .from('scribia_usuarios')
      .select('id')
      .eq('id', role.user_id)
      .single();
      
    if (!userExists) {
      console.log(`❌ Órfão encontrado: ${role.user_id} - ${role.role}`);
      
      // Deletar órfão
      const { error: deleteError } = await supabase
        .from('scribia_user_roles')
        .delete()
        .eq('user_id', role.user_id);
        
      if (deleteError) {
        console.log(`❌ Erro ao deletar ${role.user_id}:`, deleteError.message);
      } else {
        console.log(`✅ Órfão ${role.user_id} removido`);
      }
    }
  }
  
  console.log('\n✨ Limpeza concluída!');
}

cleanOrphanRoles().catch(console.error);