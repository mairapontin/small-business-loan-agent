# Fontes — geopolítica, notícias, sanções e sinais sociais

Data de consulta: 3 de setembro de 2026.

## Geopolitical Risk Index — Caldara e Iacoviello

URL: https://www.policyuncertainty.com/gpr.html

O índice GPR conta matérias jornalísticas relacionadas a ameaças e atos geopolíticos, com série benchmark desde 1985, série histórica desde 1900 e indicadores por país. É indicador de regime global/país e descoberta de choques; não mede a exposição específica de um produtor.

## Federal Reserve — exposição heterogênea por indústria

URL: https://www.federalreserve.gov/econres/notes/feds-notes/measuring-geopolitical-risk-exposure-across-industries-a-firm-centered-approach-20250829.html

A nota de 2025 mostra que consequências geopolíticas variam por indústria e que medidas de percepção das empresas e reação de mercado são complementares, não idênticas. O desenho do produto deve interagir evento com exposição real: país comprador, origem de fertilizante, rota marítima, moeda, contrato e posição.

## GDELT

URL: https://www.gdeltproject.org/

O GDELT monitora notícias em mais de 100 idiomas, possui histórico desde 1979 e atualizações frequentes, codificando eventos, entidades, locais, temas e tom. É uma fonte aberta para descoberta e agregação, mas deriva de mídia e algoritmos; requer deduplicação, avaliação de fonte, confirmação e proteção contra cobertura desigual.

## Nações Unidas — lista consolidada de sanções

URL: https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list

A lista oficial oferece versões XML/HTML/PDF e identifica pessoas e entidades sujeitas a medidas do Conselho de Segurança, com regime e identificadores. Para compliance, uma correspondência por nome não deve bloquear automaticamente: exige matching robusto, identificadores, revisão e aplicação da regra/jurisdição pertinente.

## X/Twitter e outros sinais sociais

A pesquisa de API confirmou capacidade técnica de consultar posts públicos recentes, data/hora, autor, texto, métricas públicas, referência e mídia, conforme acesso contratado. A plataforma não deve depender de scraping nem presumir acesso histórico ilimitado. Devem ser avaliados licença, retenção, redistribuição, cobertura e custo.

Uma postagem pode mover preços, mas o texto isolado não deve alterar diretamente a PD do produtor. O pipeline recomendado é:

```text
Post/notícia
→ autenticidade, autor, fonte, alcance e novidade
→ classificação de tema, entidade, local e horizonte
→ confirmação por fontes independentes e reação observável de mercado
→ mapeamento para soja, dólar, fertilizante, petróleo, frete, comprador ou rota
→ impacto na posição específica do produtor
→ alerta, cenário e revisão
```

## Features sugeridas

| Família | Exemplos | Uso |
|---|---|---|
| Regime geopolítico | nível e variação do GPR, atos versus ameaças | Stress macro e detecção de regime |
| Evento estruturado | tipo, atores, países, local, severidade, início e evolução | Grafo de exposição |
| Sinal noticioso | contagem deduplicada, diversidade de fontes, tom, aceleração e novidade | Early warning |
| Reação de mercado | retorno, volatilidade, volume, correlação e quebra de regime | Confirmação econômica |
| Exposição do produtor | origem de insumo, destino de venda, moeda, rota e contraparte | Condicionamento do impacto |
| Sanções/compliance | match, regime, identificadores, data e revisão | Motor de regras separado do score |

## Controles

Posts, notícias e índices agregados não são fatos suficientes para uma decisão adversa individual. O sistema deve preservar o conteúdo consultado, timestamp, origem, licença, classificação, confiança, confirmações, reação de mercado e analista. Deve haver filtros contra bots, duplicação, spoofing, rumor, conteúdo antigo republicado e manipulação coordenada.
