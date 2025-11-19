# Guia de Armazenamento de Fotos

Este projeto suporta múltiplas opções de armazenamento de fotos. Escolha a melhor opção para o seu caso.

## Opções Disponíveis

### 1. **Vercel Blob Storage** ⭐ (Recomendado)

**Melhor para:** Produção, especialmente se você já usa Vercel

**Vantagens:**
- ✅ Integração nativa com Next.js
- ✅ CDN global automático
- ✅ URLs públicas diretas
- ✅ Fácil de configurar
- ✅ Plano gratuito generoso

**Desvantagens:**
- ❌ Requer deploy na Vercel (ou configurar token manualmente)

**Configuração:**
```env
STORAGE_TYPE=vercel-blob
# O token BLOB_READ_WRITE_TOKEN é configurado automaticamente na Vercel
```

**Custo:** Gratuito até 1GB, depois $0.15/GB/mês

---

### 2. **AWS S3** 💰 (Melhor custo-benefício)

**Melhor para:** Produção com alto volume ou controle total

**Vantagens:**
- ✅ Muito escalável
- ✅ Custo baixo ($0.023/GB/mês)
- ✅ Alta disponibilidade
- ✅ Controle total sobre os dados

**Desvantagens:**
- ❌ Requer configuração de credenciais AWS
- ❌ Mais complexo de configurar

**Configuração:**
```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

**Custo:** ~$0.023/GB/mês + transferência

---

### 3. **Google Drive** 📁 (Já implementado)

**Melhor para:** Backup secundário ou integração com Google Workspace

**Vantagens:**
- ✅ Já está implementado
- ✅ Integração com Google Workspace
- ✅ 15GB gratuitos

**Desvantagens:**
- ❌ Não é ideal para servir imagens (não é CDN)
- ❌ Requer autenticação para acessar
- ❌ Limites de API podem ser atingidos
- ❌ Mais lento para servir fotos

**Configuração:**
```env
STORAGE_TYPE=drive
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
```

**Custo:** Gratuito até 15GB

---

### 4. **Armazenamento Local** 💾 (Desenvolvimento)

**Melhor para:** Desenvolvimento local ou testes

**Vantagens:**
- ✅ Sem configuração adicional
- ✅ Sem custos
- ✅ Total controle

**Desvantagens:**
- ❌ Não escalável
- ❌ Não funciona em produção (Vercel, etc)
- ❌ Sem backup automático
- ❌ Precisa criar endpoint para servir fotos

**Configuração:**
```env
STORAGE_TYPE=local
DATA_DIR=./data
```

**Custo:** Gratuito (mas não recomendado para produção)

---

## Recomendação Final

### Para Desenvolvimento:
```env
STORAGE_TYPE=local
```

### Para Produção (Vercel):
```env
STORAGE_TYPE=vercel-blob
```

### Para Produção (Outros hosts):
```env
STORAGE_TYPE=s3
```

### Para Backup/Arquivo:
```env
STORAGE_TYPE=drive
```

---

## Migração entre Providers

O sistema é flexível - você pode mudar o `STORAGE_TYPE` a qualquer momento. As fotos antigas continuarão no storage original, mas novas fotos usarão o novo provider.

---

## Instalação de Dependências

As dependências já estão no `package.json`. Execute:

```bash
cd next
npm install
```

Isso instalará:
- `@vercel/blob` - Para Vercel Blob
- `@aws-sdk/client-s3` - Para AWS S3
- `googleapis` - Para Google Drive (já existente)

