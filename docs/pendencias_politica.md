---
module: Yataí Finance
description: Financial and predictive modelling policy decisions and clarification status
category: documentation
type: policy-register
example:
id:
status: New
version: 1.1.0
author: Qoder
ai_author: ai_made
author_date: 2026-09-23T15:04:47
reviewer:
ai_reviewer:
reviewer_date:
updated: 2026-10-02T15:42:01
file: backend/portal-api/src/predictive/docs/pendencias_politica.md
file_visibility: public
source: Existing policy register and product-owner clarification on 2026-09-23
---

# Financial and Predictive Modelling Policy Register (`PENDING_POLICY`)

This register tracks decisions required before the deterministic financial baseline and its predictive extension become automatic platform rules. The 40 topic identifiers remain stable; they are not a count of wholly unanswered questions.

**Clarification update, 2026-09-23:** [the workbook register](auditoria/logica_planilhas.md#product-owner-clarifications-2026-09-23) records the supplied answers and remaining decisions. Agricultural revenue meaning and the case-specific nature of the prepay are clarified; debt-service and co-obligation treatment have a stated modelling direction. Reported numeric workbook gates exist, but adoption as official policy remains pending. These statements are attributed clarifications, not a new workbook audit or approval of production rules.

**Regra de ouro:** enquanto um item desta lista estiver aberto, o sistema exibe a tag `PENDING_POLICY` e apresenta intervalos ou cenários. **Não são inseridos números "típicos" de mercado como se fossem política vigente.** Isso decorre da regra de não-alucinação do `agents.md` (§2): se faltar dado, reporte a ausência.

Origem: §17 do [Plano de trabalho](plano_trabalho.md), §3.4 (gates de Definition of Done) e §5/§8 da [Reconstrução da lógica das planilhas](auditoria/logica_planilhas.md).

---

## 1. Definições de negócio

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 1 | Master workbook | **Resolved 2026-10-01:** none of the workbooks on disk is the platform baseline — a new model will be authored as the single authoritative source. Supersession is citation-only. | Tracked in #222. The existing files remain local evidence until the audit register is re-derived from the new model. |
| 2 | Target product | Clarified as case-specific prepay, not a fixed product standard. Confirm reusable product parameters and crop-date consistency. | Amount, tenor, crop, volume and guarantees must not become universal constants. |
| 3 | `net_sales` | Clarified as estimated agricultural revenue using the lower producer/regional projection. Formal schema naming and accounting reconciliation remain separate work. | Do not present the value as accounting revenue net of taxes, returns or commercial discounts. |
| 4 | Overhead | Quando usar o proxy de 30%; quais contas o substituem; quais itens evitar duplicar? | Geração de caixa e reason code |
| 5 | Rótulo (label) | O que é default e qual janela? Como tratar renegociação e recuperação judicial? | Treino, validação e métricas |
| 6 | Retiradas familiares | O que é retirada normalizada e o que é despesa operacional? | Caixa disponível |
| 7 | Custeio | Como equalizar preço, prazo, garantias e encargos entre barter, CPR, fornecedor e banco? | Margem e escolha de funding |
| 8 | Crédito de investimento | Quais encargos, indexadores, moeda, carência e balão compõem o custo all-in? | VPL, DSCR e capacidade |

## 2. Gates e limites

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 9 | Gates | Validate the reported workbook parameters and scenario-specific tests as official policy; define exceptions and consequences. | The values are recorded in the workbook register, not silently promoted to production cutoffs — `PENDING_POLICY`. |
| 10 | Debt service | Retain the current proxy for comparison; develop the full maturity schedule with cash/physical separation and no duplicated operating costs. | Clarified modelling direction; detailed implementation and policy approval remain separate work. Contingent calls are shown separately. |
| 11 | Co-obligations | Separate from direct debt; identify parties and obligation; assess a deduplicated full-call scenario. | Clarified modelling direction; no probability weighting without a defined methodology. |
| 12 | Patrimônio | Quais ativos, haircuts, gravames e regimes são elegíveis? | LGD e limite |
| 13 | Tolerância de reconciliação | Qual divergência é aceitável entre SCR, contratos e ERP? | Gate de reconciliação financeira |

Os itens 32 a 40 abaixo pertencem à mesma seção temática — todos são cortes numéricos — e por isso continuam a
numeração global. Ela aparece fora de ordem sequencial de propósito: **o número é identificador estável, não
posição**. Renumerar para restabelecer a sequência quebraria as referências feitas a estes itens.

Eles vêm da especificação do motor de risco agro (`docs/documentation/data-sources-agro.pt.md`), que fixou
valores sem origem. Dois deles já existem no código como constante — marcados com ◆ — e os demais
dependem de uma fonte que **não está integrada**, listado na última coluna.

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 32 | Score composto agro | Pesos das oito dimensões (custo, ZARC, clima, defensivo, uso do solo, desmatamento, falha de safra, autodeclaração) | Não há motor de decisão. Os pesos da especificação somam 1.0 sem justificativa derivada de amostra |
| 33 | Falha de safra por NDVI | Corte de NDVI médio no auge da safra (a especificação usa `< 0.3`) e o peso do alerta (`+25 pts`) | Sentinel-2/NDVI não está integrado. Sem calibração por bioma, cultura nem fenologia |
| 34 | Mudança de uso por embedding | Limiar de similaridade entre embeddings de safras consecutivas (`< 0.8`) e o peso (`+25 pts`) | AlphaEarth/Satellite Embedding não está integrado. A similaridade de cosseno não é calibrada por tipo de cobertura |
| 35 | Passivo ambiental preditivo | Probabilidade de desmatamento a partir da qual se alerta (`> 0.6`) e o peso (`+15 pts`) | Sem acesso à fonte de probabilidade; calibração do estimador indefinida |
| 36 | Janela de plantio ZARC | Multiplicador aplicado quando o plantio cai fora da janela segura (a especificação diz `+30%`; o código devolve `1.3`) | ◆ **já existe no código** como constante e nunca foi aprovado. Sensibilidade de default não calibrada |
| 37 | Estresse hídrico | Precipitação acumulada em 30 dias abaixo da qual a operação é crítica (`< 50 mm`) e o peso (`+20 pts`) | Agritempo não tem integração funcional. O limiar é absoluto: não varia por cultura, solo nem fase fenológica |
| 38 | Subdeclaração de custo | Razão entre custo declarado e referência oficial abaixo da qual se suspeita de fraude (`< 0.6`) e o peso (`+40 pts`) | ◆ **já existe no código** como constante. O ponto é proxy de fraude sem amostra que o sustente |
| 39 | Desvio de custo | Desvio absoluto tolerado entre custo declarado e referência (`> 30%`) e o peso (`+15 pts`) | Convive com o item 38 sem que a prioridade entre os dois esteja definida |
| 40 | Defensivo sem registro | Pontos por produto sem registro na cultura declarada (`+10 pts` por produto) e o teto de acumulação | Agrofit sem ingestão funcional. Sem teto, a regra pode dominar o score sozinha |

## 3. Grupo e governança

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 14 | Economic group | Clarified objective: establish beneficial ownership, control, flows, obligations and legally available guarantees. Detailed eligibility evidence remains to be specified. | Neither family ownership nor a fragmented formal structure implies tax irregularity or makes relatives' assets available. |
| 15 | Final decision | Which record is authoritative, and which official statuses and approval authorities apply? | Conditional advancement means continued analysis, not credit approval or permission to disburse. |
| 16 | Override | Motivos, aprovadores, validade e monitoramento | Aprendizagem e risco de modelo |
| 17 | Gestão | Pilares de equipe e tecnologia entram como veto, subscore, overlay ou reason code? | Governança e necessidade de amostra |
| 18 | Novelty | Quem aplica overlay, por quanto tempo e como encerra? | Governança de risco emergente |

## 4. Ativos, capacidade e depreciação

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 19 | Máquinas e capacidade | Quais operações, janelas e margens de capacidade são mínimas? Como tratar terceirização? | Inventário, capacidade e alertas |
| 20 | Depreciação | Qual método e fonte serão aceitos por classe de ativo? | Custo/ha, LGD e comparabilidade |
| 21 | Reposição | Quais gatilhos, horizontes e reservas entram no caso-base e no stress? | Fluxo de caixa e dívida futura |

## 5. Dados externos e sinais

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 22 | Market data | Qual latência é necessária por usuário/produto? | Arquitetura e orçamento de dados |
| 23 | Derivativos | Quais instrumentos e bolsas entram; quem valida a posição? | Motor de payoff, margem e suitability |
| 24 | Logística | Usar contrato, CT-e ou benchmark, e qual política de fallback? | Grafo e cenários de interrupção |
| 25 | Energia | Quais processos críticos e evidências serão coletados? | Features de custo e resiliência |
| 26 | Eventos globais | Quais exposições e níveis acionam alerta ou revisão? | Grafo de propagação e SLA |
| 27 | Redes sociais | Fontes, autores, confirmação, retenção e ação permitida | Controles e risco reputacional |

## 6. Piloto e aceite

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 28 | Piloto | Metas de redução de tempo, divergência, perda, alertas e adoção | Go/no-go e contrato comercial |
| 29 | Cobertura de cenários | Cobertura mínima de choques nomeados para liberar o gate | Gate de cenários |
| 30 | Shadow mode | Amostra e duração mínimas | Gate de shadow mode |
| 31 | Resultado econômico | Valores-alvo de tempo, aprovação, bad rate, perda, alertas e adoção | Gate de resultado econômico |

---

## Efeito no código portado

The ported modules — `backend/portal-api/src/predictive/domain/credit_math.py` and `backend/portal-api/src/predictive/domain/point_in_time.py` — provide deterministic financial calculations and point-in-time selection, respectively; neither applies a credit-decision cutoff. Reported workbook thresholds are now documented, but their existence is not official policy approval. A decision engine consuming these calculations must preserve `PENDING_POLICY` instead of issuing a verdict based on an unapproved rule.

Nos cortes agro (itens 32 a 40) a situação é pior e por isso registrada aqui: dois valores ◆ já existem no código como constante e **nunca foram aprovados** — o multiplicador de janela de plantio ZARC (`risk_multiplier = 1.3` em `backend/portal-api/src/routers/risk_engine.py`) e o proxy de subdeclaração de custo. Não é um cálculo portado que os aplicou: é a especificação do motor de risco agro que virou número fixo antes de qualquer decisão de produto.

---

## Segunda tag: `PENDING_PRODUCT_DECISION`

A [pauta de decisões de produto](auditoria/pauta_decisoes_produto.md) usa uma tag distinta, e as duas não se confundem:

| Tag | O que bloqueia | Onde vive |
|---|---|---|
| `PENDING_POLICY` | Threshold, cutoff, haircut ou gate numérico que viraria regra automática | Os 40 itens deste índice |
| `PENDING_PRODUCT_DECISION` | Definição de escopo, conceito ou governança que precede qualquer threshold | §3 da pauta de decisões de produto; veto agro e tratamento da ausência de dado em §2.10 |

Os oito artefatos que o dono do produto precisa aprovar para fechar a segunda tag — dicionário de conceitos, política de consolidação de grupo, matriz de dívida e caixa, workflow de decisão e alçadas, gates iniciais, tratamento das garantias, biblioteca de cenários e versão autoritativa do modelo — estão listados na §3 daquele documento. Enquanto um deles estiver aberto, os itens correspondentes permanecem marcados e **não são convertidos silenciosamente em fórmula ou feature**.
