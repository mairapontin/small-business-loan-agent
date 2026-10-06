# Revisão 2 — dados, temporalidade, fontes e rastreabilidade

**Status final:** aprovado.  
**Testes finais da rodada:** 18 aprovados.

## Achados e correções

| ID | Severidade | Achado | Correção executada |
|---|---|---|---|
| R2-01 | Alto | A matriz de fontes descrevia acesso e limitações, mas não havia contrato operacional completo de fonte. | Criado `contrato_fontes_template_v3.csv` com owner, licença, retenção, classificação, base/consentimento, timestamps, revisão, schema, SLA e fallback. |
| R2-02 | Alto | O princípio point-in-time estava documentado, porém sem teste executável de seleção temporal. | Criados `temporal_reference.py` e cinco testes que excluem versões futuras, regras ainda não vigentes e registros expirados. |
| R2-03 | Médio | Fontes internas ou consentidas sem URL pública poderiam ser tratadas indevidamente como incompletas. | O teste agora exige URL para fontes públicas e permite ausência somente quando o modo de acesso está documentado e não é público. |
| R2-04 | Médio | O catálogo não possuía feature explícita para insuficiência de liquidez em chamada de margem. | Adicionada `margin_liquidity_shortfall`, com posição, linhas, caixa elegível, política de ausência e prioridade P0. |
| R2-05 | Médio | Regras tinham descrição conceitual, mas faltava contrato versionável para vigência, aprovação e override. | Criado `contrato_regras_template_v3.csv` e teste de campos mínimos. |
| R2-06 | Baixo | Os nomes reais dos schemas precisavam ser usados pelos testes. | Testes alinhados aos cabeçalhos observados, sem renomear dados por suposição. |

## Controles validados

| Controle | Resultado |
|---|---|
| Imagens e referências do relatório | Aprovado |
| Estrutura e unicidade do catálogo de features | Aprovado |
| URLs, limitações e prioridade das fontes | Aprovado |
| Mecanismo e contrafactual na matriz causal | Aprovado |
| Inventário de ativos com linhagem e financiamento | Aprovado |
| Feature store temporal | Aprovado em testes de corte |
| Contratos de fonte e regra | Aprovado |

## Gate

A rodada foi aprovada porque o projeto possui agora especificação e teste executável para a regra central: **uma decisão histórica não pode usar dado que ainda não estava disponível ou vigente no seu corte**.
