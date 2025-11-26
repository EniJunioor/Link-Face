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
# Tipo de armazenamento: 'local', 'vercel-blob', 's3', 'drive'
STORAGE_TYPE=local

# Diretório para dados locais
DATA_DIR=./data

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Para mais detalhes sobre configuração de cada provider de storage, consulte o [Guia de Armazenamento](next/STORAGE.md).

## 📖 Documentação

- **[README do Next.js](next/README.md)** - Documentação completa da aplicação
- **[Guia de Storage](next/STORAGE.md)** - Comparação e configuração dos providers de armazenamento

## 🎯 Funcionalidades

### Para Funcionários
- Geração de links personalizados com token único
- Acompanhamento de submissões de clientes

### Para Clientes
- Interface simples e intuitiva
- Validação automática de CPF
- Captura de foto via câmera ou upload
- Suporte mobile com HTTPS

## 🌐 Rotas

- **`/`** - Página inicial do formulário
- **`/l/[token]`** - Formulário com token personalizado
- **`POST /api/submit`** - Endpoint para envio de dados

## 📦 Providers de Storage

O sistema suporta múltiplos providers de armazenamento:

| Provider | Melhor Para | Custo |
|----------|-------------|-------|
| **Vercel Blob** | Produção (Vercel) | Gratuito até 1GB |
| **AWS S3** | Produção (alto volume) | ~$0.023/GB/mês |
| **Google Drive** | Backup/Arquivo | Gratuito até 15GB |
| **Local** | Desenvolvimento | Gratuito |

Veja o [Guia de Storage](next/STORAGE.md) para mais detalhes.

## 🔒 Segurança

- Validação de CPF no cliente e servidor
- Tokens únicos para cada funcionário
- Armazenamento seguro de credenciais
- Suporte a HTTPS para câmera em dispositivos móveis

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

