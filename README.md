# Sistema de Rateio de Encargos — Arquidiocese de Maceió

Sistema web para apuração previdenciária, gerenciamento de encargos mensais e geração de demonstrativos por unidade.

---

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Banco de dados**: Firebase Firestore
- **Autenticação**: Firebase Auth
- **Storage**: Firebase Storage (PDFs)
- **Hospedagem**: Netlify

---

## Setup — Passo a Passo

### 1. Firebase

1. Acesse https://console.firebase.google.com
2. Crie um novo projeto (ex: `rateio-arquidiocese`)
3. Ative o **Firebase Authentication** → Provedor: E-mail/Senha
4. Ative o **Cloud Firestore** → Modo produção
5. Ative o **Firebase Storage**
6. Em Configurações do Projeto → Seus apps → Adicione app Web
7. Copie as credenciais do `firebaseConfig`

### 2. Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais Firebase:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Popular Unidades no Firestore

No Firebase Console → Firestore → Importar os dados, OU execute via script:

```bash
# Instale o firebase-admin e execute o seed
node src/utils/seedUnidades.js
```

Ou importe manualmente as unidades usando o painel Admin do sistema após criar o primeiro admin.

### 5. Criar Primeiro Usuário Admin

No Firebase Console → Authentication → Adicionar usuário:
- E-mail: `admin@arquidiocese.com`
- Senha: (defina uma senha forte)

Depois no Firestore → Coleção `usuarios` → Adicionar documento com ID = UID do usuário criado:
```json
{
  "nome": "Administrador",
  "email": "admin@arquidiocese.com",
  "perfil": "admin",
  "unidadeId": null,
  "ativo": true
}
```

### 6. Publicar Regras de Segurança

```bash
# Instale o Firebase CLI
npm install -g firebase-tools
firebase login
firebase init  # selecione Firestore + Storage
firebase deploy --only firestore:rules,storage
```

### 7. Rodar Localmente

```bash
npm run dev
```

Acesse http://localhost:5173

---

## Deploy no Netlify

### Via GitHub (recomendado)

1. Crie repositório no GitHub e faça push do projeto
2. No Netlify → Add new site → Import from GitHub
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Em **Environment variables**, adicione todas as variáveis do `.env`
5. Deploy!

O arquivo `netlify.toml` já configura o redirect correto para SPA.

---

## Fluxo de Uso

### Admin
1. Login → Dashboard com resumo do mês
2. **Unidades** → gerenciar as paróquias cadastradas
3. **Usuários** → criar contas para os colaboradores
4. **Importar** → fazer upload do Excel/CSV com os encargos do mês
5. **Encargos** → revisar, editar, marcar como pago, gerar PDFs
6. **Relatórios** → exportar consolidado em PDF ou Excel

### Colaborador
1. Login → vê total do mês atual da sua unidade
2. **Histórico** → lista de todos os meses
3. **Demonstrativo** → seleciona mês e baixa o PDF

---

## Estrutura do Projeto

```
src/
├── components/
│   ├── ui/          → componentes base (Button, Card, Table, Modal...)
│   ├── layout/      → AdminLayout, ColaboradorLayout
│   └── ProtectedRoute.jsx
├── context/
│   └── AuthContext.jsx
├── hooks/
│   └── useEncargos.js
├── pages/
│   ├── Login.jsx
│   ├── admin/       → Dashboard, Unidades, Usuarios, Encargos, Importar, Relatorios
│   └── colaborador/ → Dashboard, Historico, Demonstrativo
├── services/
│   ├── firebase.js  → inicialização
│   ├── auth.js      → login/logout/criar usuário
│   ├── firestore.js → CRUD de dados
│   └── storage.js   → upload/download PDFs
└── utils/
    ├── formatters.js  → moeda, data, constantes
    ├── importParser.js → parser Excel/CSV
    ├── pdfGenerator.js → geração de demonstrativos
    └── seedUnidades.js → dados iniciais das 90+ unidades
```

---

## Modelo de Planilha para Importação

Baixe o modelo pelo botão **"Baixar Modelo"** na tela de importação.

Colunas obrigatórias:
```
cnpj | nome | salarioBase | nFuncionarios | empregado | empresa | terceiros |
ratAjustado | salarioFamilia | salarioMaternidade | pis8301 | irrf0561 |
irrfCongruas | irrf1708 | cofins5960 | pis5979 | csll5987 | inss1162 |
fgts | consignado | sst | odonto | seguroVida | totalGeral
```

---

## Suporte

Dúvidas ou problemas: contate o administrador do sistema.
