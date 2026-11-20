# Motrix — Sistema de Gestão de Serviços de Oficina Mecânica

Sistema web desenvolvido para gerenciamento de clientes, veículos, ordens de serviço e controle de agendamentos de uma oficina mecânica, contemplando controle de permissões por perfil de usuário, prevenção de conflitos de horários na agenda dos mecânicos e registro de histórico de operações.

## Funcionalidades Implementadas

- Autenticação e Controle de Perfis: Cadastro e login de usuários com perfis Administrador e Mecânico, com proteção de rotas e validação de permissões no servidor.
- Gestão de Clientes e Veículos: Cadastro, consulta, edição e vínculo direto entre veículos e seus respectivos proprietários.
- Gestão de Ordens de Serviço (OS): Abertura, edição, atualização de status, paginação e filtros por nome do cliente e data de atendimento.
- Prevenção de Conflitos na Agenda: Validação no servidor que bloqueia o cadastro ou alteração de uma ordem de serviço caso o mecânico selecionado já possua atendimento agendado no mesmo horário.
- Registro de Operações (Logs): Auditoria automática de cadastros e atualizações realizadas nas ordens de serviço, registrando data, hora e usuário responsável.

## Tecnologias Utilizadas

- Front-end: HTML, CSS, JavaScript
- Back-end: PHP
- Banco de Dados: MySQL
