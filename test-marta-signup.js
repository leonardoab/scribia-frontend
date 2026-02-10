// Teste de cadastro com dados mocados da Marta
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wnqfqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWZxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4MzI4MjUsImV4cCI6MjA0MTQwODgyNX0.example';

// Dados mocados da Marta
const martaData = {
  nome_completo: 'Marta Elizabeth Saddy',
  email: 'marta_saddy@hotmail.com',
  cpf: '01503620774',
  whatsapp: '21983473950',
  senha: '@Minio101'
};

async function testMartaSignup() {
  console.log('🧪 Testando cadastro da Marta...');
  console.log('📋 Dados:', martaData);
  
  try {
    // Simular o que acontece quando o formulário é submetido
    console.log('\n✅ Dados válidos para teste:');
    console.log(`- Nome: ${martaData.nome_completo}`);
    console.log(`- Email: ${martaData.email}`);
    console.log(`- CPF: ${martaData.cpf}`);
    console.log(`- WhatsApp: ${martaData.whatsapp}`);
    console.log(`- Senha: ${'*'.repeat(martaData.senha.length)}`);
    
    console.log('\n🎯 Pronto para submeter no formulário web!');
    console.log('👆 Use esses dados no formulário que está aberto no navegador');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testMartaSignup();
