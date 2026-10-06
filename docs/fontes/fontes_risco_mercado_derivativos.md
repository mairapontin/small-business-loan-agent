# Fontes e regras — risco de mercado e derivativos

Data de referência: 3 de setembro de 2026.

## Dados de mercado e instrumentos

### B3 — Minicontrato Futuro de Soja CME (SJC)

Fonte: https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/commodities/ficha-do-produto-8AE490C96D41D3A2016D45F4569B14F0.htm

A ficha oficial informa que o SJC é referenciado no Mini-Sized Soybean Futures do CME Group, utiliza o mesmo preço de ajuste do contrato norte-americano, é negociado em USD por saca e tem tamanho de 450 sacas de 60 kg, equivalentes a 27 toneladas. Os vencimentos informados são janeiro, março, maio, julho, agosto, setembro e novembro. Para modelagem, o identificador do contrato, mês, tamanho, unidade, preço de ajuste, posição e câmbio devem ser armazenados; não se pode comparar o preço do SJC diretamente com centavos de USD por bushel sem conversão.

### CME — soja

Fontes:
- https://www.cmegroup.com/markets/agriculture/oilseeds/soybean/specs
- https://www.cmegroup.com/market-data/real-time-futures-and-options-data-api.html

A ficha de contrato divulgada pelo CME indica unidade de 5.000 bushels, aproximadamente 136 toneladas, e cotação em centavos de dólar por bushel. A API de tempo real é comercial e oferece dados por WebSocket, em JSON, incluindo negócios, topo do livro, estatísticas diárias, volume, contratos em aberto e settlement. A página informa que o acesso depende de assinatura e taxas/licenças aplicáveis. Portanto, uma aplicação comercial deve contratar fonte autorizada e mapear direitos de exibição, uso interno, armazenamento histórico e redistribuição.

### B3 — distribuição de market data

Fonte: https://www.b3.com.br/en_us/market-data-and-indices/data-services/market-data/market-data-platform/

A B3 informa que seus dados em tempo real são enviados a distribuidores autorizados, abrangendo cotações de derivativos financeiros e de commodities, câmbio spot e outros mercados. A arquitetura não deve depender de scraping de páginas públicas para produção; deve usar distribuidor autorizado, contrato de licença e trilha de timestamp/latência.

### Banco Central — câmbio e juros

Fontes:
- https://dadosabertos.bcb.gov.br/
- https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes

O Portal de Dados Abertos oferece séries e APIs para dólar comercial, Selic e outros indicadores. PTAX/SGS são adequados a fechamento, cenário, auditoria e histórico, não necessariamente a hedge intradiário executável. O sistema deve distinguir cotação oficial/fechamento de preço negociável em tempo real.

### IMEA — preços físicos, paridade e fretes em Mato Grosso

Fonte: https://www.imea.com.br/imea-site/indicador-soja

O portal publica preços disponíveis por município, paridade de exportação, comercialização, preço comercial, produtividade, produção, insumos e fretes. As datas diferem entre blocos; por isso, cada observação precisa guardar `as_of_date`, frequência e idade. Antes de automatizar ou redistribuir, devem ser confirmados licença e termos comerciais.

## Regras de derivativos e hedge

### Lei nº 6.385/1976

Fonte: https://www.planalto.gov.br/ccivil_03/leis/l6385.htm

A lei inclui contratos futuros, opções e outros derivativos no regime do mercado de valores mobiliários e estabelece que, para contratos derivativos abrangidos, o registro em câmara ou prestador de compensação, liquidação e registro autorizado pelo Banco Central ou pela CVM é condição de validade. A empresa de análise deve guardar instituição, conta, confirmação, registro, produto, posição, vencimento e identificador, e não presumir validade apenas a partir de uma planilha do produtor.

### Resolução CVM nº 30/2021

Fonte: https://conteudo.cvm.gov.br/legislacao/resolucoes/resol030.html

A resolução dispõe sobre o dever de verificar adequação de produtos, serviços e operações ao perfil do cliente. A obrigação incide no contexto dos participantes sujeitos à norma. A startup não deve declarar que executa suitability sem parecer sobre seu papel; deve, porém, capturar se o intermediário realizou o processo e se a posição é compatível com política, poderes, limites e finalidade informada.

### B3 — apreçamento e limites

Fontes:
- https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/mercado-de-derivativos/metodologia/manual-de-aprecamento-da-b3/
- https://www.b3.com.br/pt_br/produtos-e-servicos/compensacao-e-liquidacao/clearing/administracao-de-riscos/consulta-limites-de-posicoes/regras-para-limites/

A B3 publica manuais específicos de apreçamento para futuros, opções e curvas, bem como parâmetros de limites de posições por cliente ou grupo de clientes atuando em conjunto. A plataforma deve consumir settlement e parâmetros vigentes, versionar metodologias e não codificar números permanentes, pois parâmetros podem mudar.

### Resolução BCB nº 352/2023

Fonte: https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=352

A norma vigente consultada define derivativo e contabilidade de hedge para instituições obrigadas a usar o Cosif. Ela é diretamente aplicável aos entes indicados no seu escopo, não automaticamente ao produtor ou à startup. É referência útil para distinguir instrumento, compromisso firme, transação prevista e relação de proteção, mas o tratamento contábil do produtor deve ser verificado conforme regime contábil e pronunciamentos aplicáveis.

## CPR, preço e garantias

### Lei nº 8.929/1994

Fonte: https://www.planalto.gov.br/ccivil_03/leis/l8929.htm

A lei institui CPR física e permite CPR com liquidação financeira. Entre os requisitos estão entrega/vencimento, produto, qualidade, quantidade, local, garantias, forma de liquidação e critérios de obtenção do valor. Para CPR financeira, a norma exige identificação do preço e, quando aplicável, índice, taxa de juros, atualização ou variação cambial, instituição divulgadora, praça/mercado e índice. A CPR pode ser escritural e sua infraestrutura registra titularidade, aditamentos, liquidação e garantias. Esses campos devem alimentar simultaneamente o calendário de dívida, a posição física, a exposição a preço/câmbio e a prioridade das garantias.

### Lei nº 13.986/2020

Fonte: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l13986.htm

A lei trata, entre outros pontos, do Fundo Garantidor Solidário, patrimônio rural em afetação, CIR e escrituração de títulos. O patrimônio rural em afetação possui requisitos e vedações específicos, depende de registro e identificação do imóvel e pode vincular-se a CPR/CIR. Para análise de crédito, é necessário verificar matrícula, ônus, área, georreferenciamento, CAR, regularidade documental, título vinculado e extensão da garantia; o simples valor estimado da terra não comprova disponibilidade jurídica.

## Consequências para a modelagem

1. A camada em tempo real deve usar dados licenciados para produção e fontes oficiais de fechamento para reconciliação.
2. Cotações, posições físicas, derivativos e dívidas precisam de unidades, moedas e vencimentos normalizados.
3. O sistema deve distinguir hedge econômico, hedge contábil e instrumento especulativo; um não implica automaticamente o outro.
4. Chamadas de margem são eventos de liquidez. Devem alimentar o fluxo de caixa por data, mesmo quando a posição reduz a volatilidade econômica da receita no vencimento.
5. CPR e contratos físicos podem conter indexação cambial e fórmulas de preço; seu payoff deve ser reconstruído do documento e confrontado com o registro disponível.
6. Parâmetros de bolsa, regras, contratos e metodologias devem ser versionados e atualizados, não hard-coded.
