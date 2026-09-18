# Revisão 5 — testes automatizados, regressão e aceite

**Status final:** aprovado.  
**Suíte:** 35 testes aprovados.  
**Cobertura dos cálculos de referência:** 97% total; módulo temporal 100%.

## Escopo testado

| Família | Cobertura |
|---|---|
| Integridade documental | Arquivos, imagens, referências, marcadores e tópicos obrigatórios |
| Catálogos | Schema, unicidade, cobertura, fontes, limitações e prioridades |
| Temporalidade | Corte por disponibilidade, vigência, versão e expiração |
| Finanças | Depreciação, reposição, caixa, DSCR, overhead e custo efetivo |
| Mercado | Liquidez para margem e insuficiência de caixa elegível |
| Governança | Contratos de fonte, regra e decisão; evidências das revisões |
| Visual | Onze diagramas em 3600 × 2400 e onze SVGs |

## Revisão dos próprios testes

A primeira execução revelou que alguns testes usavam nomes de campos presumidos em vez dos cabeçalhos reais. Isso foi corrigido por inspeção direta dos arquivos. Também foi corrigida a regra de URL para distinguir fonte pública de fonte interna ou consentida. A cobertura inicialmente não coletou dados por nome incorreto dos módulos; o comando foi corrigido e reexecutado. Por fim, foram adicionados testes de erro e monotonicidade financeira.

| Achado do teste | Tratamento |
|---|---|
| Ausência da expressão explícita `risco geopolítico` | Plano ajustado |
| Ausência de `margin_liquidity_shortfall` | Feature P0 adicionada |
| Schema de feature presumido | Teste alinhado ao arquivo observado |
| Fonte interna sem URL | Regra de teste diferenciada |
| Schema causal presumido | Teste alinhado ao cabeçalho real |
| Cobertura não coletada | Configuração corrigida e suíte repetida |
| Título visual cortado | Renderizador corrigido e todos os painéis regenerados |

## Limitações do aceite

Os testes validam o **projeto atual**, seus contratos e cálculos de referência; eles ainda não validam um modelo preditivo treinado, pois não há base histórica rotulada do credor-âncora. Thresholds de política continuam `PENDING_POLICY`. Os três arquivos de Excel foram confirmados como o mesmo produtor, mas a versão autoritativa ainda deve ser escolhida pelo dono do produto.

## Evidências

Os resultados estão em [`05_pytest_regressao_final.txt`](evidencias/05_pytest_regressao_final.txt), [`05_junit_projeto.xml`](evidencias/05_junit_projeto.xml), [`05_coverage_projeto.xml`](evidencias/05_coverage_projeto.xml), [`05_validacao_estrutural_final.txt`](evidencias/05_validacao_estrutural_final.txt) e na [folha de contato visual](evidencias/04_contato_diagramas.png).

> **Gate final do status atual:** aprovado para empacotamento e para servir de especificação de entrada do backend.
