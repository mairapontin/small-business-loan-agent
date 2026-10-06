# Metodologia das cinco revisões do projeto atual

**Data-base:** 3 de setembro de 2026.  
**Escopo:** plano v3, catálogos de dados/features, matriz causal, arquitetura, análise das planilhas, fontes e onze diagramas finais.

Cada rodada terá objetivo próprio, testes independentes, achados classificados, correções e reexecução. Uma rodada não será contada apenas por reler o documento.

| Rodada | Foco | Testes mínimos | Gate de aprovação |
|---|---|---|---|
| 1 | Escopo e coerência de negócio | Cobertura dos requisitos do usuário, consistência entre sumário, módulos, roadmap e entregáveis | Nenhum requisito material sem destino, owner ou status |
| 2 | Dados e temporalidade | Imagens, referências, schema CSV, chaves, granularidade, timestamps, fontes e fallback | Dados críticos rastreáveis e sem uso de informação futura no desenho |
| 3 | Crédito e governança | Caixa, dívida, ativos, depreciação, custo do crédito, regras, decisões, alçadas e ambiguidades | Separação entre fato, regra, política, cálculo e decisão humana |
| 4 | Clareza visual e uso | Resolução, proporção, contraste, cortes, títulos, fluxo, leitura e consistência editorial | Todos os diagramas legíveis; texto sem contradições visuais |
| 5 | Regressão e aceite | Reexecução automatizada, hashes, cross-file, pendências, testes de cenários e pacote | Suíte verde e relatório de aceite reproduzível |

## Severidade

| Nível | Definição | Tratamento |
|---|---|---|
| Crítico | Pode induzir decisão de crédito incorreta, uso ilegal de dados ou vazamento temporal | Corrigir antes do gate |
| Alto | Lacuna relevante de cálculo, integridade, workflow ou explicação | Corrigir antes do pacote |
| Médio | Reduz clareza, robustez ou expansão | Corrigir ou registrar backlog com owner |
| Baixo | Melhoria editorial ou operacional | Registrar e priorizar |

## Regra sobre inferências

Fatos provenientes das planilhas, fontes ou confirmação do usuário serão separados de hipóteses. Toda conclusão não comprovada será escrita como **“Inferência:”**, com justificativa e ação de validação. Parâmetros não aprovados pelo dono do produto permanecerão `PENDING_POLICY`.

## Evidências por rodada

Cada revisão produzirá um relatório numerado, logs de testes, lista de correções e status final. Os arquivos originais do usuário não serão modificados. O snapshot e os hashes permitirão demonstrar o estado antes e depois das revisões.
