# Notas regulatórias — crédito agro

Data de referência: 2 de setembro de 2026.

## Banco Central — SCR

Fonte: https://www.bcb.gov.br/estabilidadefinanceira/scr

- O SCR é alimentado mensalmente por instituições financeiras e registra de forma individualizada exposições de risco direto a partir de R$ 200.
- O sistema inclui empréstimos, financiamentos, adiantamentos, coobrigações, garantias prestadas, limites não canceláveis, operações baixadas como prejuízo, instrumentos pós-pagos e outras operações reconhecidas pelo Banco Central como crédito.
- A consulta de informações consolidadas por cliente por instituição financeira exige autorização específica e expressa do cliente, conforme informado pelo BCB com referência à Resolução CMN nº 4.571/2017.
- Para uma empresa de análise de crédito que não seja participante autorizada, não se deve presumir acesso direto ao SCR. Alternativas de produto: recebimento pelo próprio cliente de relatório do Registrato, integração via instituição parceira habilitada ou uso de fontes consentidas complementares.

## Banco Central — MDCR

Fonte: https://www.bcb.gov.br/estabilidadefinanceira/micrrural

- A Matriz de Dados do Crédito Rural apresenta valores e quantidade de concessões de crédito rural.
- Permite cortes por região, UF, município, programa, fonte de recursos, instituição financeira, produto, tipo de pessoa e características do beneficiário.
- A base é atualizada diariamente, pode sofrer revisões e é disponibilizada para download em arquivos CSV compactados.
- Uso recomendado: benchmark geográfico/produto, análise de oferta de crédito e construção de variáveis de contexto; não substitui histórico de inadimplência individual.

## Manual de Crédito Rural

Fonte: https://manuais.bcb.gov.br/app/manual/mcr/publico

- O MCR é a fonte normativa oficial e deve ser versionado por data de vigência.
- O produto deve manter rastreabilidade entre política de elegibilidade, regra aplicada e versão vigente do MCR.

## Implicações iniciais para o produto

1. Separar dados do produtor obtidos por consentimento de dados públicos/agregados e de dados de parceiros regulados.
2. Tratar autorização, finalidade, retenção e auditoria como requisitos centrais desde o MVP.
3. Não utilizar a MDCR como rótulo de inadimplência: ela descreve concessão de crédito, não performance individual.
4. Criar uma camada de regras versionada para requisitos do MCR, independente do modelo estatístico de probabilidade de inadimplência.

## LGPD e decisões automatizadas

Fontes:
- https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- https://www.gov.br/participamaisbrasil/tomada-de-subsidios-inteligencia-artificial-e-revisao-de-decisoes-automatizadas

- A LGPD inclui a proteção do crédito entre as hipóteses legais de tratamento, mas a dispensa de consentimento não afasta os princípios e direitos dos titulares.
- O tratamento deve observar finalidade, adequação, necessidade, qualidade, transparência, segurança, prevenção, não discriminação e responsabilização.
- O art. 20 alcança decisões tomadas unicamente por tratamento automatizado que afetem interesses do titular, incluindo perfil de crédito; o produto deve oferecer informação clara sobre critérios e procedimentos e um fluxo de contestação/revisão.
- A tomada de subsídios da ANPD de 2024–2025 destaca riscos de viés algorítmico, opacidade, tratamento de dados sensíveis, direitos de eliminação/revogação e a necessidade de governança durante todo o ciclo de vida.
- Recomendações de arquitetura: inventário de dados e bases legais, registro de finalidade por atributo, explicabilidade por decisão, canal de contestação, revisão humana para casos adversos ou limítrofes, trilha de auditoria e Relatório de Impacto à Proteção de Dados Pessoais antes da produção.

## Cadastro Positivo

Fonte: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12414.htm

- A Lei nº 12.414/2011 disciplina bancos de dados de adimplemento de pessoas naturais e jurídicas para formação de histórico de crédito.
- Informações devem ser objetivas, claras, verdadeiras, de fácil compreensão e necessárias à avaliação econômica; dados excessivos e informações sensíveis são proibidos.
- O cadastrado tem direito de acessar seu histórico e pontuação, impugnar erros, conhecer os principais elementos e critérios da análise e solicitar revisão de decisão exclusivamente automatizada.
- Os critérios de score não podem usar informações desvinculadas do risco de crédito nem atributos protegidos descritos na lei.
- Instituições autorizadas pelo BCB fornecem dados de operações de crédito apenas a gestores registrados no Banco Central. Portanto, caso o modelo de negócios venha a administrar histórico positivo e compartilhar score/histórico com terceiros, é necessária análise jurídica específica sobre o enquadramento como gestor de banco de dados e eventual registro no BCB.

## Decisões de produto decorrentes

1. No MVP, posicionar a empresa como provedora de inteligência e recomendação de risco para credores, com decisão final e política de concessão sob responsabilidade do credor, sem presumir que isso elimina obrigações da LGPD ou da Lei do Cadastro Positivo.
2. Proibir o uso de atributos sensíveis, proxies injustificáveis e variáveis de terceiros sem vínculo econômico com o tomador.
3. Gerar um reason code por variável material para cada resultado e uma versão compreensível ao produtor.
4. Criar processos de correção de dados, reprocessamento, revisão humana e resposta a titulares.
5. Submeter o desenho societário e operacional a parecer jurídico especializado antes de operar como bureau, originador, correspondente, securitizador ou credor.

## Gestão de risco, perdas esperadas e riscos climáticos

Fontes:
- https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4966
- https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o&numero=4557
- https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4943

A Resolução CMN nº 4.966/2021, na versão vigente consultada e atualizada em 29 de agosto de 2025, estabelece critérios para provisão de perdas esperadas associadas ao risco de crédito por instituições autorizadas. Ela caracteriza como problemático o instrumento com atraso superior a 90 dias ou com indicação de que a obrigação não será integralmente honrada sem recurso a garantias, admitindo prazo inferior quando houver evidência de redução significativa da capacidade financeira. O desenho do produto deve permitir que o cliente institucional use os escores em estruturas de PD, LGD e EAD, mas não deve confundir um score de originação com a provisão regulatória completa.

A Resolução CMN nº 4.557/2017 estabelece a estrutura de gerenciamento de riscos e capital, e foi sucessivamente alterada. Para o fornecedor analítico, isso implica documentação metodológica, segregação entre desenvolvimento e validação, aprovação e controle de mudanças, trilhas de decisão, monitoramento de desempenho e capacidade de auditoria.

A Resolução CMN nº 4.943/2021 incorporou o gerenciamento de riscos social, ambiental e climático à estrutura prudencial. Na prática, a solução agro deve tratar clima, conformidade socioambiental, uso do solo e dependência geográfica como dimensões materiais do risco, não apenas como filtros reputacionais.

O modelo comercial deve oferecer três saídas distintas: probabilidade de inadimplência e rating do tomador/operação; estimativas de severidade e recuperação condicionadas à garantia; e indicadores de alerta precoce. Instituições reguladas continuarão responsáveis por calibrar esses componentes à sua carteira, política contábil e apetite de risco.

## Impedimentos sociais, ambientais e climáticos do crédito rural

Fonte normativa: https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=5193&tipo=Resolu%C3%A7%C3%A3o+CMN

A Resolução CMN nº 5.193/2024 alterou o MCR 2-9 e está vigente desde 2 de janeiro de 2025, com regras adicionais aplicáveis a partir de 2 de janeiro de 2026. O imóvel do empreendimento é identificado pelas informações do Sicar. Entre os impedimentos estão ausência, cancelamento ou suspensão do CAR; inscrição do tomador no cadastro de empregadores por trabalho análogo ao de escravo; sobreposição, conforme as condições normativas, com unidades de conservação, terras indígenas, territórios quilombolas titulados e Florestas Públicas Tipo B; e determinados embargos ambientais por desmatamento ilegal.

Desde 2 de janeiro de 2026, instituições financeiras devem verificar supressão de vegetação nativa posterior a 31 de julho de 2019 usando informações oficiais derivadas do PRODES/Inpe. Quando houver indicação, a contratação com recursos controlados ou direcionados depende da documentação prevista no MCR, como autorização de supressão, PRAD/PRA, TAC ou laudo técnico de sensoriamento remoto sob responsabilidade da instituição. O produto precisa, portanto, produzir tanto alertas geoespaciais quanto evidências reproduzíveis, sem substituir a validação documental exigida do credor.

## Cadastros fundiários integrados

Fonte: https://www.gov.br/gestao/pt-br/assuntos/meu-imovel-rural

A plataforma oficial Meu Imóvel Rural reúne informações e documentos do SICAR, SNCR, SIGEF e CAF; exige acesso por conta GOV.BR e permite ao titular compartilhar cadastros com terceiros. Esse mecanismo é uma alternativa importante de onboarding consentido. O fluxo de dados deve receber o compartilhamento feito pelo produtor, registrar a origem e a data e conciliar os polígonos de CAR e SIGEF, preservando divergências em vez de escolher silenciosamente um cadastro como verdadeiro.
