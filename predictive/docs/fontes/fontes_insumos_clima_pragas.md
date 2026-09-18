# Fontes — insumos, clima extremo, pragas e riscos emergentes

Data de referência: 3 de setembro de 2026.

## Pragas e doenças

### Embrapa — monitoramento e MIP-Soja

Fontes:
- https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/soja/producao/manejo-integrado-de-pragas/monitoramento-da-lavoura
- https://www.embrapa.br/en/busca-de-solucoes-tecnologicas/-/produto-servico/6039/manejo-integrado-de-pragas-da-soja---mip-soja

A Embrapa descreve métodos de monitoramento de insetos e danos, incluindo pano-de-batida, exame de plantas e amostras de solo. O material enfatiza repetição da amostragem, registro por ponto e divisão de propriedades maiores em talhões. O MIP-Soja é apresentado como conjunto de tecnologias para intervenção quando necessária e economicamente viável; lagartas e percevejos são destacados entre as principais pragas, e o uso sem critério pode elevar custo e selecionar resistência.

Implicação para o modelo: registro de campo validado é superior a uma variável binária “houve praga”. Devem ser capturados espécie/problema, estágio, contagem ou severidade, pontos amostrados, talhão, data, fase fenológica, limiar técnico, produto/aplicação, custo, eficácia observada e responsável técnico. Alertas regionais sem observação local servem como gatilho de inspeção, não como perda confirmada.

### MAPA — AGROFIT

Fonte: https://www.gov.br/agricultura/pt-br/assuntos/insumos-agropecuarios/insumos-agricolas/agrotoxicos/agrofit

O AGROFIT é o banco oficial de informações sobre produtos agroquímicos e afins registrados no Ministério da Agricultura e permite consulta aberta. Seu uso no produto é validar registro, cultura, alvo, ingrediente e condições do produto informado. Ele não fornece, por si só, incidência local da praga nem comprovação de aplicação.

## Eventos extremos

### CEMADEN

Fonte: https://www.gov.br/cemaden/pt-br

O CEMADEN oferece rede observacional, painel de alertas, monitoramento de secas, previsão de riscos geo-hidrológicos e produtos de risco de propagação de fogo. Para crédito agro empresarial, a cobertura e finalidade de cada produto precisam ser verificadas; um alerta municipal/regional deve ser cruzado com o polígono e com evidência de campo/satélite antes de quantificar perda.

As fontes climáticas já catalogadas — INMET, ANA, CHIRPS, ERA5-Land, NASA POWER/SMAP e satélite — devem ser combinadas. Evento extremo é registrado por intensidade, duração, área afetada, fase fenológica, antecedência do alerta, qualidade da fonte e impacto estimado.

## Preços de insumos

### IMEA — custo de produção e indicadores

Fontes:
- https://www.imea.com.br/imea-site/relatorios-mercado-detalhe?c=4&s=696277432068079616
- https://www.imea.com.br/imea-site/indicador-soja

O IMEA publica custos de produção de soja em Mato Grosso, com metodologias COE, COT e custo total, além de indicadores de sementes e fretes. O portal informa publicações mensais de custo, atualmente em Excel. Esses dados são benchmarks regionais; o custo efetivo do produtor deve vir de pedidos, notas fiscais, contratos, estoque e pagamentos.

### ANP — diesel

Fonte: https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas

A ANP disponibiliza levantamento semanal de preços médios por Brasil, região, estado e município e arquivos por posto, além de série histórica em dados abertos. É uma fonte de contexto para diesel, mas o preço do produtor deve ser extraído de NF-e/contrato quando disponível.

### Banco Mundial — Commodity Markets/Pink Sheet

Fonte: https://www.worldbank.org/en/research/commodity-markets

O Banco Mundial fornece séries mensais e anuais de preços de commodities, incluindo fertilizantes e energia, além de relatórios e previsões. A periodicidade mensal é apropriada para regimes e cenários, não para preço transacional ou alerta intradiário.

### MDIC — Comex Stat

Fonte: https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/estatisticas

O MDIC disponibiliza o Comex Stat, dados brutos, resultados preliminares e consolidados e documentação metodológica. Importações de fertilizantes e defensivos podem representar oferta e custo sistêmico, mas volume/valor mensal não substitui cotação entregue na fazenda. O dado deve ser transformado por NCM, origem, quantidade, unidade e valor, com defasagem explícita.

## Hierarquia recomendada para custos

1. Preço contratado e quantidade do próprio produtor, documentados e conciliados.
2. NF-e, pedido, boleto/pagamento, estoque e data de entrega.
3. Cotação regional/licenciada e orçamento de fornecedor.
4. Benchmark IMEA por macrorregião e safra.
5. Índices nacionais/globais de energia e fertilizantes como fatores de regime.

## Risco emergente

Um risco novo, sem histórico suficiente, não deve receber PD precisa. O sistema deve detectá-lo, localizar a exposição, produzir cenários de impacto, aplicar overlay conservador aprovado, encaminhar casos materiais para revisão humana e registrar hipótese, responsável e validade. A incorporação como feature treinada ocorre somente após observações e validação fora da amostra.
