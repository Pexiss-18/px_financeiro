# px_financeiro

Aplicativo de finanças pessoais construído com **React + Vite + Tailwind CSS**. Os dados são
persistidos no `localStorage` do navegador — nenhum servidor é necessário.

## Funcionalidades

- **Visão geral**: saldo acumulado até o mês selecionado (com saldo inicial editável), receitas e
  despesas do mês com variação real em relação ao mês anterior, total investido e gráficos
  (despesas por categoria, orçamento vs realizado e evolução dos últimos 6 meses).
- **Receitas e despesas**: cadastro, edição e exclusão de lançamentos, filtrados pelo mês
  selecionado, com busca por descrição (ignora acentos) e filtro por categoria.
- **Transações recorrentes**: marque "Repetir todo mês" ao cadastrar (aluguel, salário...) e o
  lançamento é gerado automaticamente nos meses seguintes; ocorrências excluídas não voltam.
- **Categorias gerenciáveis**: adicione ou remova categorias de receitas e despesas (remoção é
  bloqueada enquanto a categoria estiver em uso).
- **Orçamento mensal**: cada mês tem seu próprio orçamento (com um valor padrão para meses ainda
  não configurados), com barra de progresso e alerta de estouro.
- **Metas de investimento**: criação de metas com aportes e histórico (data + valor, com exclusão
  que ajusta o total).
- **Notificações** (sino no topo): alertas de orçamento (80% e 100%), metas atingidas e falhas de
  gravação no navegador.
- **Backup e dados** (ícone de banco de dados no topo): exportar em JSON (backup completo) ou CSV
  (transações, pronto para Excel pt-BR), importar um backup e restaurar os dados de exemplo.
- **Tema claro/escuro** persistido, respeitando a preferência do sistema na primeira visita.

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org/) 20.19+ (Vite 8).

```bash
npm install     # instala as dependências
npm run dev     # servidor de desenvolvimento (http://localhost:5173)
npm run build   # build de produção em dist/
npm run preview # serve o build de produção localmente
```

## Qualidade de código

```bash
npm run lint         # ESLint (regras de React e hooks)
npm test             # testes (Vitest + Testing Library)
npm run test:watch   # testes em modo watch
npm run format       # formata o código com Prettier
npm run format:check # verifica a formatação sem alterar arquivos
```

## Estrutura

```
src/
├── components/       # componentes de UI (Dashboard, TopBar, managers, etc.)
│   ├── cards/        # cartões de resumo
│   └── charts/       # gráficos (recharts)
├── data/             # dados de exemplo e categorias/cores padrão
├── hooks/            # useFinanceData: estado, cálculos e persistência (+ testes)
└── utils/            # moeda, datas, CSV, busca e validação (+ testes)
```

## Backup dos dados

Os dados vivem apenas no `localStorage` do seu navegador (chave `px-financeiro:data`). Limpar os
dados de navegação apaga tudo — use **Backup e dados → Exportar dados (JSON)** periodicamente para
guardar uma cópia, e **Importar dados** para restaurá-la. Backups antigos (v1) são aceitos na
importação; os campos novos assumem valores padrão.
