# CalorieTracker - Autenticacao e Seguranca

## Modelo Atual: Single-User

O CalorieTracker opera em modo **single-user**, ou seja, nao possui sistema de login ou autenticacao. Toda a aplicacao assume um unico usuario ativo.

### Auto-deteccao de Usuario

O arquivo `src/lib/user.ts` exporta a funcao `getDefaultUserId()`, que busca automaticamente o **primeiro User** cadastrado no banco de dados. Esse mecanismo garante que a aplicacao funcione sem necessidade de login.

```
getDefaultUserId() → busca o primeiro registro da tabela User → retorna o id
```

### userId nas APIs

Todas as rotas de API aceitam um `userId` **opcional** nos parametros (query string ou body). Quando nao informado, o fallback e o valor retornado por `getDefaultUserId()`.

Isso significa que:

- Em modo single-user, nenhuma chamada precisa informar userId
- A estrutura ja esta preparada para receber userId explicito caso multi-user seja implementado no futuro

## Validacao de Dados

### Zod Schemas

A validacao de entrada e feita com **Zod** no backend. Cada endpoint possui seu schema correspondente:

- `mealEntrySchema` — validacao de registros de refeicao
- Schemas para exercicios, alimentos, combos, etc.

Os schemas garantem:

- Tipos corretos (string, number, enum)
- Campos obrigatorios vs opcionais
- Ranges validos (ex: calorias >= 0, peso > 0)
- Enums restritos (ex: mealType so aceita valores pre-definidos)

Erros de validacao retornam **400 Bad Request** com mensagem descritiva do Zod.

## CORS e Seguranca de Rede

### Politica de CORS

O projeto usa a configuracao padrao do **Next.js**, que opera em **same-origin**:

- Requisicoes da mesma origem sao permitidas automaticamente
- Nao ha configuracao customizada de CORS headers
- Em producao (Vercel), o dominio do deploy e a unica origem permitida

### Headers de Seguranca

O Next.js aplica automaticamente headers basicos de seguranca:

- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`

## Variaveis Sensiveis

As credenciais ficam exclusivamente no arquivo `.env`, que **nao e commitado** no repositorio (incluido no `.gitignore`).

| Variavel | Descricao | Onde e usada |
|---|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL (Neon) | Prisma adapter |
| `RESEND_API_KEY` | Chave da API Resend para envio de e-mails | Servico de e-mail |

### Prisma e Adapter Pattern

O CalorieTracker usa **Prisma 7** com o padrao de **driver adapter** (`PrismaPg`). Isso significa que:

- O `schema.prisma` **nao contem** connection string (campo `url` removido do `datasource`)
- A URL do banco e configurada via `prisma.config.ts` e passada ao adapter em runtime
- Nenhuma credencial fica exposta no schema ou no codigo-fonte

## Plano Futuro: Multi-User

A arquitetura atual ja contempla a possibilidade de evolucao para multi-user. Opcoes consideradas:

### NextAuth.js

- Integracao nativa com Next.js
- Suporte a providers OAuth (Google, GitHub, etc.)
- Session management com JWT ou banco de dados
- Menor curva de aprendizado

### Clerk

- Solucao gerenciada de autenticacao
- UI pre-construida (sign-in, sign-up, profile)
- Webhooks para sincronizacao de usuarios
- Maior facilidade de implementacao

### O que precisaria mudar

1. **Adicionar middleware de autenticacao** — validar sessao em cada request
2. **Remover `getDefaultUserId()`** — substituir pela sessao do usuario logado
3. **Adicionar tela de login/registro** — UI de autenticacao
4. **Migrar dados existentes** — associar registros orfaos ao novo sistema de usuarios
5. **Ajustar queries** — garantir que cada query filtre pelo userId da sessao (row-level security)
