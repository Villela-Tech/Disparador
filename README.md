# Sender - Envio de Mensagens em Massa

Extensao Chrome para automacao de campanhas de mensagens no WhatsApp Web.

---

## Visao Geral

O Sender e uma extensao para Google Chrome que automatiza o envio de mensagens pelo WhatsApp Web. Desenvolvida para uso profissional em marketing digital, comunicacao empresarial e atendimento ao cliente, a ferramenta opera diretamente na interface do WhatsApp Web sem necessidade de APIs externas ou cadastros em plataformas de terceiros.

---

## Funcionalidades

### Envio de Mensagens

- Envio em massa para numeros avulsos, grupos e contatos salvos na agenda
- Suporte a listas importadas via planilha Excel ou CSV
- Personalizacao de mensagens com variaveis dinamicas extraidas da planilha, como nome, e-mail e telefone
- Envio de anexos multiplos: imagens, documentos e videos, com legenda personalizada por destinatario
- Controle de intervalo entre envios e agrupamento em lotes para reducao do risco de bloqueio
- Delay aleatorio configuravel para simular comportamento humano
- Botao de parar campanha disponivel durante o envio

### Relatorios

- Relatorio de entrega gerado ao final de cada campanha
- Informacoes por destinatario: mensagem entregue, anexo entregue, observacoes e erros
- Exportacao em formato CSV com cabecalho e resumo da campanha

### Templates e Campanhas

- Salvamento de mensagens como templates para reutilizacao
- Organizacao de listas de destinatarios como campanhas nomeadas

### Respostas Rapidas

- Atalhos de mensagem exibidos diretamente na tela do WhatsApp Web
- Suporte a texto e imagem com legenda
- Edicao, reordenacao e exclusao de respostas rapidas

### Interface

- Suporte a mais de 100 idiomas via localizacao da propria extensao
- Modo de desfoque de contatos e nomes para privacidade durante apresentacoes

---

## Sistema de Ativacao

A extensao possui um sistema de licenciamento com as seguintes opcoes:

- **Periodo de teste gratuito**: 3 dias de acesso completo, disponivel uma unica vez por usuario
- **Licenca por chave**: ativacao mediante chave de acesso com prazo de validade definido
- **Verificacao automatica**: a validade da licenca e verificada periodicamente durante o uso

Contato para aquisicao de licenca: WhatsApp +55 51 9498-1842

---

## Requisitos

- Google Chrome versao 88 ou superior
- WhatsApp Web ativo e conectado
- Conexao com a internet

---

## Instalacao

**Via Chrome Web Store (recomendado)**

1. Acesse a Chrome Web Store e busque por "Sender - Envio de Mensagens em Massa"
2. Clique em "Usar no Chrome"
3. Confirme a instalacao

**Via carregamento manual (para desenvolvedores)**

1. Acesse `chrome://extensions/` no Chrome
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactacao"
4. Selecione a pasta do projeto

---

## Como Usar

### Envio Basico

1. Abra o WhatsApp Web e ative a extensao
2. Selecione o tipo de destinatario: numeros, grupos ou contatos
3. Informe os numeros manualmente ou importe uma planilha
4. Digite a mensagem e configure as opcoes de envio
5. Clique em "Send" e acompanhe o progresso

### Personalizacao com Planilha

Prepare uma planilha com colunas nomeadas, por exemplo:

```
Nome     | Telefone       | Email
Joao     | +5511999999999 | joao@email.com
Maria    | +5511888888888 | maria@email.com
```

Na mensagem, utilize as variaveis entre chaves duplas:

```
Ola {{Nome}}, seu contato e {{Telefone}}.
```

A extensao substitui automaticamente as variaveis para cada destinatario antes do envio.

---

## Arquitetura Tecnica

| Componente | Descricao |
|---|---|
| `manifest.json` | Configuracao da extensao (Manifest V3) |
| `popup.html` / `popup.js` | Interface principal do usuario |
| `js/background.js` | Service worker: licenciamento, notificacoes e gerenciamento de abas |
| `js/content.js` | Content script: integracao com o WhatsApp Web e comunicacao entre componentes |
| `js/inject.js` | Script injetado na pagina: acesso as APIs internas do WhatsApp via webpack |
| `js/Utils/messenger.js` | Motor de envio de campanhas |
| `js/Utils/data.js` | Seletores DOM e constantes de configuracao |
| `Keys.json` | Lista de chaves de ativacao validas |

### Metodo de Envio

O envio de mensagens opera em dois niveis:

1. **API interna do WhatsApp** (primario): acessa os modulos internos do cliente web via webpack para envio direto
2. **Metodo DOM** (fallback): quando o chat nao esta carregado no store interno, a mensagem e inserida no campo de texto e o botao de envio e acionado programaticamente

Essa abordagem hibrida garante compatibilidade com diferentes versoes do WhatsApp Web.

---

## Tecnologias Utilizadas

- JavaScript (ES6+), HTML5, CSS3
- jQuery
- SheetJS (leitura de planilhas Excel)
- PapaParse (leitura de CSV)
- libphonenumber (validacao de numeros de telefone)
- intl-tel-input (seletor de codigo de pais)
- Driver.js (tutorial interativo)
- Chrome Extension Manifest V3

---

## Perguntas Frequentes

**A extensao e segura?**
Todos os dados ficam armazenados localmente no dispositivo do usuario. Nenhuma mensagem ou contato e enviado a servidores externos.

**Posso ser banido do WhatsApp?**
A extensao inclui recursos de protecao como intervalos entre mensagens e delays aleatorios. O uso responsavel e recomendado. O WhatsApp pode restringir contas que realizam envios em volumes muito elevados.

**Funciona com WhatsApp Business?**
Sim, e compativel com as versoes pessoal e Business do WhatsApp Web.

**O que acontece quando o periodo de teste expira?**
As funcionalidades ficam bloqueadas ate a ativacao de uma chave valida. O periodo de teste pode ser utilizado apenas uma vez por usuario.

**Como obter uma chave de ativacao?**
Entre em contato pelo WhatsApp: +55 51 9498-1842

**Funciona em qual sistema operacional?**
Qualquer sistema que execute o Google Chrome: Windows, macOS e Linux.

---

## Suporte

WhatsApp: +55 51 9498-1842
