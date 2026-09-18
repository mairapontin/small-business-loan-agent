# Modelo de ativos, tecnologia, depreciação e custo do crédito

## 1. Princípio

O ativo só melhora o risco de crédito quando é **adequado à operação, disponível na janela agronômica, utilizado corretamente, mantido, operado por equipe capacitada, integrado ao processo gerencial e economicamente justificável**. Posse ou marca não serão proxy automático de produtividade.

## 2. Inventário por classe

| Classe | Exemplos | Função de crédito |
|---|---|---|
| Potência e tração | Tratores, cavalos mecânicos e unidades de potência | Capacidade de executar operações e transportar |
| Implantação | Plantadeiras, semeadoras, distribuidores e adubadores | Uniformidade, janela e uso de sementes/insumos |
| Manejo | Pulverizadores, aplicadores, drones e equipamentos de taxa variável | Controle de pragas/doenças e eficiência de insumo |
| Colheita | Colheitadeiras, plataformas, carretas graneleiras | Perda, qualidade, velocidade e janela de caixa |
| Pós-colheita | Silos, secadores, classificadores, balanças e aeração | Qualidade, buffer, venda e garantia |
| Irrigação e água | Pivôs, bombas, motores, reservatórios, sensores e outorgas | Mitigação climática e demanda de energia |
| Energia | Transformadores, solar, geradores, baterias e estoque de combustível | Custo e continuidade de processos críticos |
| Transporte | Caminhões, implementos, contratos e telemetria | Frete, confiabilidade e preço líquido |
| Sensoriamento | Estações, sensores de solo/planta, monitores, GNSS/RTK e imagens | Medição, manejo sítio-específico e alerta |
| Conectividade | Rádio, celular, satélite, gateways e redes locais | Transmissão, automação e continuidade de dados |
| Software | ERP, FMIS, manutenção, telemetria, estoque, comercial e hedge | Controle, posição, evidência e decisão |
| Serviços | Terceirização, oficina, peças, concessionária e assistência | Alternativa de capacidade e tempo de recuperação |

## 3. Campos mínimos do ativo

Cada `asset_id` deverá registrar proprietário formal, operador econômico, local, fabricante/modelo apenas como identificação, ano, número de série/registro quando aplicável, preço e data de aquisição, valor novo comparável, valor de mercado validado, horas/quilômetros, potência/capacidade, implementos compatíveis, status, manutenção, seguro, gravames, financiamento, telemetria, disponibilidade e criticidade.

Documentos e evidências: NF-e/contrato, registro, fotos datadas, laudo, horímetro/odômetro, manutenção, seguro, gravame, telemetria, ordem de serviço e conciliação com contabilidade/ativo fixo.

## 4. Adequação de capacidade

A análise deve estimar a necessidade por operação e janela, não contar unidades.

`horas requeridas = área ÷ capacidade de campo efetiva`  
`horas disponíveis = horas trabalháveis × disponibilidade mecânica × disponibilidade de operador`  
`folga de capacidade = horas disponíveis ÷ horas requeridas − 1`

A capacidade de campo efetiva deverá usar largura, velocidade, eficiência de campo e condição local, preferencialmente observadas. Benchmark de catálogo ou fabricante será apenas fallback sinalizado.

| Operação crítica | Métrica |
|---|---|
| Plantio | Probabilidade de concluir dentro da janela; hectares/dia; paradas |
| Pulverização | Tempo entre detecção e aplicação; cobertura; deriva/retrabalho |
| Colheita | Hectares/dia; perda; umidade; fila; capacidade de transporte |
| Secagem | Toneladas/dia; consumo; fila; autonomia energética |
| Irrigação | Área, lâmina, demanda, energia, água e redundância |

Terceirização e locação devem entrar como capacidade contratada, com fornecedor, SLA, prioridade, preço, histórico e risco de concentração. Em determinada escala, serviço contratado pode ser superior à compra; não haverá viés pró-propriedade.

## 5. Custo hora e custo por hectare

O custo do ativo deve ser dividido em componentes, seguindo a disciplina econômica observada na metodologia CONAB:

| Componente | Natureza | Alocação |
|---|---|---|
| Combustível/energia | Variável | consumo observado × preço |
| Operador | Variável/semi-fixo | horas e encargos |
| Lubrificantes/filtros/consumíveis | Variável | histórico ou coeficiente validado |
| Manutenção corretiva/preventiva | Variável e ciclo | ordens, peças, mão de obra e disponibilidade |
| Seguro, abrigo e taxas | Fixo | período e uso elegível |
| Depreciação econômica | Fixo/uso | perda de valor por tempo, horas e obsolescência |
| Custo do capital | Fixo/financeiro | custo da fonte ou oportunidade |
| Financiamento | Fluxo de caixa | desembolso, parcelas, taxas e garantias |

`custo por hectare = custo total alocado da operação ÷ hectares efetivamente atendidos`.

Ativos subutilizados elevam custo unitário. Ativos sobrecarregados aumentam risco de atraso e quebra. Ambos devem aparecer.

## 6. Quatro medidas distintas de depreciação

| Medida | Objetivo | Uso no crédito |
|---|---|---|
| Depreciação contábil/fiscal | Demonstrações e tributos conforme regra aplicável | Reconciliação; não mede sozinha valor ou reposição |
| Depreciação econômica | Perda de valor por idade, uso, condição e mercado | Custo econômico e valor esperado |
| Obsolescência tecnológica | Incompatibilidade, suporte, software, eficiência e peças | Vida útil remanescente e risco operacional |
| Depreciação de garantia | Valor realizável líquido, prazo, gravame e haircut | LGD e cobertura |

A depreciação econômica básica poderá partir de `(valor novo comparável − valor residual esperado) ÷ vida econômica`, ajustada por horas, condição, manutenção, obsolescência, liquidez regional e curva de mercado. A plataforma deverá armazenar método e fonte; não aplicará taxa universal.

## 7. Capex de manutenção e reposição

A análise produzirá horizonte de 1, 3 e 5 anos:

`capex de reposição = ativos críticos a substituir × custo all-in − valor realizável da baixa`.

O gatilho não será idade isolada. Serão combinados vida útil remanescente, horas, falhas, custo de manutenção, disponibilidade, risco de peças, obsolescência, capacidade e impacto de parada.

| Indicador | Interpretação |
|---|---|
| `replacement_capex_12m` | Caixa/investimento necessário em 12 meses |
| `replacement_capex_36m` | Pressão de médio prazo |
| `maintenance_backlog` | Manutenção vencida ou adiada |
| `critical_asset_single_point` | Ativo crítico sem redundância ou serviço alternativo |
| `fleet_age_hours_index` | Idade/horas ponderadas por criticidade |
| `replacement_reserve_coverage` | Caixa/reserva acumulada sobre capex esperado |

Depreciação é custo econômico; reposição é saída de caixa futura. As duas aparecem em relatórios distintos e se reconciliam.

## 8. Custo do crédito de investimento

Cada financiamento de ativo terá fluxo completo:

| Campo | Conteúdo |
|---|---|
| Aquisição | Preço, entrada, impostos, frete, instalação, treinamento e capitalização |
| Financiamento | Valor liberado, valor financiado, datas, carência e amortização |
| Remuneração | Indexador, juros, spread, taxas, seguro e outros custos |
| Estrutura | Moeda, balão, residual, leasing, alienação e garantias |
| Capacidade | Benefício incremental, custo evitado e caixa do ativo |
| Stress | Taxa, atraso, câmbio, valor residual, manutenção e produtividade |

O modelo calculará `contract_rate`, `all_in_effective_cost`, `total_cash_paid`, `present_value_cost`, `stressed_refinancing_cost` e parcelas por data. CET regulatório será tratado conforme aplicabilidade jurídica; economicamente, todos os fluxos devem compor o custo efetivo.

## 9. Custo do crédito na produção

O custeio terá principal por desembolso e uso, juros por período, indexador, tarifas, seguro, registro, garantias, moeda, vencimento e liquidação. O custo não será apenas uma linha anual:

`custo financeiro da safra = soma dos fluxos financeiros atribuíveis por data`.

Serão comparados custo do capital de giro, desconto/barter embutido, prazo de fornecedor, CPR, adiantamento, linhas bancárias e recursos próprios. Comparação só ocorrerá após equalizar quantidade, preço do insumo, moeda, garantias, prazo, risco de entrega e todos os encargos.

## 10. Viabilidade do ativo

A compra será avaliada contra manter, reformar, terceirizar, alugar ou compartilhar.

| Métrica | Uso |
|---|---|
| VPL incremental | Benefícios e custos após impostos e financiamento conforme escopo aprovado |
| TIR econômica | Retorno do ativo sem confundir com custo da dívida |
| Payback | Recuperação de caixa, com limitações explícitas |
| DSCR do investimento | Caixa incremental/serviço da nova dívida |
| Break-even hectares/horas | Utilização mínima para justificar posse |
| Custo evitado | Serviço, perdas, insumo, combustível, retrabalho e atraso evitados |
| Valor de opção | Redundância e resposta a janela/evento extremo |

Ganho de produtividade só será creditado quando houver mecanismo e evidência. Sem histórico próprio, será cenário em faixa, não caso-base.

## 11. Features candidatas

`asset_capacity_margin`, `timely_planting_probability`, `harvest_capacity_margin`, `machine_downtime_rate`, `maintenance_compliance`, `repair_cost_trend`, `fuel_l_ha`, `energy_kwh_t`, `fleet_age_hours_index`, `remaining_useful_life`, `economic_depreciation_ha`, `replacement_capex_12m`, `replacement_reserve_coverage`, `critical_asset_single_point`, `all_in_equipment_credit_cost`, `equipment_debt_service_12m`, `incremental_dscr`, `break_even_utilization`, `fmis_usage_consistency`, `telemetry_coverage`, `data_completeness` e `operator_qualification_coverage`.

Inicialmente, essas features entram em capacidade, custo, confiança, cenários e reason codes. Sua entrada na PD exige amostra, estabilidade e validação temporal.
