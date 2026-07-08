# Análise do Projeto — px_financeiro

App de finanças pessoais em **React + Vite + Tailwind**, com persistência em `localStorage`.
Estrutura organizada (hooks, utils, componentes separados) — boa base, com pontos claros de melhoria.

---

## 🐞 Bugs e inconsistências (corrigir primeiro)

| #   | Problema                                                                                                                                       | Onde                              | Impacto                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------- |
| 1   | **`Trend` com valores fixos** — `+8%` e `-4%` "vs mês anterior" estão hardcoded                                                                | `src/components/Dashboard.jsx:35` | Mostra informação falsa ao usuário       |
| 2   | **Saldo Total ignora o mês selecionado** — soma _todas_ as receitas/despesas de todos os meses, enquanto os demais cards são filtrados por mês | `src/hooks/useFinanceData.js:49`  | Mistura conceitos e confunde             |
| 3   | **`id: Date.now()` gera colisão** — dois registros no mesmo milissegundo criam IDs iguais → `key` duplicada no React; edit/delete afeta ambos  | `src/hooks/useFinanceData.js:68`  | Bug real; usar `crypto.randomUUID()`     |
| 4   | **Orçamento é global, não por mês** — um único número aplicado a qualquer mês                                                                  | `src/hooks/useFinanceData.js`     | Todos os meses mostram o mesmo orçamento |
| 5   | **`localStorage` sem tratamento de erro na escrita** — `setItem` pode lançar exceção (quota) e travar a app                                    | `src/hooks/useFinanceData.js:32`  | App pode quebrar                         |

---

## 🧹 Qualidade de código

- **Formatação de moeda duplicada** — `toLocaleString('pt-BR', {...})` aparece ~12 vezes. Extrair um `formatCurrency()` em `utils/`.
- **Categorias hardcoded e espalhadas** — listas vivem dentro de cada componente. Centralizar em `data/` (inclusive reusar `categoryColors`).
- **Sem ESLint/Prettier** — não há padronização automática.
- **Sem `README.md`** — falta documentação de como rodar o projeto.

---

## ♿ Acessibilidade / UX

- **Botões sem `aria-label`** — sino, toggle de tema e navegação mobile (só ícones) não têm rótulo para leitores de tela.
- **Botão de sino (🔔) não faz nada** — implementar notificações (ex.: alerta de orçamento estourado) ou remover.

---

## ✨ Funcionalidades a adicionar

- **Exportar / importar dados** (JSON ou CSV) + botão de **resetar** — hoje os dados só vivem no navegador, sem backup.
- **Trend real mês-a-mês** — resolve o item 1.
- **Transações recorrentes** (aluguel, salário) para não recadastrar todo mês.
- **Histórico de aportes** nas metas (data + valor) — hoje só soma o total.
- **Gerenciar categorias** (criar / editar / remover) em vez de listas fixas.
- **Gráfico de evolução** (saldo / receitas / despesas ao longo dos meses) — o `recharts` já está instalado.
- **Filtro / busca** no histórico de transações.

---

## 🎯 Recomendação de priorização

1. **Correções rápidas e de alto impacto:** IDs únicos, `formatCurrency` centralizado, `Trend` real, export/import de dados.
2. **Limpeza de código:** categorias centralizadas, ESLint/Prettier, README.
3. **Funcionalidades novas:** gráfico de evolução, categorias gerenciáveis, transações recorrentes.

### Pacotes sugeridos

- **A)** Só correções de bugs (itens 1–5)
- **B)** Bugs + limpeza de código (1–8)
- **C)** Completo: bugs + limpeza + export/import + trend real + gráfico de evolução
