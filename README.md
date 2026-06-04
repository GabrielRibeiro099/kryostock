# KryoStock

**KryoStock** é um aplicativo portátil de controle de estoque desenvolvido como projeto de portfólio em Engenharia de Software. A proposta é oferecer uma ferramenta local para pequenos controles operacionais, com cadastro de produtos, categorias, movimentações, dashboard, relatórios, configurações de usuário, backup JSON e execução portátil no Windows.

## Descrição

O sistema foi desenvolvido com React, TypeScript e Vite, com foco em uma interface moderna, limpa e objetiva. A versão portátil usa um launcher local em Go para servir o build da aplicação, abrir o app em modo janela e salvar os dados em um arquivo JSON dentro da própria pasta do aplicativo.

## Como usar a versão portátil

1. Extraia todos os arquivos em uma pasta limpa.
2. Mantenha `KryoStock.exe`, `dist/`, `public/` e a estrutura do projeto na mesma pasta.
3. Execute **KryoStock.exe**.
4. Cadastre seu usuário local.
5. Use produtos, categorias, movimentações, dashboard, relatórios e configurações.
6. Os dados ficam salvos localmente na pasta `dados/`.

> Importante: mantenha apenas o executável principal `KryoStock.exe`. Esta versão foi organizada para não ter executáveis duplicados.

## Objetivo do Projeto

O objetivo do KryoStock é demonstrar, em um projeto realista de portfólio júnior, conceitos como CRUD, regras de negócio, persistência local, autenticação local, validações, relatórios, backup, organização de componentes e empacotamento portátil para Windows.

O KryoStock **não é um ERP**. Ele é focado exclusivamente em controle de estoque local.

## Funcionalidades

- Login e cadastro local de usuários.
- Cadastro, edição, exclusão e inativação de produtos.
- Cadastro e edição de categorias.
- Bloqueio de exclusão de categorias em uso.
- Movimentações de entrada, saída, ajuste positivo, ajuste negativo e correção de inventário.
- Exclusão controlada de movimentações, com recálculo de estoque e proteção contra inconsistências.
- Bloqueio de saída maior que o estoque disponível.
- Dashboard com indicadores baseados nos dados reais.
- Relatórios de estoque e movimentações sem dados aleatórios.
- Configurações de usuário com nome, avatar, senha e tema.
- Exportação e importação de backup JSON.
- Proteção contra tela branca por erro inesperado.
- Versão portátil para Windows com persistência local.
- Interface com modo claro e modo escuro.
- Logo e ícone do KryoStock aplicados ao aplicativo e ao executável.

## Tecnologias Utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Radix UI / componentes de interface
- Sonner para notificações
- Go para o launcher portátil
- Vitest para testes automatizados básicos

## Estrutura do Projeto

```txt
src/app/
  App.tsx
  components/
  services/
    authService.ts
    storageService.ts
    reportService.ts
    inventoryService.ts
    movementService.ts
    categoryService.ts
    validationService.ts
  hooks/
  tests/
launcher/
  main.go
dist/
  build final do aplicativo
```

## Arquitetura e Organização

O projeto separa parte da regra de negócio em serviços específicos:

- `authService.ts`: normalização de e-mail, hash local, verificação de senha e migração de senhas antigas.
- `storageService.ts`: estrutura versionada, normalização, migração, carregamento, salvamento, backup e fallback local.
- `inventoryService.ts`: criação, atualização, exclusão e inativação de produtos.
- `movementService.ts`: validação, aplicação e exclusão controlada das movimentações de estoque.
- `categoryService.ts`: validação, criação, edição e bloqueio de exclusão de categorias em uso.
- `reportService.ts`: cálculos reais para dashboard e relatórios.
- `validationService.ts`: validações reutilizáveis de produtos e categorias.


## Screenshots

  ## Tela de login
    <img width="2559" height="1397" alt="TelaLogin" src="https://github.com/user-attachments/assets/b5ee4993-b345-41e9-82f2-1d12deb9e6e4" />
    
  ## Tela de Cadastro
    <img width="2559" height="1394" alt="TelaCadastro" src="https://github.com/user-attachments/assets/c0a64e78-7c87-4c5e-8b96-4f2d99f808b7" />
    
  ## Interface
    <img width="2559" height="1344" alt="Interface" src="https://github.com/user-attachments/assets/d94f0ae2-805f-4e82-a195-a527ee0fce90" />


## Regras de Negócio

- SKU de produto deve ser único.
- Produto precisa ter nome, SKU, categoria, unidade, custo, preço e estoque válido.
- Estoque não pode ficar negativo.
- Saída e ajuste negativo não podem ser maiores que o estoque disponível.
- Correção de inventário define a quantidade final real.
- Movimentações registram produto, tipo, quantidade, data, motivo, usuário, estoque anterior e estoque novo.
- Movimentações podem ser excluídas somente quando a exclusão não deixa o histórico posterior inconsistente.
- Categoria em uso não pode ser excluída.
- Produto com histórico de movimentações é inativado em vez de excluído fisicamente.
- Produtos inativos preservam histórico e não entram como ativos nos indicadores principais.

## Persistência de Dados

A estrutura persistida usa `schemaVersion` e separa usuários, sessão, estoque e configurações. Na versão portátil, o app prioriza a API local do launcher (`/api/data`) para salvar em arquivo JSON. No navegador comum, usa `localStorage` como fallback.

## Autenticação Local

A autenticação é local e serve para identificar o usuário dentro do aplicativo portátil. Senhas novas são armazenadas com hash local e salt por usuário. Esse mecanismo evita texto puro, mas não substitui autenticação profissional com backend seguro.

## Backup e Importação

O usuário pode exportar um backup `.json` contendo dados do sistema e importar esse backup posteriormente. A importação valida e normaliza os dados antes de substituir o estado atual.

## Relatórios e Dashboard

Os relatórios e o dashboard usam dados reais de produtos, categorias e movimentações. Não há geração de valores aleatórios para simular gráficos.

## Versão Portátil para Windows

O arquivo `KryoStock.exe` funciona como launcher local. Ele sobe um servidor HTTP local, serve a pasta `dist`, abre o app em modo janela usando Microsoft Edge ou Google Chrome e salva os dados na pasta `dados`.

Comando para recompilar o launcher:

```bash
cd launcher
go build -ldflags="-H windowsgui" -o ../KryoStock.exe main.go
```

## Aviso sobre Windows SmartScreen

Na primeira execução, o Windows pode mostrar a mensagem **“O Windows protegeu o computador”**.

Isso é um aviso do **Microsoft Defender SmartScreen**. Ele aparece quando um executável baixado da internet ainda não possui reputação pública suficiente ou não está assinado com um certificado de assinatura de código reconhecido.

Esse aviso não significa automaticamente que o KryoStock é malware. Ele indica que o Windows ainda não reconhece publicamente o arquivo como um aplicativo com reputação estabelecida.

Para remover definitivamente esse aviso em computadores de terceiros, a distribuição profissional precisa de:

1. Certificado de assinatura de código emitido por uma Autoridade Certificadora reconhecida.
2. Assinatura Authenticode aplicada ao `KryoStock.exe`.
3. Tempo/reputação de distribuição para o SmartScreen reconhecer o aplicativo como confiável.

Enquanto o executável não for assinado digitalmente, o SmartScreen pode exibir esse aviso em algumas máquinas, principalmente na primeira execução após download.

## Como Rodar em Desenvolvimento

```bash
npm install
npm run dev
```

## Como Gerar Build

```bash
npm run build
```

## Como Rodar os Testes

```bash
npm run test
```

## Limitações Conhecidas

- A autenticação é local e não substitui autenticação profissional de produção.
- Os dados são armazenados localmente, sem sincronização em nuvem.
- Não há banco de dados externo.
- Não há multiusuário real em rede.
- O launcher depende de Microsoft Edge ou Google Chrome instalado.
- O aviso do Windows SmartScreen só é removido definitivamente com assinatura digital reconhecida.
- A segurança é limitada ao contexto local/portátil.
- O projeto é um sistema de portfólio em evolução, não um ERP empresarial completo.

## Roadmap

- Migrar persistência para SQLite local.
- Adicionar exportação PDF.
- Adicionar importação CSV/Excel.
- Criar permissões por usuário.
- Adicionar logs de auditoria.
- Melhorar criptografia local.
- Criar versão com Tauri, Electron ou Wails.
- Adicionar filtros avançados nos relatórios.
- Adicionar CI/CD.
- Expandir cobertura de testes.

## Aprendizados

Este projeto aplica conceitos importantes para um desenvolvedor iniciante/júnior: componentização, estado, validação, regras de negócio, persistência, backup, relatórios, tratamento de erros, documentação e empacotamento portátil.

## Aviso sobre Segurança

O KryoStock foi desenvolvido para uso local e demonstração de portfólio. Para uso real em ambiente empresarial, seria necessário implementar autenticação robusta, criptografia forte, banco de dados adequado, backups automatizados, permissões, auditoria e controles de segurança adicionais.
