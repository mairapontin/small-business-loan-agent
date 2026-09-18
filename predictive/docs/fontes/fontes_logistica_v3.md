# Fontes — logística, armazenagem e infraestrutura

Data de consulta: 3 de setembro de 2026.

## ANTT — Portal de Dados Abertos

URL: https://dados.antt.gov.br/

O portal organiza conjuntos sobre cargas, ferrovias e rodovias. Deve ser usado para infraestrutura regulada, operadores, concessões e dados disponíveis de transporte; não deve ser confundido automaticamente com cotação de frete spot por rota.

## DNIT — Dados Abertos

URL: https://servicos.dnit.gov.br/dadosabertos/

O portal lista conjuntos como condições do pavimento, contagem de tráfego, jurisdição de vias, obras, pesagem e indicadores rodoviários. As condições de pavimento e obras podem alimentar risco de interrupção, tempo, custo e rota alternativa; exigem data de referência e compatibilização geográfica.

## ONTL/Infra S.A.

URL: https://ontl.infrasa.gov.br/

O Observatório integra bases, séries e painéis rodoviários, ferroviários, aquaviários e portuários, além de visualizador geográfico, simuladores de custo de transporte e transbordo e planejamento logístico. Em agosto de 2026, o portal apresentava Anuário com base 2016–2025, diagnóstico 2010–2024, panorama do Centro-Oeste e PNL 2050. O produto deve distinguir dado histórico, infraestrutura existente e projeto futuro.

Geoportal: https://geoportal.infrasa.gov.br/

## CONAB — Portal de Informações

URL: https://portaldeinformacoes.conab.gov.br/

O Portal Armazéns do Brasil/SICARM informa localização, capacidade estática e características de unidades armazenadoras. Outros painéis oferecem preços, produção e custos. Armazém cadastrado não prova capacidade disponível, contrato, qualidade, energia, seguro ou acesso do produtor; essas condições precisam ser confirmadas.

## Estrutura do grafo logístico

| Entidade | Campos mínimos |
|---|---|
| Origem | Talhão/fazenda, coordenada, volume, janela e condição de acesso |
| Armazém | Localização, capacidade, disponibilidade contratada, qualidade, secagem, energia e seguro |
| Terminal/transbordo | Modal, capacidade, fila, janela, tarifa, restrição e alternativa |
| Segmento | Modal, distância, tempo, pedágio, combustível, tarifa, sazonalidade e condição |
| Destino | Comprador/porto/esmagadora, especificação, janela e recebimento |
| Contrato de transporte | Transportador, RNTRC quando aplicável, preço, reajuste, capacidade e SLA |
| Evento | Bloqueio, obra, enchente, greve, avaria, fila, restrição de calado ou indisponibilidade |

O cálculo deve separar frete observado/contratado, piso regulatório quando aplicável, custo próprio da frota, armazenagem, secagem, perdas, pedágios, transbordo e custo financeiro do atraso. Cada rota deve produzir custo por saca/tonelada, preço líquido na fazenda, tempo, variância, ponto único de falha e rota alternativa.
