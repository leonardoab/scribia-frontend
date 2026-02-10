# Scribia Frontend

Aplicação web para geração e gerenciamento de livebooks (resumos inteligentes) de palestras e eventos.

## 🚀 Tecnologias

- **React 18** - Biblioteca para interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **Lucide React** - Ícones
- **React Hook Form** - Gerenciamento de formulários
- **Recharts** - Gráficos e visualizações

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn
- Acesso ao backend Scribia

## 🔧 Instalação

```bash
# Clonar repositório
git clone https://github.com/leonardoab/scribia-frontend.git
cd scribia-frontend

# Instalar dependências
npm install --legacy-peer-deps

# Configurar variáveis de ambiente
cp .env.example .env
```

## ⚙️ Configuração

Edite o arquivo `.env`:

```env
# URL do backend
VITE_API_URL=https://scribiabackend-fmedhyfpfqgdgchu.brazilsouth-01.azurewebsites.net/api/v1
```

## 🏃 Executar Localmente

### Desenvolvimento (HTTP)
```bash
npm run dev
```
Acesse: http://localhost:8080

### Desenvolvimento (HTTPS)
```bash
# Gerar certificados SSL (primeira vez)
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
  -keyout localhost-key.pem -out localhost-cert.pem -days 365

npm run dev
```
Acesse: https://localhost:8080

### Build de Produção
```bash
npm run build
```

## 📦 Deploy

O deploy é automatizado via GitHub Actions para Azure Static Web Apps.

### Configuração do Deploy

1. **Secret necessário no GitHub:**
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`

2. **Workflow:** `.github/workflows/azure-static-web-apps.yml`

3. **Trigger:** Push na branch `main`

### URL de Produção
https://black-meadow-0bb07f50f.4.azurestaticapps.net

## 👥 Tipos de Usuário

### Organizador de Eventos
- Gerenciar eventos e palestras
- Visualizar dashboard com métricas
- Gerenciar participantes
- Acessar relatórios e rankings

### Usuário Individual
- Criar livebooks pessoais
- Upload de áudios/transcrições
- Visualizar e baixar livebooks
- Interagir com IAs (Bia e Tutor)

### Participante de Evento
- Acessar livebooks do evento
- Visualizar palestras
- Baixar materiais

## 🔐 Credenciais de Teste

### Organizadores
- **Email:** organizador1@scribia.com | **Senha:** senha123
- **Email:** organizador2@scribia.com | **Senha:** senha123

### Usuários Individuais
- **Email:** individual1@email.com | **Senha:** senha123
- **Email:** individual2@email.com | **Senha:** senha123

### Usuários Originais
- **Email:** organizador.evento@organizador.evento | **Senha:** senha456
- **Email:** usuario.individual@usuario.individual | **Senha:** senha123

## 📁 Estrutura do Projeto

```
src/
├── components/        # Componentes reutilizáveis
│   ├── chat/         # Componentes de chat (Bia, Tutor)
│   ├── organizador/  # Componentes específicos do organizador
│   └── ui/           # Componentes UI base (shadcn)
├── pages/            # Páginas da aplicação
│   ├── dashboard/    # Dashboard do usuário
│   ├── organizador/  # Páginas do organizador
│   └── palestras/    # Páginas de palestras
├── services/         # Serviços e APIs
│   └── api.ts        # Cliente HTTP e endpoints
├── lib/              # Utilitários
└── App.tsx           # Componente raiz
```

## 🎨 Funcionalidades

### Dashboard
- Visão geral de livebooks
- Estatísticas de uso
- Acesso rápido a funcionalidades

### Gerenciamento de Eventos
- Criar e editar eventos
- Adicionar palestras
- Gerenciar participantes
- Visualizar métricas

### Livebooks
- Gerar livebooks de palestras
- Tipos: Completo, Executivo, Tópicos
- Download em PDF e TXT
- Visualização online

### IAs Assistentes
- **Bia:** Assistente para criação de livebooks
- **Tutor Scribia:** Suporte e tutoriais

### Rankings e Tendências
- Palestras mais acessadas
- Temas em alta
- Estatísticas de engajamento

## 🐛 Troubleshooting

### Erro de dependências
```bash
npm install --legacy-peer-deps
```

### Erro de CORS
Verifique se o backend está configurado para aceitar requisições do frontend.

### Certificado SSL inválido (desenvolvimento)
Aceite o certificado no navegador ou use HTTP.

## 📝 Licença

Proprietary - Todos os direitos reservados

## 👨‍💻 Desenvolvedor

Leonardo Bezerra - [GitHub](https://github.com/leonardoab)
