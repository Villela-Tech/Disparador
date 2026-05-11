// ========================================
// CÓDIGOS DE IDIOMAS SUPORTADOS
// ========================================
// Lista completa de códigos de idioma ISO para internacionalização
let ALL_LANGUAGE_CODES = ["af", "am", "an", "ar", "ast", "az", "be", "bg", "bn", "br", "bs", "ca", "ckb", "co", "cs", "cy", "da", "de", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fil", "fo", "fr", "fy", "ga", "gd", "gl", "gn", "gu", "ha", "haw", "he", "hi", "hr", "hu", "hy", "ia", "id", "is", "it", "ja", "ka", "kk", "km", "kn", "ko", "ku", "ky", "la", "ln", "lo", "lt", "lv", "mk", "ml", "mn", "mo", "mr", "ms", "mt", "nb", "ne", "nl", "nn", "no", "oc", "om", "or", "pa", "pl", "ps", "pt", "qu", "rm", "ro", "ru", "sd", "sh", "si", "sk", "sl", "sn", "so", "sq", "sr", "st", "su", "sv", "sw", "ta", "te", "tg", "th", "ti", "tk", "to", "tr", "tt", "tw", "ug", "uk", "ur", "uz", "vi", "wa", "xh", "yi", "yo", "zh", "zu"];

// ========================================
// SELETORES DOM DO WHATSAPP WEB
// ========================================
// Classes e seletores CSS usados para interagir com elementos do WhatsApp
let DOCUMENT_ELEMENT_SELECTORS = {
    // Painel lateral esquerdo com contatos
    left_side_contacts_panel: [
        "#pane-side"
    ],
    
    // Div do perfil do contato
    contact_profile_div: [
        "img.x1hc1fzr._ao3e"
    ],
    
    // Divisores de data (hoje/ontem)
    today_yesterday_div: [
        "._1fyro",
        "._ao3e"
    ],
    
    // Cabeçalho do perfil
    profile_header: [
        "._604FD",
        "._ak0z",
        "span.x1okw0bk"
    ],
    
    // Painel de conversa principal
    conversation_panel: [
        "[data-testid=\"conversation-panel-messages\"]",
        "._5kRIK",
        "._ajyl",
        ".x1ewm37j"
    ],
    
    // Wrapper do painel de conversa
    conversation_panel_wrapper: [
        "[data-testid=\"conversation-panel-body\"]",
        "._3B19s",
        "._amm9",
        ".xnpuxes"
    ],
    conversation_header: [
        "[data-testid=\"conversation-header\"]",
        "#main header"
    ],
    conversation_header_name_div: [
        "._amie"
    ],
    conversation_message_div: [
        "[data-testid^=\"conv-msg\"]",
        "[data-id^=\"true\"]",
        "[data-id^=\"false\"]"
    ],
    conversation_non_message_div: [
        ".focusable-list-item"
    ],
    conversation_title_div: [
        "[data-testid=\"conversation-info-header-chat-title\"]",
        "#main header span"
    ],
    conversation_compose_div: [
        "[data-testid=\"conversation-compose-box-input\"]",
        "._4r9rJ",
        "._ak1p",
        "._ak1r"
    ],
    block_message_div: [
        "[data-testid=\"block-message\"]",
        "._1alON"
    ],
    input_message_div: [
        "[data-testid=\"conversation-compose-box-input\"]",
        "#main [contenteditable=\"true\"][role=\"textbox\"]",
        "#main p.selectable-text.copyable-text",
        "[aria-placeholder=\"Type a message\"]",
        "[aria-placeholder=\"Digite uma mensagem\"]",
        "[aria-placeholder*=\"mensagem\"]",
        "[aria-activedescendant]"
    ],
    footer_div: [
        "footer._3E8Fg",
        "footer._ak1i"
    ],
    new_chat_btn: [
        "[data-icon=\"new-chat-outline\"]"
    ],
    new_chat_parent: [
        '[aria-label=\"New chat\"]'
    ],
    starting_chat_popup: [
        "[aria-label='Starting chat']",
        "[data-animate-modal-popup=\"true\"]:has(svg circle)"
    ],
    invalid_chat_popup: [
        "[aria-label='Phone number shared via url is invalid.']",
        "[aria-label*=\"número de telefone compartilhado\"]"
    ],
    invalid_popup_ok_btn: [
        "[data-testid=\"popup-controls-ok\"]",
        "[data-animate-modal-popup=\"true\"]:not(:has(svg circle)) button"
    ],
    send_message_btn: [
        // WhatsApp Web muda frequentemente o DOM do botão de enviar.
        // Preferir o botão (clickável) e manter spans como fallback.
        "button[data-testid=\"send\"]",
        "button[aria-label=\"Enviar\"]",
        "button[aria-label*=\"Send\"]",
        "#main footer button[data-testid=\"send\"]",
        "#main footer button:has(span[data-icon=\"send\"])",
        "button:has(span[data-icon=\"send\"])",
        "span[data-icon=\"send\"]"
    ]
};

// Google Analytics Config Data
let GA_CONFIG = {
    GA_ENDPOINT: 'https://www.google-analytics.com/mp/collect',
    GA_DEBUG_ENDPOINT: 'https://www.google-analytics.com/debug/mp/collect',
    MEASUREMENT_ID: 'G-RKJ49K5JXL',
    API_SECRET: 'jJNQa1g_Qw64CF4MRAKj7A',
    DEFAULT_ENGAGEMENT_TIME_MSEC: 100,
    SESSION_EXPIRATION_IN_MIN: 30,
}

// AWS APIs / URLs
let AWS_API = {
    GET_CONFIG_DATA: 'https://hpm53jwusnnb4vmbpmyzjppecy0omfxw.lambda-url.ap-south-1.on.aws/',
}

// FAQs
let FAQS = [
    {
        question: "Funciona no aplicativo desktop?",
        answer: "Não, é uma extensão do Chrome e funciona apenas no Google Chrome (Mac, Windows e Linux)."
    },
    {
        question: "Funciona no meu país?",
        answer: "Sim, todos os países do mundo podem usar a extensão."
    },
    {
        question: "Como enviar links clicáveis através do Sender?",
        answer: "Você pode enviar um link clicável para qualquer pessoa que:<br>- Tenha seu número salvo na agenda do telefone<br>- Ou tenha respondido a você pelo menos uma vez."
    },
    {
        question: "Como formatar corretamente a coluna de números no arquivo CSV?",
        answer: "1. Selecione a coluna de números -> Clique com o botão direito -> Clique em 'Formatar Células'.<br>2. Vá para a categoria 'Número' -> Vá para a caixa 'Casas Decimais'<br>3. Altere para '0' e clique em 'OK'.<br>4. Verifique se os números agora estão aparecendo corretamente."
    },
    {
        question: "Como enviar um anexo?",
        answer: "1. Clique em 'Adicionar Anexo' e selecione o tipo de anexo<br>2. Selecione o arquivo que deseja enviar<br>3. Seu chat pessoal será aberto - envie o arquivo no chat.<br>4. Agora abra a extensão e clique em 'Enviar Mensagem'. Seu arquivo será enviado um por um para todos os contatos."
    },
    {
        question: "Posso enviar mensagem para pessoas em um grupo separadamente sem salvar seus contatos?",
        answer: "Sim, você pode. Aqui está como:<br>1. Abra o grupo respectivo e clique na extensão<br>2. Clique em 'Baixar Contatos do Grupo' e um Excel com os números de contato será baixado<br>3. Faça upload deste CSV e digite a mensagem que deseja enviar na extensão."
    },
    {
        question: "Como enviar links clicáveis através do Sender?",
        answer: "Você pode enviar um link clicável para qualquer pessoa que:<br>- Tenha seu número salvo na agenda do telefone<br>- Ou tenha respondido a você pelo menos uma vez."
    }
];

// Other Variables
let RUNTIME_CONFIG = {
    reloadInject: false,
    useOldInjectMethod: true,
    useOldMessageSending: true,
}