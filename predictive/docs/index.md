# Modelagem Preditiva de Crédito Agro

Pacote de especificação e governança para a modelagem preditiva de crédito agro, com data-base **3 de setembro de 2026**. Foco inicial em soja no Mato Grosso, com arquitetura expansível.

> **O que este pacote é:** plano de trabalho, contratos de dados, catálogo de features, matrizes causais e de fontes, diagramas e cálculos de referência.
> **O que este pacote não é:** um modelo preditivo treinado. Sem histórico rotulado de decisões e desfechos de um credor-âncora, não existe base para uma PD própria validada.

## Navegação

| Documento | Conteúdo |
|---|---|
| [Status atual](status_atual.md) | Estado do pacote de origem: resultado das cinco revisões, arquivos principais, premissas e pendências |
| [Plano de trabalho](plano_trabalho.md) | Escopo, fora-de-escopo, Definition of Done, escada de modelos, roadmap de 18 meses e primeiros 90 dias |
| [Arquitetura de modelagem](arquitetura_modelagem.md) | Unidade de decisão, grafo de entidades, camadas de dados, os 17 motores separados, ponte planilha→plataforma |
| [Modelo de ativos e tecnologia](modelo_ativos_tecnologia.md) | Inventário por classe, campos mínimos do ativo, depreciação econômica, capex de reposição e custo all-in do crédito |
| [Pendências de política](pendencias_politica.md) | Índice consolidado dos 40 itens `PENDING_POLICY` e a segunda tag `PENDING_PRODUCT_DECISION` |
| [Auditoria](auditoria/logica_planilhas.md) | Lógica reconstruída das planilhas, inventário técnico folha a folha, observações e inferências, pauta de decisões de produto |
| [Revisões](revisoes/00_metodologia.md) | As cinco revisões do pacote de origem, a metodologia e o aceite por testes automatizados |
| Contratos de dados | Catálogo de features, matriz de fontes, matriz causal, dicionário de ativos e templates — tabela abaixo |
| [Fontes de pesquisa](fontes/fontes_dados.md) | Catálogo de fontes por domínio, com URLs e limitações |

## Contratos de dados

| Arquivo | Linhas | Conteúdo |
|---|---|---|
| `contratos/catalogo_features_v3.csv` | 92 features | Nome, granularidade, campos-fonte, cálculo, mecanismo econômico, tratamento de ausência e prioridade P0/P1/P2 |
| `contratos/matriz_fontes_v3.csv` | 50 fontes | BACEN, Receita Federal, MAPA/ZARC, CONAB, IBGE, INMET, satélite, B3/CME, ANP, ANEEL, ANTT, sanções ONU e outras |
| `contratos/matriz_causal_v3.csv` | 37 relações | Choque → exposição condicionante → mediador operacional → efeito financeiro → desfecho de crédito, com defasagens e contrafactual/placebo |
| `contratos/dicionario_inventario_ativos_v3.csv` | 73 campos | Inventário de máquinas, capacidade, depreciação e reposição |
| `contratos/contrato_fontes_template_v3.csv` | template | Contrato por fonte de dados |
| `contratos/contrato_regras_template_v3.csv` | template | Contrato por regra (legal, contratual, política do credor) |
| `contratos/workflow_decisao_template_v3.csv` | template | Registro dos quatro parceres de decisão separados |

## Cálculos portados para o backend

Os cálculos portados vivem no backend, em `services/portal-api/src/yatai_api/predictive/`:

| Módulo | Conteúdo |
|---|---|
| `domain/credit_math.py` | Depreciação econômica, capex de reposição, caixa disponível para serviço da dívida, DSCR, shortfall de liquidez de margem, overhead normalizado, XNPV e taxa efetiva anual all-in por bisseção |
| `domain/point_in_time.py` | Seleção point-in-time do registro vigente e legitimamente disponível no corte da decisão |

Ambos usam `Decimal`, não `float` — a precisão é requisito de auditoria, não preferência de estilo. Nenhum dos dois aplica corte de decisão: os thresholds não existem (ver [pendências](pendencias_politica.md)).

Além dos dois módulos de referência, o mesmo pacote tem a camada temporal especificada neste pacote: `temporal/` (carimbos de tempo, observação, portas, resolução, confiança, snapshot e feature store) e `adapters/memory_store.py`. O event store, o motor de decisão e os registros de decisão continuam especificação — não código.

O split em `services/` + `libs/shared/` ainda está em andamento: `domain/` e `temporal/` têm como destino `libs/shared/`, para ser uma biblioteca compartilhada e não duas cópias que divergem no corte point-in-time. Os caminhos acima são os vigentes, não o desenho final.

A suíte de integridade estrutural do pacote de origem também foi portada, em `services/portal-api/tests/predictive/test_docs_integrity.py`: ela verifica a existência dos documentos, o fechamento das referências numéricas, o esquema dos CSVs de contrato, as dimensões dos diagramas e a presença das tags de pendência. O gerador da folha de contato dos diagramas está em `services/portal-api/src/yatai_api/predictive/scripts/make_contact_sheet.py`.

## Princípios que atravessam todo o pacote

**Point-in-time.** Todo registro carrega `event_time`, `available_time`, `ingested_time`, `effective_from`/`effective_to`, `source_version` e `quality_status`. Um dado revisado nunca sobrescreve o valor que sustentou uma decisão passada.

**Seis categorias que não se misturam.** Fato · regra legal · regra contratual · política do credor (configurável por cliente) · feature preditiva · overlay temporário (com prazo, responsável e critério de saída).

**Quatro registros de decisão separados.** `model_recommendation`, `analyst_recommendation`, `credit_authority_decision`, `workflow_status` — mais o `override_record`. A recomendação do modelo nunca é apresentada como decisão.

**Limite técnico não deriva de PD.** É o mínimo entre necessidade comprovada, capacidade de serviço, caixa suportado nos cenários, limite de concentração e limite de colateral/política.

**Hierarquia de fallback.** Dado validado do produtor → fonte externa específica → benchmark regional → fallback sinalizado. Nunca imputação silenciosa.

## Escopo da integração

Todo o conteúdo do pacote de origem está integrado: documentação, contratos de dados, os 11 diagramas em SVG e em PNG de alta resolução, as cinco revisões do projeto com suas evidências, o inventário técnico das planilhas, os dois módulos de cálculo com testes e a suíte de integridade estrutural.

Isso inclui o que antes estava fora de escopo — o event store e a feature store temporal, os quatro registros de decisão, o motor de decisão e seus gates. **Integrado aqui significa especificação, não implementação em execução.** A persistência atual da plataforma é JSON com file lock, sobre a qual reprodutibilidade point-in-time não é implementável; a especificação define o contrato temporal que uma decisão de arquitetura de persistência precisa atender. O motor de decisão e os gates chegam com os thresholds ausentes e marcados: cada item viaja **com a tag** `PENDING_POLICY` ou `PENDING_PRODUCT_DECISION`, e nenhum foi convertido em número "típico" de mercado.

**Única exclusão:** os três arquivos `.xlsx` de origem. Eles contêm dados pessoais de um produtor real e não são versionados. Toda a lógica que deles foi extraída está reconstruída em [auditoria](auditoria/logica_planilhas.md) e [inventário técnico](auditoria/inventario_tecnico.md), com o produtor referido como `PRODUTOR_EXEMPLO` e os valores nominais do caso omitidos.

## Referências cruzadas

Link relativo só resolve dentro deste site. O que pertence ao site principal — buildado separadamente — é citado por seção ou por caminho no repositório, nunca por link relativo:

- Instruções de comportamento da IA e regras de governança: `agents.md` (raiz do repositório)
- Contrato consumido pelo backend — as cinco rotas `/api/risk/*`, os quatro serviços de fonte e a assimetria de falha entre eles: documentação técnica da plataforma, §6 "Mapa de Endpoints e Rastreabilidade" e §9.4 "Fontes de risco agro". Citamos por seção, não por caminho: os arquivos daquela pasta estão em renomeação.
- Descrição das fontes de dados: apenas neste pacote, em [fontes/fontes_dados.md](fontes/fontes_dados.md). A documentação técnica descreve o que o backend consome; não há terceira cópia.
