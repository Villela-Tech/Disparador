// ========================================
// VARIÁVEIS GLOBAIS DO MOTOR DE ENVIO
// ========================================
// Controle de parada de campanhas
var stop = false;
var cancelDelay;

// ========================================
// FUNÇÕES DE RESOLUÇÃO DE PROMISES
// ========================================
// Funções para resolver promises de envio de mensagens
var resolveSendMessageToNumber;
var rejectSendMessageToNumber;
var resolveSendMessageToGroup;
var resolveSendAttachmentsToNumber;

// ========================================
// CONTROLE DE PROMISES ATIVAS
// ========================================
// Map para controlar promises ativas por número
var activePromises = new Map();
var resolveSendAttachmentsToGroup;

// ========================================
// CONTROLE DE NÚMEROS INVÁLIDOS
// ========================================
// Array para armazenar números inválidos
var invalid_numbers = [];
var max_invalid_numbers_to_display = 8; // Máximo de números inválidos para exibir

// ========================================
// FUNÇÃO PRINCIPAL DO MOTOR DE ENVIO
// ========================================
// Função principal que gerencia todo o processo de envio de mensagens
async function messenger(numbers, message, time_gap, csv_data, customization, caption_customization, random_delay, batch_size, batch_gap, caption, send_attachment_first, campaign_type) {
    // Toca som de início de campanha
    playSound('campaign_start');

    // Registra eventos no Google Analytics
    trackSystemEvent('time_gap', time_gap);
    trackSystemEvent('batch_size', batch_size);
    trackSystemEvent('random_delay', random_delay);
    trackSystemEvent('batch_gap', batch_gap);

    // Inicializa relatório da campanha
    let report_rows = initializeReport(campaign_type);
    let sent_count = 0;
    let start_index = 0;

    // Prepara mensagens personalizadas se necessário
    let messages = customization ? await setMessages(message, csv_data, "text", numbers.length) : Array(numbers.length).fill(message);
    
    // Prepara legendas personalizadas se necessário
    let captions = isCaptionCustomisation(caption, csv_data) ? await setCaptions(caption, csv_data) : Array(numbers.length).fill(caption);
    
    // Obtém dados dos anexos
    let attachments = await getAttachmentsData();

    // Dados da campanha para processamento
    let campaign_data = {
        numbers, message, caption, time_gap, random_delay, batch_size, batch_gap,
        csv_data, customization, caption_customization, send_attachment_first, campaign_type
    };

    // Executa a campanha e obtém resultados
    let { report_rows: finalReport, sent_count: finalCount, total_time } = await executeCampaign(
        numbers, messages, captions, attachments, start_index, report_rows, sent_count, campaign_data
    );

    // Save final campaign report
    let curr_report = {
        rows: finalReport,
        start_time: new Date().getTime(),
        total_time: total_time,
        time_gap: time_gap,
        campaign_type: campaign_type,
        sent_count: finalCount
    };

    await updateDeliveryReports(numbers, message, curr_report);
    // chrome.storage.local.set({ 'attachmentsData': [] });
    campaignRunningIndex = null;

    // Send notification
    chrome.runtime.sendMessage({
        type: 'send_notification',
        title: 'Suas mensagens foram enviadas',
        message: 'Abra a extensão para baixar o relatório',
    });

    playSound('campaign_end');

    // Hide messenger popup
    hideMessengerPopup();
}

// Campaign Executor
async function executeCampaign(numbers, messages, captions, attachments, start_index, report_rows, sent_count, campaign_data) {
    let { time_gap, random_delay, batch_size, batch_gap, send_attachment_first, campaign_type } = campaign_data;
    let total_time = 0, remaining_time, delays = [];
    let total_numbers = numbers.length;
    let total_numbers_to_sent = (total_numbers - start_index);
    let not_sent_message_count = 0, not_sent_attachments_count = 0;
    invalid_numbers = [];

    for (let i = 0; i < numbers.length; i++) {
        let curr_time_gap = getTimeGap(i, batch_size, time_gap, random_delay, batch_gap);
        total_time += curr_time_gap;
        delays.push(curr_time_gap);
    }
    remaining_time = total_time;

    messanger_popup();

    for (let i = start_index; i < total_numbers; i++) {
        // Verificar se deve parar antes de cada iteração
        if (stop) {
            stop = false;
            break;
        }
        
        campaignRunningIndex = i;
        
        // Limpar estado anterior antes de processar nova mensagem
        clearMessageState();
        triggerEscape();
        await delay(500); // Pequeno delay para garantir que o escape foi processado

        let curr_number = campaign_type.includes('number') ? numbers[i].replace(/\D/g, '') : '';
        let curr_group_id = campaign_type.includes('group') ? numbers[i] : '';
        let curr_message = (messages.length >= i) ? messages[i] : '';
        let curr_caption = (captions.length >= i) ? captions[i] : '';
        let curr_delay = (delays.length >= i) ? Math.max(1, delays[i] - 1) * 1000 : 30000;

        let sending_to = campaign_type.includes('group') ? groupIdToName[curr_group_id] : curr_number;

        remaining_time -= delays[i];
        await updateMessengerProgressBar(sending_to, i, total_numbers, remaining_time, total_time, campaign_type);
        
        // Aplicar delay antes de processar a mensagem
        await delay(curr_delay);

        // Usa API ProSender para enviar mensagem - abre chat sem texto na URL
        let is_chat_opened = curr_number ? await openNumber(curr_number, '') : true;

        // Aguarda o WhatsApp Web carregar o chat e o campo de texto ficar disponível
        if (is_chat_opened && curr_number) {
            await delay(2000);
        }

        if (is_chat_opened) {
            if (send_attachment_first) {
                var { is_attachments_sent, comments: attachments_comments, error: attachments_error } = await handleAttachmentsSend(curr_number, curr_group_id, attachments, curr_caption, '-', true);
                var { is_message_sent, comments: message_comments, error: message_error } = await handleMessageSend(curr_number, curr_group_id, curr_message);
            } else {
                var { is_message_sent, comments: message_comments, error: message_error } = await handleMessageSend(curr_number, curr_group_id, curr_message);     
                // Delay importante: aguardar mensagem ser processada antes de enviar anexos (evita "não vai nem foto")
                if (attachments && attachments.length > 0) await delay(1500);
                var { is_attachments_sent, comments: attachments_comments, error: attachments_error } = await handleAttachmentsSend(curr_number, curr_group_id, attachments, curr_caption, is_message_sent);
            }
            
            // Aguardar um pouco após o envio para garantir que a mensagem foi processada
            await delay(1000);
        } else {
            var is_message_sent = curr_message ? 'NO' : '-';
            var is_attachments_sent = (attachments && attachments.length > 0) ? 'NO' : '-';
            var message_comments = 'Invalid Number; Tip: Please ensure that your number exists on WhatsApp!';
            var attachments_comments = '';
        }


        let final_comments = [message_comments, attachments_comments].filter(comment => comment.length > 0).join(' ; ');
        if (final_comments.length == 0) {
            final_comments = '-';
            sent_count++;
        }

        let final_error = [(message_error ? String(message_error) : ''), (attachments_error ? String(attachments_error) : '')].filter(err => err.length > 0).join(' ; ');
        if (final_error.length == 0) {
            final_error = '-';
        }

        report_rows.push([sending_to, is_message_sent, is_attachments_sent, final_comments, final_error]);

        // Track success / failed events
        if (is_message_sent != '-') {
            if (message_comments.length == 0) {
                trackSystemEvent('send_message_success_total');
            } else if (is_chat_opened) {
                not_sent_message_count++;
                trackSystemEvent('send_message_failed_total', message_comments);
            }
        }
        if (is_attachments_sent != '-') {
            if (attachments_comments.length == 0) {
                trackSystemEvent('send_attachments_success_total');
            } else if (is_chat_opened) {
                not_sent_attachments_count++;
                trackSystemEvent('send_attachments_failed_total', attachments_comments);
            }
        }
    }

    // Track complete campaign success / failed events
    if (messages.length > 0 && messages[0].length > 0) {
        if (not_sent_message_count == 0) 
            trackSystemEvent('send_message_complete_success');
        if (not_sent_message_count == total_numbers_to_sent) 
            trackSystemEvent('send_message_complete_failed')
    }
    
    if (attachments && attachments.length > 0) {
        if (not_sent_attachments_count == 0) 
            trackSystemEvent('send_attachments_complete_success');
        if (not_sent_attachments_count == total_numbers_to_sent) 
            trackSystemEvent('send_attachments_complete_failed')
    }

    // Ensure popup is closed when campaign execution completes
    hideMessengerPopup();

    return { report_rows, sent_count, total_time };
}

// Send Message or Attachments functions (código do lpkcglgkpkloheddkmehdapeclclnecm)
async function handleMessageSend(number, group_id, message) {
    if (message) {
        if (number) {
            return await sendMessageToNumberNew(number, message);
        }
        if (group_id) {
            return await sendMessageToGroup(group_id, message);
        }
    } else {
        return {
            is_message_sent: '-',
            comments: ''
        }
    }
}

async function sendMessageToNumber(number, message) {
    try {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let send_message_btn = getDocumentElement('send_message_btn');
                if (send_message_btn) {
                    // Em versões novas, o seletor pode retornar o <span> do ícone.
                    // Garantir clique no <button> ancestral quando existir.
                    const clickableBtn = send_message_btn.closest?.('button') || send_message_btn;
                    clickableBtn.click();
                    trackSuccess('send_message_to_number_success');
                    resolve({ is_message_sent: 'YES', comments: '' });
                } else {
                    resolve({
                        is_message_sent: 'NO',
                        comments: 'Issue with the number',
                        error: 'Send button is not found'
                    });
                }
            }, 1000);
        });
    } catch (e) {
        console.error('ERROR :: sendMessageToNumber :: ' + e);
        trackError('send_message_to_number_error', e);
        return {
            is_message_sent: 'NO',
            comments: 'Error while sending message to number',
            error: e
        }
    }
}

async function sendMessageToNumberNew(number, message) {
    try {
        let curr_chat_number = getCurrentChatNumber();
        number = curr_chat_number ? curr_chat_number : number;

        // Criar uma promise única para este número
        const promiseId = `${number}_${Date.now()}`;
        
        return new Promise((resolve, reject) => {
            // Armazenar a promise ativa
            activePromises.set(promiseId, { resolve, reject });
            
            // Configurar callbacks globais apenas se não houver outras promises ativas
            if (activePromises.size === 1) {
                resolveSendMessageToNumber = (payload) => {
                    // Resolver todas as promises ativas
                    for (let [id, promise] of activePromises) {
                        promise.resolve(payload);
                    }
                    activePromises.clear();
                };
                
                rejectSendMessageToNumber = async (payload) => {
                    // Fallback DOM: API Store falhou, usa paste + clique no botão enviar
                    console.log('[Sender] Fallback DOM ativado para:', number);
                    try {
                        const inputBox = getDocumentElement('input_message_div');
                        if (inputBox) {
                            inputBox.focus();
                            await new Promise(r => setTimeout(r, 300));
                            pasteMessage(message);
                            console.log('[Sender] Mensagem colada no input');
                        } else {
                            console.warn('[Sender] Input box não encontrado');
                        }
                    } catch(e) {
                        console.error('[Sender] Erro ao colar mensagem:', e);
                    }
                    const result = await sendMessageToNumber();
                    console.log('[Sender] Resultado do fallback:', result);
                    for (let [id, promise] of activePromises) {
                        promise.resolve(result);
                    }
                    activePromises.clear();
                };
            }

            // Disparar evento de envio
            window.dispatchEvent(new CustomEvent("ProSender::send-message", {
                detail: {
                    number: number,
                    message: message,
                    promiseId: promiseId
                }
            }));
            
            // Timeout de segurança para evitar promises pendentes
            setTimeout(() => {
                if (activePromises.has(promiseId)) {
                    activePromises.delete(promiseId);
                    resolve({
                        is_message_sent: 'NO',
                        comments: 'Timeout while sending message',
                        error: 'Message send timeout'
                    });
                }
            }, 10000); // 10 segundos de timeout
        });
    } catch (e) {
        console.error('ERROR :: sendMessageToNumberNew :: ' + e);
        trackError('send_message_to_number_new_error', e);
        return {
            is_message_sent: 'NO',
            comments: 'Error while sending message to number',
            error: e
        }
    }
}
async function sendMessageToGroup(group_id, message) {
    try {
        return new Promise((resolve, reject) => {
            resolveSendMessageToGroup = resolve;
            window.dispatchEvent(new CustomEvent("ProSender::send-message-to-group", {
                detail: { group_id: group_id, message: message }
            }));
        });
    } catch (e) {
        console.error("ERROR :: sendMessageToGroup :: " + e);
        trackError('send_message_to_group_error', e);
        return {
            is_message_sent: 'NO',
            comments: 'Error while sending the message to group',
            error: e
        }
    }
}

async function handleAttachmentsSend(number, group_id, attachments, caption, is_message_sent, wait_till_send = false) {
    if (is_message_sent === 'NO') {
        return {
            is_attachments_sent: 'NO',
            comments: '',
        }
    }
    else if (attachments && attachments.length > 0) {
        if (number) {
            return await sendAttachmentsToNumber(number, attachments, caption, wait_till_send);
        }
        if (group_id) {
            return await sendAttachmentsToGroup(group_id, attachments, caption, wait_till_send);
        }
    } else {
        return {
            is_attachments_sent: '-',
            comments: ''
        }
    }
}

async function sendAttachmentsToNumber(number, attachments, caption, wait_till_send) {
    try {
        let curr_chat_number = getCurrentChatNumber();
        number = curr_chat_number ? curr_chat_number : number;

        return new Promise((resolve, reject) => {
            resolveSendAttachmentsToNumber = resolve;

            window.dispatchEvent(new CustomEvent("ProSender::send-attachments", {
                detail: {
                    number: number,
                    attachments: attachments,
                    caption: caption,
                    waitTillSend: wait_till_send
                }
            }));
        })
    } catch (e) {
        console.error("ERROR :: sendAttachmentsToNumber :: " + e);
        trackError('send_attachments_to_number_error', e);
        return {
            is_attachments_sent: 'NO',
            comments: 'Error while sending the attachments to number',
            error: e
        }
    }
}

async function sendAttachmentsToGroup(group_id, attachments, caption, wait_till_send) {
    try {
        return await new Promise((resolve, reject) => {
            resolveSendAttachmentsToGroup = resolve;

            window.dispatchEvent(new CustomEvent("ProSender::send-attachments-to-group", {
                detail: {
                    attachments: attachments,
                    caption: caption,
                    groupId: group_id,
                    waitTillSend: wait_till_send
                }
            }));
        });
    } catch (e) {
        console.error("ERROR :: sendAttachmentsToGroup :: " + e);
        trackError('send_attachments_to_group_error', e);
        return {
            is_attachments_sent: 'NO',
            comments: 'Error while sending the attachments to group',
            error: e
        }
    }
}

// Open Number / Chat
async function openNumber(number, message = '', time_gap = 1) {
    try {
        const text = message ? encodeURIComponent(message) : '';
        let has_opened = await openNumberTab(`https://api.whatsapp.com/send?phone=${number}&text=${text}`); // Old Url

        if (!has_opened) {
            has_opened = await openNumberTab(`https://wa.me/${number}?text=${text}`); // New Url
        }

        if (!has_opened) {
            invalid_numbers.push(`+${number}`);
        } else {
            await delay(time_gap * 1000);
        }

        return has_opened;
    } catch (e) {
        console.error('ERROR :: openNumber :: ', e);
        trackError('open_number_error', e);
        return false;
    }
}

async function openNumberTab(link) {
    let linkElement = document.getElementById("whatsapp-message-sender");
    if (!linkElement) {
        linkElement = document.createElement("a");
        linkElement.id = "whatsapp-message-sender";
        document.body.append(linkElement);
    }

    linkElement.setAttribute("href", link);
    linkElement.click();

    return await hasChatOpened();
}

async function hasChatOpened() {
    return new Promise((resolve, reject) => {
        let is_chat_loading = false;
        let wait_time_ms = 0;

        let checkChatOpenedInterval = setInterval(() => {
            wait_time_ms += 100;

            const starting_chat_popup = getDocumentElement('starting_chat_popup');
            const invalid_chat_popup = getDocumentElement('invalid_chat_popup');

            if (starting_chat_popup || wait_time_ms >= 500) {
                is_chat_loading = true;
            }

            if (is_chat_loading) {
                if (invalid_chat_popup || wait_time_ms >= 10000) {
                    // Handle the invalid chat popup if it's displayed
                    const invalid_chat_ok_btn = getDocumentElement('invalid_popup_ok_btn');
                    if (invalid_chat_ok_btn) {
                        invalid_chat_ok_btn.click();
                    }

                    clearInterval(checkChatOpenedInterval);
                    resolve(false);
                } else if (!starting_chat_popup) {
                    clearInterval(checkChatOpenedInterval);
                    resolve(true);
                }
            }
        }, 100);
    });
}

function getCurrentChatNumber() {
    try {
        // Use current chat number if it's available
        let conversation_message_div = getDocumentElement('conversation_message_div');
        let number = null;
        if (conversation_message_div) {
            let curr_chat_id = conversation_message_div.dataset['id'];

            // O elemento pode não ter data-id (versões novas do WhatsApp usam data-testid)
            if (!curr_chat_id) return null;

            let parts = curr_chat_id.split("_");
            if (parts.length < 2) return null;

            let curr_chat_number = parts[1].split("@c.us")[0];
            if (curr_chat_number && curr_chat_number.length > 10) {
                number = curr_chat_number;
            }
        }
        return number;
    } catch (e) {
        return null;
    }
}

// Helper function to hide messenger popup
function hideMessengerPopup() {
    var messanger_popup_div = document.getElementsByClassName("messanger_popup")[0];
    if (messanger_popup_div) {
        messanger_popup_div.style.display = 'none';
    }
}

// Helper function to clear state between messages
function clearMessageState() {
    // Limpar promises ativas pendentes
    if (activePromises.size > 0) {
        for (let [id, promise] of activePromises) {
            promise.resolve({
                is_message_sent: 'NO',
                comments: 'Previous message state cleared',
                error: 'State cleared'
            });
        }
        activePromises.clear();
    }
    
    // Limpar callbacks globais
    resolveSendMessageToNumber = null;
    rejectSendMessageToNumber = null;
}

// Stop Campaign function
function stopCampaign() {
    stop = true;
    trackButtonClick('stop_campaign');
    cancelDelay();
    
    // Hide messenger popup when campaign is stopped
    hideMessengerPopup();
}

// Customization related function
function isCaptionCustomisation(caption, csv_data) {
    if (csv_data.length == 0) {
        return false;
    }
    const pattern = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;

    while ((match = pattern.exec(caption)) !== null) {
        matches.push(match[1].trim());
    }
    for (var j = 0; j < csv_data[0].length; j++) {
        if (!hasLeadingOrTrailingSpaces(csv_data[0][j])) {
            var variable = csv_data[0][j];
        }
        else {
            var variable = csv_data[0][j].trim();
        }
        if (matches.includes(variable)) {
            return true;
        }
    }
    return false;
}

async function setCaptions(caption, csv_data) {
    let captionArr = caption;
    let customisedArr = [];
    let customisedCaption;
    for (let i = 0; i < captionArr.length; i++) {
        customisedCaption = await setMessages([captionArr[i]], csv_data, "caption")
        customisedArr.push(customisedCaption);
    }
    finalArr = transposeArray(customisedArr);
    return finalArr;
}

async function setMessages(message, csv_data, purpose, numbers_length) {
    //start from here
    if (purpose == "text" && csv_data.length == 0) {
        let return_message = [];
        for (let i = 0; i < numbers_length; i++) {
            return_message.push(message);
        }
        return return_message;
    }
    var messages = [];
    
    // Encontrar o índice da coluna "Valor Divida"
    const valorDividaIndex = csv_data[0].findIndex(header => header === 'Valor Divida');
    
    for (var i = 1; i < csv_data.length; i++) {
        if (purpose == "caption") {
            var temp_message = message[0];
        }
        else {
            var temp_message = message;
        }
        for (var j = 0; j < csv_data[0].length; j++) {
            if (!hasLeadingOrTrailingSpaces(csv_data[0][j])) {
                var variable = csv_data[0][j];
            }
            else {
                var variable = csv_data[0][j].trim();
            }
            var curr_text = csv_data[i][j];
            
            // Se for a coluna Valor Divida, formatar o valor
            if (j === valorDividaIndex && curr_text) {
                curr_text = formatarValorMonetario(curr_text);
            }
            
            if (temp_message.includes('{{' + variable + '}}'))
                temp_message = temp_message.replaceAll('{{' + variable + '}}', curr_text);
        }
        messages.push(temp_message);
    }
    return messages;
}

function formatarValorMonetario(valor) {
    // Remove qualquer caractere que não seja número, ponto ou vírgula
    valor = valor.toString().replace(/[^\d.,]/g, '');
    
    // Se tiver vírgula, converte para ponto
    valor = valor.replace(',', '.');
    
    // Converte para número
    let numero = parseFloat(valor);
    
    // Se for um número válido, formata
    if (!isNaN(numero)) {
        return `R$ ${numero.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            style: 'decimal'
        })}`;
    }
    return valor; // Retorna o valor original se não conseguir formatar
}

// Messenger related popup's handling functions
async function messanger_popup() {
    var messanger_popup_div = document.getElementsByClassName("messanger_popup")[0];
    if (!messanger_popup_div) {
        // ultimate div
        var popup = document.createElement('div');
        popup.className = 'messanger_popup';

        // message sending div
        var sendingMessageDiv = document.createElement('div');
        sendingMessageDiv.className = 'message_being_sent'

        var campaignDiv = document.createElement('div');
        campaignDiv.className = 'did_you_know';

        var modal_content = document.createElement('div');
        modal_content.className = 'messanger_popup_content';

        sendingMessageDiv.appendChild(modal_content);

        modal_content.appendChild($($.parseHTML(`<div class="popup_text_title"><img style="width: 25px; height: 25px;" src=${email_icon_src}></img><p id="message_sending_popup_title" style="margin-left: 15px; font-weight: 700; font-size: 16px; line-height: 20.7px; align-items: center; ">Suas mensagens estão sendo enviadas</p></div>`))[0]);
        modal_content.appendChild($($.parseHTML(`<div class="messanger_time_bar_outline"><div class="messanger_time_bar" ></div></div>`))[0]);
        modal_content.appendChild($($.parseHTML(`<div class="messanger_sending"></div>`))[0]);

        let campaignButtons = document.createElement('div');
        campaignButtons.className = 'campaign_buttons';

        campaignButtons.innerHTML =
            `
            <div class="stop_campaign_button CtaBtn">
                <div class="circle"></div><p class="text">Parar Campanha</p>
            </div>
        `
        modal_content.appendChild(campaignButtons);

        popup.appendChild(sendingMessageDiv);
        popup.appendChild(campaignDiv);

        var body = document.querySelector('body');
        body.appendChild(popup);
        modal_content.appendChild($($.parseHTML('<span id="close_edit1" style="position: absolute;top: 12px;right: 12px;font-size: 20px;width:14px"><img class="CtaCloseBtn" src="' + close_img_src + '" style="width: 100%;" alt="x"></span>'))[0]);
        document.getElementById("close_edit1").addEventListener("click", function (event) {
            hideMessengerPopup();
        });
        document.querySelector('.stop_campaign_button').addEventListener("click", stopCampaign);
    }
    else
        messanger_popup_div.style.display = 'block';

    document.getElementById('message_sending_popup_title').innerText = 'Suas mensagens estão sendo enviadas';
}

async function updateMessengerProgressBar(sending_to, index, total_numbers, remaining_time, total_time, campaign_type) {
    let messanger_sending = document.getElementsByClassName("messanger_sending")[0];
    if (messanger_sending) {
        messanger_sending.innerHTML = '';

        let sending_to_text = campaign_type.includes('group') ? sending_to : `+${sending_to}`
        let currently_sending_to_html = `<div id="currently_sending_to" style="">Enviando para :  <strong style="padding: 0px 12px;" class="currently_sending_number">${sending_to_text}</strong>  ( ${index + 1} de ${total_numbers} )</div>`;
        
        let invalid_number_list = invalid_numbers.slice(0, max_invalid_numbers_to_display).join(', ') + (invalid_numbers.length > max_invalid_numbers_to_display ? ', ... + ' + parseInt(invalid_numbers.length - max_invalid_numbers_to_display) + ' mais' : '');
        let invalid_number_error_html = `<div id="invalid_number_error" style="display: ${invalid_numbers.length === 0 ? 'none' : 'flex'};"><p class="header"><img src=${error_icon_src} style="width: 17px; height: 17px"/><span style="font-weight: 700;">Número(s) inválido(s) encontrado(s) :</span></p><p id="invalid_number_list">${invalid_number_list}</p><p class="footer">${await translate("Por favor, verifique o relatório de entrega após o término da campanha.")}</p></div>`;

        messanger_sending.appendChild($($.parseHTML(currently_sending_to_html))[0]);
        messanger_sending.appendChild($($.parseHTML(invalid_number_error_html))[0]);
    }

    let messanger_time_bar = document.getElementsByClassName("messanger_time_bar")[0];
    if (messanger_time_bar) {
        // Limpa qualquer intervalo anterior se existir
        if (window.timeUpdateInterval) {
            clearInterval(window.timeUpdateInterval);
        }

        let current_remaining_time = remaining_time;
        
        const updateTimeDisplay = () => {
            if (!messanger_time_bar) return;
            
            messanger_time_bar.innerHTML = '';
            let remaining_bar = (index == 0) ? 0 : (1 - (current_remaining_time / total_time)) * 100;
            let hours = Math.floor(current_remaining_time / 3600);
            let mins = (Math.ceil(current_remaining_time / 60) % 60);
            let seconds = Math.floor(current_remaining_time % 60);
            
            let remaining_time_str;
            if (index + 1 === total_numbers) {
                remaining_time_str = "Finalizando envio...";
            } else if (current_remaining_time < 60) {
                remaining_time_str = `Aproximadamente ${seconds} segundos restantes`;
            } else {
                remaining_time_str = "Aproximadamente " + 
                    ((hours > 0) ? (hours + ((hours > 1) ? " horas " : " hora ")) : "") + 
                    mins + ((mins > 1) ? " minutos " : " minuto ") + 
                    "restantes";
            }

            let remaining_time_text_html = `<div style="width: 400px;color: #fff;position: absolute;text-align: center;font-weight: normal;font-size: 12px;padding: 4px;">${remaining_time_str}</div>`;
            let remaining_time_bar_html = `<div style="width: ${remaining_bar}%;background: #357A71;height: 100%;border-radius: 16px;"></div>`;
            messanger_time_bar.appendChild($($.parseHTML(remaining_time_text_html))[0]);
            messanger_time_bar.appendChild($($.parseHTML(remaining_time_bar_html))[0]);

            current_remaining_time--;
            if (current_remaining_time < 0) {
                clearInterval(window.timeUpdateInterval);
            }
        };

        // Atualiza imediatamente a primeira vez
        updateTimeDisplay();

        // Configura o intervalo para atualizar a cada segundo
        if (current_remaining_time > 0) {
            window.timeUpdateInterval = setInterval(updateTimeDisplay, 1000);
        }
    }
}

async function updateDeliveryReports(numbers, message, curr_report) {
    let [reports, campaigns, templates] = await new Promise((resolve) => {
        chrome.storage.local.get(['deliveryReports', 'campaigns', 'templates'], (res) => {
            let reports = res.deliveryReports || [];
            let campaigns = res.campaigns || [];
            let templates = res.templates || [];
            resolve([reports, campaigns, templates]);
        });
    });
    
    if (reports.length >= 10) reports.shift(1);

    let [campaign_name, template_name] = await new Promise((resolve) => {
        let campName = null, tempName = null;
        let numbers_str = numbers.join(",");
        campaigns.forEach(campaign => {
            if (campaign.numbers == numbers_str) {
                campName = campaign.name;
            }
        })
        templates.forEach(template => {
            if (template.message == message) {
                tempName = template.name;
            }
        })
        resolve([campName, tempName]);
    });

    let { rows, start_time, campaign_type, sent_count, total_time, time_gap } = curr_report;

    // Formatar a data no padrão brasileiro
    let last_run_str = new Date(start_time).toLocaleString("pt-BR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Criar cabeçalho com informações da campanha
    let header_rows = [
        ["INFORMAÇÕES DA CAMPANHA"],
        ["Data do Envio", last_run_str],
        ["Nome da Campanha", campaign_name || "Campanha " + (reports.length + 1)],
        ["Tipo de Campanha", campaign_type.includes('group') ? "Grupos" : "Números"],
        ["Nome do Template", template_name || "-"],
        ["Resumo do Envio", `${sent_count} mensagens enviadas de ${numbers.length}`],
        [""], // Linha em branco para separação
        ["RELATÓRIO DETALHADO DE ENVIOS"]
    ];

    // Adicionar cabeçalho do relatório detalhado
    let detail_header = (campaign_type.includes('group'))
        ? ["Nome do Grupo", "Mensagem Entregue?", "Anexos Entregues?", "Observações", "Erro"]
        : ["Número do WhatsApp", "Mensagem Entregue?", "Anexos Entregues?", "Observações", "Erro"];
    header_rows.push(detail_header);

    // Processar as linhas de dados (excluindo o cabeçalho original)
    let data_rows = rows.slice(1).map(row => {
        return row.slice(0, 5).map(cell => {
            if (cell === 'YES') return 'SIM';
            if (cell === 'NO') return 'NÃO';
            return cell;
        });
    });

    // Combinar todas as linhas
    let final_rows = [...header_rows, ...data_rows];

    let csv_data = serizalize_csv_rows(final_rows);
    reports.push({
        'name': campaign_name,
        'date': start_time,
        'data': csv_data,
    });

    await chrome.storage.local.set({ deliveryReports: reports });
    campaign_end_popup(reports, sent_count, numbers.length, total_time, time_gap);
}

function serizalize_csv_rows(rows) {
    return "data:text/csv;charset=utf-8," + rows.map(row => {
        if (row.length === 1) {
            // Cabeçalhos de seção em maiúsculas
            return `"${row[0]}"`;
        }
        return row.map(col => {
            if (col === undefined || col === null) return '""';
            // Garantir que números de telefone sejam tratados como texto
            if (/^\+?\d+$/.test(col)) return `"${col}"`;
            // Escapar aspas duplas e envolver em aspas
            return `"${col.toString().replace(/"/g, '""')}"`;
        }).join(",");
    }).join("\n");
}

async function campaign_end_popup(reports, sent_count, total_numbers, total_time_taken, time_gap) {
    let popup = document.getElementById('campaign_end_popup');
    if (popup) {
        popup.parentElement.removeChild(popup);
    }

    total_time_taken = Math.ceil(total_time_taken / 60);
    let last_report = reports[reports.length - 1];

    // Last Report Name and URI
    let reportDataURI = encodeURI(last_report.data);
    let reportDownloadDate = getReportDateFormat(last_report.date, true);
    let reportName = last_report.name || "Campaign " + reports.length;
    let reportDownloadName = `${reportName} ${reportDownloadDate}.csv`;

    const messageSentDiv = `
    <div class='message_send_div'>
        <div class='message_send_text' style='color: #fff'>
            <img style='width: 50px; height: 50px' src=${read_icon_src}></img>
            <p style='font-weight: 700; font-size: 20px; line-height: 25.88px'>
                ${'Sua campanha foi concluída'}
            </p>
        </div>
        <span id="campaign_end_popup_close" style="position: absolute;top: 12px;right: 12px;font-size: 20px;width:14px; z-index: 1000"><img class="CtaCloseBtn" src=${close_img_src} style="width: 100%;" alt="x"></span>
    </div>
    <div class='campaign_info_div'>
        <div style='display: flex; margin: 0 auto'>
            <div class='campaign_info'>
                <div class='campaign_info_text'>
                    <p><span class='campaign_name'>${reportName}</span> : Enviado para <span class='numbers_message_sent_to num_of_numbers'>${sent_count}</span> números de um total de ${' '} <span class='total_numbers num_of_numbers'>${total_numbers}</span></p>
                    <p>${'Tempo aproximado'} : <span class='approx_time num_of_numbers'>${total_time_taken}</span> ${total_time_taken > 1 ? 'minutos' : 'minuto'}</p>
                </div>
                <div class='download_campaign_report'>
                    <p>${'Confira nosso novo relatório de entrega'} : ${' '}</p>
                    <a class='download_report_button CtaBtn' href=${reportDataURI} download="${reportDownloadName}">
                        Baixar Relatório de Entrega
                    </a>
                </div>
            </div>
        </div>
    </div>
    `;

    popup = document.createElement('div');
    popup.className = 'campaign-end trial_popup';
    popup.id = 'campaign_end_popup';
    popup.innerHTML = messageSentDiv;
    document.body.appendChild(popup);

    // adding google analytics
    document.querySelector('.download_report_button').addEventListener('click', () => {
        trackButtonClick('download_delivery_report_campaign_end')
    })

    let closeButton = document.getElementById('campaign_end_popup_close');
    closeButton.addEventListener('click', () => {
        popup.parentElement.removeChild(popup);
        trackCloseButtonClick('campaign_end_popup_close');
    });

    chrome.storage.local.get(['campaignNumber'], function (res) {
        if (res.campaignNumber == null || res.campaignNumber == undefined || !res.campaignNumber) {
            chrome.storage.local.set({ 'campaignNumber': 1 });
        } else {
            chrome.storage.local.set({ 'campaignNumber': res.campaignNumber + 1 });
        }
    })
    trackButtonView('campaign_end_popup');
}

// Scheduled Campaigns
async function handleScheduleCampaigns() {
    chrome.storage.local.get(['scheduled_campaigns'], async function (result) {
        let scheduled_campaigns = result.scheduled_campaigns || [];
        for (let i = 0; i < scheduled_campaigns.length; i++) {
            let isScheduledWithin24Hours = false;
            let campaign_date = scheduled_campaigns[i].campaign_date;
            let scheduled_time = scheduled_campaigns[i].schedule_time;
            isScheduledWithin24Hours = isWithin24Hours(campaign_date, scheduled_time);

            if (scheduled_campaigns[i].hasBeenScheduled == true || !isScheduledWithin24Hours) {
                continue;
            }
            let { numbers, groups, message, time_gap, csv_data, customization, schedule_time, random_delay, batch_size, batch_gap, caption, caption_customization, attachmentsData } = scheduled_campaigns[i];
            const timeOutId = await schedule_message(numbers, groups, message, time_gap, csv_data, customization, caption_customization, schedule_time, random_delay, batch_size, batch_gap, caption, attachmentsData);
            scheduled_campaigns[i].hasBeenScheduled = true;
            scheduled_campaigns[i].timeOutId = timeOutId;
        }
        chrome.storage.local.set({ scheduled_campaigns: scheduled_campaigns });
    });
}

async function schedule_message(numbers, groups, message, time_gap, csv_data, customization, caption_customization, schedule_time, random_delay, batch_size, batch_gap, caption, attachmentsData) {
    var stime = schedule_time.split(":");
    var time12 = ((stime[0] % 12).toString()) + ":" + stime[1] + ((stime[0] < 12) ? 'AM' : 'PM');

    // Send notification
    chrome.runtime.sendMessage({
        type: 'send_notification',
        title: 'Your campaign has been scheduled for ' + time12,
        message: 'Open the extension to view all scheduled campaigns.',
    });

    var ctime = new Date();
    var interval_time = ((Number(stime[0]) - ctime.getHours()) * 60 + (Number(stime[1]) - ctime.getMinutes()) + 1440) % 1440;
    const timeOutId = setTimeout(() => {
        chrome.storage.local.get(['scheduled_campaigns'], async function (result) {
            let scheduled_campaigns = result.scheduled_campaigns || [];
            if (scheduled_campaigns.length > 0)
                scheduled_campaigns.shift();
            chrome.storage.local.set({ scheduled_campaigns: scheduled_campaigns });
        });
        // pass the groups instead of numbers 
        if (numbers == null || numbers == undefined || numbers.length == 0)
            messenger(groups, message, time_gap, csv_data, customization, caption_customization, random_delay, batch_size, batch_gap, caption, 'Scheduled_group', null, null, null);
        else
            messenger(numbers, message, time_gap, csv_data, customization, caption_customization, random_delay, batch_size, batch_gap, caption, 'Scheduled_number', null, null, null);
    }, interval_time * 60000);

    return timeOutId;
}

// ===== Utility functions =====

// Messenger related utilities
async function delay(ms) {
    if (ms == 0) return;
    
    return new Promise(resolve => {
        const timeoutId = setTimeout(resolve, ms);
        
        // Armazenar função de cancelamento
        cancelDelay = () => {
            clearTimeout(timeoutId);
            resolve();
        };
    });
}

function initializeReport(campaign_type) {
    let report_header = (campaign_type.includes('group'))
        ? ["Nome do Grupo", "Mensagem Entregue?", "Anexos Entregues?", "Observações", "Erro"]
        : ["Número do WhatsApp", "Mensagem Entregue?", "Anexos Entregues?", "Observações", "Erro"];
    return [report_header];
}

function getTimeGap(index, batch_size, time_gap, random_delay, batch_gap) {
    if (index == 0)
        return 1;
    if (batch_size && (index % batch_size) == 0)
        return batch_gap;
    if (random_delay)
        return getRandomNumber(3, 10);
    return time_gap;
}

async function getAttachmentsData() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['attachmentsData'], (res) => {
            resolve(res.attachmentsData || []);
        });
    });
}

function triggerEscape() {
    var event = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        charCode: 27
    });
    document.dispatchEvent(event);
}

function transposeArray(arr) {
    const numRows = arr[0].length;
    const numCols = arr.length;
    const transposedArray = [];
    for (let i = 0; i < numRows; i++) {
        const newRow = [];
        for (let j = 0; j < numCols; j++) {
            newRow.push(arr[j][i]);
        }
        transposedArray.push(newRow);
    }
    return transposedArray;
}

function playSound(songName) {
    try {
        let source = chrome.runtime.getURL(`sounds/${songName}.mp3`);
        let audio = new Audio(source);
        audio.play();
        audio.onerror = function() {
            console.error(`Failed to play sound: ${songName}`);
        };
    } catch (e) {
        console.error(`Error while playing sound: ${songName}`);
    }
}