# Arquitetura causal, temporal e preditiva — crédito agro soja/MT

## 1. Unidade de decisão

A unidade primária será `decision_id`, associada a `operation_id`, `crop_year`, `group_id` e aos imóveis/talhões que suportam a produção. CPF ou CNPJ isolado não é unidade suficiente. A análise deve distinguir quem produz, quem vende, quem contrata, quem deve, quem garante, quem possui o bem e quem controla economicamente a estrutura.

## 2. Grafo de entidades e exposições

O grafo conterá nós de pessoa física, pessoa jurídica, família, propriedade, talhão, conta, dívida, CPR, contrato físico, derivativo, comprador, fornecedor, armazém, transportador, rota, terminal, seguradora e operação de crédito. Relações terão tipo, vigência, evidência, fonte, confiança e percentual quando aplicável.

A resolução do grupo produzirá três visões separadas:

| Visão | Pergunta | Tratamento |
|---|---|---|
| Formal | Quem aparece em QSA, matrícula, contrato e cadastro? | Fato documental versionado |
| Econômica | Quem controla, usa, recebe ou paga? | Evidência de fluxo, poder e operação |
| Disponível ao credor | Qual caixa, ativo ou garantia pode suportar a obrigação? | Regra jurídica/contratual e haircut |

Pulverização patrimonial gera `structure_complexity`, `unresolved_ownership_share` e diligência; não gera acusação fiscal automática.

## 3. Camadas de dados

```text
FONTES BRUTAS
→ evidência imutável, hash, licença e timestamps

NORMALIZAÇÃO
→ unidades, identidades, contratos, geometrias e qualidade

EVENT STORE / POSIÇÕES
→ fatos econômicos e jurídicos versionados

FEATURE STORE TEMPORAL
→ originação, monitoramento e cenários, sem informação futura

MOTORES
→ regras + caixa + exposição + modelos estatísticos

DECISÃO E AÇÃO
→ recomendação, parecer, alçada, condições e playbook
```

Todo registro temporal terá `event_time`, `available_time`, `ingested_time`, `effective_from`, `effective_to`, `source_version` e `quality_status`. Um dado revisado não substitui o valor usado numa decisão antiga.

## 4. Motores separados

| Motor | Função | Técnica inicial | Saída |
|---|---|---|---|
| Resolução de entidade/grupo | Consolidar PF/PJ, família e relações | Regras + grafo + revisão | Grupo, vínculos e confiança |
| Legal/regulatório | Aplicar impedimentos e exigências | Regras versionadas | Apto, bloqueio, pendência ou revisão |
| Contratual | Interpretar obrigações e garantias | Campos estruturados + regras | Cronograma, eventos e prioridade |
| Necessidade de custeio | Validar orçamento e uso | Modelo determinístico | Necessidade elegível |
| Fluxo de caixa | Alocar entradas e saídas por data | Motor diário/mensal | Caixa mínimo, funding gap e DSCR |
| Produtividade | Estimar distribuição de rendimento | Baseline hierárquico/boosting | P10, P50 e P90 por talhão |
| Mercado/hedge | Reconstruir físico, derivativos e moeda | Payoff + MTM + margem | Exposição, basis, hedge e caixa |
| Ativos/tecnologia | Medir capacidade, custo, uso, manutenção e retorno | Inventário + telemetria + engenharia econômica | Capacidade, custo/ha, vida útil e capex |
| Depreciação/reposição | Separar custo econômico, garantia e caixa futuro | Curvas por idade/uso/condição + cenários | Valor, vida remanescente e reposição |
| Custo do crédito | Modelar investimento e custeio pelo fluxo completo | TIR/CET econômico + cronograma | Custo all-in, parcelas e refinanciamento |
| Logística/energia | Calcular rota, custo e interrupção | Grafo multimodal + cenários | Preço líquido, prazo e fallback |
| PD de originação | Ordenar risco de default | Logística/scorecard monotônico | PD, rating e reason codes |
| LGD | Estimar perda após default | Segmentação; depois regressão/sobrevivência | LGD e tempo de recuperação |
| EAD | Projetar exposição no default | Cronograma e comportamento de saque | EAD por data/cenário |
| Early warning | Detectar mudança após decisão | Regras + modelo temporal | Alerta, severidade e ação |
| Novidade/risco emergente | Identificar evento fora da experiência | Anomalia + regra de cobertura | `novelty_flag` e overlay |
| Carteira/concentração | Agregar risco do credor | Stress e rede | Concentração e perda esperada |

A saída de crédito não será uma média opaca desses motores. Regras impeditivas, PD, capacidade, LGD, concentração e confiança de dados permanecem dimensões separadas.

## 5. Ponte financeira das planilhas para a plataforma

A lógica observada nas planilhas será preservada como baseline comparável, mas seus proxies serão decompostos.

| Elemento atual | Evolução necessária |
|---|---|
| `net_sales` agregado | Receita por cultura, contrato, quantidade, preço, qualidade, praça, moeda, recebimento e status |
| Custo direto agregado | Orçamento e realizado por insumo, talhão, fornecedor, moeda, entrega e pagamento |
| Overhead de 30% da receita | Despesas administrativas/operacionais detalhadas, normalizadas e reconciliadas; proxy apenas como fallback sinalizado |
| Máquina como patrimônio agregado | Inventário por ativo, capacidade na janela, custo/ha, manutenção, telemetria, vida útil e alternativa terceirizada |
| Depreciação agregada | Separar contábil, econômica, obsolescência, valor de garantia e capex de reposição por data |
| Taxa nominal do financiamento | Fluxo all-in com valor liberado, encargos, carência, parcelas, balão, moeda e custo de refinanciamento |
| Juros + principal ≤360 dias | Cronograma contratual completo, com CPR, barter, fornecedores, arrendamento, derivativos e contingências |
| Liquidez elegível agregada | Ativo, titular, disponibilidade, prazo, haircut, gravame e necessidade operacional |
| Cobertura de CPR agregada | Produto, obrigação física/financeira, volume, qualidade, moeda, preço, praça, vencimento e prioridade |
| Stress genérico | Biblioteca de cenários nomeados e combinados |
| “Avança condicionado” em texto | Registros separados de recomendação, parecer, alçada e status |

O proxy atual pode permanecer como benchmark histórico `legacy_model_v1`, mas a plataforma registrará `model_version` e diferença entre legado e motor de caixa detalhado.

## 6. Fluxo de caixa temporal

O calendário mínimo será semanal durante plantio/colheita e mensal nos demais períodos, podendo ser diário para margem de derivativos. Cada fluxo terá valor, moeda, data esperada, data contratual, entidade, contraparte, certeza, prioridade e cenário.

```text
Caixa inicial disponível
+ vendas recebidas/contratadas
+ desembolsos de crédito
+ liquidação de hedge/opções
+ indenização de seguro provável e elegível
− insumos entregues/pagos
− operação, mão de obra, energia e frete
− margem inicial e ajustes de derivativos
− tributos, arrendamentos e despesas administrativas
− juros e principal por contrato
− capex obrigatório e retiradas aprovadas
= caixa disponível por data
```

Os indicadores centrais serão caixa mínimo, dias com caixa negativo, funding gap máximo, DSCR por janela, dívida de pico, concentração de vencimentos e distância a covenant.

## 7. Mercado, futuros e correlações

O motor converterá todas as posições para unidades canônicas, mantendo contrato, vencimento, lote, moeda, praça e fonte. A exposição física será separada em produzida, projetada, contratada, aberta, comprometida, segurada e entregue.

A pesquisa de correlação terá quatro etapas:

| Etapa | Procedimento | Gate |
|---|---|---|
| Descoberta | Correlações contemporâneas/defasadas, móveis, não lineares e condicionais | Plausibilidade e qualidade temporal |
| Mecanismo | Descrever caminho preço/câmbio/custo/clima → posição → caixa → default | Aprovação de Crédito/Risco |
| Validação | Teste out-of-time, estabilidade por safra/região/porte/hedge e falsificação | Ganho incremental e sinal coerente |
| Produção | Monitorar drift, latência, cobertura e reason codes | Retirada/recalibração se falhar |

Não se usará nível de séries não estacionárias sem transformação adequada. Serão testados retornos, diferenças, volatilidade, basis, inclinação de curva, carry, open interest, volume, volatilidade implícita e quebras de regime. A relação será condicionada a exposição: preço da soja só altera o risco de forma definida quando se conhece volume aberto, vendas, derivativos, produtividade e calendário de caixa.

## 8. Biblioteca de cenários desenvolvida do zero

| Família | Cenário nomeado | Variáveis afetadas | Canal de crédito |
|---|---|---|---|
| Clima | Seca em floração/enchimento | produtividade, replantio e qualidade | receita e overhedge |
| Clima | Excesso de chuva na colheita/enchente | área, qualidade, atraso e rota | receita e timing de caixa |
| Sanidade | Praga/doença com eficácia baixa de controle | produtividade e defensivo extraordinário | margem e custeio adicional |
| Insumos | Fertilizante/diesel sobe antes da compra | custo remanescente e capital de giro | funding gap |
| Mercado | Soja cai e basis regional abre | preço líquido do volume aberto | margem e DSCR |
| Hedge | Soja sobe com futuro vendido | MTM e chamada de margem | squeeze de liquidez |
| Produção/hedge | Quebra de safra com obrigação acima do P10 | recompra/não entrega | passivo contratual |
| Logística | Interrupção de corredor/terminal | frete, atraso, armazenagem e qualidade | recebimento e covenant |
| Energia | Falha de energia na secagem/armazenagem | perda, atraso e custo alternativo | liquidez e garantia |
| Geopolítica | Guerra/sanção/tarifa afeta insumo ou demanda | câmbio, fertilizante, petróleo, frete e preço | margem e contraparte |
| Informacional | Post/notícia gera salto de preço/volatilidade | mercado confirmado e margem | chamada de margem e overlay |
| Emergente | Evento sem histórico suficiente | faixa de impacto | `novelty_flag` e revisão |

Cenários devem preservar dependências; não se somarão percentis extremos incompatíveis. A primeira versão será determinística e documentada. Simulação conjunta virá depois, com distribuições calibradas e dependência por regime.

## 9. Gestão, equipe, equipamentos e tecnologia

O módulo operacional será baseado em evidência, não em opinião livre. O score não premiará “ter tecnologia”; avaliará adequação, capacidade, uso, manutenção, custo, resultado e financiamento.

| Pilar | Métricas candidatas |
|---|---|
| Planejamento | orçamento por talhão, calendário, revisões e erro histórico |
| Controle | fechamento mensal, reconciliação, estoque, custo e rastreabilidade |
| Agronomia | caderno de campo, amostragem, assistência, tempo de resposta e eficácia |
| Financeiro/comercial | posição diária, caixa projetado, limites, preço de equilíbrio e hedge |
| Pessoas | funções críticas cobertas, experiência, turnover, sucessão e dependência de pessoa-chave |
| Tecnologia | cobertura, integração, uptime, calibração, uso efetivo e segurança |
| Máquinas | capacidade por janela, horas, perdas, combustível, downtime e operador |
| Reposição | vida útil, manutenção atrasada, valor residual, capex e reserva |
| Crédito dos ativos | custo all-in, parcelas, DSCR incremental e risco de refinanciamento |
| Continuidade | seguro, redundância, peças, energia, conectividade e fornecedores alternativos |

Inicialmente, esses atributos formarão subscore e reason codes; só entrarão na PD após consistência de coleta, estabilidade e teste fora da amostra.

## 10. Logística e energia

O grafo ligará talhão/fazenda a armazéns, terminais, compradores e portos por segmentos rodoviários, ferroviários, hidroviários e transbordos. Cada rota terá distância, tempo, preço, combustível, pedágio, tarifa, capacidade, sazonalidade, confiabilidade e fallback.

O preço líquido será:

`preço líquido = preço de venda − frete − armazenagem − secagem − transbordo − descontos de qualidade − perdas − custo financeiro do prazo`.

Energia será decomposta em combustível de máquinas, combustível de transporte, eletricidade de irrigação/secagem/armazenagem e geração própria. Benchmark público não substituirá fatura, NF-e ou contrato do produtor.

## 11. Geopolítica, notícias e sinais sociais

O evento só afetará o produtor após passar pelo grafo de exposição. O sistema distinguirá evento, narrativa, reação de mercado e impacto operacional. Postagem individual não será prova de risco do produtor.

Os controles incluirão deduplicação, diversidade de fontes, credibilidade, bot/spoofing, conteúdo antigo, confirmação oficial, reação de preço/volume/volatilidade e mapeamento para países, produtos, rotas e contrapartes.

## 12. Modelos e rótulos

O rótulo primário será default/inadimplência material definido pelo produto e contrato. Haverá rótulos auxiliares para atraso, renegociação, concessão, recuperação judicial, execução, fraude, quebra agronômica, chamada de margem, não entrega e pagamento tempestivo.

A coorte terá uma linha por decisão/operação. Reprovados sem desempenho permanecem sem rótulo. Divisões de treino/teste serão temporais e impedirão que o mesmo grupo/fazenda atravesse conjuntos quando houver risco de memorização.

## 13. Registro da decisão

| Registro | Conteúdo mínimo |
|---|---|
| `model_recommendation` | PD, rating, limite técnico, cenários, reason codes e versão |
| `analyst_recommendation` | parecer, ajustes, pendências e justificativa |
| `credit_authority_decision` | decisão, alçada, limite, preço, prazo, garantia, covenants e condições |
| `workflow_status` | estado, responsável, prazo e próxima ação |
| `override_record` | diferença, motivo padronizado, aprovador e validade |

Essa separação elimina a ambiguidade observada entre o rótulo `Preliminary decision` e a instrução textual “avança condicionado”.
