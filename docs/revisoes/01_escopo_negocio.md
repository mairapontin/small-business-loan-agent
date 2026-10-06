# Revisão 1 — escopo, completude e coerência de negócio

**Status inicial:** aprovado com correções.  
**Data-base:** 3 de setembro de 2026.

## Matriz de cobertura

| Requisito | Evidência no projeto | Resultado |
|---|---|---|
| Soja em Mato Grosso com expansão | Escopo do MVP e roadmap | Coberto |
| Indicadores financeiros e dívidas | Motor financeiro, caixa, contratos e catálogo | Coberto |
| Clima, solo, pragas e extremos | Módulo agronômico e cenários nomeados | Coberto |
| Dólar, soja, futuros, opções e margem | Motor de mercado/hedge e feature store temporal | Coberto |
| Governança PF/PJ/família | Grafo econômico e disponibilidade ao credor | Coberto |
| Gestão, equipe e tecnologia | Maturidade operacional e evidências | Coberto |
| Máquinas, softwares e produtividade | Inventário, capacidade na janela e retorno | Coberto após última revisão |
| Depreciação, reposição e custo do crédito | Seções 5.4–5.6, dicionário de ativos e features | Coberto após última revisão |
| Logística, modais, combustível e energia | Grafo logístico e módulo energético | Coberto |
| Geopolítica, notícias e redes sociais | Radar por exposição e confirmação econômica | Coberto |
| Planilhas do gerente | Auditoria, baseline legado e pauta do owner | Coberto, com autoridade pendente |
| Inferências identificadas | Registro separado e regra `PENDING_POLICY` | Coberto |
| Diagramas legíveis | Onze painéis 3600 × 2400 e SVG | Coberto |

## Achados

| ID | Severidade | Achado | Correção |
|---|---|---|---|
| R1-01 | Alto | A versão autoritativa entre os três arquivos do mesmo produtor não foi definida. | Manter os arquivos como camadas observadas e bloquear transformação em política até decisão do owner. |
| R1-02 | Médio | O roadmap possuía gates por fase, mas faltava uma definição consolidada de pronto para o MVP. | Adicionar critérios de conclusão do MVP e artefatos obrigatórios. |
| R1-03 | Médio | Métricas comerciais e operacionais do piloto estão descritas, mas seus valores-alvo não foram aprovados. | Registrar categorias de KPI com valor `PENDING_POLICY`, sem inventar thresholds. |
| R1-04 | Baixo | A relação entre planilha legado, motor determinístico e modelo preditivo poderia ser destacada novamente no aceite. | Exigir reconciliação do baseline e ganho incremental fora da amostra. |

## Coerência do produto

O produto permanece coerente como **decisão assistida por operação**, e não score universal. A sequência correta é grupo econômico, dívida, caixa, produção, posições, ativos, logística e eventos; somente depois PD/LGD/EAD. Regras legais, políticas, cálculos e decisão humana permanecem separadas.

## Gate

A rodada será aprovada após inserir no plano a definição de pronto e os KPIs pendentes de política, e após a suíte de integridade permanecer verde.
