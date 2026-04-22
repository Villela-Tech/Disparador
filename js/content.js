// ========================================
// CONFIGURAÇÃO DE RECURSOS E ÍCONES
// ========================================
// URLs dos ícones e recursos da extensão
var close_img_src = chrome.runtime.getURL("logo/closeBtn.png");
var recommend_tick = chrome.runtime.getURL("logo/recommend-tickmark.png");
var export_contacts_text_src = chrome.runtime.getURL("logo/export-contact.svg");
var email_icon_src = chrome.runtime.getURL("logo/email.png");
var error_icon_src = chrome.runtime.getURL("logo/error.png");
var read_icon_src = chrome.runtime.getURL("logo/read.png");
var wall_clock_white_icon = chrome.runtime.getURL("logo/wall-clock-white.png");
var smile_icon = chrome.runtime.getURL("logo/smile.png");
var logo_img = chrome.runtime.getURL("logo/logo-img.png");
var arrow_left = chrome.runtime.getURL("logo/prime_arrow-left.png");
var arrow_right = chrome.runtime.getURL("logo/arrow-right.png");
var bulb_icon = chrome.runtime.getURL("logo/lightbulb.png");
var man_thinking = chrome.runtime.getURL("logo/man-thinking.png");
var cross_icon_src = chrome.runtime.getURL("logo/close-1.png");
var check_icon_src = chrome.runtime.getURL("logo/check-mark.png");
var eye_visible = chrome.runtime.getURL("logo/prime_eye-visible.png");
var eye_hidden = chrome.runtime.getURL("logo/prime_eye-hidden.png");
var delete_icon_src = chrome.runtime.getURL("logo/delete-icon.png");
var edit_icon_src = chrome.runtime.getURL("logo/edit_icon.png");   
var down_arrow_src = chrome.runtime.getURL("logo/down-arrow.png");
var drag_icon_src = chrome.runtime.getURL("logo/drag_icon.png");
var attachment_icon = chrome.runtime.getURL("logo/attach_symbol.png")

// ========================================
// CARREGAMENTO DE FONTES EXTERNAS
// ========================================
// Adiciona fontes Google Fonts ao WhatsApp Web
let link = document.createElement("link");
link.rel = "stylesheet";
link.href =
    "https://fonts.googleapis.com/css2?family=Palanquin+Dark:wght@400;500;700&family=PT+Sans+Caption&family=Reem+Kufi+Ink&display=swap";
document.head.appendChild(link);

// ========================================
// VARIÁVEIS GLOBAIS DO CONTENT SCRIPT
// ========================================
// Informações do usuário
let my_number = null,
    logged_in_user = null,
    plan_type = "Expired";

// Arrays para controle de dados
var rows = [],                    // Linhas de relatório
    notifications_hash = {},      // Hash de notificações
    stop = false,                 // Flag para parar campanhas
    groupIdToName = {},          // Mapeamento ID -> Nome dos grupos
    contactIdToName = {};        // Mapeamento ID -> Nome dos contatos

// Controle de mensagens e interface
var messages = [], reload_quick_reply_div = false, imageData;

// Controle de tamanho de conversão
let totalConvertedSize = 0;

// Informações de localização
var location_info = { name: 'international', name_code: "US", currency: "USD", default: true };

// Versões e tipos de inicialização
var init_store_type = null, whatsapp_version = null, extension_version = chrome.runtime.getManifest().version;

// ========================================
// INJEÇÃO DO SCRIPT PRINCIPAL
// ========================================
// Função que injeta o script inject.js no WhatsApp Web
(function addInject() {
    let jsPath = "/js/inject.js";
    let script_element = document.createElement("script");
    script_element.setAttribute("type", "text/javascript");
    script_element.setAttribute("id", "inject");
    script_element.src = chrome.runtime.getURL(jsPath);
    
    // Remove o script após carregamento para evitar duplicação
    script_element.onload = function () {
        this.parentNode.removeChild(this);
    };
    document.head.appendChild(script_element);
})();

// ========================================
// LISTENER DE MENSAGENS DO INJECT.JS
// ========================================
// Escuta mensagens vindas do script inject.js
window.addEventListener("message", injectMessageListner, false);

// Função que processa mensagens do inject.js
function injectMessageListner(event) {
    // Verifica se a mensagem é válida e vem da mesma janela
    if (event.source != window || !event.data.type)
        return;

    let message_type = event.data.type;
    let message_payload = event.data.payload;

    // Handle error and success
    if (message_payload) {
        if (message_payload.error) {
            trackError(message_type, message_payload.error);
        } else if (message_type.includes('send')) {
            trackSuccess(message_type + "_success");
        }
    }

    // ========================================
    // PROCESSAMENTO DE TIPOS DE MENSAGEM
    // ========================================
    // Switch case para processar diferentes tipos de mensagens do inject.js
    switch (message_type) {
        // Recebe tipo de inicialização do WhatsApp
        case "get_init_store_type":
            init_store_type = localStorage.getItem('pro-sender::init_store_type');
            if (!init_store_type || init_store_type != message_payload) {
                init_store_type = message_payload;
                localStorage.setItem('pro-sender::init_store_type', init_store_type);
                trackSystemEvent("init_store_type", init_store_type);
            }
            break;

        // Recebe versão do WhatsApp Web
        case "get_whatsapp_version":
            whatsapp_version = localStorage.getItem('pro-sender::whatsapp-version');
            if (!whatsapp_version || whatsapp_version != message_payload) {
                whatsapp_version = message_payload;
                localStorage.setItem('pro-sender::whatsapp-version', whatsapp_version);
                trackSystemEvent("whatsapp_version", whatsapp_version);
            }
            break;

        // Recebe lista de grupos do WhatsApp
        case "get_all_groups":
            setGroupDataToLocalStorage(message_payload);
            break;

        // Recebe lista de contatos do WhatsApp
        case "get_all_contacts":
            setContactDataToLocalStorage(message_payload);
            break;

        // ========================================
        // RESPOSTAS DE ENVIO DE MENSAGENS
        // ========================================
        // Processa respostas de envio para números individuais
        case "send_message_to_number":
            resolveSendMessageToNumber(message_payload);
            break;

        // Erro da API Store → aciona fallback DOM (colar texto + clicar enviar)
        case "send_message_to_number_error":
        case "send_message_to_number_new_error":
            if (typeof rejectSendMessageToNumber === 'function') {
                rejectSendMessageToNumber(message_payload);
            } else {
                resolveSendMessageToNumber(message_payload);
            }
            break;

        // Processa respostas de envio para grupos
        case "send_message_to_group":
        case "send_message_to_group_error":
            resolveSendMessageToGroup(message_payload);
            break;

        // ========================================
        // RESPOSTAS DE ENVIO DE ANEXOS
        // ========================================
        // Processa respostas de envio de anexos para números
        case "send_attachments_to_number":
        case "send_attachments_to_number_error":
            resolveSendAttachmentsToNumber(message_payload);
            break;

        // Processa respostas de envio de anexos para grupos
        case "send_attachments_to_group":
        case "send_attachments_to_group_error":
            resolveSendAttachmentsToGroup(message_payload);
            break;

        default:
            break;
    }
}

// Close Reminder Popup if user clicks outside of it
document.addEventListener('click', (event) => {
    if(document.querySelector('.trial_popup')) {
        let popup = document.querySelectorAll('.trial_popup')[0];
        if(!popup.contains(event.target)) {
            document.body.removeChild(popup);
        }
    }
});

// ========================================
// ARMAZENAMENTO DE DADOS DE GRUPOS
// ========================================
// Função que processa e armazena dados dos grupos do WhatsApp
function setGroupDataToLocalStorage(data) {
    // Mapeia os dados dos grupos adicionando IDs únicos
    let finalGroupData = data.map((group) => {
        return {
            ...group,
            objId: 'g' + group.id._serialized.replace(/\D+/g, ""), // ID único para interface
        }
    })
    
    // Armazena no storage local da extensão
    chrome.storage.local.set({ "allGroupData": finalGroupData });

    // Cria mapeamento ID -> Nome para busca rápida
    const groupData = data;
    groupData.forEach((group) => {
        const groupid = group.id._serialized;
        if (groupid && group.name)
            groupIdToName[groupid] = group.name;
    })
}

// ========================================
// ARMAZENAMENTO DE DADOS DE CONTATOS
// ========================================
// Função que processa e armazena dados dos contatos do WhatsApp
function setContactDataToLocalStorage(data) {
    // Mapeia os dados dos contatos adicionando IDs únicos
    let finalContactData = data.map((contact) => {
        return {
            ...contact,
            objId: 'c' + contact.id._serialized.replace(/\D+/g, ""), // ID único para interface
        }
    })
    
    // Armazena no storage local da extensão
    chrome.storage.local.set({ "allContactData": finalContactData });

    // Cria mapeamento ID -> Nome para busca rápida
    const contactData = data;
    contactData.forEach((contact) => {
        const contact_id = contact.id._serialized;
        if (contact_id && contact.name)
            contactIdToName[contact_id] = contact.name;
    })
}

function init() {
    messageListener();
    fetchLocalStorage();
    fetchConfigData();
    
    // Verificar se deve mostrar o popup de tutorial
    chrome.storage.local.get(['no_of_visit', 'showHowToUsePopup'], (res) => {
        let visit_count = res.no_of_visit || 0;
        let showTutorial = res.showHowToUsePopup;
        
        // Só mostra o tutorial se:
        // 1. Não for a primeira visita (visit_count > 0)
        // 2. showHowToUsePopup estiver explicitamente definido como true
        if (visit_count > 0 && showTutorial === true) {
    callIfNoOtherPopups(showHowToUsePopup);
        }
    });

    window.onload = function () {
        if (window.location.host === "web.whatsapp.com") {
            reload_my_number();
            reload_plan_type();
            chrome.storage.local.get(["messages"], function (result) {
                if (result.messages) messages = result.messages;
            });

            setInterval(() => {
                const quick_reply_div = document.getElementById("quick_reply_div");
                if (!quick_reply_div || reload_quick_reply_div) {
                    quick_reply_messages();
                }

                const profile_header_buttons_div = document.getElementById('profile_header_buttons_div');
                if (!profile_header_buttons_div) {
                    profile_header_buttons();
                }

                const main_panel = document.getElementById('main');
                if (main_panel) {
                    toggle_blur(null);
                }

                const sidePanel = document.querySelector('#pane-side');
                if (!sidePanel) {
                    detectBanText();
                }
            }, 1000);

            trackSystemEvent('whatsapp_visit', my_number);
        }
        const profileHeaderInterval = setInterval(() => {
            const profile_header = getDocumentElement("profile_header");
            if (profile_header) {
                clearInterval(profileHeaderInterval);
            }
        }, 100);
    };
};
init();

function messageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.type) {
            case "number_message":
            case "group_message":
                messenger(
                    request.numbers || request.groups,
                    request.message,
                    request.time_gap,
                    request.csv_data,
                    request.customization,
                    request.caption_customization,
                    request.random_delay,
                    request.batch_size,
                    request.batch_gap,
                    request.caption,
                    request.send_attachment_first,
                    request.type
                );
                break;

            case "add_attachments":
                handleAddAttachment();
                break;

            case "reload_contacts":
                window.dispatchEvent(new CustomEvent("PRIMES::get-all-contacts"));
                break;

            default:
                console.warn("Unknown request type:", request.type);
                break;
        }
    });
}

function fetchLocalStorage() {
    chrome.storage.local.get(['location_info'], (result) => {
        location_info = result.location_info || location_info;
    });
}

function profile_header_buttons() {
    const profile_header = getDocumentElement('profile_header');
    if (!profile_header) return;

    const profile_header_buttons_div = document.createElement('div');
    profile_header_buttons_div.id = 'profile_header_buttons_div';

    const profile_header_buttons_list = profile_header.children[0];
    profile_header_buttons_list.insertBefore(profile_header_buttons_div, profile_header_buttons_list.children[0]);

    // Profile Header Buttons
    add_profile_header_btn('blur_contacts', 'Blur chat, contact name and profile picture - Sender', eye_hidden, toggle_blur);

    // Handle other 
    const new_chat_btn = getDocumentElement('new_chat_btn');
    if (new_chat_btn && !new_chat_btn.classList.contains('CtaBtn')) {
        new_chat_btn.classList.add('CtaBtn');
    }
    const new_chat_parent = getDocumentElement('new_chat_parent');
    if (new_chat_parent) {
        new_chat_btn.title = "";
        handleShowTooltip({
            query: DOCUMENT_ELEMENT_SELECTORS['new_chat_parent'][0],
            text: "New chat",
            bottom: "-30px",
        });
    }
}

function add_profile_header_btn(btn_id, btn_title, btn_image = null, on_click) {
    const profile_header_buttons_div = document.querySelector('#profile_header_buttons_div');
    if (!profile_header_buttons_div) return;

    const existing_btn = document.querySelector(`#${btn_id}`);
    if (existing_btn) return;

    const btn = document.createElement('div');
    btn.id = btn_id;
    btn.classList.add('profile_header_button');
    btn.innerHTML = `<img src=${btn_image} class='${btn_id}_icon CtaBtn' alt='${btn_id}'>`;
    btn.addEventListener('click', on_click);

    profile_header_buttons_div.appendChild(btn);
    handleShowTooltip({
        query: `#${btn_id}`,
        text: btn_title,
        bottom: "-30px",
    });
}

function toggle_blur(click_event) {
    try {
        const blurContactsBtn = document.getElementById('blur_contacts');
        const isBlurred = blurContactsBtn.classList.contains('blurred');

        // Elements to blur
        const reply_div = document.querySelector('#reply_div');
        const left_side_contacts_panel = getDocumentElement('left_side_contacts_panel');
        const conversation_header_name_div = getDocumentElement('conversation_header_name_div');

        const contact_profile_divs = getDocumentElement('contact_profile_div', true);
        const conversation_message_divs = getDocumentElement('conversation_message_div', true);
        const conversation_non_message_divs = getDocumentElement('conversation_non_message_div', true);

        const elementsToToggle = [
            reply_div,
            left_side_contacts_panel,
            conversation_header_name_div,
            ...contact_profile_divs,
            ...conversation_message_divs,
            ...conversation_non_message_divs,
            // Add other elements as needed
        ];

        elementsToToggle.forEach(element => {
            applyOrRemoveBlur(element, 'blur', click_event ? !isBlurred : isBlurred);
        });

        if (click_event) {
            blurContactsBtn.classList.toggle('blurred', !isBlurred);
            blurContactsBtn.innerHTML = `<img class='blur_icon' src=${!isBlurred ? eye_visible : eye_hidden} alt='blur-info'>`;

            if (isBlurred) {
                trackButtonClick('blur_contacts');
            }
        }
    } catch (e) {
        console.error('Error :: toggle_blur :: ', e);
    }
}

function applyOrRemoveBlur(element, className, shouldApply) {
    try {
        if (!element)
            return;

        if (shouldApply) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    } catch (error) {
        console.log(error);
    }
}

function quick_reply_messages() {
    let reply_div = document.getElementById("quick_reply_div");
    if (reply_div) {
        reply_div.parentNode.removeChild(reply_div);
    }

    if (messages.length === 0) return; // Se não houver mensagens, não cria o div

    reply_div = document.createElement("div");
    reply_div.id = 'quick_reply_div';
    reply_div.innerHTML = `
    <div id="quick_reply_messages_container" class="quick_reply_container">
        ${messages.map(message => {
            let text = "";

            if (typeof message === "object" && message !== null) {
                text = message.title || message.message;
            } else {
                text = message;
            }

            let displayText = text.length > 47 ? text.substring(0, 47) + '...' : text;

            return `<button class="reply_click message_btn CtaBtn" style="background:${message.color || 'var(--outgoing-background)' }" value="${text}">${displayText}</button>`;
        }).join("")}
    </div>
    <div id="quick_reply_buttons_container" class="quick_reply_container">
        <button class="CtaBtn menu_btn" id="expand_quick_reply_btn" isExpand="false" style="display: none;">
            <img src="${down_arrow_src}"/>
        </button>
        <button class="CtaBtn menu_btn" id="edit_quick_reply_btn">Edit</button>
    </div>
    `;

    reply_div.addEventListener('click', (event) => {
        let message = event.target.value;
        send_quick_reply_message(message);
    });

    let footer_div = getDocumentElement('footer_div');
    if (footer_div) {
        footer_div.style.paddingTop = '0px'; // Alterado de 36px para 0px
        footer_div.appendChild(reply_div);

        let conversation_panel = getDocumentElement('conversation_panel');
        if (conversation_panel) {
            conversation_panel.scrollBy(0, 33);
        }

        reload_quick_reply_div = false;
    } else {
        return;
    }  

    let edit_btn = document.getElementById("edit_quick_reply_btn");
    edit_btn.addEventListener('click', (e) => {
        e.stopPropagation();
        edit_quick_reply_popup();
        trackButtonClick('smart_reply_edit');
    }); 

    let expand_quick_reply_btn = document.getElementById("expand_quick_reply_btn");
    expand_quick_reply_btn.addEventListener('click', (e) => {
        e.stopPropagation();

        let isExpand = e.target.getAttribute('isExpand') === "true";
        let footer_div = getDocumentElement('footer_div')
        let quick_reply_div = document.getElementById("quick_reply_div");
        let messages_container = document.getElementById("quick_reply_messages_container");
    
        if (footer_div && quick_reply_div && messages_container) {
            if (!isExpand) {
                messages_container.style.flexWrap = 'wrap';
                footer_div.style.paddingTop = `${quick_reply_div.offsetHeight}px`;
                expand_quick_reply_btn.style.rotate = '180deg';
                trackButtonClick('smart_reply_div_expanded');
            } else {
                messages_container.style.flexWrap = 'nowrap';
                footer_div.style.paddingTop = '36px';
                expand_quick_reply_btn.style.rotate = '0deg';
            }    

            e.target.setAttribute('isExpand', (!isExpand).toString());
            // TRACK GOOGLE ANALYTICS FOR THIS NEW BUTTON
        }
    });

    // Show / Not show expand quick reply button
    setTimeout(() => {
        let container = document.getElementById("quick_reply_messages_container");
        let expand_btn = document.getElementById("expand_quick_reply_btn");
    
        if (container && expand_btn) {
            expand_btn.style.display = isOverflowing(container) ? "block" : "none";
        }
    }, 100);


    // updating premium usage for quick replies
    let quickReplyButton= document.getElementsByClassName('reply_click')[0];
    if(quickReplyButton){
        quickReplyButton.addEventListener('click', function (){
            chrome.storage.local.get(['premiumUsageObject'], function(result){
                if(result.premiumUsageObject!==undefined){
                    let updatedPremiumUsageObject = {...result.premiumUsageObject, quickReplies: true};
                    chrome.storage.local.set({'premiumUsageObject': updatedPremiumUsageObject});
                }
            });
        })
    }
}

function isOverflowing(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

async function send_quick_reply_message(message) {
    if (!message || message.trim().length == 0) return;

    let message_input_box = getDocumentElement('input_message_div');
    if (!message_input_box) return;

    trackButtonClick("smart_reply_sent");
    let result = messages.find(msg => typeof msg === "object" && msg.title === message);
    if(result){
        let conv_header = getDocumentElement('conversation_header');
        if (!conv_header) return;
        
        let conv_msg_div = getDocumentElement('conversation_message_div');
        let curr_chat_id = conv_msg_div.dataset['id'];
        if(!conv_msg_div || !conv_msg_div.dataset['id'].includes('@g.us')){
            let number_id = curr_chat_id.split('_')[1];
            window.dispatchEvent(new CustomEvent("ProSender::send-attachments", {
                detail: {
                    number: number_id,
                    attachments: result.blob,
                    name:result.name,
                    caption: result.caption,
                    quick:true
                }
            }));
        }else{
            let group_id = curr_chat_id.split('_')[1];
            window.dispatchEvent(new CustomEvent("ProSender::send-attachments-to-group", {
                detail: {
                    groupId: group_id,
                    attachments: result.blob,
                    name:result.name,
                    caption: result.caption,
                    quick:true
                }
            }));   
        }
    } else{
        pasteMessage(message);
        await sendMessageToNumber();
    }
}

function pasteMessage(text) {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text", text);
    const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
    });
    
    const inputMessageBox = getDocumentElement('input_message_div');
    inputMessageBox.dispatchEvent(event);
}

function filter_quick_reply_message(message) {
    return message
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

function refresh_quick_replies() {
    let messages_list = document.getElementById('quick_reply_messages_list');
    if (messages_list) {
        messages_list.innerHTML = messages.map((message, index) => {
            let message_bg_color = message.color || (document.body.classList.contains('dark') ? '#333333' : '#ffffff');
            return `
                <div class="message_row drag_handle" draggable="true" index="${index}">
                    <img class="CtaBtn drag_handle" src="${drag_icon_src}" title="Reorder"/>
                    <div class="message_div drag_handle" title="Send" style="background-color: ${message_bg_color}">${message.title || message.message || message}</div>
                    <input type="color" class="color-picker" index=${index} id="color${index}" value="${message_bg_color}" title="Change Background"/>
                    <img class="CtaBtn edit_message_btn" index="${index}" src="${edit_icon_src}" title="Edit"/>
                    <img class="CtaBtn delete_message_btn" index="${index}" src="${delete_icon_src}" title="Delete"/>
                </div>
            `;
        }).join("");        
    }

    chrome.storage.local.set({ messages: messages });
    chrome.storage.local.set({ totalConvertedSize: totalConvertedSize });
    reload_quick_reply_div = true;

    // Handle Drag and Drop Listener
    let dragged_index = null;
    document.querySelectorAll('.message_row').forEach((row) => {
        row.addEventListener('dragstart', (e) => {
            let target_element = e.target;
            let target_row = target_element.closest('.message_row');
            
            if (target_element.classList.contains('drag_handle')) {
                dragged_index = parseInt(target_row.getAttribute('index'));
                target_row.style.opacity = '0.5';
            } else {
                e.preventDefault();
            }
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.target.closest('.message_row').classList.add('dragged');
        });

        row.addEventListener('dragleave', (e) => {
            e.target.closest('.message_row').classList.remove('dragged');
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            let target_element = e.target;
            let target_row = target_element.closest('.message_row');
            let dropped_index = parseInt(target_row.getAttribute('index'));
            
            if (dragged_index !== dropped_index) {
                let moved_item = messages.splice(dragged_index, 1)[0];
                messages.splice(dropped_index, 0, moved_item);
                refresh_quick_replies();
                trackButtonClick('smart_reply_reordered');
            }
        });

        row.addEventListener('dragend', (e) => {
            e.target.closest('.message_row').classList.remove('dragged');
            e.target.closest('.message_row').style.opacity = '1';
        });
    });
}

function getFileDetails(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file provided"));
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
            resolve("More than 10MB file size is not allowed!");
            return;
        }

        const fr = new FileReader();
        fr.readAsDataURL(file);
        fr.onload = () => {
            const base64String = fr.result;
            totalConvertedSize += base64String.length; // Track encoded data size
            if (totalConvertedSize > 50 * 1024 * 1024) { // 50MB total limit
                resolve("Upload limit reached. You can only upload up to 50MB in total.");
                return;
            }
            resolve({ name: file.name, blob: JSON.stringify(base64String) });
        };
        fr.onerror = err => reject(err);
    });
}

    // Toggle UI elements based on image selection
function toggleUI(showImageOptions) {
    document.getElementById("add_quick_img_btn_container").style.display = showImageOptions ? "flex" : "none";
    document.getElementById("add_quick_reply_btn_container").style.display = showImageOptions ? "none" : "flex";
    document.getElementById("title_input").style.display = showImageOptions ? "block" : "none";
    document.getElementById("add_quick_img_btn").style.display = showImageOptions ? "none" : "block";

    const captionField = document.getElementById("add_quick_reply_textarea");
    captionField.placeholder = showImageOptions ? "Type your caption here ..." : "Type your quick reply here";
    captionField.classList.toggle("title_textarea", showImageOptions);
}

// Display selected image name
function displayImageName(imageName,classRed) {
    let existingPTag = document.getElementById("image_name");
    if (!existingPTag) {
        existingPTag = document.createElement("p");
        existingPTag.className = `image_name ${classRed}`;
        existingPTag.id = "image_name";
        document.getElementById("inputs_container").append(existingPTag);
    }
    existingPTag.innerText = imageName;
}

// Reset UI elements after saving
function resetUI() {
    toggleUI(false);
    document.getElementById("image_name")?.remove();
    document.getElementById("title_input").value = "";
    document.getElementById("add_quick_reply_textarea").value = "";
}

async function handleImageSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show and hide relevant UI elements
    toggleUI(true);

    try {
        imageData = await getFileDetails(file);
        if(typeof imageData !== 'string'){
            displayImageName(imageData.name,'');
        }else{
            resetUI()
            displayImageName(imageData,"error_class")
            setTimeout(() => {
                resetUI()
            }, 2000);
        }
    } catch (error) {
        resetUI()
        console.error(error.message);
    }
}

function edit_quick_reply_popup() {
    let edit_popup = document.getElementById('edit_quick_reply_popup');
    if (edit_popup) {
        document.body.removeChild(edit_popup);
    }

    edit_popup = document.createElement('div');
    edit_popup.id = 'edit_quick_reply_popup';
    edit_popup.className = 'edit_quick_reply_popup trial_popup';
    edit_popup.style.width = 'min(600px, 95%)';
    edit_popup.style.maxHeight = 'min(600px, 85%)';
    edit_popup.innerHTML = `
        <div class="edit_quick_reply_content trial_content">
            <span class="CtaCloseBtn popup-close-btn" id="close_edit_quick_reply_popup"><img src="${close_img_src}" /></span>

            <div class="trial_big_title">Edit / Add Quick Replies</div>
            <div id="quick_reply_messages_list" class="messages_list"></div>
            
            <div class="input_container">
                <div id="inputs_container">
                    <input type="text" id="title_input" placeholder="Add title here ..." class="title_input_container" style="display:none;" >
                    <textarea id="add_quick_reply_textarea" type="text" placeholder="Type your quick reply here"></textarea>
                    <img src="${attachment_icon}" alt="Add Attachment" id="add_quick_img_btn" class="attachment_icon tool-icon">
                </div>
                <div id="add_quick_reply_btn_container" class="btn_container">
                    <button id="add_quick_reply_btn" class="CtaBtn text_btn">Add Template</button>
                    <input type="file" id="select-image" hidden>
                </div>
                <div id="edit_quick_reply_btn_container" class="btn_container" style="display: none;">
                    <button id="save_quick_reply_btn" class="CtaBtn text_btn">Save</button>
                    <button id="cancel_quick_reply_btn" class="CtaBtn text_btn">Cancel</button>
                </div>
                <div id="add_quick_img_btn_container" class="btn_container" style="display: none;">
                    <button id="save_quick_img_btn" class="CtaBtn text_btn">Save</button>
                    <button id="cancel_quick_img_btn" class="CtaBtn text_btn">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(edit_popup);
    refresh_quick_replies();

    // On close button click
    document.getElementById('close_edit_quick_reply_popup').addEventListener('click', () => {
        document.body.removeChild(edit_popup);
    })

    // Handle Delete, Edit, Save and Send functions
    document.getElementById('quick_reply_messages_list').addEventListener('click', (event) => {
        event.stopPropagation();

        let targetElement = event.target;
        let targetClass = event.target.classList;
        let targetIndex = parseInt(event.target.getAttribute('index'));
        
        if (targetClass.contains('delete_message_btn')) {
            // Delete quick reply message
            const [deletedItem] = messages.splice(targetIndex, 1); // Remove the file
            if (deletedItem && deletedItem.blob) {
                const byteSize = Math.ceil((deletedItem.blob.length * 3) / 4);
                totalConvertedSize -= byteSize; // Deduct from total size
            }
            refresh_quick_replies();

            trackButtonClick('smart_reply_deleted');
        } else if (targetClass.contains('edit_message_btn')) {
            // Add textarea to edit message
            if (!isNaN(targetIndex)) {
                refresh_quick_replies();
                document.querySelectorAll('.message_row')[targetIndex].classList.add('disabled');
                if(typeof messages[targetIndex] === 'object'){
                    toggleUI(true)
                    displayImageName(messages[targetIndex].name,'')
                    document.getElementById("title_input").value = messages[targetIndex].title;
                    document.getElementById("add_quick_reply_textarea").value = messages[targetIndex].caption;
                    document.getElementById('add_quick_img_btn_container').setAttribute('index', targetIndex);   
                } else {
                    document.getElementById('add_quick_reply_textarea').value = messages[targetIndex];
                    document.getElementById('add_quick_reply_btn_container').style.display = 'none';   
                    document.getElementById('edit_quick_reply_btn_container').style.display = 'flex';   
                    document.getElementById('edit_quick_reply_btn_container').setAttribute('index', targetIndex);   
                }

            }
        } else if (targetClass.contains('message_div')) {
            // Close popup and Send quick reply message
            document.body.removeChild(edit_popup);
            send_quick_reply_message(targetElement.innerText);
        }else if(targetClass.contains('color-picker')){

            targetElement.addEventListener("change", (e) => {
                let newColor = e.target.value;
                if(typeof messages[targetIndex] === 'object'){
                    messages[targetIndex].color = newColor;
                }else{
                    messages[targetIndex] = { message : messages[targetIndex], color : newColor }
                }
                refresh_quick_replies();
            }, { once: true });
            

        }
    })

    // Add quick reply message
    document.getElementById('add_quick_reply_btn').addEventListener('click', (event) => {
        event.stopPropagation();

        let new_message = document.getElementById('add_quick_reply_textarea').value;
        new_message = filter_quick_reply_message(new_message);

        if(new_message) {
            messages.push(new_message);
            refresh_quick_replies();

            document.getElementById('add_quick_reply_textarea').value = '';
            trackButtonClick('smart_reply_added');
        }
    })

    document.getElementById("add_quick_img_btn").addEventListener("click", (event) => {
        event.stopPropagation();
        
        const inputImage = document.getElementById("select-image");
        inputImage.click();
        inputImage.addEventListener("change", handleImageSelection, { once: true });
    });
    
    document.getElementById("save_quick_img_btn").addEventListener("click", () => {
        const inputContent = document.getElementById("title_input");
        const captionContent = document.getElementById("add_quick_reply_textarea");
        let target_index = document.getElementById('add_quick_img_btn_container').getAttribute('index'); 
    
        if (inputContent.value.trim()) {
            if(target_index){
                messages[target_index].title = filter_quick_reply_message(inputContent.value);
                messages[target_index].caption = filter_quick_reply_message(captionContent.value);
                document.getElementById('add_quick_img_btn_container').setAttribute('index', '');
            } else {
                imageData.title = filter_quick_reply_message(inputContent.value);
                imageData.caption = filter_quick_reply_message(captionContent.value);
                messages.push(imageData);
            }
    
            refresh_quick_replies();
            resetUI();
        } else {
            inputContent.focus();
        }
    });

    document.getElementById("cancel_quick_img_btn").addEventListener("click", () => {
        resetUI()
        let target_index = document.getElementById('add_quick_img_btn_container').getAttribute('index');
        if(target_index){
            document.querySelectorAll('.message_row')[target_index].classList.remove('disabled');
            document.getElementById('add_quick_img_btn_container').setAttribute('index', '');
        }

    });
        
    // Save edited quick reply message
    document.getElementById('save_quick_reply_btn').addEventListener('click', (event) => {
        event.stopPropagation();
        
        let new_message = document.getElementById('add_quick_reply_textarea').value.trim();
        let target_index = document.getElementById('edit_quick_reply_btn_container').getAttribute('index');   
        new_message = filter_quick_reply_message(new_message);

        if(new_message && target_index) {
            messages[target_index] = new_message;
            refresh_quick_replies();

            document.getElementById('add_quick_reply_textarea').value = '';
            document.getElementById('add_quick_reply_btn_container').style.display = 'flex';   
            document.getElementById('edit_quick_reply_btn_container').style.display = 'none';   
            document.getElementById('edit_quick_reply_btn_container').setAttribute('index', '');   
            trackButtonClick('smart_reply_edited');
        }
    });

    // Cancel edit quick reply message
    document.getElementById('cancel_quick_reply_btn').addEventListener('click', (event) => {
        event.stopPropagation();

        refresh_quick_replies();
        document.getElementById('add_quick_reply_textarea').value = '';
        document.getElementById('add_quick_reply_btn_container').style.display = 'flex';   
        document.getElementById('edit_quick_reply_btn_container').style.display = 'none';   
        document.getElementById('edit_quick_reply_btn_container').setAttribute('index', '');   
    });

    trackButtonView('edit_smart_reply_popup');
}

async function reload_my_number() {
    let result = await chrome.storage.local.get('my_number');
    my_number = result.my_number || null;
    if (!my_number) {
        var last_wid = window.localStorage.getItem("last-wid");
        var last_wid_md = window.localStorage.getItem("last-wid-md");
        if (last_wid_md)
            my_number = window.localStorage.getItem("last-wid-md").split("@")[0].substring(1).split(":")[0];
        else if (last_wid)
            my_number = window.localStorage.getItem("last-wid").split("@")[0].substring(1);
        if (my_number)
            chrome.storage.local.set({ my_number: my_number });
    }
    if (!my_number) {
        trackSystemEvent('no_number', 'track');
        try {
            trackSystemEvent('no_number_local_storage', window.localStorage);
        } catch (e) {
            console.log(e)
        }
    } else {
        trackSystemEvent('my_number', my_number);
    }
}

// ========================================
// CARREGAMENTO DO PLAN TYPE
// ========================================
async function reload_plan_type() {
    let result = await chrome.storage.local.get('plan_type');
    plan_type = result.plan_type || "Expired";
    console.log("📊 Plan type carregado:", plan_type);
}

// ========================================
// LISTENER PARA MUDANÇAS NO PLAN TYPE
// ========================================
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.plan_type) {
        plan_type = changes.plan_type.newValue || "Expired";
        console.log("📊 Plan type atualizado:", plan_type);
    }
});

async function readFileAndSaveToLocalStorage(e, localStorageName) {
    let files = e.target.files;
    let renderedFiles = [];

    let fileReadPromises = Array.from(files).map((file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64Data = event.target.result;
                const fileData = {
                    name: file.name,
                    type: file.type,
                    data: base64Data
                };
                renderedFiles.push(fileData);
                resolve();
            };
            reader.readAsDataURL(file);
        });
    });
    await Promise.all(fileReadPromises);
    chrome.storage.local.set({ [localStorageName]: renderedFiles });
}

async function handleAddAttachment() {
    let inputElement = document.createElement('input');
    inputElement.type = "file";
    inputElement.id = "new_input_element";
    inputElement.multiple = true;
    document.body.appendChild(inputElement);
    inputElement.click();

    inputElement.addEventListener("change", async function(e) {
        let selectedFiles = inputElement.files;
        trackEvent('add_attachments', selectedFiles.length);
        await readFileAndSaveToLocalStorage(e, "linuxInputAttachments")
        inputElement.remove();
    });
}

function handleAddCSVInput(){
    let inputElement = document.createElement('input');
    inputElement.type = "file";
    inputElement.id = "new_csv_input_element";
    inputElement.accept = ".xls,.xlsx,.ods,.csv";
    document.body.appendChild(inputElement);
    inputElement.click();

    inputElement.addEventListener("change", async function(e){
        await readFileAndSaveToLocalStorage(e, "linuxCSVAttachment")
        inputElement.remove();
    });
}

// Google Analytics
function getTrackLabel() {
    try {
        return [my_number, plan_type, plan_duration].join(' ').trim();
    } catch {
        return '';
    }
}

function getTrackLocation() {
    return location_info.default ? {} : {
        city: location_info.city,
        region: location_info.region,
        country: location_info.country,
        dial_code: location_info.dial_code,
    }
}

function getTrackContext() {
    return {
        init_store_type: init_store_type,
        whatsapp_version: whatsapp_version,
        extension_version: extension_version,
    }
}

function trackEvent(event, track) {
    trackGenericEvent(event, { type: 'event', track, natural_interaction: true });
}

function trackButtonClick(event) {
    trackGenericEvent(event, { type: 'clicked', natural_interaction: true });
}

function trackCloseButtonClick(event) {
    trackGenericEvent(event, { type: 'clicked' });
}

function trackButtonView(event) {
    trackGenericEvent(event, { type: 'viewed' });
}

function trackSystemEvent(event, track = '') {
    trackGenericEvent(event, { type: 'event', track });
}

function trackSuccess(event) {
    trackGenericEvent(event, { type: 'success' });
}

function trackError(event, error = '') {
    trackGenericEvent(event, { type: 'error', error: String(error) })
}

function trackGenericEvent(event, data) {
    let label = getTrackLabel();
    let location = getTrackLocation();
    let context = getTrackContext();

    // Filters null and undefined values
    let combinedData = { ...location, ...context, ...data };
    let eventData = Object.fromEntries(
        Object.entries(combinedData).filter(([key, value]) => value != null || value != undefined) 
    );
    GoogleAnalytics.trackEvent(event, { label, ...eventData });
}

// ---- config-data OR data.js related functions ---

function getDocumentElement(key, selectAll = false) {
    try {
        if (DOCUMENT_ELEMENT_SELECTORS[key]) {
            for (const className of DOCUMENT_ELEMENT_SELECTORS[key]) {
                const element = (selectAll) ? document.querySelectorAll(className) : document.querySelector(className);
                if (element) {
                    return element;
                }
            }
        } else {
            console.log("Selector not exists:", key);
        }
    } catch (err) {
        console.log("Error while finding document element", err);
    }
    return null;
}

async function fetchConfigData() {
    try {
        const url = `${AWS_API.GET_CONFIG_DATA}?operation=get-all-config-data`
        const response = await fetch(url);
        const jsonData = await response.json();
        const allConfigData = jsonData.data;

        if (allConfigData && Array.isArray(allConfigData)) {
            const configMap = createConfigMap(allConfigData);
            loadConfigData(configMap);

            chrome.storage.local.set({ CONFIG_DATA: configMap });
        } else {
            console.log("Config data not found. Api response:", jsonData);
        }
    } catch (err) {
        console.log("Error while fetching config data:", err);
    }
};

function createConfigMap(configArray) {
    const configMap = {};
    configArray.forEach(item => {
        if (item.name && item.data !== null) {
            configMap[item.name] = item.data;
        }
    });
    return configMap;
}

// Load AWS Config Data from API to Local Data (for content js)
function loadConfigData(configMap) {
    // Constant Objects
    if (configMap.GA_CONFIG)
        GA_CONFIG = { ...configMap.GA_CONFIG };
    if (configMap.DOCUMENT_ELEMENT_SELECTORS)
        DOCUMENT_ELEMENT_SELECTORS = { ...configMap.DOCUMENT_ELEMENT_SELECTORS };
    if (configMap.RUNTIME_CONFIG) {
        RUNTIME_CONFIG = { ...configMap.RUNTIME_CONFIG };
        if (RUNTIME_CONFIG.reloadInject) {
            window.dispatchEvent(new CustomEvent("ProSender::init", {
                detail: { useOldMethod: RUNTIME_CONFIG.useOldInjectMethod }
            }));
        }
    }
}

var ban_text_detected = false;
function detectBanText() {
    if (ban_text_detected)
        return;

    let banMessages = [
        "verify your phone number",
        "you will need to verify your phone number",
        "You have been logged out. To log back in, you will need to verify your phone number.", // English
        "आप लॉग आउट हो गए हैं। फिर से लॉग इन करने के लिए, आपको अपना फ़ोन नंबर सत्यापित करना होगा।", // Hindi
        "Você foi desconectado. Para fazer login novamente, será necessário verificar seu número de telefone.", // Brazilian Portuguese
        "Has cerrado sesión. Para volver a iniciar sesión, deberás verificar tu número de teléfono." // Spanish    
    ]

    for (const message of banMessages) {
        if (document.body.innerText.includes(message) || document.body.innerText.toLowerCase().includes(message.toLocaleLowerCase())) {
            // trackSystemEvent('banned_text', banMessages);
            trackSystemEvent('banned_text');
            ban_text_detected = true;
        }
    }
}

function showTooltip({ elementParentClass, text, positionTop, positionBottom, positionLeft, positionRight }) {
    const parentElement = document.querySelector(elementParentClass);
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip_main_container";
    if (positionTop)
        tooltip.style.top = positionTop;
    if (positionBottom)
        tooltip.style.bottom = positionBottom;
    if (positionLeft)
        tooltip.style.left = positionLeft;
    if (positionRight)
        tooltip.style.right = positionRight;
    tooltip.innerHTML = `
        <div>
            ${text}
        </div>
        <div class="tooltip_arrow"></div>
    `;
    parentElement.appendChild(tooltip);
}

// ========================================
// SISTEMA DE AQUECIMENTO DE NÚMEROS
// ========================================

// Variáveis globais do sistema de aquecimento
let warmupSystem = {
    isActive: false,
    settings: null,
    stats: {
        totalResponses: 0,
        uniqueContacts: new Set(),
        todayResponses: 0,
        uptime: 0,
        startTime: null
    },
    lastResponseTime: new Map(),
    phoneNumber: null
};

// Função para inicializar o sistema de aquecimento
function initializeWarmupSystem() {
    console.log("🔥 Inicializando sistema de aquecimento");
    
    // Detectar número do telefone
    detectPhoneNumber();
    
    // Configurar listener para mensagens do popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'startWarmup') {
            startWarmupSystem(request.settings);
            sendResponse({ success: true });
        } else if (request.action === 'stopWarmup') {
            stopWarmupSystem();
            sendResponse({ success: true });
        } else if (request.action === 'sendWarmupMessage') {
            sendWarmupMessageToNumber(request.number, request.message);
            sendResponse({ success: true });
        } else if (request.action === 'getConnectedNumber') {
            // Retornar número conectado
            const connectedNumber = getConnectedNumber();
            sendResponse({ number: connectedNumber });
        }
    });
}

// Sistema de detecção de notificações do WhatsApp Web
function monitorWhatsAppNotifications() {
    console.log("🔔 Iniciando monitoramento de notificações do WhatsApp Web");
    
    let lastNotificationCount = 0;
    let processedNotifications = new Set();
    
    // Função para detectar notificações
    function detectNotifications() {
        try {
            // Procurar por indicadores de notificação no WhatsApp Web
            const notificationSelectors = [
                // Badge de notificação no título da aba
                'title',
                // Indicadores de mensagem não lida
                '[data-testid="unread-count"]',
                '[data-testid="unread"]',
                // Contadores de mensagens não lidas
                'span[data-testid="unread-count"]',
                'div[data-testid="unread-count"]',
                // Indicadores visuais de mensagem nova
                '[data-testid="msg-container"]:not([data-testid="outgoing"])',
                // Badge de notificação
                '[data-testid="notification-badge"]',
                // Contador de mensagens não lidas na lista de chats
                'span[data-testid="unread-count"]',
                'div[data-testid="unread-count"]'
            ];
            
            let notificationCount = 0;
            let newNotifications = 0;
            
            // Verificar título da aba para notificações
            const pageTitle = document.title;
            const titleMatch = pageTitle.match(/\((\d+)\)/);
            if (titleMatch) {
                const titleCount = parseInt(titleMatch[1]);
                if (titleCount > lastNotificationCount) {
                    newNotifications = titleCount - lastNotificationCount;
                    lastNotificationCount = titleCount;
                    console.log(`🔔 ${newNotifications} nova(s) notificação(ões) detectada(s) no título da aba`);
                }
            }
            
            // Verificar contadores de mensagens não lidas
            notificationSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element.textContent && element.textContent.trim()) {
                        const text = element.textContent.trim();
                        const numberMatch = text.match(/\d+/);
                        if (numberMatch) {
                            const count = parseInt(numberMatch[0]);
                            if (count > 0) {
                                const notificationId = `${selector}-${count}-${text}`;
                                if (!processedNotifications.has(notificationId)) {
                                    processedNotifications.add(notificationId);
                                    notificationCount += count;
                                    console.log(`🔔 Notificação encontrada: ${selector} = ${count} (${text})`);
                                }
                            }
                        }
                    }
                });
            });
            
            // Se detectou novas notificações, atualizar estatísticas
            if (newNotifications > 0) {
                console.log(`📊 Processando ${newNotifications} nova(s) notificação(ões)`);
                updateReceivedMessageStats(newNotifications);
            }
            
        } catch (error) {
            console.error("❌ Erro ao detectar notificações:", error);
        }
    }
    
    // Monitorar mudanças no título da página
    const titleObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                detectNotifications();
            }
        });
    });
    
    // Observar mudanças no título
    const titleElement = document.querySelector('title');
    if (titleElement) {
        titleObserver.observe(titleElement, {
            childList: true,
            subtree: true,
            characterData: true
        });
        console.log("✅ Monitoramento de título da aba ativado");
    }
    
    // Monitorar mudanças no DOM para contadores de notificação
    const domObserver = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Verificar se foi adicionado um contador de notificação
                        if (node.querySelector && (
                            node.querySelector('[data-testid="unread-count"]') ||
                            node.matches('[data-testid="unread-count"]') ||
                            node.querySelector('[data-testid="unread"]') ||
                            node.matches('[data-testid="unread"]')
                        )) {
                            shouldCheck = true;
                        }
                    }
                });
            }
        });
        
        if (shouldCheck) {
            setTimeout(detectNotifications, 500);
        }
    });
    
    // Observar mudanças no documento
    domObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Verificação inicial
    setTimeout(detectNotifications, 1000);
    
    console.log("✅ Monitoramento de notificações do WhatsApp Web ativado");
}

// Sistema de detecção de som de notificação
function monitorNotificationSound() {
    console.log("🔊 Iniciando monitoramento de som de notificação");
    
    // Interceptar reprodução de áudio
    const originalPlay = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function() {
        console.log("🔊 Áudio reproduzido:", this.src || 'sem src');
        
        // Verificar se é som de notificação do WhatsApp
        if (this.src && (
            this.src.includes('notification') ||
            this.src.includes('message') ||
            this.src.includes('whatsapp') ||
            this.src.includes('sound')
        )) {
            console.log("🔔 Som de notificação do WhatsApp detectado!");
            updateReceivedMessageStats(1);
        }
        
        return originalPlay.call(this);
    };
    
    // Interceptar criação de elementos de áudio
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(this, tagName);
        
        if (tagName.toLowerCase() === 'audio') {
            element.addEventListener('play', function() {
                console.log("🔊 Elemento de áudio reproduzido:", this.src || 'sem src');
                
                // Verificar se é som de notificação
                if (this.src && (
                    this.src.includes('notification') ||
                    this.src.includes('message') ||
                    this.src.includes('whatsapp') ||
                    this.src.includes('sound')
                )) {
                    console.log("🔔 Som de notificação detectado via elemento!");
                    updateReceivedMessageStats(1);
                }
            });
        }
        
        return element;
    };
    
    console.log("✅ Monitoramento de som de notificação ativado");
}

// Sistema de monitoramento de mensagens recebidas removido - focando apenas nas enviadas

// Funções de mensagens recebidas removidas - focando apenas nas enviadas

// Função para mostrar estatísticas atuais (apenas enviadas)
function showCurrentStats() {
    chrome.storage.local.get(['connectedNumberStats'], function(result) {
        const stats = result.connectedNumberStats || {};
        console.log("📊 Estatísticas atuais:", {
            number: stats.number,
            totalSent: stats.totalSent || 0,
            lastActivity: stats.lastActivity
        });
    });
}

// Função para monitorar mensagens recebidas
// Função de monitoramento de mensagens recebidas removida

// Função de atualização de mensagens recebidas removida

// Função para obter número conectado
function getConnectedNumber() {
    try {
        // Primeiro tentar obter do localStorage
        var last_wid = window.localStorage.getItem("last-wid");
        var last_wid_md = window.localStorage.getItem("last-wid-md");
        
        let connectedNumber = null;
        
        if (last_wid_md) {
            connectedNumber = window.localStorage.getItem("last-wid-md").split("@")[0].substring(1).split(":")[0];
        } else if (last_wid) {
            connectedNumber = window.localStorage.getItem("last-wid").split("@")[0].substring(1);
        }
        
        // Se não encontrou no localStorage, tentar detectar na interface
        if (!connectedNumber) {
            const phoneElement = document.querySelector('[data-testid="phone-number"]') || 
                               document.querySelector('[title*="+"]') ||
                               document.querySelector('[aria-label*="+"]');
            
            if (phoneElement) {
                const phoneText = phoneElement.textContent || phoneElement.title || phoneElement.getAttribute('aria-label');
                const phoneMatch = phoneText.match(/\+?[\d\s\-\(\)]+/);
                if (phoneMatch) {
                    connectedNumber = phoneMatch[0].replace(/\D/g, '');
                }
            }
        }
        
        console.log("📱 Número conectado detectado:", connectedNumber);
        return connectedNumber;
    } catch (error) {
        console.error("❌ Erro ao obter número conectado:", error);
        return null;
    }
}

// Função para detectar o número do telefone
function detectPhoneNumber() {
    try {
        // Tentar obter o número do WhatsApp Web
        const phoneElement = document.querySelector('[data-testid="phone-number"]') || 
                           document.querySelector('[title*="+"]') ||
                           document.querySelector('[aria-label*="+"]');
        
        if (phoneElement) {
            const phoneText = phoneElement.textContent || phoneElement.title || phoneElement.getAttribute('aria-label');
            const phoneMatch = phoneText.match(/\+?[\d\s\-\(\)]+/);
            if (phoneMatch) {
                warmupSystem.phoneNumber = phoneMatch[0].replace(/\D/g, '');
                console.log("📱 Número detectado:", warmupSystem.phoneNumber);
                updateWarmupPhoneDisplay();
            }
        }
    } catch (error) {
        console.error("❌ Erro ao detectar número:", error);
    }
}

// Função para iniciar o sistema de aquecimento
function startWarmupSystem(settings) {
    console.log("🔥 Iniciando sistema de aquecimento com configurações:", settings);
    
    warmupSystem.isActive = true;
    warmupSystem.settings = settings;
    warmupSystem.stats.startTime = Date.now();
    
    // Injetar script de monitoramento de mensagens
    injectWarmupScript();
    
    // Atualizar interface
    updateWarmupStatus();
    
    console.log("✅ Sistema de aquecimento iniciado");
}

// Função para parar o sistema de aquecimento
function stopWarmupSystem() {
    console.log("🔥 Parando sistema de aquecimento");
    
    warmupSystem.isActive = false;
    warmupSystem.settings = null;
    
    // Salvar estatísticas
    saveWarmupStats();
    
    // Atualizar interface
    updateWarmupStatus();
    
    console.log("✅ Sistema de aquecimento parado");
}

// Função para enviar mensagem de aquecimento para número específico
function sendWarmupMessageToNumber(number, message) {
    console.log(`📤 Enviando mensagem de aquecimento para ${number}: ${message}`);
    
    try {
        // Usar exatamente o sistema que já funciona
        const cleanNumber = number.replace(/\D/g, '');
        const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : '55' + cleanNumber;
        
        console.log(`📱 Número formatado: ${formattedNumber}`);
        
        // Usar sistema de envio híbrido - exatamente como o sistema atual
        if (typeof openNumber !== 'undefined') {
            // Abrir chat com número (sem mensagem para evitar duplicação)
            openNumber(formattedNumber, '').then(result => {
                console.log("✅ Chat aberto via openNumber:", result);
                
                // Aguardar um pouco para o chat abrir
                setTimeout(() => {
                    // Colar mensagem no campo de texto usando pasteMessage
                    pasteMessage(message);
                    
                    // Aguardar um pouco e clicar no botão de enviar
                    setTimeout(() => {
                        let send_message_btn = getDocumentElement('send_message_btn');
                        if (send_message_btn) {
                            send_message_btn.click();
                            console.log("✅ Mensagem enviada via método híbrido");
                        } else {
                            console.error("❌ Botão de enviar não encontrado");
                        }
                    }, 1000);
                }, 2000);
            }).catch(error => {
                console.error("❌ Erro no openNumber:", error);
            });
        } else {
            console.error("❌ Função openNumber não encontrada");
        }
        
    } catch (error) {
        console.error("❌ Erro ao enviar mensagem de aquecimento:", error);
    }
}

// Função para envio direto via WhatsApp Web
function sendDirectMessage(number, message) {
    console.log(`📤 Envio direto para ${number}: ${message}`);
    
    // Criar URL do WhatsApp Web
    const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
    
    // Abrir nova aba
    chrome.tabs.create({ url: url }, function(tab) {
        console.log("✅ Aba de envio criada:", tab.id);
        
        // Aguardar carregamento e fechar
        setTimeout(() => {
            chrome.tabs.remove(tab.id);
            console.log("✅ Aba fechada após envio");
        }, 8000); // Mais tempo para garantir envio
    });
}

// Função para injetar script de monitoramento
function injectWarmupScript() {
    const script = `
        // Sistema de monitoramento de mensagens para aquecimento
        (function() {
            console.log("🔥 Script de aquecimento injetado");
            
            // Função para verificar se deve responder
            function shouldRespond(phoneNumber, intervalMinutes) {
                const now = Date.now();
                const lastResponse = window.warmupLastResponseTime && window.warmupLastResponseTime.get(phoneNumber);
                
                if (!lastResponse) {
                    return true;
                }
                
                const timeDiff = now - lastResponse;
                const intervalMs = intervalMinutes * 60 * 1000;
                
                return timeDiff >= intervalMs;
            }
            
            // Função para obter resposta do vasco de conversas
            function getResponseFromBank(conversationType) {
                if (window.CONVERSATION_BANKS && window.CONVERSATION_BANKS[conversationType]) {
                    const bank = window.CONVERSATION_BANKS[conversationType];
                    const randomIndex = Math.floor(Math.random() * bank.responses.length);
                    return bank.responses[randomIndex];
                }
                
                // Fallback para respostas padrão
                const defaultResponses = [
                    "Olá! Como posso ajudar?",
                    "Obrigado pela mensagem!",
                    "Estou aqui para conversar!",
                    "Oi! Tudo bem?",
                    "Como você está?",
                    "Obrigado pelo contato!",
                    "Estou disponível!",
                    "Como posso ajudar hoje?"
                ];
                
                const randomIndex = Math.floor(Math.random() * defaultResponses.length);
                return defaultResponses[randomIndex];
            }
            
            // Função para enviar resposta
            function sendResponse(message) {
                try {
                    // Encontrar campo de mensagem
                    const messageInput = document.querySelector('[data-testid="conversation-compose-box-input"]') ||
                                       document.querySelector('[contenteditable="true"][data-tab="10"]') ||
                                       document.querySelector('div[contenteditable="true"][role="textbox"]');
                    
                    if (messageInput) {
                        // Limpar campo
                        messageInput.innerHTML = '';
                        
                        // Simular digitação
                        const event = new Event('input', { bubbles: true });
                        messageInput.textContent = message;
                        messageInput.dispatchEvent(event);
                        
                        // Encontrar botão de enviar
                        const sendButton = document.querySelector('[data-testid="send"]') ||
                                         document.querySelector('[data-icon="send"]') ||
                                         document.querySelector('button[aria-label*="Send"]');
                        
                        if (sendButton) {
                            setTimeout(() => {
                                sendButton.click();
                                console.log("✅ Resposta enviada:", message);
                            }, 1000 + Math.random() * 2000); // Delay aleatório entre 1-3 segundos
                        }
                    }
                } catch (error) {
                    console.error("❌ Erro ao enviar resposta:", error);
                }
            }
            
            // Monitorar mensagens recebidas
            function monitorMessages() {
                if (!window.WPP || !window.WPP.on) {
                    setTimeout(monitorMessages, 2000);
                    return;
                }
                
                window.WPP.on('chat.new_message', (message) => {
                    if (!message.id.fromMe && message.body) {
                        const phoneNumber = message.from.user;
                        console.log("📨 Nova mensagem recebida de:", phoneNumber);
                        
                        // Verificar se deve responder
                        const settings = window.warmupSettings;
                        if (settings && shouldRespond(phoneNumber, settings.interval)) {
                            // Verificar se o número está na lista de aquecimento
                            if (settings.numbers && settings.numbers.length > 0) {
                                const cleanNumber = phoneNumber.replace(/\D/g, '');
                                const isInWarmupList = settings.numbers.some(n => {
                                    const cleanN = n.replace(/\D/g, '');
                                    return cleanN === cleanNumber || cleanN.endsWith(cleanNumber) || cleanNumber.endsWith(cleanN);
                                });
                                
                                if (!isInWarmupList) {
                                    console.log("🚫 Número não está na lista de aquecimento:", phoneNumber);
                                    return;
                                }
                            }
                            
                            const response = getResponseFromBank(settings.conversationType);
                            sendResponse(response);
                            
                            // Atualizar tempo da última resposta
                            if (!window.warmupLastResponseTime) {
                                window.warmupLastResponseTime = new Map();
                            }
                            window.warmupLastResponseTime.set(phoneNumber, Date.now());
                            
                            // Notificar popup sobre nova resposta
                            chrome.runtime.sendMessage({
                                action: 'warmupResponseSent',
                                phoneNumber: phoneNumber,
                                message: response,
                                conversationType: settings.conversationType
                            });
                        }
                    }
                });
                
                console.log("👂 Monitor de mensagens ativo");
            }
            
            // Inicializar monitoramento
            setTimeout(monitorMessages, 3000);
            
        })();
    `;
    
    // Criar e injetar script
    const scriptElement = document.createElement('script');
    scriptElement.textContent = script;
    document.head.appendChild(scriptElement);
    
    // Remover script após injeção
    setTimeout(() => {
        scriptElement.remove();
    }, 1000);
}

// Função para atualizar status do aquecimento
function updateWarmupStatus() {
    chrome.storage.local.set({
        warmupStatus: {
            connected: warmupSystem.isActive,
            lastUpdate: new Date().toISOString()
        },
        warmupStats: {
            totalResponses: warmupSystem.stats.totalResponses,
            uniqueContacts: warmupSystem.stats.uniqueContacts.size,
            todayResponses: warmupSystem.stats.todayResponses,
            uptime: warmupSystem.stats.uptime
        }
    });
}

// Função para atualizar exibição do número
function updateWarmupPhoneDisplay() {
    chrome.runtime.sendMessage({
        action: 'updateWarmupPhone',
        phoneNumber: warmupSystem.phoneNumber
    });
}

// Função para salvar estatísticas
function saveWarmupStats() {
    if (warmupSystem.stats.startTime) {
        warmupSystem.stats.uptime = Math.floor((Date.now() - warmupSystem.stats.startTime) / 1000);
    }
    
    chrome.storage.local.set({
        warmupStats: {
            totalResponses: warmupSystem.stats.totalResponses,
            uniqueContacts: warmupSystem.stats.uniqueContacts.size,
            todayResponses: warmupSystem.stats.todayResponses,
            uptime: warmupSystem.stats.uptime
        }
    });
}

// Listener para mensagens do runtime
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'warmupResponseSent') {
        // Atualizar estatísticas
        warmupSystem.stats.totalResponses++;
        warmupSystem.stats.uniqueContacts.add(request.phoneNumber);
        
        // Verificar se é do dia atual
        const today = new Date().toDateString();
        const lastUpdate = localStorage.getItem('warmupLastUpdate');
        if (lastUpdate !== today) {
            warmupSystem.stats.todayResponses = 1;
            localStorage.setItem('warmupLastUpdate', today);
        } else {
            warmupSystem.stats.todayResponses++;
        }
        
        // Salvar estatísticas
        saveWarmupStats();
        
        console.log("📊 Estatísticas atualizadas:", warmupSystem.stats);
    }
});

    // Inicializar sistema de aquecimento quando o content script carregar
    initializeWarmupSystem();

function removeTooltip() {
    const tooltip = document.querySelector(".tooltip_main_container");
    if (tooltip) {
        tooltip.remove();
    }
}

function handleShowTooltip(element) {
    const parentElement = document.querySelector(element.query);
    if (parentElement) {
        parentElement.addEventListener("mouseover", () => {
            showTooltip({
                elementParentClass: element.query,
                text: element.text,
                positionTop: element.top,
                positionLeft: element.left,
                positionRight: element.right,
                positionBottom: element.bottom,
            });
        });
        parentElement.addEventListener("mouseout", () => {
            removeTooltip();
        });
    }
}