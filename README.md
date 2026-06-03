# Noir Detail

Site institucional da Noir Detail, criado para apresentar serviços de limpeza detalhada e detailing premium ao domicílio para automóveis e motociclos.

## Visão Geral

Este site é uma página simples, moderna e responsiva que permite:

- Apresentar a marca Noir Detail
- Divulgar serviços de limpeza exterior, interior e motor
- Mostrar a tabela de preços dos principais serviços
- Explicar o processo de marcação de forma clara
- Facilitar o contacto através de WhatsApp, Instagram e TikTok
- Enviar pedidos de marcação diretamente pelo formulário

## Tecnologias

- **HTML5**: estrutura principal do site
- **CSS3**: estilos, layout responsivo, animações e identidade visual
- **JavaScript**: interatividade, menu mobile, animações ao scroll, destaque da navegação e submissão do formulário
- **Node.js + Express**: backend para validação das marcações
- **Cloudflare Turnstile**: CAPTCHA para proteção contra bots

## Estrutura do Projeto

```bash
NoirDetail/
├── files/
│   ├── fontes Maven Pro
│   ├── noir-detail-favicon.svg
│   └── noir-detail-logo.svg
├── server.js
├── index.html
├── style.css
├── script.js
├── package.json
└── README.md
```

## Como Abrir

O projeto tem frontend e backend. Para correr localmente, é necessário ter Node.js instalado.

Para visualizar:

1. Instalar dependências com `npm install`
2. Iniciar o servidor com `npm start`
3. Abrir `http://localhost:3000` no navegador

## Funcionalidades

### Página Inicial

- Apresentação da marca Noir Detail
- Chamada principal para marcação por WhatsApp
- Botão para consultar a tabela de preços
- Animação visual relacionada com lavagem e cuidado automóvel
- Destaque para serviços rápidos desde 30€

### Serviços

- Limpeza exterior
- Limpeza interior
- Limpeza de motor
- Cartões informativos com descrição de cada serviço

### Tabela de Preços

- Pack Detail por 75€
- Exterior por 30€
- Interior por 45€
- Manutenção regular por 35€
- Opções separadas de manutenção exterior e interior por 20€

### Processo

- Envio de mensagem com a viatura e o serviço pretendido
- Combinação do local, horário e necessidades específicas
- Realização do serviço e entrega do acabamento final

### Contacto

- Formulário com nome, contacto e mensagem
- Validação anti-spam com backend, rate limit, honeypot e CAPTCHA
- Envio da mensagem por email via `mailto:` quando SMTP não estiver configurado
- Abertura do WhatsApp apenas depois da validação do backend
- Links para Instagram, TikTok e WhatsApp

## Design e Identidade Visual

O site utiliza uma estética escura e premium, com destaque para tons de preto, cinzento, rosa e amarelo. A tipografia Maven Pro reforça uma aparência moderna, limpa e profissional.

Também foram adicionadas animações suaves, efeitos de brilho, navegação fixa e adaptação para dispositivos móveis, garantindo uma boa experiência em computador, tablet e telemóvel.

## Estado do Projeto

Este projeto foi desenvolvido como site de apresentação da Noir Detail e pode continuar a ser atualizado com novos serviços, fotografias de trabalhos realizados, testemunhos de clientes e melhorias visuais.

## Links

- [Instagram](https://www.instagram.com/noir.detail/)
- [TikTok](https://www.tiktok.com/@noir.detail)
- [WhatsApp](https://wa.me/351925070415)
- Site: `https://noirdetail.pt`

---

@ Noir Detail
