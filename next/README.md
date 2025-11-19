## Link-Face (Next.js) — SMS link ➜ Nome/CPF ➜ Foto ➜ DB ➜ Storage

### Visão geral
- Projeto unificado em `next/` (UI + API `/api/submit`).
- SQLite para persistência e sistema flexível de armazenamento de fotos.
- Suporta múltiplos providers: Local, Vercel Blob, AWS S3, Google Drive.

### Requisitos
- Node 18+

### Instalação e execução (Next)
```
cd next
npm install
cd ..
npm install
npm run dev
# http://seu-ip-local:3000
```

### Compartilhar com HTTPS (câmera em celular)
```
npm run dev:tunnel
# inicia o Next exposto na rede e cria um túnel HTTPS (https://*.loca.lt)
```
Acesse a URL HTTPS gerada no celular. Para encerrar, use Ctrl+C.

### Variáveis de ambiente (crie `next/.env`)
```
# Tipo de armazenamento: 'local', 'vercel-blob', 's3', 'drive'
STORAGE_TYPE=local
DATA_DIR=./data
NEXT_PUBLIC_APP_URL=http://localhost:3000

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

Coloque o JSON da conta de serviço em `next/gcp-service-account.json` (ou ajuste o caminho) e compartilhe a pasta de destino no Drive com o e‑mail da conta de serviço.

### Rotas
- UI: `/` e `/l/<token>`
- API: `POST /api/submit`

### Observação
As pastas `backend/` e `frontend/` foram descontinuadas; use apenas o app em `next/`.



