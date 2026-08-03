# 🚀 PWA Template — Versionamento por Arquivo

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)

Um modelo minimalista, sem frameworks e sem dependências para criar **Progressive Web Apps (PWAs)** rápidos e instaláveis, com um sistema de cache versionado por **arquivo de manifesto** em vez de constantes hardcoded no código do Service Worker.

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Por que um arquivo de versão em vez de `CACHE_NAME` no código?](#-por-que-um-arquivo-de-versão-em-vez-de-cache_name-no-código)
- [Funcionalidades](#-funcionalidades)
- [Estrutura de Arquivos](#-estrutura-de-arquivos)
- [Pré-requisitos](#-pré-requisitos)
- [Como Usar (Passo a Passo)](#-como-usar-passo-a-passo)
- [Entendendo o Cache e a Auto-Atualização](#-entendendo-o-cache-e-a-auto-atualização)
- [⚠️ A regra mais importante deste modelo](#️-a-regra-mais-importante-deste-modelo)
- [Testando localmente](#-testando-localmente)
- [Auditoria (Lighthouse)](#-auditoria-lighthouse)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 💡 Sobre o Projeto

Este modelo resolve a mesma dor de cabeça de sempre — configurar Service Worker do zero — mas com uma abordagem diferente para o cache: em vez de editar uma lista de arquivos direto dentro do `service-worker.js` toda vez que você adiciona algo ao projeto, a lista fica separada, em um arquivo de texto simples: `sw-version.txt`.

Isso é especialmente útil em projetos com **múltiplos arquivos CSS/JS que crescem aos poucos** (várias páginas, vários componentes) — você não precisa reabrir o Service Worker toda vez que criar um arquivo novo, só adicionar uma linha no `.txt`.

## 🤔 Por que um arquivo de versão em vez de `CACHE_NAME` no código?

Modelos tradicionais de PWA costumam usar algo assim dentro do próprio `sw.js`:

```javascript
const CACHE_NAME = 'meu-app-v2';
const FILES_TO_CACHE = ['./', './index.html', './style.css', './app.js'];
```

Isso funciona, mas mistura duas responsabilidades no mesmo lugar: **a lógica de cache** e **a lista de conteúdo**. Neste modelo, essas responsabilidades são separadas:

- `service-worker.js` → só lógica. Você não deveria precisar tocar nele no dia a dia.
- `sw-version.txt` → só dados. Primeira linha é a versão, as demais são os caminhos a cachear.

Isso torna o Service Worker praticamente "escreva uma vez, esqueça" — o arquivo que você realmente edita com frequência é um `.txt` de leitura simples, sem sintaxe de JavaScript pra errar.

## ✨ Funcionalidades

- 📱 **Instalável:** `manifest.json` pronto para "Adicionar à tela inicial" em iOS, Android e Desktop.
- 📶 **Offline first:** o Service Worker serve os arquivos cacheados imediatamente; a rede só é usada quando necessário.
- 🔄 **Auto-atualizável e silencioso:** quando uma nova versão é detectada, ela é baixada e ativada automaticamente, sem interromper o usuário com pop-ups — o conteúdo novo assume na próxima navegação natural.
- 🗂️ **Versionamento por arquivo:** adicionar um arquivo novo ao projeto é só adicionar uma linha ao `sw-version.txt`, sem editar lógica.
- 🧹 **Auto-limpeza de cache:** versões antigas são apagadas automaticamente a cada atualização, sem acumular lixo no armazenamento do navegador.
- 🔀 **Tratamento de redirects:** já resolve um bug comum e pouco documentado de Service Workers com respostas redirecionadas (ex: `/pagina.html` → `/pagina`), que costuma quebrar silenciosamente em outros boilerplates.
- ⚡ **Zero dependências:** Vanilla JavaScript puro, sem build step.

---

## 📁 Estrutura de Arquivos

```
meu-pwa/
├── assets/
│   ├── css/
│   │   └── style.css          # Seus estilos (exemplo mínimo incluso)
│   ├── js/
│   │   ├── pwa-register.js    # Registra o SW — não precisa editar
│   │   └── app.js             # Seu código JavaScript principal
│   ├── icon-192.png           # Ícone PWA 192×192 (você precisa criar)
│   └── icon-512.png           # Ícone PWA 512×512 (você precisa criar)
├── index.html                 # Página principal de exemplo
├── manifest.json              # Identidade do app (nome, cores, ícones)
├── service-worker.js          # O Service Worker — raramente precisa editar
└── sw-version.txt             # Versão + lista de arquivos a cachear
```

> `service-worker.js` e `manifest.json` **precisam ficar na raiz** do site — não dentro de `/assets` — para que o escopo do Service Worker cubra o site inteiro.

---

## ⚠️ Pré-requisitos

Para que o Service Worker funcione e o PWA seja instalável, seu projeto precisa rodar em um ambiente seguro:

- **Em desenvolvimento:** `localhost` ou `127.0.0.1`.
- **Em produção:** um servidor com HTTPS válido (GitHub Pages, Netlify, Vercel, Firebase Hosting, etc).

---

## 🛠️ Como Usar (Passo a Passo)

### 1. Clone este repositório

```bash
git clone https://github.com/Christian5910/PWA-Model.git
cd PWA-Model
```

### 2. Configure a identidade visual (`manifest.json`)

Abra o arquivo e ajuste:

- `name` / `short_name` — nome completo e nome curto (aparece embaixo do ícone).
- `description` — uma frase sobre o app.
- `background_color` / `theme_color` — cores da sua marca, em hexadecimal.
- Substitua `assets/icon-192.png` e `assets/icon-512.png` pelos seus próprios ícones, mantendo os tamanhos exatos.

### 3. Liste seus arquivos (`sw-version.txt`)

Abra `sw-version.txt` e edite a lista, uma linha por arquivo, a partir da raiz do site:

```
1.0.0
/
/index.html
/manifest.json
/assets/css/style.css
/assets/js/pwa-register.js
/assets/js/app.js
/assets/icon-192.png
/assets/icon-512.png
```

A **primeira linha é sempre a versão**. Todo arquivo HTML, CSS, JS ou imagem que seu app precisa para funcionar offline deve estar listado aqui.

### 4. Inclua o script de registro em todas as páginas

No `<head>` ou antes do fechamento de `<body>` de **cada** página HTML:

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0d0d0d">
<link rel="apple-touch-icon" href="/assets/icon-192.png">
<script src="/assets/js/pwa-register.js" defer></script>
```

### 5. Teste localmente

Veja a seção [Testando localmente](#-testando-localmente) abaixo — **não use a extensão Live Server** para testar Service Workers (motivo explicado lá).

---

## 🔄 Entendendo o Cache e a Auto-Atualização

Sempre que você mudar algo no site (novo CSS, novo texto, nova imagem), os usuários que já instalaram o PWA só vão receber essa mudança se você seguir os dois passos abaixo — **os dois, sempre juntos**:

### Passo 1 — Atualize `sw-version.txt`

Suba o número da versão e adicione a linha de qualquer arquivo novo:

```
1.0.1
/
/index.html
...
```

### Passo 2 — Atualize `SW_BUILD` dentro de `service-worker.js`

No topo do arquivo:

```javascript
const SW_BUILD = '1.0.1'; // <-- mesmo número da 1ª linha de sw-version.txt
```

## ⚠️ A regra mais importante deste modelo

**O navegador só percebe que existe uma atualização de Service Worker quando o arquivo `service-worker.js` muda, byte a byte.** Ele não fica observando o conteúdo de `sw-version.txt` sozinho — esse arquivo só é lido *depois* que o navegador já decidiu reinstalar o Service Worker.

Isso quer dizer que **só mudar o `sw-version.txt` não é suficiente**. Se você esquecer de tocar no `service-worker.js` também, a atualização nunca chega aos usuários que já têm o app instalado — mesmo que o `.txt` esteja perfeitamente atualizado no servidor.

É por isso que existe a constante `SW_BUILD` logo no topo do `service-worker.js`: ela existe unicamente para forçar essa mudança de bytes que o navegador precisa detectar. Sempre que você subir a versão no `.txt`, suba esse número junto.

| Você mudou... | O navegador detecta atualização? |
|---|---|
| Só o `sw-version.txt` | ❌ Não |
| Só o `SW_BUILD` no `service-worker.js` | ✅ Sim, mas sem saber o que cachear de novo |
| Os dois juntos | ✅ Sim, do jeito certo |

Quando funciona corretamente: o usuário abre o app → o navegador detecta que `service-worker.js` mudou → instala a nova versão em segundo plano, lendo a lista de arquivos do `sw-version.txt` → assume o controle automaticamente, sem interromper o usuário → o conteúdo novo aparece na próxima navegação.

---

## 🧪 Testando localmente

**Não use a extensão Live Server do VS Code para testar Service Workers.** Ela injeta um script de auto-reload que recarrega a página sempre que qualquer arquivo do projeto muda — incluindo o próprio `sw-version.txt` — e isso conflita com o ciclo de vida do Service Worker, causando comportamento confuso que não reflete o que vai acontecer em produção.

Use um servidor estático puro:

```bash
npx serve .
```

Depois abra `http://localhost:3000`, abra o DevTools → aba **Application** → **Service Workers**, e acompanhe o registro e as atualizações por lá.

---

## 💯 Auditoria (Lighthouse)

Seguindo esta estrutura e hospedando em HTTPS, o esperado é:

- ✅ Alta pontuação em Performance
- ✅ Alta pontuação em Acessibilidade (depende do seu HTML)
- ✅ Alta pontuação em Melhores Práticas
- ✅ PWA instalável (badge ativo)

---

## 🤝 Contribuição

Contribuições são bem-vindas.

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. Push para a Branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
