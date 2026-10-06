# Fontes — eventos extremos e interrupções globais

Data de consulta: 3 de setembro de 2026.

## GDACS

Portal: https://gdacs.org/

API: https://www.gdacs.org/gdacsapi/swagger/index.html

O GDACS é uma estrutura de cooperação entre Nações Unidas, Comissão Europeia e gestores de desastre. O portal publica alertas e informações iniciais sobre desastres súbitos; a API permite listar eventos, alertas, episódios, áreas afetadas, geometrias e produtos. Em 2 de setembro de 2026, o portal destacava enchentes no Nepal, o exemplo mencionado pelo usuário.

O sinal GDACS deve ser cruzado com ativos, fornecedores, compradores, corredores, portos e regiões de formação de preço. Um desastre distante sem caminho de exposição não deve alterar diretamente o score do produtor.

## Copernicus Emergency Management Service

URL: https://mapping.emergency.copernicus.eu/

O serviço usa imagens de satélite e dados geoespaciais para mapear desastres naturais, emergências humanas e crises. As ativações e produtos podem confirmar área e severidade; a ativação do serviço é restrita a usuários autorizados, mas produtos publicados podem ser usados conforme termos aplicáveis.

## NASA Earthdata

URL: https://www.earthdata.nasa.gov/topics/human-dimensions/natural-hazards

A NASA oferece dados globais, inclusive próximos do tempo real, para enchentes, incêndios, ciclones, secas, calor extremo e outros perigos. Alguns downloads e ferramentas exigem Earthdata Login. Os produtos possuem resolução, latência, algoritmo e limitações próprios; devem ser validados por tipo de evento.

## Arquitetura de propagação

```text
Evento externo
→ localização, tipo, severidade e janela
→ interseção com ativo, rota, porto, fornecedor, comprador ou região produtora
→ choque em preço, basis, frete, disponibilidade, prazo, qualidade ou contraparte
→ posição econômica do produtor
→ fluxo de caixa, liquidez, garantia e risco de crédito
```

## Regras de uso

| Nível | Tratamento |
|---|---|
| Evento sem exposição identificada | Registrar no radar; sem alteração de risco do produtor |
| Exposição provável, evidência preliminar | Alerta e coleta de confirmação |
| Interseção confirmada com ativo/rota | Cenário quantitativo e ação operacional |
| Evento fora da amostra | `novelty_flag`, faixa de impacto, overlay temporário e revisão humana |
| Fonte contraditória | Preservar versões e reduzir confiança; não automatizar decisão adversa |

Dados de desastre são alertas de perigo e impacto potencial; não provam dano individual, causalidade do default ou descumprimento contratual.
