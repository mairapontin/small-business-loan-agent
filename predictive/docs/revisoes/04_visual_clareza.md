# Revisão 4 — diagramas, clareza e experiência do analista

**Status inicial:** correção obrigatória.

A [folha de contato](evidencias/04_contato_diagramas.png) confirmou consistência de cores, caixas, sequência e tipografia interna nos onze diagramas. Entretanto, a inspeção individual de `v3_01_entidades_hd.png` revelou corte lateral do título **“ENTIDADES, PATRIMÔNIO E DISPONIBILIDADE AO CREDOR”**. A miniatura já sugeria o problema, e a visualização integral confirmou que o título excede a largura da imagem.

| ID | Severidade | Achado | Ação |
|---|---|---|---|
| R4-01 | Alto | Título do painel de entidades cortado nas duas laterais. | Implementar quebra ou escala automática de título e renderizar novamente todos os painéis. |
| R4-02 | Médio | A antiga aprovação visual não cobriu todos os painéis em uma única comparação. | Adotar folha de contato mais inspeção individual dos extremos. |
| R4-03 | Baixo | Os nomes de arquivos na folha de contato são pequenos, mas servem apenas ao QA. | Manter como evidência técnica; não faz parte do relatório principal. |

O gate exige zero corte em título, caixa ou subtítulo, resolução 3600 × 2400, SVG vetorial e suíte estrutural verde.

## Correção e reinspeção

O renderizador passou a dimensionar o título de acordo com seu comprimento, sem reduzir a fonte interna das caixas. Os onze PNGs e SVGs foram regenerados. A inspeção individual confirmou o título completo do painel de entidades, e a nova folha de contato não mostrou cortes, sobreposições ou mudanças de proporção.

| Gate visual | Resultado |
|---|---|
| Títulos integralmente visíveis | Aprovado |
| Textos internos dentro das caixas | Aprovado |
| Proporção uniforme 3:2 | Aprovado |
| Resolução PNG 3600 × 2400 | Aprovado |
| Cópia vetorial SVG | Aprovado |
| Cores e sequência consistentes | Aprovado |

**Status final da revisão 4: aprovado.**
