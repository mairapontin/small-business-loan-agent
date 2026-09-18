# Pauta de decisões para o dono do produto

**Objeto:** transformação das planilhas do mesmo produtor em regras de uma plataforma de crédito agro.

**Data de referência:** 3 de setembro de 2026.

> **Aviso de anonimização.** Este documento foi portado da pauta original removendo a identidade do produtor e os valores monetários específicos do caso. O produtor é referido como `PRODUTOR_EXEMPLO`. As fórmulas, a estrutura de cálculo e as perguntas de política são as do documento original e não foram alteradas. Os arquivos `.xlsx` de origem contêm dados pessoais e **não são versionados neste repositório**.

> Este documento não presume respostas. Quando apresenta uma interpretação possível, usa o prefixo **Inferência:**.

## 1. Esclarecimentos imediatos

### 1.1 O que significa dizer que a decisão final não foi localizada

Na folha `00 Credit Readout`, existe o rótulo `Preliminary decision` em `A4`, mas não foi encontrada uma célula preenchida ao lado com algo como `aprovar`, `reprovar`, `aprovar condicionado`, limite, prazo ou justificativa. Em `01 Script Fontes`, existe o texto “Decision is avança condicionado until gates/docs are cleared”. Esse segundo texto é uma **orientação de uso da planilha**, não uma fórmula nem um campo transacional de decisão.

Portanto, o ponto não é afirmar que o gerente decidiu fora do Excel. O ponto é que o arquivo não permite identificar de modo inequívoco:

| Elemento | Pergunta sem resposta no arquivo |
|---|---|
| Recomendação do modelo | Qual resultado foi calculado automaticamente? |
| Parecer do analista | O gerente concordou, ajustou ou rejeitou a recomendação? |
| Decisão de alçada | Quem tomou a decisão definitiva e em qual data? |
| Limite aprovado | Qual valor, moeda, prazo e produto foram autorizados? |
| Condições precedentes | Quais documentos, garantias ou ações precisam ocorrer antes do desembolso? |
| Override | Houve decisão diferente do modelo? Qual motivo e aprovador? |
| Estado atual | A proposta está em análise, condicionada, aprovada, contratada, desembolsada ou encerrada? |

**Inferência:** “avança condicionado” parece ser a recomendação operacional do analista para continuar a análise, e não necessariamente a aprovação final da operação. Essa interpretação precisa ser confirmada.

A plataforma deveria separar quatro registros: `model_recommendation`, `analyst_recommendation`, `credit_authority_decision` e `current_workflow_status`. Cada registro deve guardar usuário, data/hora, versão dos dados/modelo/política, limite, condições e justificativa.

### 1.2 É necessário reenviar a planilha em outro formato?

Não. Os arquivos XLSX estão íntegros, as fórmulas foram lidas e cópias isoladas foram recalculadas sem alteração de valores. O `###` aparece porque a coluna ficou estreita no layout de impressão; o número continua armazenado na célula.

Outro formato só seria necessário se houvesse um objeto que não pudesse ser interpretado no XLSX, uma senha, uma macro externa indispensável ou um suplemento proprietário. Nada disso foi identificado. Se for desejável discutir visualmente uma decisão célula a célula, um PDF com as páginas principais ou capturas de tela pode facilitar a conversa, mas não é requisito técnico neste momento.

### 1.3 O que é o `overhead proxy` de 30% da receita

No modelo observado, a lógica é:

```text
Receita agrícola
− custo direto da cultura
= contribuição bruta agrícola

Contribuição bruta agrícola
− 30% da receita agrícola
= EBITDA proxy de crédito
```

No cenário base exibido, a planilha traz valores em cache para cada componente:

| Componente | Valor observado |
|---|---|
| Receita base | omitido — dado do produtor |
| Custo direto base | omitido — dado do produtor |
| Contribuição bruta | `receita base − custo direto base` |
| Overhead proxy, 30% da receita | `0,30 × receita base` |
| EBITDA proxy de crédito | `contribuição bruta − overhead proxy` |

Os valores nominais do caso original foram omitidos desta versão por serem dado do produtor. A relação aritmética entre os componentes é o que importa para a modelagem e está preservada.

O termo **proxy** significa que a planilha não reconstruiu todas as despesas indiretas reais a partir de documentos contábeis e financeiros. Em vez disso, aplica uma taxa única de 30% sobre a receita como aproximação conservadora.

Ele não deve ser chamado de EBITDA contábil auditado porque não está demonstrado se inclui ou exclui corretamente administração, folha não alocada à lavoura, pró-labore, retiradas familiares, seguros gerais, manutenção de estrutura, armazenagem, energia fora do orçamento da cultura, serviços corporativos, arrendamentos, depreciação, tributos, itens extraordinários e transações entre empresas do grupo.

O risco de uma taxa única é duplo. Pode haver **dupla contagem** se uma despesa já estiver no custo/ha e também for coberta pelos 30%. Pode haver **omissão** se uma saída de caixa relevante não estiver nem no custo direto nem no overhead. Antes de usar o indicador na plataforma, o dono do produto precisa aprovar uma ponte explícita:

```text
Contribuição da safra
− despesas administrativas em caixa
− despesas operacionais não alocadas
− pró-labore/remuneração normalizada
± ajustes recorrentes aprovados
= geração operacional de caixa de crédito
```

Juros, principal de dívida, capex, variação de capital de giro e distribuições aos sócios devem aparecer em linhas separadas. Misturá-los no overhead dificulta o DSCR e pode gerar dupla contagem.

## 2. Dúvidas contextualizadas para discussão

### 2.1 Arquivo autoritativo e governança da regra

| Pergunta ao dono do produto | Contexto observado | Por que a decisão é necessária |
|---|---|---|
| Qual das três versões é a fonte oficial atual? | Foi confirmado que os arquivos tratam do mesmo produtor; as versões têm 19, 39 e 69 folhas. | Evita implementar fórmula antiga ou camada de QA como se fosse regra ativa. |
| As abas duplicadas são histórico, alternativas ou tentativas descartadas? | `financial_model.xlsx` contém vários sufixos `_1`, `_2`, `_3` e abas AI. | Define o que deve ser migrado, arquivado ou ignorado. |
| Quem pode alterar premissas e fórmulas? | A planilha não possui registro transacional de alteração por usuário. | Permite segregação entre Produto, Crédito, Risco, Jurídico e Tecnologia. |
| Toda mudança precisa de teste e aprovação? | Há folhas de QA, mas não foi observada uma política formal de promoção. | Evita mudança silenciosa de cutoff, haircut ou fórmula. |

### 2.2 Conceitos financeiros

| Pergunta ao dono do produto | Contexto observado | Consequência da resposta |
|---|---|---|
| O que exatamente é `net_sales`? | A própria memória pede confirmação entre receita agrícola de crédito e receita contábil líquida. | Define denominador de margem, EBITDA, DSCR e alavancagem. |
| Quais itens entram no custo direto da cultura? | A planilha usa valor do produtor e proxy regional. | Evita duplicar sementes, fertilizantes, defensivos, diesel, mão de obra, energia, frete e arrendamento. |
| O que deve entrar no overhead? | A taxa atual é 30% da receita. | Define a ponte entre margem da safra e geração operacional de caixa. |
| O overhead é por cultura, fazenda, empresa ou grupo? | O produtor pode operar por várias PFs/PJs e imóveis. | Define critérios de rateio e consolidação. |
| Pró-labore, retiradas familiares e despesas pessoais entram onde? | Não existe ponte explícita no modelo observado. | Afeta caixa disponível e risco de mistura patrimonial. |
| O EBITDA proxy continuará sendo usado ou será substituído por fluxo de caixa direto? | Hoje ele alimenta DSCR e alavancagem. | Define arquitetura de capacidade de pagamento. |
| Quais receitas são elegíveis: vendidas, fixadas, a fixar, barter, estoque, subprodutos? | A receita atual é agregada. | Define certeza, timing, contraparte e risco de basis. |

### 2.3 Dívida, caixa e grupo econômico

| Pergunta ao dono do produto | Contexto observado | Consequência da resposta |
|---|---|---|
| O serviço da dívida é o proxy atual ou o cronograma contratual completo? | Hoje usa juros modelados + principal até 360 dias. | O calendário completo captura picos de liquidez e descasamentos intrassafra. |
| Como tratar CPR, barter, fornecedores, arrendamento, impostos parcelados, avais e derivativos? | Nem todas essas obrigações aparecem no proxy agregado. | Evita subestimar EAD e necessidade de caixa. |
| SCR prevalece sempre quando maior que a dívida declarada? | A planilha recomenda usar SCR quando maior. | Pode haver duplicidade, coobrigação ou operação liquidada ainda não atualizada. |
| Como reconciliar dívida por contrato com SCR e registradoras? | A planilha traz fotografia e histórico parcial. | Impede dupla contagem e identifica passivo omitido. |
| Coobrigação entra 100%, ponderada ou apenas como contingência? | O caso mostra coobrigações relevantes. | Altera dívida consolidada, limite de grupo e stress. |
| Qual caixa é realmente disponível? | O indicador usa liquidez elegível, mas não há calendário detalhado. | Caixa bloqueado, vinculado, de outra empresa ou necessário à operação não deve ser contado integralmente. |

### 2.4 PF, PJ, família e patrimônio

| Pergunta ao dono do produto | Contexto de produto | Consequência da resposta |
|---|---|---|
| Qual é a unidade de risco: CPF, CNPJ, núcleo familiar, grupo econômico ou operação? | Bens, receitas e dívidas podem estar distribuídos entre familiares e empresas. | Define consolidação e evita visão fragmentada do risco. |
| Quais critérios provam controle econômico ou beneficiário final? | Titularidade formal não é necessariamente controle econômico. | Define evidência mínima: QSA, procurações, contas, contratos, fluxo financeiro, uso do ativo e garantias. |
| Como tratar cônjuge, herdeiros, espólio, usufruto, condomínio e empresas patrimoniais? | Podem ter direitos e obrigações distintos. | Afeta disponibilidade patrimonial e execução de garantias. |
| Transferências entre familiares são receita, empréstimo, aporte, distribuição ou adiantamento? | Fluxos podem parecer capacidade quando são apenas circulação interna. | Evita dupla contagem e melhora a trilha de origem/destino. |
| O sistema deve sinalizar estrutura complexa sem presumir evasão? | Pulverização patrimonial pode ter razões sucessórias, operacionais, jurídicas ou tributárias legítimas. | O output deve ser `complexidade/opacidade/necessidade de diligência`, não acusação de irregularidade. |
| Quais documentos autorizam consolidar ou excluir patrimônio de terceiro? | Bens de familiares não garantidores podem não estar disponíveis ao credor. | Evita considerar patrimônio sem suporte jurídico. |

### 2.5 Garantias e produto

| Pergunta ao dono do produto | Contexto observado | Consequência da resposta |
|---|---|---|
| O prepay em moeda estrangeira com CPR física observado no caso é só deste caso? | A folha de roteiro descreve essa operação; o valor nominal e a cultura foram omitidos por serem dado do produtor. | Evita transformar característica do caso em regra geral para soja. |
| Como se calcula cobertura de CPR por produto? | A planilha usa volume, preço conservador, conversão e prepay. | Precisa distinguir obrigação física, financeira, moeda, qualidade, praça e vencimento. |
| Quais haircuts e documentos tornam cada garantia elegível? | A planilha mantém perfeição do colateral como pendência. | Define LGD, condição precedente e bloqueio. |
| Como tratar gravames, prioridade, cessão, substituição e liberação parcial? | Valor econômico não equivale a garantia livre. | Evita cobertura fictícia. |

### 2.6 Política de decisão e alçadas

| Pergunta ao dono do produto | Contexto observado | Consequência da resposta |
|---|---|---|
| Quais são os estados do workflow? | `Preliminary decision` está sem valor; existe texto “avança condicionado”. | Define originação, análise, comitê, contratação, desembolso e monitoramento. |
| Quais gates numéricos são mandatórios? | O modelo cita DSCR, alavancagem, liquidez e CPR, sem cutoffs explícitos. | Evita inventar limites e permite backtesting. |
| Gate é bloqueio absoluto, condição ou fator de preço? | A consequência não está parametrizada. | Define motor de regras e política comercial. |
| Quem tem alçada para override? | Não há trilha observada de override. | Garante responsabilização e monitoramento de exceções. |
| Como registrar limite, prazo, preço, garantia e covenants aprovados? | O readout não contém registro completo da decisão. | Cria o contrato decisório reproduzível. |

### 2.7 Cenários e riscos novos

| Pergunta ao dono do produto | Contexto observado | Consequência da resposta |
|---|---|---|
| O stress genérico deve continuar como piso comparável? | Hoje usa 0,85× produtividade, 0,90× preço e 1,10× custo. | Pode permanecer como benchmark, mas não substitui cenários causais. |
| Quais eventos devem ser nomeados no MVP de soja/MT? | A camada será desenvolvida do zero. | Prioriza seca, excesso de chuva, calor, incêndio, praga, fertilizante, frete, juros, basis e margem. |
| Como combinar eventos sem somar extremos incompatíveis? | Choques possuem dependências e efeitos opostos. | Define cenários conjuntos, regimes e simulação. |
| O que fazer com evento sem histórico suficiente? | Riscos emergentes não permitem PD estatística confiável. | Exige faixa de impacto, overlay, revisão humana e validade limitada. |
| Notícias e redes sociais podem bloquear crédito? | Uma postagem pode mover preços, mas também conter ruído/manipulação. | Recomendação inicial: usar como gatilho para medir impacto de mercado, nunca como prova isolada ou regra automática contra o produtor. |

### 2.8 Gestão, equipe e tecnologia do produtor

| Pergunta ao dono do produto | Contexto de produto | Consequência da resposta |
|---|---|---|
| Como medir experiência e sucessão do gestor? | O Excel atual é majoritariamente financeiro/patrimonial. | Cria avaliação de continuidade e key-person risk. |
| Quais funções críticas precisam existir ou ser terceirizadas? | Agronomia, finanças, comercial, manutenção, armazenagem e hedge exigem competências distintas. | Permite score operacional com evidências. |
| Como comprovar qualidade da equipe? | Currículo autodeclarado é insuficiente. | Define documentos, tempo de casa, certificações, turnover e referências. |
| Quais tecnologias importam por sistema produtivo? | Tecnologia pode reduzir ou concentrar risco. | Telemetria, agricultura de precisão, irrigação, armazenagem, ERP e conectividade devem ser avaliados por disponibilidade, uso e manutenção. |
| Existe plano de contingência e seguro? | Evento extremo pode interromper operação. | Define recuperação, redundância e transferência de risco. |

### 2.9 Logística, energia e infraestrutura

| Pergunta ao dono do produto | Contexto de produto | Consequência da resposta |
|---|---|---|
| Qual é a rota fazenda–armazém–terminal–comprador? | Distância e sazonalidade alteram preço líquido e tempo de caixa. | Define custo por tonelada/saca, risco de atraso e basis local. |
| Quais modais estão disponíveis? | Rodovia, ferrovia, hidrovia e combinações possuem custos e riscos diferentes. | Permite cenários de bloqueio e rotas alternativas. |
| Frete é próprio, contratado spot ou contrato anual? | Forma de contratação muda volatilidade e capex. | Define custo, disponibilidade e contraparte. |
| Qual combustível e eficiência da frota/equipamentos? | Diesel, biodiesel, eletricidade e geração própria têm exposições distintas. | Liga preço de energia ao custo operacional. |
| Há armazenagem própria e energia confiável? | Armazenagem pode reduzir venda forçada, mas exige capex, manutenção e energia. | Afeta timing da receita, perda de qualidade e liquidez. |
| Quais gargalos e redundâncias existem? | Ponte, estrada, balsa, terminal ou subestação podem ser ponto único de falha. | Define stress operacional e plano de contingência. |

### 2.10 Fontes de risco agro: veto e ausência de dado

| Pergunta ao dono do produto | Contexto observado | Consequência da resposta |
|---|---|---|
| Uma evidência de conversão florestal pode vetar a proposta por si, ignorando o score composto? | A especificação do motor agro estabelece que o veto do MapBiomas "manda em tudo" e faz a proposta sair bloqueada com o score dispensado. A fonte não está integrada ao backend. | Define a hierarquia entre bloqueio socioambiental e pontuação. Sem a resposta, nenhum gate de veto pode ser implementado. |
| Ausência de dado de uma fonte deve falhar aberto, falhar fechado ou interromper a esteira? | As três atitudes coexistem hoje: ZARC trata a ausência como "dentro da janela", Agrofit como "não conforme", e a rota de clima devolve HTTP 200 com `status pending`. Nenhuma delas foi escolhida deliberadamente. | Fixa o comportamento padrão que `agents.md` §2 exige e precede os itens 33 a 40 do registro de pendências de política. |

## 3. Resultado esperado da reunião

Ao final, o dono do produto deve aprovar um **dicionário de conceitos**, uma **política de consolidação de grupo**, uma **matriz de dívida e caixa**, um **workflow de decisão e alçadas**, os **gates iniciais**, o **tratamento das garantias**, a **biblioteca de cenários** e a **versão autoritativa** do modelo. Itens sem decisão permanecem marcados como `PENDING_PRODUCT_DECISION`; não serão convertidos silenciosamente em fórmula ou feature.
