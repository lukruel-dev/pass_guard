# PassGuard 🛡️

Cofre digital seguro para armazenamento e geração de senhas fortes, com suporte a autenticação multifator (2FA TOTP), controle de acesso por linha (Row Level Security - RLS) e interface moderna e responsiva.

---

## 🚀 Arquitetura & Stack

- **Frontend & Edge API:** [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript, Tailwind CSS, Radix UI)
- **Hospedagem & CI/CD:** [Vercel](https://vercel.com/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + RLS + GoTrue Auth)
- **Segurança:** Autenticação de dois fatores (TOTP / Google Authenticator) e RLS estrito no banco.

---

## 🛠️ Configuração e Execução Local

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` na raiz com as credenciais do Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-public
   ```

3. Execute o script SQL em `supabase/schema.sql` no SQL Editor do seu projeto Supabase para criar as tabelas e políticas de RLS.

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 📦 Deploy na Vercel

O projeto está configurado para deploy contínuo via GitHub na Vercel. Certifique-se de configurar as seguintes variáveis de ambiente no dashboard da Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
