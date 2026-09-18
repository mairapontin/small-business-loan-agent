# Fontes — gestão, equipe, tecnologia e mitigação de risco

Data de consulta: 3 de setembro de 2026.

## Embrapa — gestão da propriedade por talhões

URL: https://www.embrapa.br/en/busca-de-publicacoes/-/publicacao/1165023/a-gestao-da-propriedade-rural-por-talhoes

A publicação de 2023 descreve uma ferramenta de gestão com custos por talhão, comparações entre safras/culturas, ponto de equilíbrio em sacas e relatórios para decisão. Para o produto de crédito, a evidência relevante não é apenas “possui software”, mas a existência de histórico consistente por talhão, rotina de lançamentos, reconciliação com documentos, uso efetivo na decisão e capacidade de explicar desvios.

## MAPA — Agricultura Digital e de Precisão

URL: https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/tecnologia-agropecuaria/agricultura-de-precisao-1

A página oficial destaca aplicações como otimização de insumos, redução de perdas, escalonamento de colheita, monitoramento de qualidade, irrigação de precisão e treinamento de mão de obra. O score operacional deve medir tecnologia por adequação, disponibilidade, uso, manutenção, cobertura e redundância — não por simples aquisição de equipamento.

## CPI/PUC-Rio — gerenciamento de risco na agricultura brasileira

URL: https://www.climatepolicyinitiative.org/publication/risk-management-in-brazilian-agriculture-instruments-public-policy-and-perspectives/

O relatório trata conjuntamente riscos naturais, como seca, enchente, pragas, doenças e incêndios, e riscos de mercado, como variação de preço. Também ressalta que modernização, especialização e tecnologias de maior retorno podem alterar a variância dos resultados. Para a modelagem, tecnologia deve ser representada com dois canais: ganho esperado de produtividade/eficiência e risco de execução, dependência, manutenção ou concentração.

## Tradução para variáveis verificáveis

| Dimensão | Evidência preferida | Saída sugerida |
|---|---|---|
| Gestão econômica | Orçamento por talhão/cultura, realizado, fechamento mensal e reconciliação | Erro orçamentário, tempestividade e completude |
| Gestão agronômica | Caderno de campo, registros de pragas, aplicação, laudos e assistência técnica | Aderência, tempo de resposta e eficácia |
| Equipe | Organograma, funções, formação, tempo de casa, turnover, prestadores e plano de sucessão | Cobertura de funções críticas e key-person risk |
| Tecnologia | Telemetria, mapas, ERP/FMIS, integração, taxa de uso, uptime e calibração | Maturidade operacional e qualidade do dado |
| Continuidade | Seguro, contingência, redundância de máquinas, energia, conectividade e fornecedores | Capacidade de resposta e tempo de recuperação |

Questionário autodeclarado não deve ser suficiente para uma feature decisória. Cada atributo deve ter `source`, `evidence_id`, `validation_status`, `available_time` e prazo de validade.
