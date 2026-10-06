# Revisão 3 — finanças, crédito, regras e governança

**Status final:** aprovado.  
**Testes finais da rodada:** 27 aprovados.

## Achados e correções

| ID | Severidade | Achado | Correção executada |
|---|---|---|---|
| R3-01 | Alto | As fórmulas financeiras estavam descritas, mas não existia uma bateria executável de invariantes. | Criados cálculos de referência e nove testes para depreciação, reposição, caixa, DSCR, margem, overhead e custo efetivo. |
| R3-02 | Alto | Depreciação econômica poderia ser confundida com saída de caixa ou capex. | Testes separam depreciação não caixa, manutenção paga e capex de reposição no horizonte. |
| R3-03 | Alto | Taxa nominal poderia ocultar encargos e diferença entre valor financiado e liberado. | Implementado teste de taxa all-in com fluxo datado, valor recebido e pagamentos. |
| R3-04 | Médio | O proxy de overhead poderia duplicar despesas já classificadas. | Criada função de normalização e teste que deduz sobreposições sem gerar overhead negativo. |
| R3-05 | Alto | A chamada de margem exigia teste de liquidez elegível, não apenas valor de MTM. | Criado teste de `margin_liquidity_shortfall` com caixa e linhas comprometidas. |
| R3-06 | Médio | A separação de decisão estava conceitual, sem contrato de dados próprio. | Criado `workflow_decisao_template_v3.csv` com recomendação, parecer, alçada, condições, versões e override. |
| R3-07 | Alto | Regras legais, contratos e políticas não podem ser promediados em score. | Mantida separação por categoria, vigência, aprovação e possibilidade de override no contrato de regras. |

## Invariantes aprovados

| Invariante | Resultado |
|---|---|
| Depreciação não é descontada novamente do caixa se o caixa operacional já é antes de encargos não caixa | Aprovado |
| Reposição entra pelo desembolso líquido do valor de baixa | Aprovado |
| DSCR exige serviço da dívida positivo e contratual | Aprovado |
| Custo efetivo usa todos os fluxos e datas | Aprovado |
| Liquidez de margem usa somente caixa e linhas elegíveis | Aprovado |
| Overhead não duplica custo já classificado | Aprovado |
| Parecer do analista e decisão da alçada são registros distintos | Aprovado no contrato |

## Governança

Estruturas PF/PJ/família serão avaliadas por evidência de controle, benefício, fluxo, obrigação e disponibilidade ao credor. O sistema não inferirá evasão fiscal ou fraude a partir da pulverização patrimonial. Suspeitas e divergências gerarão diligência e revisão autorizada, não acusação automática.

## Gate

A rodada foi aprovada porque as principais distinções financeiras e decisórias agora possuem especificação e teste reproduzível. Valores de corte continuam `PENDING_POLICY` até decisão do dono do produto.
