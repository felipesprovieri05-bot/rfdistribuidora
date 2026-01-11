<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Adega e Lanchonete - Premium Experience

Sistema de gestão para adega e lanchonete construído com Next.js, React e TypeScript.

## Tecnologias

- **Next.js 15** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **LocalStorage** - Persistência de dados

## Executar Localmente

**Pré-requisitos:** Node.js 18+ instalado

1. Instalar dependências:
   ```bash
   npm install
   ```

2. (Opcional) Configurar variáveis de ambiente:
   - Criar arquivo `.env.local` na raiz do projeto
   - Adicionar `GEMINI_API_KEY=sua_chave_aqui` se necessário

3. Executar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abrir no navegador:
   - Acesse [http://localhost:3000](http://localhost:3000)

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria uma build de produção
- `npm start` - Inicia o servidor de produção (após build)
- `npm run lint` - Executa o linter

## Estrutura do Projeto

```
├── app/                  # Páginas e layouts do Next.js
│   ├── layout.tsx       # Layout raiz
│   ├── page.tsx         # Página principal
│   └── globals.css      # Estilos globais
├── components/          # Componentes React
├── services/            # Serviços e utilitários
├── types.ts            # Definições TypeScript
└── constants.tsx       # Constantes da aplicação
```
