# SINFRALOG — Painel Gerencial

Mashup **Qlik Sense** desenvolvido com **React, TypeScript e Vite** para visualização e análise dos dados gerenciais da SINFRALOG.

A aplicação se conecta à **Engine API do Qlik Sense** e disponibiliza dashboards, indicadores, filtros, gráficos e mapas personalizados.

## Tecnologias

* React
* TypeScript
* Vite
* Tailwind CSS
* Radix UI / shadcn/ui
* enigma.js
* `@cluster-data-experience/qlik-modules`
* React Context API e Hooks
* `@tanstack/react-virtual`

## Pré-requisitos

* Node.js 22.19+
* Acesso a um ambiente Qlik Sense
* Aplicação Qlik configurada para o painel
* Certificados e permissões necessários para conexão com ambientes Enterprise, quando aplicável

## Instalação

Clone o repositório:

```bash
git clone <url-do-repositorio>
cd sinfralog-painel-gerencial
```

Instale as dependências:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

## Configuração do Qlik Sense

A configuração de conexão fica em:

```text
public/connection.json
```

Dependendo do ambiente, também pode ser utilizado:

```text
public/connectionOnPrem.json
```

Exemplo:

```json
{
  "host": "seu-servidor-qlik.com",
  "port": 443,
  "isSecure": true,
  "prefix": "/",
  "appId": "GUID-DO-APP-QLIK",
  "webIntegrationId": "ID-DE-INTEGRACAO"
}
```

> **Importante:** antes de alterar fórmulas, colunas, integrações ou o mapa de obras, leia o arquivo [`instructions.md`](instructions.md). Ele contém regras e restrições específicas do projeto.

## Scripts

```bash
npm run dev
```

Inicia o servidor de desenvolvimento.

```bash
npm run build
```

Gera o build de produção em `dist/`.

```bash
npm run lint
```

Executa as verificações do ESLint.

```bash
npm run storybook
```

Inicia o Storybook para desenvolvimento e documentação isolada dos componentes.

> O comando `npm run dev` executa previamente o processo `revert-lib` utilizado pelo projeto.

## Estrutura

```text
src/
├── components/         # Componentes reutilizáveis
│   ├── FilterObject/
│   ├── Map/
│   └── shadcn/
├── layout/             # Layouts da aplicação
├── pages/              # Páginas do painel
│   ├── AnaliseCustomizada/
│   ├── Contratos/
│   ├── MapaObras/
│   └── Obras/
├── routes/             # Rotas
├── shared/             # Recursos compartilhados
│   ├── components/
│   └── hooks/
└── App.tsx
```

## Integração com Qlik

A comunicação com o Qlik Sense é realizada pela **Engine API via WebSocket**.

Entre os principais hooks utilizados estão:

* `useQlik()` — acesso à sessão e à Engine API.
* `useGenericCube()` — criação e consumo de HyperCubes.
* `useGenericListObject()` — criação e consumo de listas de seleção.

## Build e Deploy

Gere o build:

```bash
npm run build
```

Depois:

1. Compacte o conteúdo gerado em `dist/`.
2. Acesse o **Qlik Management Console (QMC)**.
3. Vá até **Extensions**.
4. Faça o upload do arquivo compactado.

## Problemas de conexão

Em caso de erro de WebSocket ou conexão com o Qlik:

* confira `host`, `appId`, `port` e `prefix`;
* verifique certificados e permissões do ambiente;
* confirme se o navegador confia no certificado HTTPS;
* consulte o Console do navegador para erros de WebSocket, CORS ou autenticação.

---

Desenvolvido pela equipe de Dados.
