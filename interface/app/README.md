# TaskFlow Clínica

MVP acadêmico de agenda médica local, feito com HTML, CSS e JavaScript sem dependências externas. A entrada da aplicação é [index.html](index.html).

## Como abrir

Abra `index.html` em um navegador moderno. A interface usa scripts JavaScript clássicos (sem módulos ES), então não requer servidor HTTP nem instalação de pacotes. O armazenamento é feito no `localStorage` do navegador.

## Perfis e fluxos

- **Recepção:** visão geral, lista de consultas com filtros por data e médico, detalhes e novo agendamento.
- **Médicos:** visão da própria agenda, cadastro de horários e alteração de horários ainda livres.
- **Troca de perfil:** use o seletor no topo. Ele demonstra os fluxos acadêmicos; não é autenticação nem uma barreira de segurança.
- **Ajuda:** instruções variam conforme o perfil ativo.

Na primeira abertura são gravados horários e consultas de demonstração. Agendamentos e mudanças posteriores ficam salvos neste navegador e computador. A aplicação não sincroniza dados entre navegadores ou dispositivos. Limpar os dados do site no navegador também apaga a agenda local.

## Organização

- `index.html`: estrutura e pontos de entrada dos scripts.
- `styles.css`: identidade visual, componentes e regras responsivas.
- `main.js`: navegação e integração da interface com os serviços.
- `services/appointments.js`: validações e regras de agenda.
- `services/storage.js`: leitura e gravação no `localStorage`, incluindo a carga inicial demonstrativa.

## Regras implementadas

- Agendar exige médico, paciente e horário livre; um horário não pode ser reservado duas vezes.
- Médicos veem e alteram horários da própria agenda. Horários com consulta não podem ser alterados.
- Datas passadas e horários duplicados são rejeitados.
- Não existe ação de cancelamento; a regra também rejeita uma chamada de cancelamento no serviço.
- Falhas e validações de armazenamento são mostradas ao usuário.

## Validação executada

- `node --check` para os três arquivos JavaScript: sem erros de sintaxe.
- Testes isolados em memória do serviço: carga inicial, gravação local, agendamento, rejeição de conflito, filtro por médico, proteção de horário ocupado, titularidade do médico e rejeição de cancelamento: aprovados.
- A abertura para inspeção visual automatizada foi bloqueada pela política do navegador desta sessão para URLs `file://`; por isso, a renderização visual não foi verificada aqui.

## Decisões do requisito ainda pendentes

O seletor de perfil é somente uma forma de demonstração: sem serviço de autenticação não há como provar a identidade de quem usa o navegador. A duração de consulta e os status também não foram definidos nos documentos. O MVP adota horários discretos informados pelo médico e o status fixo `Confirmada`. A política de excluir horários foi evitada porque não há operação de exclusão no escopo apresentado.
