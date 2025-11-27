# 🔗 Link-Face

Sistema de verificação de identidade com captura de foto e validação de CPF. Permite que funcionários enviem links personalizados para clientes realizarem a confirmação de identidade de forma segura.

## 📋 Sobre o Projeto

O **Link-Face** é uma aplicação web moderna que facilita o processo de verificação de identidade através de:

- ✅ Validação de CPF em tempo real
- ✅ Captura de foto via câmera ou upload
- ✅ Links personalizados por funcionário
- ✅ Armazenamento flexível de fotos (múltiplos providers)
- ✅ Interface responsiva e intuitiva

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **SQLite** - Banco de dados local
- **Sharp** - Processamento e compressão de imagens
- **Sistema de Storage Flexível**:
  - Vercel Blob Storage
  - AWS S3
  - Google Drive
  - Armazenamento Local

## 📁 Estrutura do Projeto

```
link-face/
├── next/                    # Aplicação Next.js principal
│   ├── app/                 # App Router do Next.js
│   │   ├── api/            # Rotas da API
│   │   ├── components/     # Componentes React
│   │   └── l/[token]/      # Página com token personalizado
│   ├── src/lib/            # Bibliotecas e utilitários
│   │   ├── db.ts           # Configuração do SQLite
│   │   ├── drive.ts        # Integração Google Drive
│   │   └── storage.ts      # Sistema de storage flexível
│   ├── data/               # Dados locais (DB, uploads)
│   ├── README.md           # Documentação específica
│   └── STORAGE.md          # Guia de armazenamento
└── README.md               # Este arquivo
```

## ⚙️ Requisitos

- Node.js 18 ou superior
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/EniJunioor/Link-Face.git
cd Link-Face
```

2. **Instale as dependências:**
```bash
cd next
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

4. **Execute o projeto:**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🔐 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `next/` com as seguintes variáveis:

```env
# Storage
STORAGE_TYPE=local  # ou 'vercel-blob', 's3', 'drive'
DATA_DIR=./data
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Validações de Imagem
MAX_IMAGE_SIZE=5242880           # 5MB em bytes
MAX_BASE64_SIZE=7000000          # ~7MB
MIN_IMAGE_DIMENSION=200          # 200px mínimo
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW=60000          # 1 minuto em ms
RATE_LIMIT_MAX_REQUESTS=10       # 10 requisições

# Autenticação Admin
ADMIN_PASSWORD=seu_password_seguro  # Senha para acesso ao painel admin

# Google Drive (quando STORAGE_TYPE=drive)
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
GOOGLE_DRIVE_FOLDER_ID=

# AWS S3 (quando STORAGE_TYPE=s3)
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET_NAME=your-bucket-name

# Vercel Blob (quando STORAGE_TYPE=vercel-blob)
# Usa automaticamente BLOB_READ_WRITE_TOKEN do Vercel
```

Para mais detalhes sobre configuração de cada provider de storage, consulte o [Guia de Armazenamento](next/STORAGE.md).

## 📖 Documentação

- **[README do Next.js](next/README.md)** - Documentação completa da aplicação
- **[Guia de Storage](next/STORAGE.md)** - Comparação e configuração dos providers de armazenamento
- **[Funcionalidades](next/FEATURES.md)** - Lista completa de funcionalidades implementadas

## ⚙️ Funcionalidades Técnicas

### Sistema de Logs
- ✅ Logs estruturados em JSON
- ✅ Níveis: DEBUG, INFO, WARN, ERROR
- ✅ Stack traces para erros
- ✅ Contexto adicional em cada log
- ✅ Filtro por ambiente (desenvolvimento/produção)

### Sistema de Notificações
- ✅ Suporte para email e SMS
- ✅ Notificações automáticas em novas submissões
- ✅ Integração preparada para SendGrid, Twilio, etc.
- ✅ Modo console para desenvolvimento
- ✅ Logs de todas as notificações

### Compressão de Imagens
- ✅ Redimensiona imagens grandes (máx 1920x1920px)
- ✅ Comprime JPEG, PNG e WEBP
- ✅ Qualidade configurável (padrão: 85%)
- ✅ Logs de taxa de compressão
- ✅ Fallback gracioso se Sharp não estiver disponível

### Painel Administrativo
- ✅ Dashboard com estatísticas em tempo real
- ✅ Tabela de submissões com paginação
- ✅ Busca em tempo real por nome ou CPF
- ✅ Filtro por funcionário
- ✅ Visualização de fotos
- ✅ Criação e gerenciamento de funcionários
- ✅ Exportação de dados em CSV ou JSON
- ✅ Design responsivo e moderno

## 🎯 Funcionalidades

### Para Funcionários
- ✅ Geração de links personalizados com token único
- ✅ Painel administrativo completo (`/admin`)
- ✅ Visualização de todas as submissões em tempo real
- ✅ Estatísticas e dashboard
- ✅ Busca e filtros por nome, CPF ou funcionário
- ✅ Exportação de dados em CSV ou JSON
- ✅ Criação e gerenciamento de funcionários
- ✅ Visualização de fotos enviadas pelos clientes

### Para Clientes
- ✅ Interface simples e intuitiva
- ✅ Validação automática de CPF
- ✅ Captura de foto via câmera ou upload
- ✅ Suporte mobile com HTTPS
- ✅ Validação de tamanho e tipo de imagem
- ✅ Compressão automática de imagens grandes

## 🌐 Rotas

### Rotas Públicas
- **`/`** - Página inicial do formulário
- **`/l/[token]`** - Formulário com token personalizado
- **`POST /api/submit`** - Endpoint para envio de dados
- **`GET /api/photos/[id]`** - Visualizar foto enviada
- **`GET /api/health`** - Health check do sistema

### Rotas Administrativas
- **`/admin`** - Painel administrativo (requer autenticação)
- **`/admin/login`** - Página de login
- **`GET /api/admin/submissions`** - Listar todas as submissões
- **`GET /api/admin/submissions?search=termo`** - Buscar submissões
- **`GET /api/admin/employees`** - Listar funcionários
- **`POST /api/admin/employees`** - Criar novo funcionário
- **`GET /api/admin/export?format=csv|json`** - Exportar dados

## 📦 Providers de Storage

O sistema suporta múltiplos providers de armazenamento:

| Provider | Melhor Para | Custo |
|----------|-------------|-------|
| **Vercel Blob** | Produção (Vercel) | Gratuito até 1GB |
| **AWS S3** | Produção (alto volume) | ~$0.023/GB/mês |
| **Google Drive** | Backup/Arquivo | Gratuito até 15GB |
| **Local** | Desenvolvimento | Gratuito |

Veja o [Guia de Storage](next/STORAGE.md) para mais detalhes.

## 🔒 Segurança e Validações

### Validações de Imagem
- ✅ Validação de tamanho máximo (configurável, padrão: 5MB)
- ✅ Validação de tipo de arquivo (apenas JPG, PNG, WEBP)
- ✅ Validação de dimensões mínimas (configurável, padrão: 200x200px)
- ✅ Validação de tamanho do Base64
- ✅ Compressão automática de imagens grandes (máx 1920x1920px)

### Proteções de Segurança
- ✅ Rate limiting (10 requisições/minuto por IP/token, configurável)
- ✅ Sanitização de nomes de arquivo (prevenção de path traversal)
- ✅ Headers de segurança HTTP:
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Strict-Transport-Security
  - Referrer-Policy
  - Permissions-Policy

### Autenticação
- ✅ Sistema de autenticação por senha no painel admin
- ✅ Sessões seguras com cookies HttpOnly
- ✅ Proteção de todas as rotas administrativas
- ✅ Middleware de autenticação

### Outros
- ✅ Validação de CPF no cliente e servidor
- ✅ Tokens únicos para cada funcionário
- ✅ Armazenamento seguro de credenciais
- ✅ Suporte a HTTPS para câmera em dispositivos móveis
- ✅ Validação completa de variáveis de ambiente

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente
3. Defina `STORAGE_TYPE=vercel-blob`
4. Deploy automático!

### Outros Serviços

O projeto pode ser deployado em qualquer serviço que suporte Next.js:
- AWS Amplify
- Netlify
- Railway
- Render

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento local
npm run dev:host     # Desenvolvimento exposto na rede
npm run build        # Build de produção
npm run start        # Inicia servidor de produção
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👤 Autor

**Eni Júnior**

- GitHub: [@EniJunioor](https://github.com/EniJunioor)

## 🙏 Agradecimentos

- Next.js pela excelente documentação
- Comunidade open source

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!

