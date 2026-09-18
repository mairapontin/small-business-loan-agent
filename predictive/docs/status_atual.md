# Status do pacote de origem — modelagem preditiva de crédito agro

**Data-base:** 3 de setembro de 2026.
**Foco:** soja em Mato Grosso, com arquitetura expansível.
**status** plano, contratos de dados, catálogos e cálculos de referência aprovados em cinco revisões; backend ainda não incluído neste snapshot.

> Este documento é o registro de aceite do pacote original, portado para o repositório. Os caminhos da tabela abaixo já apontam para o destino no `yatai-dev`, não para o pacote de origem.

## Resultado das cinco revisões

| Rodada | Foco | Resultado |
|---|---|---|
| 1 | Escopo e coerência de negócio | Aprovada após definição de pronto do MVP |
| 2 | Dados, temporalidade e fontes | Aprovada após contratos e testes point-in-time |
| 3 | Finanças, crédito e governança | Aprovada após testes financeiros e contrato decisório |
| 4 | Diagramas e clareza | Aprovada após correção de título cortado e nova renderização |
| 5 | Regressão e aceite | 35 testes aprovados; 97% de cobertura nos cálculos de referência |

## Arquivos principais

| Caminho no repositório | Conteúdo |
|---|---|
| [`plano_trabalho.md`](plano_trabalho.md) | Plano integral revisado |
| [`modelo_ativos_tecnologia.md`](modelo_ativos_tecnologia.md) | Ativos, tecnologia, depreciação e custo do crédito |
| `diagramas/` | Onze painéis PNG 3600 × 2400 e SVG vetorial |
| `contratos/` | Features, fontes, matriz causal, inventário de ativos e templates de fonte/regra/decisão |
| `revisoes/` | Metodologia e relatórios das cinco revisões, com as evidências de execução |
| `../../back/` | Cálculos de referência portados e sua suíte de testes |
| `auditoria/` | Reconstrução lógica, observações e pauta para o dono do produto |
| `fontes/` | Fontes técnicas, legais, financeiras, operacionais e de risco |
| [`revisoes/evidencias/SHA256SUMS_pacote_origem.txt`](revisoes/evidencias/SHA256SUMS_pacote_origem.txt) | Integridade dos arquivos no pacote de origem |

> Os hashes de `SHA256SUMS_pacote_origem.txt` referem-se aos arquivos **como estavam no pacote de origem**. Documentos renomeados ou anonimizados durante a integração não conferem com esses valores; o arquivo serve como prova de proveniência, não como verificação do conteúdo integrado.

## Premissas e pendências

Os três Excel representam o mesmo produtor. Nenhuma versão foi declarada autoritativa; portanto, o pacote não transforma automaticamente um arquivo em política oficial. `net_sales`, gates de aprovação, tratamento de coobrigações, serviço completo da dívida e metas do piloto continuam dependentes de aprovação do dono do produto. Esses pontos permanecem identificados como `PENDING_POLICY` ou pergunta contextualizada — ver [pendências de política](pendencias_politica.md) e [pauta de decisões](auditoria/pauta_decisoes_produto.md).

Os cálculos incluídos servem como referência e teste. Eles não substituem validação jurídica, contábil, agronômica, atuarial ou de risco independente. Não há modelo preditivo treinado sem base histórica rotulada do credor-âncora.

## Execução dos testes

No pacote de origem, a suíte rodava com `PYTHONPATH=testes python3 -m pytest -q testes` e registrou **35 testes aprovados**. As evidências JUnit, cobertura e validação estrutural estão em [`revisoes/evidencias/`](revisoes/evidencias/SHA256SUMS_pacote_origem.txt).

No repositório, os cálculos portados e o teste de integridade documental rodam a partir de `services/portal-api/`, no escopo `yatai_api/predictive/`:

```bash
pytest tests/predictive
```
