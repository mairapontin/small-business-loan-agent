# Taxonomia de dados e regras — crédito agro soja em Mato Grosso

## Regra fundamental

A expressão “dados e regras” deve ser desdobrada em quatro objetos distintos. Uma mesma informação pode alimentar mais de um objeto, mas não se deve confundi-los.

| Objeto | Pergunta | Exemplo | Saída |
|---|---|---|---|
| Regra legal/regulatória | A operação é permitida e quais documentos/condições são obrigatórios? | Impedimentos do MCR, validade do CAR, registro da CPR | Elegível, impedido, pendente ou revisão jurídica |
| Regra contratual/comercial | A operação respeita os contratos e como os fluxos/garantias se comportam? | Quantidade já vendida, preço a fixar, barter, cessão, prioridade, cross-default | Exposição líquida, obrigações, conflitos e condições |
| Política do credor | Mesmo permitida, a operação cabe no apetite do financiador? | Limite por grupo, LTV, DSCR mínimo, concentração regional | Aprovar, revisar, condicionar ou recusar |
| Variável preditiva | A informação possui relação econômica e estatística com default, perda ou produtividade? | Volatilidade de margem, histórico de atraso, veranico na floração | PD, LGD, produtividade e alerta |

Nenhuma probabilidade estatística substitui uma proibição legal. Nenhum alerta ambiental isolado deve ser apresentado como ilegalidade sem enquadramento da regra. Nenhum derivativo deve ser tratado como proteção sem reconstruir seu payoff, volume, vencimento, basis, margem e contraparte.

## Domínios do motor de decisão

| Domínio | Dados mínimos | Regras a representar | Resultado do motor |
|---|---|---|---|
| Identidade e grupo econômico | CPF/CNPJ, QSA, vínculos societários/familiares economicamente justificáveis, contas, empresas, imóveis e garantidores | KYC, sanções, duplicidade, consolidação de exposição e partes relacionadas | Grupo resolvido, beneficiário, exposição consolidada e pendências |
| Financeiro e endividamento | Balanço/DRE/caixa, extratos, contas a receber/pagar, estoques, contratos, CACR/SCR, CPR, barter, arrendamentos, tributos e passivos judiciais | Definição de dívida, senioridade, vencimento, juros, covenant, cross-default, contingências e dupla contagem | Dívida líquida/ajustada, serviço da dívida, liquidez e alavancagem por safra |
| Operação agrícola | Área, posse/arrendamento, cultura, cultivar, ciclo, calendário, orçamento, tecnologia, produtividade, seguro e assistência | ZARC, finalidade do crédito, orçamento elegível, cronograma, comprovação de aplicação e cobertura | Necessidade de custeio, risco de execução e produtividade de equilíbrio |
| Comercialização física | Contratos de compra/venda, CPR física, barter, preço, quantidade, qualidade, entrega, armazém, comprador e recebíveis | Validade, registro, cessão, prioridade, condição de entrega, preço fixo/a fixar, penalidades, força maior e compensações | Receita contratada, receita exposta, risco de contraparte e obrigação física |
| Derivativos e hedge | Futuros, opções, termo/NDF, swaps, moeda, strikes, vencimentos, lotes, prêmios, margens, corretora e confirmações | Elegibilidade da contraparte, poderes, suitability quando aplicável, registro, limites, margem, liquidação e contabilização | Hedge efetivo, exposição residual, caixa de margem e risco de basis |
| Garantias | CPR, penhor, hipoteca, alienação fiduciária, aval/fiança, seguro, cessão de recebíveis, depósitos e bens | Constituição, registro, prioridade, gravames, cobertura, elegibilidade, execução, substituição e vencimento | LGD, valor líquido, haircut, tempo e risco de execução |
| Ambiental e climático | CAR, polígonos, PRODES/DETER, embargos, APP/RL, autorizações, PRA/PRAD/TAC, licenças e alertas | MCR vigente, Código Florestal, embargos, supressão, exceções e evidência documental | Impedimento, pendência, alerta ou indicador de risco |
| Fundiário e territorial | Matrícula, certidões, SIGEF, SNCR/CCIR, CAR, posse, arrendamento, confrontações e sobreposições | Titularidade/posse, poderes de contratar, validade do arrendamento, ônus, indisponibilidade e compatibilidade das áreas | Vínculo com empreendimento, área financiável e risco fundiário |
| Social e integridade | Lista trabalhista, sanções, PEP quando aplicável, fraude documental, processos e partes relacionadas | Impedimentos do MCR, PLD/FTP do cliente regulado, política de integridade e fraude | Impedimento, diligência ampliada ou alerta |
| Mercado, macro e logística | Preço local, CBOT, câmbio, basis, juros, insumos, frete, armazenagem e rotas | Política de marcação, cenários, limites de concentração e premissas de preço/custo | Fluxo base, adverso e severo; margem de segurança |
| Dados e privacidade | Origem, titular, finalidade, base legal, consentimento, versão, qualidade, retenção e acesso | LGPD, Cadastro Positivo, sigilo, contratos de dados, direitos e incidentes | Campo utilizável, bloqueado, expirado ou sujeito a revisão |

## Camadas de legislação e normativos a pesquisar

1. Crédito rural e prudencial: Manual de Crédito Rural, resoluções do CMN/BCB sobre impedimentos, risco de crédito, risco social/ambiental/climático e compartilhamento de dados.
2. Ambiental: Código Florestal, CAR/PRA, competências de IBAMA/SEMA-MT, embargos, licenciamento, PRODES e categorias territoriais protegidas.
3. Fundiária: registro de imóveis, georreferenciamento/SIGEF, SNCR/CCIR, posse, arrendamento e cadeia dominial, com parecer jurídico sobre cada garantia.
4. Títulos e garantias do agro: Lei da CPR, registro/deposito, patrimônio rural em afetação/CIR quando aplicável, penhor rural, hipoteca, alienação fiduciária, cessão e prioridade.
5. Comercial e contratual: Código Civil, contratos de compra e venda futura, barter, armazenagem, transporte, qualidade/entrega, força maior, cessão e compensação.
6. Derivativos: regras de mercados organizados e balcão, registro, intermediação, suitability quando houver recomendação, contratos B3, margem e riscos de liquidação; CPC 48 quando a informação contábil de hedge for usada.
7. Dados pessoais e crédito: LGPD, Cadastro Positivo, SCR/CACR, Open Finance, sigilo bancário, direitos de revisão e contratos com operadores.
8. Recuperação e insolvência: recuperação judicial/falência, concurso de credores, essencialidade de bens, execuções e tratamento das garantias, sempre com análise jurídica especializada.
9. Tributário/documental: regularidade fiscal e documentos de produtores PF/PJ; tratamento tributário afeta caixa, mas o produto não deve emitir opinião fiscal automatizada.

## Princípio de cálculo financeiro

A exposição econômica deve ser reconstruída por vencimento e contraparte. O sistema deve distinguir dívida bancária, CPR financeira, obrigação física, barter, fornecedores, arrendamento, tributos, leasing, avais/fianças e passivos contingentes. Itens não podem ser somados sem normalização: uma CPR pode representar a mesma obrigação registrada em outra fonte.

Para cada instrumento, guardar principal/quantidade, moeda/unidade, indexador, taxa/preço, vencimento, amortização/entrega, garantia, prioridade, contraparte, fonte, identificador e data de consulta. O serviço da dívida deve ser comparado ao caixa por safra, não apenas a EBITDA anual.

## Princípio de avaliação de hedge

A plataforma não deve classificar um contrato como hedge apenas pela sua descrição. Deve reconstruir posição física esperada, contratos físicos já firmados e instrumentos financeiros, por commodity, praça, mês e moeda. A proteção líquida depende de volume compatível, vencimento, correlação do indexador com o preço local, risco de basis, margem, liquidez, prêmio, risco de contraparte e possibilidade de overhedge.

## Resultado esperado por operação

O dossiê deve apresentar: regras legais testadas e sua versão; documentos e dados usados; exposição financeira consolidada; mapa de vencimentos; receita física contratada e não contratada; hedge e exposição residual; fluxo de caixa base/adverso/severo; garantias e prioridade; impedimentos e pendências; PD/LGD; limite sugerido; reason codes; nível de confiança; e canal de correção/revisão.
