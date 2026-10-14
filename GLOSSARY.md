# MyHermes

MyHermes é o contexto de automações pessoais que transforma entradas do proprietário em informação organizada e ações controladas.

## Language

**Hermes**:
O sistema pessoal que recebe Entradas, mantém Itens e coordena Automações.
_Avoid_: Bot, assistente genérico

**Automação**:
Uma capacidade do Hermes que reage a um gatilho e produz um resultado observável.
_Avoid_: Script, rotina

**Entrada**:
O conteúdo original recebido pelo Hermes e preservado para auditoria ou reprocessamento.
_Avoid_: Mensagem, prompt

**Item**:
O registro interpretado a partir de uma Entrada, classificado como Nota, Tarefa ou Lembrete.
_Avoid_: Entrada processada, registro

**Nota**:
Um Item informativo que não exige conclusão nem entrega em horário determinado.
_Avoid_: Anotação, memo

**Tarefa**:
Um Item que representa algo a ser realizado e posteriormente concluído.
_Avoid_: To-do, ação

**Lembrete**:
Um Item cuja finalidade é ser apresentado ao proprietário em um instante determinado.
_Avoid_: Alarme, notificação

**Interpretação**:
A leitura estruturada de uma Entrada que propõe o conteúdo e o tipo de um Item.
_Avoid_: Classificação, resposta da IA

**Correção**:
Uma alteração deliberada que substitui parte de uma Interpretação sem apagar seu histórico.
_Avoid_: Edição, ajuste
