# KryoStock

**Aplicativo portátil de controle de estoque desenvolvido com React, TypeScript, Vite e Go.**

O KryoStock é um projeto de portfólio desenvolvido com o objetivo de criar uma solução simples, local e funcional para controle de estoque.

A proposta do sistema não é ser um ERP, mas sim um aplicativo focado exclusivamente em gerenciamento de produtos, categorias, movimentações e indicadores de estoque.

## Visão geral

O KryoStock permite controlar produtos, categorias, entradas, saídas, ajustes e correções de inventário de forma local.

O sistema possui dashboard, relatórios, backup em JSON, modo claro/escuro e versão portátil para Windows.

## Funcionalidades

- Cadastro de produtos
- Cadastro de categorias
- Registro de entradas
- Registro de saídas
- Ajustes positivos e negativos
- Correção de inventário
- Histórico de movimentações
- Exclusão controlada de movimentações
- Dashboard com indicadores
- Relatórios com dados reais
- Produtos com estoque baixo
- Configurações de usuário
- Backup local em JSON
- Importação de backup
- Modo claro e escuro
- Versão portátil para Windows

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Vitest
- Go

## Conceitos aplicados

- Componentização
- CRUD
- Regras de negócio
- Validação de dados
- Persistência local
- Backup em JSON
- Testes automatizados básicos
- Tratamento de erros
- Empacotamento portátil para Windows
- Documentação técnica

## Screenshots

### Tela de Login

<img width="2559" height="1397" alt="TelaLogin" src="https://github.com/user-attachments/assets/e64586bb-6e06-4b29-a902-b1d29312c344" />


### Tela de Cadastro

<img width="2559" height="1394" alt="TelaCadastro" src="https://github.com/user-attachments/assets/12f22f14-cbc6-4ba9-bffb-ef7b8677ce1f" />


### Interface

<img width="2559" height="1344" alt="Interface" src="https://github.com/user-attachments/assets/625a829a-853b-4d49-b3a3-1b6d1bc6c92e" />


## Como rodar o projeto
  npm install
  npm run dev

Como gerar build
  npm run build

Como rodar os testes
  npm run test

Download da versão portátil

A versão portátil para Windows está disponível na aba Releases deste repositório.

Aviso do Windows SmartScreen

Ao executar o KryoStock.exe pela primeira vez, o Windows pode exibir o aviso:

“O Windows protegeu o computador”

Esse aviso aparece porque o executável ainda não possui assinatura digital reconhecida ou reputação pública suficiente no Microsoft Defender SmartScreen.

Isso é comum em aplicativos independentes sem certificado de assinatura de código.

Limitações conhecidas
A autenticação é local
Os dados são armazenados localmente
Não há sincronização em nuvem
Não há banco de dados externo
Não há multiusuário em rede
O executável pode exibir aviso do SmartScreen
O sistema é focado em controle de estoque, não em ERP completo
Roadmap
Aumentar cobertura de testes
Adicionar exportação CSV
Adicionar importação de produtos por CSV/Excel
Estudar persistência com SQLite local
Criar versão demonstrativa online
Melhorar relatórios avançados
Implementar assinatura digital do executável
Status

Versão 1.0.0 finalizada para portfólio.

Autor

Desenvolvido por Gabriel Ribeiro como projeto de portfólio em Engenharia de Software.

