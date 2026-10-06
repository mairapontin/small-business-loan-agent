# Fontes — combustível, energia elétrica e continuidade

Data de consulta: 3 de setembro de 2026.

## ANP — Levantamento de Preços de Combustíveis

URL: https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas

A página disponibiliza resultados semanais por Brasil, região, estado e município, dados por posto revendedor, série histórica aberta e painel de preços. O benchmark é útil para diesel e outros combustíveis, mas o custo do produtor deve ser obtido de NF-e, contrato, volume, frete e condição comercial. A modelagem precisa registrar ausência de cobertura em município/semana e não interpolar silenciosamente.

## ANEEL — Base de Tarifas

URL: https://portalrelatorios.aneel.gov.br/luznatarifa/basestarifas

A base oficial contém tarifas das distribuidoras, incluindo TUSD. Para chegar ao custo efetivo da fazenda/armazém, devem ser adicionados grupo/subgrupo tarifário, modalidade, demanda contratada, horário, impostos, bandeiras, energia reativa, geração distribuída/mercado livre quando aplicável e fatura real.

## EPE — WEBMAP do sistema energético

URL: https://www.epe.gov.br/pt/publicacoes-dados-abertos/publicacoes/webmap-epe

O WEBMAP oferece camadas existentes e planejadas de geração, transmissão, subestações, biocombustíveis e combustíveis líquidos, com download geográfico, metadados e WMS. Infraestrutura planejada deve permanecer separada da existente e da efetivamente disponível ao produtor.

## Estrutura de exposição energética

| Uso | Campos mínimos | Risco traduzido |
|---|---|---|
| Máquinas e frota | Litros/ha, litros/t, tipo de diesel/combustível, idade, eficiência, estoque e contrato | Custo direto, indisponibilidade e capex |
| Transporte contratado | Modal, distância, consumo/índice de reajuste e combustível | Frete, preço líquido e volatilidade |
| Secagem/armazenagem | kWh/t, combustível térmico, umidade, tarifa e capacidade | Custo pós-colheita, atraso e perda de qualidade |
| Irrigação | kWh/ha, demanda, fonte, janela e disponibilidade hídrica | Produtividade, custo e risco de interrupção |
| Geração própria | Fonte, capacidade, produção, armazenamento, manutenção e conexão | Redução de custo, receita/compensação e risco técnico |
| Continuidade | Interrupções, duração, redundância, gerador, estoque e SLA | Tempo de recuperação e perda operacional |

A feature decisória deve usar custo e consumo específicos do produtor quando comprovados. Tarifas e preços públicos servem como benchmark, deflator, stress e preenchimento controlado com baixa confiança.
