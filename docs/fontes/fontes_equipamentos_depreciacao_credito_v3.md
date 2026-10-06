# Fontes — equipamentos, tecnologia, depreciação e crédito

Data de consulta: 3 de setembro de 2026.

## Embrapa — agricultura de precisão e retorno

Fonte: https://www.embrapa.br/en/busca-de-publicacoes/-/publicacao/1124732/agricultura-de-precisao-no-contexto-do-sistema-de-producao-lucratividade-e-sustentabilidade

A publicação de 2020 avalia custos e potencial de lucratividade da agricultura de precisão em milho e soja. Ela descreve simulações, baseadas em literatura e planilhas de custo, que aplicaram premissas de economia/ganho tecnológico. Para a análise de crédito, esses percentuais não devem ser copiados como ganho garantido do produtor; servem como hipótese a ser verificada com operação, talhão, horas, insumos e histórico próprios.

## Embrapa — automação e agricultura de precisão

Fontes:
- https://www.embrapa.br/en/busca-de-projetos/-/projeto/216563/agricultura-de-precisao-ap-para-sustentabilidade-do-sistema-produtivo-agricola-pecuario-e-florestal-brasileiro
- https://www.embrapa.br/en/tema-automacao-e-agricultura-de-precisao/sobre-o-tema

A Embrapa define agricultura de precisão como processo gerencial baseado em variabilidade espacial e manejo sítio-específico. As tecnologias citadas incluem máquinas, implementos, drones, sensores, IoT, telemetria, redes sem fio, processamento de imagens, ISOBUS e FMIS. O valor deve ser avaliado pelo processo gerencial e pelo uso, não pela posse isolada.

## CONAB — metodologia de custo de produção

Fonte: https://www.gov.br/conab/pt-br/acesso-a-informacao/institucional/atos-normativos/normas-da-organizacao/operacoes/30-302_norma_metodologia_de_custo_de_producao.pdf/@@download/file

A norma 30.302 separa custos variáveis, custos fixos, despesas financeiras, depreciações, manutenção, seguro do capital fixo e remuneração dos fatores. Para máquinas próprias, pede tipo, fabricante, modelo, especificação, potência, tração, preço novo, quantidade, fase, intensidade de uso, horas por hectare, combustível, operador, vida útil, valor residual e manutenção. Ela distingue hora-máquina dos custos de depreciação/remuneração do capital. Essa separação deve ser preservada no motor de crédito.

## IBGE — Censo Agropecuário 2017

Fonte: https://www.ibge.gov.br/estatisticas/economicas/agricultura-e-pecuaria/21814-2017-censo-agropecuario.html

O Censo inclui tratores, máquinas, implementos, veículos, energia, silos, irrigação, combustíveis, mão de obra, dívidas, investimentos, financiamentos e valor dos bens. É benchmark municipal/estrutural e tem defasagem; não substitui inventário atual do produtor.

## BNDES Finame Agrícola

Fonte: https://www.bndes.gov.br/wps/portal/site/home/financiamento/produto/bndes-finame-agricola

A página descreve financiamento para máquinas, equipamentos, implementos, caminhões e bens de informática/automação. O custo em operações indiretas combina custo financeiro, taxa do BNDES e taxa do agente. Condições, participação, prazo e garantias variam e devem ser versionados. O produto de crédito deve usar o contrato/proposta vigente, não valores históricos da página como premissa fixa.

## Implicações para o modelo

1. Depreciação contábil, depreciação econômica, obsolescência tecnológica, valor de garantia e capex de reposição são medidas distintas.
2. O custo da máquina na produção precisa separar combustível/energia, operador, manutenção/reparo, seguro, aluguel/terceirização, depreciação e custo do capital.
3. O custo do crédito deve ser calculado pelo fluxo contratual completo: entrada, desembolsos, juros, indexador, spread, taxas, registro, seguro, garantias, impostos quando aplicáveis, carência, parcelas e valor residual/balloon.
4. A reposição deve entrar no fluxo de caixa quando necessária para manter a capacidade produtiva, não apenas como despesa contábil anual.
5. Ativo subutilizado pode aumentar custo por hectare mesmo quando moderno; terceirização pode ser economicamente superior em determinadas escalas e janelas.
6. Tecnologia só deve receber benefício preditivo se houver cobertura, uso, qualidade e ganho observável no histórico do produtor ou em comparação validada.

## Banco Central — Custo Efetivo Total

Fontes:
- https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4881
- https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Instru%C3%A7%C3%A3o%20Normativa%20BCB&numero=83

A Resolução CMN nº 4.881/2020 disciplina o cálculo e a informação do CET no seu escopo regulatório. A Instrução Normativa BCB nº 83/2021 exemplifica a separação entre valor solicitado, valor financiado, valor liberado, parcelas, tarifas, tributos, seguro e outros custos vinculados. Para o motor interno de crédito agro, a mesma disciplina econômica deve ser aplicada mesmo quando o instrumento analisado exigir nomenclatura ou norma própria: modelar todos os fluxos e calcular taxa interna efetiva, sem reduzir custo do crédito à taxa nominal.

O custo deverá ser mensurado em pelo menos quatro visões: `contract_rate`, `all_in_effective_cost`, `cash_carry_cost` e `stressed_refinancing_cost`. A aplicabilidade jurídica do CET a cada produto deve ser confirmada por compliance; o modelo econômico, porém, sempre utilizará fluxo completo.
