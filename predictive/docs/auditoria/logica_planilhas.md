# Reconstrução da lógica observada nas três planilhas

Data de referência: 3 de setembro de 2026.

> **Aviso de anonimização.** Este documento foi portado da auditoria original substituindo a identidade do produtor e os valores específicos do caso por dados sintéticos. O produtor é referido como `PRODUTOR_EXEMPLO` e o caso como `CASE_SYNTH_0001`. As fórmulas, a estrutura das folhas e as regras metodológicas são as observadas nos arquivos originais e não foram alteradas. Os arquivos `.xlsx` de origem contêm dados pessoais e **não são versionados neste repositório**.

> Regra metodológica: toda afirmação sem o prefixo **Inferência:** foi diretamente observada em células, fórmulas, metadados ou documentação interna dos arquivos. Uma fórmula tecnicamente estável não implica que sua definição de negócio esteja aprovada.

## 1. Papel observado de cada arquivo

| Arquivo | Papel observado | Componentes centrais |
|---|---|---|
| `260619-credit-model-final-checked-v11.xlsx` | Modelo de análise de crédito de um caso identificado como `PRODUTOR_EXEMPLO` | Readout, histórico/projeção, premissas, produção, terras, ativos, passivos, SCR, preço, modelo de uma safra, flags e histórico de dívida |
| `Financialmodel_lastversion.xlsx` | Workbook normalizado e preparado para implementação em sistema | Quinze folhas visíveis normalizadas; memória de cálculo; glossário; dicionários; validações; fontes e auditorias em folhas `veryHidden` |
| `financial_model.xlsx` | Pacote ampliado de requisitos, QA, abas legadas, abas derivadas e estruturas para IA/TI | Requisitos de sistema, instruções de IA, tags, QA, modelo legado, múltiplas abas duplicadas e tabelas normalizadas |

Os três arquivos são versões ou camadas derivadas do mesmo caso-base, e não três produtores diferentes. A evidência é a repetição do produtor, de `CASE_SYNTH_0001`, das folhas, fórmulas e valores. Qual deles é a versão autoritativa permanece `PENDING_POLICY`.

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
| Receita da safra | Volume/projeção multiplicado por preço; cenário base usa menor visão entre produtor e regional | `net_sales` ainda não tem definição final aprovada — `PENDING_POLICY` |
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

As folhas de roteiro e mapa de preenchimento registram os gates de DSCR, alavancagem, liquidez, cobertura de CPR e documentação. O readout principal exibe `Preliminary decision`, mas a área observada não contém valor preenchido. Outra folha afirma que a decisão é "avança condicionado" até que os gates e documentos sejam liberados.

Os cortes numéricos desses gates **não existem nos arquivos** e permanecem `PENDING_POLICY`. Não devem ser preenchidos com valores "típicos" de mercado.

**Inferência:** a decisão final provavelmente é registrada manualmente fora da célula do readout ou ainda não foi ligada à apresentação principal. Não há evidência suficiente para afirmar qual campo é o registro mestre da decisão — `PENDING_POLICY`.

## 6. Lacunas reconhecidas pelos próprios arquivos

| Lacuna | Estado observado | Efeito |
|---|---|---|
| P&L 22/23A | Aberta | Histórico de três safras incompleto |
| Preços históricos por cultura | Aberta, severidade alta | Não permite validar o preço projetado contra três anos |
| Histórico SCR | Doze meses; 36 meses não carregados | Tendência parcial |
| Produtividade/custo regional | Proxy | Base conservadora ainda precisa de benchmark validado |
| Área irrigada | Suporte pendente | Atributo produtivo não confirmado |
| Garantias | Constituição/perfeição pendente | Colateral não pode ser tratado como plenamente disponível |
| `net_sales` | Revisão de negócio — `PENDING_POLICY` | Risco de confundir receita agrícola de crédito com receita contábil líquida |

## 7. Controles técnicos observados

Os três arquivos são pacotes XLSX íntegros, sem VBA e sem vínculos externos OOXML. Cópias isoladas foram recalculadas e os valores das fórmulas permaneceram iguais aos caches originais, sem novos erros. Há fórmulas que retornam vazio por desenho; sua existência não é automaticamente erro.

No layout de impressão, alguns números aparecem como `###` por largura insuficiente de coluna. Isso é um problema de apresentação, não prova de falha da fórmula.

## 8. Pontos que não serão inferidos

Antes de transformar o Excel em regra da plataforma, é necessário confirmar — todos `PENDING_POLICY`: relação entre os três arquivos; versão autoritativa; definição de `net_sales`; localização do parecer final; thresholds de gates; escopo do serviço da dívida; tratamento das coobrigações; e se o prepay em moeda estrangeira com CPR física observado no caso é apenas deste caso ou padrão de produto.

O valor nominal do prepay e a cultura da CPR do caso original foram omitidos desta versão por serem dado do produtor. A estrutura — prepay em moeda estrangeira lastreado por CPR física — é o que importa para a modelagem.

---

**Origem:** `credito_agro_status_atual_2026-09-03/auditoria_planilhas/reconstrucao_logica_modelos.md`
**Índice de pendências:** [Pendências de política](../pendencias_politica.md)
