# Observações e inferências — planilhas de crédito agro

Data de análise: 3 de setembro de 2026.

> **Aviso de anonimização.** Este documento foi portado da auditoria original substituindo a identidade do produtor por dado sintético. O produtor é referido como `PRODUTOR_EXEMPLO`. As fórmulas, a estrutura das folhas e as regras metodológicas são as observadas nos arquivos originais e não foram alteradas. Os arquivos `.xlsx` de origem contêm dados pessoais e **não são versionados neste repositório**.

## Regra de leitura

Este arquivo separa **fatos observados** de **inferências**. Fórmulas e textos transcritos da planilha são tratados como observação. Qualquer conclusão sobre intenção, autoria, equivalência entre versões ou regra de negócio não confirmada aparece com o prefixo **Inferência:**.

## Estrutura dos arquivos

| Arquivo | Fato observado |
|---|---|
| `260619-credit-model-final-checked-v11.xlsx` | 19 folhas, 1.187 fórmulas, dois gráficos, sem vínculos externos OOXML e sem VBA. |
| `Financialmodel_lastversion.xlsx` | 39 folhas, 845 fórmulas, 24 folhas `veryHidden`, sem gráficos, sem vínculos externos OOXML e sem VBA. Contém memória de cálculo, glossário e QA. |
| `financial_model.xlsx` | 69 folhas, 1.393 fórmulas, dois gráficos, sem vínculos externos OOXML e sem VBA. Inclui folhas de requisitos, QA, instruções de IA e diversas abas duplicadas/normalizadas. |

O usuário confirmou que os três arquivos tratam **do mesmo produtor**. As diferenças devem ser analisadas como versões, camadas ou ampliações do mesmo caso; ainda falta confirmar qual arquivo é a fonte autoritativa para a lógica vigente.

## Lógica de crédito observada na versão final verificada

A planilha trabalha com histórico esperado de três safras e uma safra projetada, dividida em cenário informado pelo produtor, benchmark regional, base de crédito e stress. O arquivo registra que 22/23A não estava disponível e que o stress é genérico, sem cenário climático nomeado.

| Parâmetro | Valor observado | Fonte interna |
|---|---:|---|
| Fator de stress de produtividade | 0,85× | `Premissas!F25` |
| Fator de stress de preço | 0,90× | `Premissas!F26` |
| Fator de stress de custo | 1,10× | `Premissas!F27` |
| Ajuste de overhead | 30% da receita | `Premissas!E16` |
| Regra de base de crédito | Menor receita entre produtor/regional e maior custo entre produtor/regional | `03 One-Safra Model!A12:D12` |
| Custo regional | 1,00× custo do produtor | Proxy temporário declarado no modelo |

A contribuição bruta agrícola é calculada como receita menos custo direto. O EBITDA proxy de crédito é a contribuição bruta menos o overhead definido. O próprio arquivo determina que esse indicador deve ficar separado do EBITDA contábil/auditado. Na prática, ele é uma aproximação de geração operacional construída como contribuição bruta da safra menos 30% da receita, e não uma soma detalhada de todas as despesas indiretas reais. É necessário definir quais despesas os 30% pretendem cobrir, evitar dupla contagem com o custo/ha e separar juros, principal, capex, capital de giro e distribuições aos sócios.

O serviço da dívida proxy é juros modelados mais principal de curto prazo com vencimento em até 360 dias. O DSCR proxy é EBITDA proxy de crédito dividido pelo serviço da dívida proxy. A alavancagem usa dívida de underwriting dividida pelo EBITDA proxy; quando o EBITDA de stress é não positivo, o modelo apresenta 999× como representação de alavancagem extrema. A liquidez de curto prazo é liquidez elegível dividida pelo principal de curto prazo. A cobertura de CPR compara valor conservador da obrigação/produção ao prepay, conforme a memória interna.

## Saídas observadas no caso exibido

O readout identifica `PRODUTOR_EXEMPLO` e a safra projetada 25/26P. No cenário base, a receita e o EBITDA proxy usam o benchmark regional quando inferior à visão do produtor. O stress observado gera EBITDA proxy negativo e DSCR negativo. A planilha também exibe dívida SCR atual, média e pico de 12 meses, variação da dívida, principal em até 360 dias e coobrigações.

O campo visual `Preliminary decision` aparece como rótulo, mas não foi encontrado valor preenchido na mesma área com a recomendação, o limite, as condições ou o aprovador. Em outra folha existe a frase “avança condicionado até liberação dos gates e documentos”; essa frase é uma instrução textual de uso, não uma fórmula nem um registro transacional de decisão.

**Inferência:** “avança condicionado” parece indicar que a proposta pode continuar no workflow, sujeita ao saneamento de documentos e gates, mas não prova que tenha ocorrido aprovação final. Para eliminar a ambiguidade, a plataforma deve separar recomendação do modelo, parecer do analista, decisão da alçada e status atual da proposta.

## Lacunas e flags declarados pela própria planilha

A versão verificada mantém abertos: P&L de 22/23A; preços históricos das culturas; histórico de dívida além dos 12 meses disponíveis; benchmark regional de produtividade/custo; suporte de área irrigada; e perfeição/constituição das garantias. O modelo declara que não se deve liberar a operação se documentos críticos falharem.

A versão normalizada registra explicitamente que `net_sales` ainda exige definição de negócio: receita agrícola aceita por Crédito ou receita contábil líquida. A memória recomenda confirmar que a variável não seja interpretada como receita contábil líquida de impostos quando a intenção for receita agrícola de crédito.

## Inspeção visual

No PDF gerado a partir da planilha, o readout principal apresenta tabelas legíveis em A4, mas alguns valores monetários aparecem como `###` devido à largura insuficiente das colunas no layout de impressão. A página de detalhes mostra diversos históricos como `Pendente`/`N/D` e lista limitações de cobertura de dados. Esses problemas são fatos de apresentação e não erros matemáticos por si só.

## Questões que exigem confirmação

1. **Confirmado:** os três arquivos pertencem ao mesmo produtor.
2. Qual arquivo deve ser tratado como fonte autoritativa para a lógica atual?
3. Qual é a definição oficial de `net_sales`?
4. Onde e como é registrada a decisão final: `aprovar`, `aprovar condicionado`, `reprovar`, limite e condições?
5. Quais gates numéricos são obrigatórios para DSCR, alavancagem, liquidez e cobertura de CPR?
6. O serviço da dívida deve incluir apenas principal até 360 dias e juros modelados ou o cronograma contratual completo por data?
7. `Co-obligations` entra na EAD, em limite de grupo, como contingência ou apenas como alerta?
8. O prepay em moeda estrangeira lastreado por CPR física é específico deste caso ou regra do produto?

## Verificação de recálculo

Foram abertas e salvas cópias isoladas dos três arquivos pelo LibreOffice e os valores resultantes de todas as células com fórmula foram comparados aos caches originais. Não houve alteração nos valores calculados e não surgiram erros de fórmula. Permaneceram 82, 18 e 64 fórmulas sem valor em cache, respectivamente, nos arquivos `financial_model.xlsx`, `260619-credit-model-final-checked-v11.xlsx` e `Financialmodel_lastversion.xlsx`.

Esse teste confirma **estabilidade técnica do recálculo nas condições observadas**, mas não valida definições de negócio, fontes, completude documental, thresholds de crédito ou adequação jurídica.
