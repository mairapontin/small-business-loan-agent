# Pendências de política (`PENDING_POLICY`)

Índice consolidado de todas as decisões que o dono do produto precisa tomar antes que a modelagem preditiva de crédito agro possa virar regra automática da plataforma.

**Regra de ouro:** enquanto um item desta lista estiver aberto, o sistema exibe a tag `PENDING_POLICY` e apresenta intervalos ou cenários. **Não são inseridos números "típicos" de mercado como se fossem política vigente.** Isso decorre da regra de não-alucinação do `agents.md` (§2): se faltar dado, reporte a ausência.

Origem: §17 do [Plano de trabalho](plano_trabalho.md), §3.4 (gates de Definition of Done) e §5/§8 da [Reconstrução da lógica das planilhas](auditoria/logica_planilhas.md).

---

## 1. Definições de negócio

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 1 | Versão mestre | Qual dos três arquivos é autoritativo? Se nenhum, qual artefato tem cada função? | Linhagem, QA e comparação correta |
| 2 | Produto-alvo | O prepay em moeda estrangeira com CPR física é específico do caso ou produto-padrão? | Escopo, moeda, cultura, garantia e rótulo |
| 3 | `net_sales` | Receita agrícola aceita, receita após descontos ou receita contábil líquida? | Fórmula de margem e comparabilidade |
| 4 | Overhead | Quando usar o proxy de 30%; quais contas o substituem; quais itens evitar duplicar? | Geração de caixa e reason code |
| 5 | Rótulo (label) | O que é default e qual janela? Como tratar renegociação e recuperação judicial? | Treino, validação e métricas |
| 6 | Retiradas familiares | O que é retirada normalizada e o que é despesa operacional? | Caixa disponível |
| 7 | Custeio | Como equalizar preço, prazo, garantias e encargos entre barter, CPR, fornecedor e banco? | Margem e escolha de funding |
| 8 | Crédito de investimento | Quais encargos, indexadores, moeda, carência e balão compõem o custo all-in? | VPL, DSCR e capacidade |

## 2. Gates e limites

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 9 | Gates | Limites de DSCR, alavancagem, liquidez, cobertura de CPR e exceções | Política configurável — **não inventar thresholds** |
| 10 | Serviço da dívida | Incluir cronograma completo, barter, fornecedores, arrendamentos e derivativos? | Caixa e capacidade reais |
| 11 | Coobrigações | Tratamento econômico: integral, ponderado, cenário ou alerta? | Dívida consolidada e EAD |
| 12 | Patrimônio | Quais ativos, haircuts, gravames e regimes são elegíveis? | LGD e limite |
| 13 | Tolerância de reconciliação | Qual divergência é aceitável entre SCR, contratos e ERP? | Gate de reconciliação financeira |

Os itens 32 a 40 abaixo pertencem à mesma seção temática — todos são cortes numéricos — e por isso continuam a
numeração global. Ela aparece fora de ordem sequencial de propósito: **o número é identificador estável, não
posição**. Renumerar para restabelecer a sequência quebraria as referências feitas a estes itens.

Eles vêm da especificação do motor de risco agro (`docs/documentation/data_sources_agro.pt.md`), que fixou
valores sem origem. Dois deles já existem no código como constante — marcados com ◆ — e os demais
dependem de uma fonte que **não está integrada**, listado na última coluna.

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 32 | Score composto agro | Pesos das oito dimensões (custo, ZARC, clima, defensivo, uso do solo, desmatamento, falha de safra, autodeclaração) | Não há motor de decisão. Os pesos da especificação somam 1.0 sem justificativa derivada de amostra |
| 33 | Falha de safra por NDVI | Corte de NDVI médio no auge da safra (a especificação usa `< 0.3`) e o peso do alerta (`+25 pts`) | Sentinel-2/NDVI não está integrado. Sem calibração por bioma, cultura nem fenologia |
| 34 | Mudança de uso por embedding | Limiar de similaridade entre embeddings de safras consecutivas (`< 0.8`) e o peso (`+25 pts`) | AlphaEarth/Satellite Embedding não está integrado. A similaridade de cosseno não é calibrada por tipo de cobertura |
| 35 | Passivo ambiental preditivo | Probabilidade de desmatamento a partir da qual se alerta (`> 0.6`) e o peso (`+15 pts`) | Sem acesso à fonte de probabilidade; calibração do estimador indefinida |
| 36 | Janela de plantio ZARC | Multiplicador aplicado quando o plantio cai fora da janela segura (a especificação diz `+30%`; o código devolve `1.3`) | ◆ **já existe no código** como constante e nunca foi aprovado. Sensibilidade de default não calibrada |
| 37 | Estresse hídrico | Precipitação acumulada em 30 dias abaixo da qual a operação é crítica (`< 50 mm`) e o peso (`+20 pts`) | Agritempo não tem integração funcional. O limiar é absoluto: não varia por cultura, solo nem fase fenológica |
| 38 | Subdeclaração de custo | Razão entre custo declarado e referência oficial abaixo da qual se suspeita de fraude (`< 0.6`) e o peso (`+40 pts`) | ◆ **já existe no código** como constante. O ponto é proxy de fraude sem amostra que o sustente |
| 39 | Desvio de custo | Desvio absoluto tolerado entre custo declarado e referência (`> 30%`) e o peso (`+15 pts`) | Convive com o item 38 sem que a prioridade entre os dois esteja definida |
| 40 | Defensivo sem registro | Pontos por produto sem registro na cultura declarada (`+10 pts` por produto) e o teto de acumulação | Agrofit sem ingestão funcional. Sem teto, a regra pode dominar o score sozinha |

## 3. Grupo e governança

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 14 | Grupo PF/PJ | Critérios de controle, consolidação, disponibilidade e documentação | Grafo e regra de diligência |
| 15 | Parecer final | Qual registro é mestre; quais status e alçadas? | Workflow, override e auditoria |
| 16 | Override | Motivos, aprovadores, validade e monitoramento | Aprendizagem e risco de modelo |
| 17 | Gestão | Pilares de equipe e tecnologia entram como veto, subscore, overlay ou reason code? | Governança e necessidade de amostra |
| 18 | Novelty | Quem aplica overlay, por quanto tempo e como encerra? | Governança de risco emergente |

## 4. Ativos, capacidade e depreciação

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 19 | Máquinas e capacidade | Quais operações, janelas e margens de capacidade são mínimas? Como tratar terceirização? | Inventário, capacidade e alertas |
| 20 | Depreciação | Qual método e fonte serão aceitos por classe de ativo? | Custo/ha, LGD e comparabilidade |
| 21 | Reposição | Quais gatilhos, horizontes e reservas entram no caso-base e no stress? | Fluxo de caixa e dívida futura |

## 5. Dados externos e sinais

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 22 | Market data | Qual latência é necessária por usuário/produto? | Arquitetura e orçamento de dados |
| 23 | Derivativos | Quais instrumentos e bolsas entram; quem valida a posição? | Motor de payoff, margem e suitability |
| 24 | Logística | Usar contrato, CT-e ou benchmark, e qual política de fallback? | Grafo e cenários de interrupção |
| 25 | Energia | Quais processos críticos e evidências serão coletados? | Features de custo e resiliência |
| 26 | Eventos globais | Quais exposições e níveis acionam alerta ou revisão? | Grafo de propagação e SLA |
| 27 | Redes sociais | Fontes, autores, confirmação, retenção e ação permitida | Controles e risco reputacional |

## 6. Piloto e aceite

| # | Tema | Decisão pendente | Consequência técnica |
|---|---|---|---|
| 28 | Piloto | Metas de redução de tempo, divergência, perda, alertas e adoção | Go/no-go e contrato comercial |
| 29 | Cobertura de cenários | Cobertura mínima de choques nomeados para liberar o gate | Gate de cenários |
| 30 | Shadow mode | Amostra e duração mínimas | Gate de shadow mode |
| 31 | Resultado econômico | Valores-alvo de tempo, aprovação, bad rate, perda, alertas e adoção | Gate de resultado econômico |

---

## Efeito no código portado

Os módulos já portados — `services/portal-api/src/yatai_api/predictive/domain/credit_math.py` e `services/portal-api/src/yatai_api/predictive/domain/point_in_time.py` — calculam indicadores mas **não aplicam nenhum corte de decisão**. Isso é deliberado: os thresholds dos itens 9 a 13 não existem. Qualquer motor de decisão que consuma esses cálculos deve retornar `PENDING_POLICY` no lugar do veredito até que o item correspondente seja aprovado.

Nos cortes agro (itens 32 a 40) a situação é pior e por isso registrada aqui: dois valores ◆ já existem no código como constante e **nunca foram aprovados** — o multiplicador de janela de plantio ZARC (`risk_multiplier = 1.3` em `services/portal-api/src/yatai_api/routers/risk_engine.py`) e o proxy de subdeclaração de custo. Não é um cálculo portado que os aplicou: é a especificação do motor de risco agro que virou número fixo antes de qualquer decisão de produto.

---

## Segunda tag: `PENDING_PRODUCT_DECISION`

A [pauta de decisões de produto](auditoria/pauta_decisoes_produto.md) usa uma tag distinta, e as duas não se confundem:

| Tag | O que bloqueia | Onde vive |
|---|---|---|
| `PENDING_POLICY` | Threshold, cutoff, haircut ou gate numérico que viraria regra automática | Os 40 itens deste índice |
| `PENDING_PRODUCT_DECISION` | Definição de escopo, conceito ou governança que precede qualquer threshold | §3 da pauta de decisões de produto; veto agro e tratamento da ausência de dado em §2.10 |

Os oito artefatos que o dono do produto precisa aprovar para fechar a segunda tag — dicionário de conceitos, política de consolidação de grupo, matriz de dívida e caixa, workflow de decisão e alçadas, gates iniciais, tratamento das garantias, biblioteca de cenários e versão autoritativa do modelo — estão listados na §3 daquele documento. Enquanto um deles estiver aberto, os itens correspondentes permanecem marcados e **não são convertidos silenciosamente em fórmula ou feature**.
