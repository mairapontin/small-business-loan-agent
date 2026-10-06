---
module: Yataí Finance
description: Deterministic workbook baseline and attributed financial modelling clarifications
category: documentation
type: evidence-register
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
file: backend/portal-api/src/predictive/docs/auditoria/logica_planilhas.md
file_visibility: public
source: Imported workbook audit and product-owner clarification on 2026-09-23
---

# Deterministic Financial and Credit Model — Workbook Evidence

Original audit reference date: 2026-09-03. Product-owner clarification: 2026-09-23.

## Role in the application

The modelling content in `docs/financial_model/` is the heart of the application's financial and credit analysis: the **deterministic part of client analysis**, as explicitly confirmed by the product owner. Given the same inputs, assumptions and formula version, calculations and defined stress scenarios must be reproducible. Estimated revenue or yield inputs do not make this arithmetic a trained predictive model.

The `backend/portal-api/src/predictive/` package develops the same financial domain: deterministic calculation primitives and temporal data selection exist; detailed cash-flow engines and statistical prediction remain separate implementation and validation work. See [architecture](../arquitetura_modelagem.md) and [package entry point](../index.md). The platform entry is `docs/documentation/technical-index.md`, built as a separate documentation site.

> **Aviso de anonimização.** Este documento foi portado da auditoria original substituindo a identidade do produtor e os valores específicos do caso por dados sintéticos. O produtor é referido como `PRODUTOR_EXEMPLO` e o caso como `CASE_SYNTH_0001`. As fórmulas, a estrutura das folhas e as regras metodológicas são as observadas nos arquivos originais e não foram alteradas. Os arquivos `.xlsx` de origem contêm dados pessoais e **não são versionados neste repositório**.

> Evidence rule: distinguish original audit observations, **Provided clarification** from the product owner, and **Inference:** for deductions. The 2026-09-23 clarification is not independent workbook verification. A technically stable formula does not establish approved business policy.

## 1. Papel observado de cada arquivo

| Arquivo | Papel observado | Componentes centrais |
|---|---|---|
| `260619-credit-model-final-checked-v11.xlsx` | Modelo de análise de crédito de um caso identificado como `PRODUTOR_EXEMPLO` | Readout, histórico/projeção, premissas, produção, terras, ativos, passivos, SCR, preço, modelo de uma safra, flags e histórico de dívida |
| `Financial model_last version.xlsx` | Normalized workbook prepared for system implementation | Normalized visible sheets; calculation memory; glossary; dictionaries; validation, source and audit sheets marked `veryHidden` in the original audit |
| `financial_model.xlsx` | Pacote ampliado de requisitos, QA, abas legadas, abas derivadas e estruturas para IA/TI | Requisitos de sistema, instruções de IA, tags, QA, modelo legado, múltiplas abas duplicadas e tabelas normalizadas |

All three filenames above were confirmed under `docs/financial_model/`. The original audit calls the second file `Financialmodel_lastversion.xlsx`; that is not its current local filename, and historical hash equivalence was not reverified.

**Provided clarification, 2026-09-23:** the contents relate to the same anonymized case, but this does not establish whether the other two workbooks are earlier revisions or separate analyses of that case. Repeated identity, sheets or formulas alone do not establish revision order. Workbook authority and lineage remain unconfirmed.

## 2. Fluxo de cálculo observado no modelo de crédito

```text
Dados do produtor + produção + preço + terras + ativos + passivos + SCR
                              ↓
                 Premissas e verificações de fonte
                              ↓
        Cenário produtor + regional + base conservadora + stress
                              ↓
       Receita agrícola − custo direto = contribuição bruta agrícola
                              ↓
 Contribuição bruta − overhead proxy = EBITDA proxy de crédito
                              ↓
 Juros modelados + principal ≤360 dias = serviço da dívida proxy
                              ↓
 DSCR, alavancagem, liquidez, cobertura de CPR e caixa após dívida
                              ↓
      Readout + pendências + gates documentais + revisão de Crédito
```

O arquivo declara a regra de base conservadora como **menor receita entre produtor e regional** e **maior custo entre produtor e regional**. No estado atual do caso, o custo regional é apenas o custo do produtor multiplicado por 1,00, até a carga de orçamento regional.

## 3. Premissas e fórmulas centrais

| Indicador | Fórmula observada | Observação de governança |
|---|---|---|
| Crop revenue | Area, yield and price projection; the credit base uses the lower producer/regional estimate | Provided clarification defines `net_sales` as estimated agricultural revenue, not reconciled accounting net revenue. |
| Custo direto | Área × custo/ha ou valor da fonte | Benchmark regional ainda é proxy no caso observado |
| Contribuição bruta | Receita − custo direto | Antes de overhead e itens financeiros |
| Overhead proxy | Receita × 30% | Declarado como proxy de Crédito, não overhead contábil auditado. Quando substituir pelo realizado é `PENDING_POLICY` |
| EBITDA proxy de crédito | Contribuição bruta − overhead proxy | Não deve ser apresentado como EBITDA contábil |
| Serviço da dívida proxy | Juros modelados + principal com vencimento em até 360 dias | A própria planilha diz que não é cronograma contratual completo. Escopo definitivo é `PENDING_POLICY` |
| DSCR proxy | EBITDA proxy ÷ serviço da dívida proxy | Histórico aparece como N/D quando não há serviço compatível |
| Dívida de underwriting | Base derivada do SCR; usar SCR quando maior que o detalhe do produtor | Exige reconciliação com contratos e duplicidades. Tolerância de reconciliação é `PENDING_POLICY` |
| Dívida/EBITDA | Dívida de underwriting ÷ EBITDA proxy | EBITDA não positivo no stress é representado como 999× |
| Liquidez/dívida de curto prazo | Liquidez elegível ÷ principal em até 360 dias | Depende de haircuts e disponibilidade dos ativos líquidos — `PENDING_POLICY` |
| Cobertura de CPR | Valor conservador de volume/preço convertido ÷ valor do prepay | A fórmula precisa ser confirmada por produto, moeda e obrigação física — `PENDING_POLICY` |
| Caixa após dívida | EBITDA proxy + prepay em BRL − juros − principal em até 360 dias | Antes de dividendos, capex e detalhamento de capital de giro |
| Necessidade de nova dívida | `MAX(0; -caixa após dívida)` | Mede funding gap no proxy atual |

## 4. Construção de cenários observada

| Cenário | Regra observada |
|---|---|
| Produtor | Valores informados ou provenientes do modelo do produtor |
| Regional | Benchmark de preço e, quando disponível, produtividade/custo regional |
| Base de Crédito | Receita conservadora e custo conservador |
| Stress | Produtividade × 0,85; preço × 0,90; custo × 1,10 |

O stress é genérico. A própria planilha registra que não há evento climático nomeado. Portanto, ela não representa, no estado atual, seca, enchente, praga, choque de fertilizante, interrupção logística, guerra, sanção ou chamada de margem como eventos separados. A cobertura mínima de cenários nomeados é `PENDING_POLICY`.

## 5. Gates e decisão

The original audit records a blank `Preliminary decision` field and a separate instruction to proceed conditionally until gates and documents are cleared. **Provided clarification, 2026-09-23:** this allows continued analysis only; it is not approval or authorization to disburse. The final-decision record, official statuses and approval authority remain unconfirmed.

The earlier audit's statement that numeric gate values do not exist is superseded by the supplied clarification below. These are **reported parameters currently used in the workbook model**, not independently reverified cell evidence or approved credit policy.

| Gate | Reported workbook parameter | Reported formula scenario |
|---|---|---|
| DSCR | Minimum 1.00x | Base |
| Debt / EBITDA | Maximum 3.50x | Base and stress |
| Liquidity / short-term debt | Minimum 0.50x | Base |
| CPR coverage | Minimum 1.30x | Stress |

Keep these values as the documented model baseline. Official policy adoption remains `PENDING_POLICY`; neither passing a formula nor the conditional-advancement instruction substitutes for a human credit decision.

## 6. Lacunas reconhecidas pelos próprios arquivos

| Lacuna | Estado observado | Efeito |
|---|---|---|
| P&L 22/23A | Aberta | Histórico de três safras incompleto |
| Preços históricos por cultura | Aberta, severidade alta | Não permite validar o preço projetado contra três anos |
| Histórico SCR | Doze meses; 36 meses não carregados | Tendência parcial |
| Produtividade/custo regional | Proxy | Base conservadora ainda precisa de benchmark validado |
| Área irrigada | Suporte pendente | Atributo produtivo não confirmado |
| Garantias | Constituição/perfeição pendente | Colateral não pode ser tratado como plenamente disponível |
| `net_sales` | Meaning clarified on 2026-09-23; no accounting reconciliation established | Label as estimated agricultural revenue; do not present it as accounting net sales. |

## 7. Controles técnicos observados

Os três arquivos são pacotes XLSX íntegros, sem VBA e sem vínculos externos OOXML. Cópias isoladas foram recalculadas e os valores das fórmulas permaneceram iguais aos caches originais, sem novos erros. Há fórmulas que retornam vazio por desenho; sua existência não é automaticamente erro.

No layout de impressão, alguns números aparecem como `###` por largura insuficiente de coluna. Isso é um problema de apresentação, não prova de falha da fórmula.

## Product-owner clarifications (2026-09-23)

**Evidence status:** the following records the clarification supplied by the product owner, not a new independent inspection or recalculation of workbook cells. It supersedes earlier unanswered questions or conflicting audit assertions on these topics without turning them into approved production policy.

| Topic | Supplied clarification and modelling treatment | Remaining boundary |
|---|---|---|
| Three workbooks | Their contents relate to the same anonymized credit case, with multiple sheets and internal versions. | **Product-owner decision, 2026-10-01:** none of the workbooks on disk is the platform baseline — a new model will be authored as the single authoritative source. Supersession is citation-only (tracked in #222). |
| `net_sales` | Estimated agricultural revenue based on area, yield and price. Credit analysis uses the lower of the producer projection and the regional reference. Treat the concept as estimated agricultural revenue, not accounting net sales. | No reconciliation establishes deductions for taxes, returns or commercial discounts. A clearer field name is a proposed schema change, not an implemented rename. |
| Conditional advancement | "Proceed conditionally" means the analysis may continue while requirements remain outstanding. It is neither approval nor permission to disburse. | Final-decision location, official statuses and authorized approvers remain undefined. Keep analyst recommendation, authority decision and release conditions separate. |
| Numeric gates | Preserve the reported model parameters and scenario-specific tests in the gate table above. | Adoption as official policy remains `PENDING_POLICY`; do not invent other cutoffs or treat a passing formula as authorization. |
| Debt service | Retain estimated interest plus principal due within 360 days as the current approximation. The proposed evolution is a complete maturity schedule covering barter, suppliers, CPR, leases and derivatives. | Separate cash payments from physical deliveries; do not recount costs already deducted from operating cash flow. Show contingent liabilities and their call impact separately. The complete schedule is not implemented by this clarification. |
| Co-obligations | Keep separate from direct debt, identifying debtor, guarantor and guaranteed obligation. Assess a full-call scenario after removing amounts already present in consolidated debt. | Do not apply probability weights without a defined methodology. This scenario is not an instruction to add the same exposure twice to baseline debt. |
| Prepay and physical CPR | The foreign-currency prepay is specific to the case, not a fixed product standard. Amount, tenor, crop, volume and guarantees must be adjustable per operation. | Reconcile disbursement and physical-delivery dates with the crop season used in projections. Case amounts, identity and crop remain omitted from this versioned register. |
| Group assets | Reconstruct beneficial ownership, economic control, revenue flows, liabilities and assets or guarantees legally available to the operation. | Distribution among individuals, companies and relatives does not itself establish tax irregularity. Relatives' assets are unavailable without verified participation and formalized guarantees. |

### Remaining confirmations

- **Workbook authority and lineage:** **Resolved 2026-10-01** — none of the workbooks on disk is the platform baseline; a new model will be authored as the single authoritative source (tracked in #222).
- **Decision governance:** identify the final record, official workflow statuses and authorized approvers.
- **Policy adoption:** validate the reported numeric parameters as official rules, including exceptions and their consequences.
- **Crop and operation dates:** confirm that funding, maturity, delivery and projected crop season are consistent.

Other unresolved policy topics, such as overhead composition, eligible assets and haircuts, remain in the [policy register](../pendencias_politica.md). This clarification does not approve those unrelated items or establish workbook-to-code parity.

---

**Origem:** `credito_agro_status_atual_2026-09-03/auditoria_planilhas/reconstrucao_logica_modelos.md`
**Índice de pendências:** [Pendências de política](../pendencias_politica.md)
