// ========================================
// VARIÁVEIS GLOBAIS DA EXTENSÃO
// ========================================

// Dados da planilha Excel/CSV carregada
var csv_data = [], csv_name = "", 

// Informações do usuário e plano
my_number = null, plan_type = 'Expired', last_plan_type = 'Expired', customer_email, popup_numbers = "";

// Configurações de idioma
let currentLanguage = 'default';
let allLanguageCodes = ALL_LANGUAGE_CODES;

// Biblioteca de formatação de telefones
let libphone = libphonenumber;

// Informações de localização
let country_info = "";

// Arrays para grupos, contatos e seleções
let allGroups = [], allContacts = [], groups_selected = [], contacts_selected = [], 

// Configurações de interface
messageToggleSwitchValue = "numbers", isMultipleAccount = true, 

// Números de exemplo para demonstração
otherNumbers = [
    '+551111111111', '+552222222222', '+553333333333',
    '+551111111111', '+552222222222', '+553333333333',
    '+551111111111', '+552222222222', '+553333333333',
    '+551111111111', '+552222222222', '+553333333333',
    '+551111111111', '+552222222222', '+553333333333',
    '+551111111111', '+552222222222', '+553333333333',
    '+551111111111', '+552222222222', '+553333333333',
    '+551111111111', '+552222222222', '+553333333333'
], 

// Configurações adicionais
parentEmail = "", showAllMultNumbers = true;
let subscribed_date = null;

// Objetos de funcionalidades (anexos, grupos, personalização)
let attachment_obj = false, group_obj = false, customization_obj = false;

// Objetos de tradução para diferentes seções
let translatedSendObj, translatedGroupMsgObj, translatedCustomObj, translatedAttachments, translatedContactMsgObj;

// Controle de interface e scroll
let lastScrollPosition = 0, lastScrollPosition_contacts = 0, selectedAll = false, fetching = false;

// Informações de localização padrão
let location_info = { name: 'international', name_code: "US", currency: "USD" };

// ========================================
// DETECÇÃO DE SISTEMA OPERACIONAL
// ========================================
// Verifica se o usuário está no Mac ou Linux para ajustes específicos
let isMac = navigator.platform.toLowerCase().includes("mac");
let isLinux = navigator.platform.toLowerCase().includes("linux");

// ========================================
// CONFIGURAÇÃO INICIAL DO MAC
// ========================================
// Sair do modo tela cheia no Mac para melhor experiência
chrome.windows.getCurrent().then(window => {
    if (window.state === 'fullscreen' && isMac) {
        chrome.windows.update(window.id, { state: 'normal' });
    } 
});

// ========================================
// SISTEMA DE VERIFICAÇÃO DE ATIVAÇÃO
// ========================================
// Variável para controlar se a extensão está ativada
let isExtensionActivated = false;

// ========================================
// VERIFICAÇÃO DE STATUS DE ATIVAÇÃO
// ========================================
// Função que verifica se a extensão está ativada
function checkActivationStatus() {
    chrome.runtime.sendMessage({type: 'check_activation'}, function(response) {
        if (response && response.status) {
            // Considera válido tanto 'Ativado' quanto 'Trial'
            isExtensionActivated = (response.status === 'Ativado' || response.status === 'Trial');
            
            if (isExtensionActivated) {
                if (response.status === 'Trial') {
                    console.log("🧪 Extensão em período de teste - liberando funcionalidades");
                    showTrialStatus();
                } else {
                    console.log("✅ Extensão ativada - liberando funcionalidades");
                    // Remover barra de trial se existir
                    $('#trial-status-bar').remove();
                    // Remover botão flutuante se existir
                    $('#floating-activation-button').remove();
                }
                enableAllFeatures();
            } else {
                console.log("❌ Extensão não ativada - bloqueando funcionalidades");
                disableAllFeatures();
                showActivationModal();
            }
        } else {
            console.log("❌ Status de ativação não encontrado");
            disableAllFeatures();
            showActivationModal();
        }
    });
}

// ========================================
// EXIBIÇÃO DO STATUS DE TRIAL
// ========================================
// Função que mostra o status do período de teste
function showTrialStatus() {
    chrome.storage.local.get(['statusApp'], function(result) {
        if (result.statusApp && result.statusApp.activation === 'Trial') {
            const today = new Date();
            const expiration = new Date(result.statusApp.dateValidity.split('/').reverse().join('-'));
            const daysLeft = Math.ceil((expiration - today) / (1000 * 60 * 60 * 24));
            
            // Criar barra de status do trial no topo
            createTrialStatusBar(daysLeft, result.statusApp);
        }
    });
}

// ========================================
// CRIAÇÃO DA BARRA DE STATUS DO TRIAL
// ========================================
function createTrialStatusBar(daysLeft, trialData) {
    // Remover barra anterior se existir
    $('#trial-status-bar').remove();
    
    const statusBarHtml = `
        <div id="trial-status-bar" class="trial-status-bar" style="
            background: #FFA500;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            margin-bottom: 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: 'PT Sans Caption', sans-serif;
        ">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">🧪</span>
                <div>
                    <div style="font-weight: bold; font-size: 14px;">Teste</div>
                    <div style="font-size: 12px; opacity: 0.9;">${daysLeft} ${daysLeft === 1 ? 'dia restante' : 'dias restantes'}</div>
                </div>
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
                →
            </div>
        </div>
    `;
    
    // Inserir no início do conteúdo principal
    $('#popup_functionality').prepend(statusBarHtml);
    
    // Mostrar botão flutuante de ativação
    showFloatingActivationButton();
    
    // Event listener para clicar na barra
    $('#trial-status-bar').click(function() {
        createTrialDetailsModal(daysLeft, trialData);
    });
}

// ========================================
// EXIBIÇÃO DO BOTÃO FLUTUANTE DE ATIVAÇÃO
// ========================================
function showFloatingActivationButton() {
    // Remover botão anterior se existir
    $('#floating-activation-button').remove();
    
    const buttonHtml = `
        <div id="floating-activation-button" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            animation: float 3s ease-in-out infinite;
        ">
            <button class="CtaBtn" style="
                background: #25D366;
                color: white;
                border: none;
                padding: 15px 25px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: 'PT Sans Caption', sans-serif;
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            ">
                <span style="font-size: 18px;">🔑</span>
                <span>Ativar Licença</span>
            </button>
        </div>
        
        <style>
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3); }
                50% { box-shadow: 0 4px 25px rgba(37, 211, 102, 0.6); }
                100% { box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3); }
            }
            
            #floating-activation-button button:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
            }
        </style>
    `;
    
    $('body').append(buttonHtml);
    
    // Event listener para o botão
    $('#floating-activation-button button').click(function() {
        showKeyInputModal();
    });
}

// ========================================
// MODAL DE ATIVAÇÃO DO TRIAL
// ========================================
function showTrialActivationModal(trialData) {
    // Remover modal anterior se existir
    $('#trial-activation-modal').remove();
    
    const modalHtml = `
        <div id="trial-activation-modal" class="trial-activation-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div class="trial-activation-content" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                <h2 style="color: #25D366; margin-bottom: 15px;">Ativação Concluída!</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #25D366;">
                    <h3 style="color: #333; margin-bottom: 15px;">Detalhes da Licença:</h3>
                    
                    <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                        <strong>Chave:</strong> ${trialData.key}
                    </div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                        <strong>Data de Ativação:</strong> ${trialData.dateActivation}
                    </div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                        <strong>Data de Expiração:</strong> ${trialData.dateValidity}
                    </div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                        <strong>Duração Total:</strong> 3 dias
                    </div>
                    <div style="font-size: 14px; color: #666;">
                        <strong>Dias Restantes:</strong> 3 dias
                    </div>
                </div>
                
                <div style="background: #25D366; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <div style="font-size: 16px; font-weight: bold;">🎉 Parabéns! Sua extensão está ativa e todas as funcionalidades foram liberadas.</div>
                </div>
                
                <button id="close-trial-activation" style="
                    background: #25D366;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    font-weight: bold;
                ">Entendi</button>
                
                <div style="font-size: 12px; color: #666; margin-top: 15px;">
                    💡 <strong>Dica:</strong> Sua licença será verificada automaticamente a cada 5 minutos
                </div>
            </div>
        </div>
    `;
    
    $('body').append(modalHtml);
    
    // Event listener para fechar o modal
    $('#close-trial-activation').click(function() {
        $('#trial-activation-modal').hide();

        // Atualiza o plan_type no storage (equivalente ao setStatusActivated do background)
        chrome.storage.local.get(['statusApp'], function(result) {
            if (result.statusApp) {
                var planType = result.statusApp.activation === 'Trial' ? 'Trial' : 'Ativado';
                chrome.storage.local.set({ plan_type: planType });
            }
        });

        chrome.runtime.sendMessage({ type: 'extension_trial_started' });
        send_notification('Período de Teste Iniciado', 'Você tem 3 dias de acesso gratuito.');
        
        // Recarregar interface
        setTimeout(function() {
            checkActivationStatus();
        }, 500);
    });
}

// ========================================
// CRIAÇÃO DO MODAL DE DETALHES DO TRIAL
// ========================================
function createTrialDetailsModal(daysLeft, trialData) {
    // Remover modal anterior se existir
    $('#trial-details-modal').remove();
    
    const modalHtml = `
        <div id="trial-details-modal" class="trial-details-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div class="trial-details-content" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🧪</div>
                <h2 style="color: #333; margin-bottom: 15px;">Período de Teste Ativo</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFA500;">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px; color: #FFA500;">${daysLeft}</div>
                    <div style="font-size: 16px; margin-bottom: 15px; color: #666;">${daysLeft === 1 ? 'dia restante' : 'dias restantes'}</div>
                    
                    <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                        <strong>Iniciado em:</strong> ${trialData.dateActivation}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        <strong>Expira em:</strong> ${trialData.dateValidity}
                    </div>
                </div>
                
                <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
                    Você tem acesso completo a todas as funcionalidades do Sender por <strong>${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}</strong>!
                </p>
                
                <div style="margin-bottom: 25px;">
                    <button id="activate-now-trial" class="CtaBtn" style="
                        background: #25D366;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                        margin-bottom: 10px;
                    ">🔑 Ativar Licença</button>
                    <button id="contact-support-trial" style="
                        background: #25D366;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                        margin-bottom: 10px;
                    ">💬 Falar no Chat</button>
                </div>
                
                <button id="activate-later-trial" style="
                    background: #ccc;
                    color: #333;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">Fechar</button>
            </div>
        </div>
    `;
    
    $('body').append(modalHtml);
    
    // Event listeners para o modal
    $('#activate-now-trial').click(function() {
        $('#trial-details-modal').hide();
        showKeyInputModal();
    });
    
    $('#contact-support-trial').click(function() {
        $('#trial-details-modal').hide();
        // Abrir WhatsApp para suporte
        const phoneNumber = "555194981842";
        const message = "Olá! Gostaria de ativar minha licença mensal do Sender.";
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
    
    $('#activate-later-trial').click(function() {
        $('#trial-details-modal').hide();
    });
}

// ========================================
// HABILITAÇÃO DE TODAS AS FUNCIONALIDADES
// ========================================
// Função que habilita todos os botões e funcionalidades
function enableAllFeatures() {
    // Habilitar botão de envio
    $('#sender').prop('disabled', false).removeClass('disabled');
    
    // Habilitar botão de agendamento
    $('#schedule').prop('disabled', false).removeClass('disabled');
    
    // Habilitar upload de arquivos
    $('#file-input').prop('disabled', false);
    
    // Habilitar campos de entrada
    $('#numbers-input').prop('disabled', false);
    $('#message').prop('disabled', false);
    
    // Remover botão de contato
    $('#contact-button-main').remove();
    
    // Esconder modais se estiverem visíveis
    $('#activation-modal').hide();
    $('#contact-modal').hide();
    
    // Banner de status já inclui as informações de ativação
    
    // Mostrar status de ativado
    showActivationStatus('Ativado');
}

// ========================================
// DESABILITAÇÃO DE TODAS AS FUNCIONALIDADES
// ========================================
// Função que desabilita todos os botões e funcionalidades
function disableAllFeatures() {
    // Desabilitar botão de envio
    $('#sender').prop('disabled', true).addClass('disabled');
    
    // Desabilitar botão de agendamento
    $('#schedule').prop('disabled', true).addClass('disabled');
    
    // Desabilitar upload de arquivos
    $('#file-input').prop('disabled', true);
    
    // Desabilitar campos de entrada
    $('#numbers-input').prop('disabled', true);
    $('#message').prop('disabled', true);
    
    // Adicionar botão de contato se não existir
    addContactButton();
    
    // Mostrar status de não ativado
    showActivationStatus('Não Ativado');
}

// ========================================
// EXIBIÇÃO DOS DETALHES DO STORAGE
// ========================================
// Função que exibe detalhes da ativação a partir do storage
function showActivationDetailsFromStorage() {
    chrome.storage.local.get(['statusApp'], function(result) {
        if (result.statusApp && result.statusApp.activation === 'Ativado') {
            const activationData = result.statusApp;
            
            // Calcular dias
            const today = new Date();
            const expiration = new Date(activationData.dateValidity.split('/').reverse().join('-'));
            const daysLeft = Math.ceil((expiration - today) / (1000 * 60 * 60 * 24));
            
            // Calcular duração total
            const activation = new Date(activationData.dateActivation.split('/').reverse().join('-'));
            const totalDays = Math.ceil((expiration - activation) / (1000 * 60 * 60 * 24));
            
            // Mostrar modal
            showActivationDetails(activationData, totalDays);
        }
    });
}

// ========================================
// ADIÇÃO DO BOTÃO DE CONTATO
// ========================================
// Função que adiciona botão de contato na interface
function addContactButton() {
    // Remover botão anterior se existir
    $('#contact-button-main').remove();
    
    // Adicionar botão de contato
    const contactButton = `
        <div id="contact-button-main" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
        ">
            <button id="contact-main-button" style="
                background: linear-gradient(135deg, #25D366, #1ea952);
                color: white;
                border: none;
                padding: 16px 24px;
                border-radius: 50px;
                font-size: 14px;
                cursor: pointer;
                box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: bold;
                transition: all 0.3s ease;
                animation: pulse-gentle 2s infinite;
                border: 2px solid rgba(255, 255, 255, 0.2);
            ">
                <span style="font-size: 16px;">🔑</span>
                <span>Ativar Licença</span>
            </button>
        </div>
        
        <style>
            @keyframes pulse-gentle {
                0% {
                    transform: scale(1);
                    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 8px 25px rgba(37, 211, 102, 0.6);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
                }
            }
        </style>
    `;
    
    $('body').append(contactButton);
    
    // Event listener para o botão
    $('#contact-main-button').click(function() {
        showContactModal();
    });
    
    // Adicionar efeito hover
    $('#contact-main-button').hover(
        function() {
            $(this).css({
                'transform': 'scale(1.1)',
                'box-shadow': '0 10px 30px rgba(37, 211, 102, 0.7)',
                'background': 'linear-gradient(135deg, #1ea952, #25D366)'
            });
        },
        function() {
            $(this).css({
                'transform': 'scale(1)',
                'box-shadow': '0 6px 20px rgba(37, 211, 102, 0.4)',
                'background': 'linear-gradient(135deg, #25D366, #1ea952)'
            });
        }
    );
}

// ========================================
// EXIBIÇÃO DO MODAL DE ATIVAÇÃO
// ========================================
// Função que exibe o modal de ativação
function showActivationModal() {
    // Criar modal se não existir
    if ($('#activation-modal').length === 0) {
        createActivationModal();
    }
    
    $('#activation-modal').show();
}

// ========================================
// EXIBIÇÃO DO MODAL DE CONTATO
// ========================================
// Função que exibe o modal de contato quando usuário não quer ativar
function showContactModal() {
    // Criar modal de contato se não existir
    if ($('#contact-modal').length === 0) {
        createContactModal();
    }
    
    $('#contact-modal').show();
}

// ========================================
// CRIAÇÃO DO MODAL DE ATIVAÇÃO
// ========================================
// Função que cria o modal de ativação
function createActivationModal() {
    // Verificar se trial já foi usado para esconder o botão
    chrome.storage.sync.get(['trialUsed'], function(syncData) {
        const trialUsed = syncData && syncData.trialUsed === true;
        
        const modalHtml = `
        <div id="activation-modal" class="activation-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div class="activation-content" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🔑</div>
                <h2 style="color: #333; margin-bottom: 15px;">Ativação Necessária</h2>
                <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
                    Olá! 😊 O Sender é um projeto que desenvolvemos com muito carinho. 
                    <br><br>
                    ${trialUsed ? 
                        'Você já utilizou seu período de teste. Ative sua licença mensal (30 dias) com uma chave válida.' : 
                        'Teste grátis por 3 dias ou ative sua licença mensal (30 dias) com uma chave válida.'
                    }
                </p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #25D366;">
                    <div style="font-size: 16px; font-weight: bold; color: #25D366; margin-bottom: 5px;">
                        💰 Licença Mensal: R$ 14,90
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        Acesso completo a todas as funcionalidades por 30 dias
                    </div>
                </div>
                <div style="margin-bottom: 25px;">
                    ${!trialUsed ? `<button id="start-trial" class="CtaBtn" style="
                        background: #FFA500;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                        margin-bottom: 10px;
                        font-weight: bold;
                    ">🧪 3 Dias de Teste</button>` : ''}
                    <button id="activate-extension" class="CtaBtn" style="
                        background: #25D366;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                        margin-bottom: 10px;
                    ">🔑 Ativar Licença</button>
                    <button id="contact-whatsapp" style="
                        background: #25D366;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                        margin-bottom: 10px;
                    ">📱 Entrar em Contato</button>
                    <button id="close-activation-modal" style="
                        background: #ccc;
                        color: #333;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-bottom: 10px;
                    ">Fechar</button>
                </div>
                <p style="font-size: 12px; color: #999;">
                    Entre em contato via WhatsApp para obter sua chave de ativação
                </p>
            </div>
        </div>
    `;
    
    $('body').append(modalHtml);
    
    // Event listeners para o modal
    $('#start-trial').click(function() {
        // Verificar se já usou trial
        chrome.storage.sync.get(['trialUsed'], function(syncData) {
            if (syncData && syncData.trialUsed === true) {
                alert('Você já usou seu período de teste de 3 dias.');
                return;
            }
            
            // Fechar modal de ativação
            $('#activation-modal').hide();
            
            // Iniciar trial
            chrome.runtime.sendMessage({type: 'start_trial'}, function(response) {
                if (response && response.success) {
                    console.log("🧪 Trial iniciado com sucesso");
                }
            });
        });
    });
    
    $('#activate-extension').click(function() {
        // Fechar modal de ativação
        $('#activation-modal').hide();
        
        // Mostrar modal de inserção de chave
        showKeyInputModal();
    });
    
    $('#close-activation-modal').click(function() {
        $('#activation-modal').hide();
    });
    
    $('#contact-whatsapp').click(function() {
        // Fechar modal de ativação
        $('#activation-modal').hide();
        
        // Mostrar modal de contato
        showContactModal();
    });
    
    }); // Fechar o bloco do chrome.storage.sync.get
}

// ========================================
// CRIAÇÃO DO MODAL DE CONTATO
// ========================================
// Função que cria o modal de contato
function createContactModal() {
    const contactModalHtml = `
        <div id="contact-modal" class="contact-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div class="contact-content" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
                <h2 style="color: #333; margin-bottom: 15px;">Entre em Contato</h2>
                <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
                    Para obter sua chave de ativação, entre em contato conosco via WhatsApp.
                </p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #25D366;">
                    <div style="font-size: 16px; font-weight: bold; color: #25D366; margin-bottom: 5px;">
                        💰 Licença Mensal: R$ 14,90
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        Acesso completo a todas as funcionalidades por 30 dias
                    </div>
                </div>
                <div style="margin-bottom: 25px;">
                    <button id="contact-whatsapp-modal" style="
                        background: #25D366;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 5px;
                        font-size: 18px;
                        cursor: pointer;
                        margin-right: 10px;
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    ">
                        <span>📱</span>
                        <span>WhatsApp: (51) 9498-1842</span>
                    </button>
                    <button id="close-contact-modal" style="
                        background: #ccc;
                        color: #333;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-bottom: 10px;
                    ">Fechar</button>
                </div>
                <p style="font-size: 12px; color: #999;">
                    Clique no botão acima para abrir o WhatsApp automaticamente
                </p>
            </div>
        </div>
    `;
    
    $('body').append(contactModalHtml);
    
    // Event listeners para o modal de contato
    $('#contact-whatsapp-modal').click(function() {
        // Abrir WhatsApp com o número fornecido
        const phoneNumber = "555194981842";
        const message = "Olá! Gostaria de ativar minha licença do Sender.";
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        // Abrir em nova aba
        chrome.tabs.create({ url: whatsappUrl });
        
        // Fechar modal
        $('#contact-modal').hide();
    });
    
    $('#close-contact-modal').click(function() {
        $('#contact-modal').hide();
    });
}

// ========================================
// MODAL DE INSERÇÃO DE CHAVE
// ========================================
// Função que exibe o modal para inserir chave de ativação
function showKeyInputModal() {
    // Criar modal se não existir
    if ($('#key-input-modal').length === 0) {
        createKeyInputModal();
    }
    
    $('#key-input-modal').show();
}

// ========================================
// CRIAÇÃO DO MODAL DE INSERÇÃO DE CHAVE
// ========================================
// Função que cria o modal moderno para inserir chave
function createKeyInputModal() {
    const keyInputModalHtml = `
        <div id="key-input-modal" class="key-input-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10002;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div class="key-input-content" style="
                background: white;
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div style="font-size: 64px; margin-bottom: 20px;">🔑</div>
                <h2 style="color: #333; margin-bottom: 10px; font-size: 24px;">Ativação da Licença</h2>
                <p style="color: #666; margin-bottom: 30px; line-height: 1.5; font-size: 16px;">
                    Digite sua chave de ativação para liberar todas as funcionalidades do Sender.
                </p>
                
                <div style="margin-bottom: 30px;">
                    <input type="text" id="activation-key-input" placeholder="Ex: SENDER2024PRO30DIAS" style="
                        width: 100%;
                        padding: 15px 20px;
                        border: 2px solid #ddd;
                        border-radius: 10px;
                        font-size: 16px;
                        text-align: center;
                        box-sizing: border-box;
                        transition: border-color 0.3s;
                    ">
                    
                    <div id="key-status" style="
                        margin-top: 15px;
                        padding: 10px;
                        border-radius: 5px;
                        font-size: 14px;
                        display: none;
                    "></div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <button id="validate-key" style="
                        background: #25D366;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                        font-weight: bold;
                        transition: background-color 0.3s;
                    ">
                        ✅ Validar Chave
                    </button>
                    <button id="cancel-key-input" style="
                        background: #ccc;
                        color: #333;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: background-color 0.3s;
                    ">
                        ❌ Cancelar
                    </button>
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin-top: 20px;
                ">
                    <p style="font-size: 12px; color: #666; margin: 0;">
                        <strong>💡 Dica:</strong> Digite sua chave de ativação fornecida pelo suporte
                    </p>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(keyInputModalHtml);
    
    // Event listeners para o modal de chave
    $('#validate-key').click(function() {
        const key = $('#activation-key-input').val().trim();
        if (key) {
            validateActivationKey(key);
        } else {
            showKeyStatus('Por favor, digite uma chave de ativação.', 'error');
        }
    });
    
    $('#cancel-key-input').click(function() {
        $('#key-input-modal').hide();
    });
    
    // Permitir ativação com Enter
    $('#activation-key-input').keypress(function(e) {
        if (e.which === 13) { // Enter key
            $('#validate-key').click();
        }
    });
    
    // Adicionar eventos de focus/blur
    $('#activation-key-input').focus(function() {
        $(this).css('border-color', '#25D366');
    });
    
    $('#activation-key-input').blur(function() {
        $(this).css('border-color', '#ddd');
    });
    
    // Adicionar eventos hover para os botões
    $('#validate-key').hover(
        function() {
            $(this).css('background-color', '#1ea952');
        },
        function() {
            $(this).css('background-color', '#25D366');
        }
    );
    
    $('#cancel-key-input').hover(
        function() {
            $(this).css('background-color', '#bbb');
        },
        function() {
            $(this).css('background-color', '#ccc');
        }
    );
}

// ========================================
// VALIDAÇÃO DA CHAVE DE ATIVAÇÃO
// ========================================
// Função que valida a chave de ativação
function validateActivationKey(key) {
    showKeyStatus('Validando chave...', 'loading');
    
    // Carregar chaves do GitHub
    loadKeysFromGitHub(key);
}

// ========================================
// CARREGAMENTO DE CHAVES VÁLIDAS
// ========================================
// Função que carrega as chaves válidas (local, GitHub ou fallback)
function loadKeysFromGitHub(key) {
    const fallbackKeys = [
        'datarun20dias',
        'SENDER2024PRO30DIAS', 'SENDER2024BASIC10DIAS', 'SENDER2024PREMIUM30DIAS',
        'SENDER2024ULTIMATE60DIAS', 'SENDER2024LIFETIME', 'SENDER2024TRIAL7DIAS',
        'SENDER2024BUSINESS30DIAS', 'SENDER2024ENTERPRISE90DIAS', 'SENDER2024STARTER15DIAS',
        'SENDER2024ADVANCED45DIAS', 'SENDER2024PLATINUM120DIAS', 'SENDER2024GOLD60DIAS',
        'SENDER2024SILVER30DIAS', 'SENDER2024BRONZE15DIAS', 'SENDER2024FREE5DIAS',
        'SENDER2024DEMO3DIAS', 'SENDER2024TEST1DIAS', 'SENDER2024DEV30DIAS',
        'SENDER2024BETA15DIAS', 'SENDER2024ALPHA7DIAS'
    ];

    function validateWithKeys(keys, source) {
        if (keys && Array.isArray(keys) && keys.includes(key)) {
            console.log("✅ Chave válida encontrada em:", source);
            showKeyStatus('✅ Chave válida! Ativando extensão...', 'success');
            setTimeout(() => activateExtension(key), 1500);
            return true;
        }
        return false;
    }

    // 1. Tentar Keys.json local primeiro (sempre disponível)
    const localKeysUrl = chrome.runtime.getURL("Keys.json");
    fetch(localKeysUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (validateWithKeys(data.Keys, "Keys.json local")) return;
            // Chave não encontrada localmente, tentar GitHub
            return fetch("https://villela-tech.github.io/ativa-o/Keys.json");
        })
        .then(response => {
            if (!response) return;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data && validateWithKeys(data.Keys, "GitHub")) return;
            throw new Error("Chave não encontrada");
        })
        .catch(error => {
            console.log("⚠️ Usando fallback de chaves:", error.message);
            if (validateWithKeys(fallbackKeys, "fallback")) return;
            showKeyStatus('❌ Chave inválida. Verifique e tente novamente.', 'error');
        });
}

// ========================================
// EXIBIÇÃO DO STATUS DA CHAVE
// ========================================
// Função que exibe o status da validação da chave
function showKeyStatus(message, type) {
    const statusDiv = $('#key-status');
    statusDiv.show();
    
    let bgColor, textColor;
    switch(type) {
        case 'success':
            bgColor = '#d4edda';
            textColor = '#155724';
            break;
        case 'error':
            bgColor = '#f8d7da';
            textColor = '#721c24';
            break;
        case 'loading':
            bgColor = '#d1ecf1';
            textColor = '#0c5460';
            break;
        default:
            bgColor = '#f8f9fa';
            textColor = '#495057';
    }
    
    statusDiv.css({
        'background-color': bgColor,
        'color': textColor,
        'border': `1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'}`
    }).text(message);
}

// ========================================
// ATIVAÇÃO DA EXTENSÃO
// ========================================
// Função que ativa a extensão após validação da chave
function activateExtension(key) {
    // Calcular data de expiração baseada na chave
    let days = 30; // padrão
    if (key.includes('LIFETIME')) {
        days = 720; // ~2 anos
    } else if (/dias/i.test(key)) {
        const match = key.match(/(\d+)dias/i);
        if (match) {
            days = parseInt(match[1]);
        }
    }
    
    const today = new Date();
    const expirationDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const activationData = {
        activation: 'Ativado',
        dateActivation: today.toLocaleDateString('pt-BR'),
        dateValidity: expirationDate.toLocaleDateString('pt-BR'),
        key: key
    };
    
    // Salvar no storage
    chrome.storage.local.set({statusApp: activationData}, function() {
        console.log('✅ Extensão ativada com sucesso!');
        
        // Enviar chave para webhook
        sendKeyToWebhook(key);
        
        // Fechar modal
        $('#key-input-modal').hide();
        
        // Ativar funcionalidades
        isExtensionActivated = true;
        enableAllFeatures();
        
        // Mostrar mensagem de sucesso
        showKeyStatus(`🎉 Extensão ativada com sucesso por ${days} dias!`, 'success');
        
        // Mostrar informações detalhadas de ativação
        showActivationDetails(activationData, days);
        
        // Notificar background
        chrome.runtime.sendMessage({type: 'extension_activated'});
    });
}

// ========================================
// ENVIO DE CHAVE PARA WEBHOOK
// ========================================
// Função que envia a chave ativada para o webhook
function sendKeyToWebhook(key) {
    console.log("📝 Enviando chave para webhook:", key);
    
    // Dados para enviar
    const data = {
        key: key,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        date: new Date().toLocaleDateString('pt-BR')
    };
    
    console.log("📤 Dados que serão enviados:", data);
    
    // Webhook Make.com configurado
    const webhookUrl = "https://hook.us1.make.com/7j7lwcsk1w0ztjkc5semdngzf2peubkx";
    console.log("🌐 Enviando para:", webhookUrl);
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).then(response => {
        console.log("📡 Resposta recebida:", response.status, response.statusText);
        if (response.ok) {
            console.log("✅ Chave registrada com sucesso no Make.com");
        } else {
            console.log("⚠️ Resposta do webhook:", response.status);
        }
        return response.text();
    }).then(responseText => {
        console.log("📄 Conteúdo da resposta:", responseText);
    }).catch(error => {
        console.log("❌ Erro ao registrar chave:", error);
        console.log("❌ Detalhes do erro:", error.message);
    });
}

// ========================================
// EXIBIÇÃO DOS DETALHES DE ATIVAÇÃO
// ========================================
// Função que exibe os detalhes da ativação
function showActivationDetails(activationData, days) {
    // Criar modal de detalhes se não existir
    if ($('#activation-details-modal').length === 0) {
        createActivationDetailsModal();
    }
    
    // Atualizar informações
    $('#activation-date').text(activationData.dateActivation);
    $('#expiration-date').text(activationData.dateValidity);
    $('#activation-key').text(activationData.key);
    $('#days-remaining').text(days);
    
    // Calcular dias restantes
    const today = new Date();
    const expiration = new Date(activationData.dateValidity.split('/').reverse().join('-'));
    const timeDiff = expiration.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    $('#days-left').text(daysLeft > 0 ? daysLeft : 0);
    
    // Mostrar modal
    $('#activation-details-modal').show();
}

// ========================================
// CRIAÇÃO DO MODAL DE DETALHES
// ========================================
// Função que cria o modal com detalhes da ativação
function createActivationDetailsModal() {
    const detailsModalHtml = `
        <div id="activation-details-modal" class="activation-details-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10003;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div class="activation-details-content" style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                <h2 style="color: #25D366; margin-bottom: 20px; font-size: 24px;">Ativação Concluída!</h2>
                
                <div style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    text-align: left;
                ">
                    <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">📋 Detalhes da Licença:</h3>
                    
                    <div style="margin-bottom: 10px;">
                        <strong>🔑 Chave:</strong> <span id="activation-key" style="font-family: monospace; background: #e9ecef; padding: 2px 6px; border-radius: 3px;"></span>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong>📅 Data de Ativação:</strong> <span id="activation-date"></span>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong>⏰ Data de Expiração:</strong> <span id="expiration-date"></span>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong>📊 Duração Total:</strong> <span id="days-remaining"></span> dias
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong>⏳ Dias Restantes:</strong> <span id="days-left" style="color: #25D366; font-weight: bold;"></span> dias
                    </div>
                </div>
                
                <div style="
                    background: #d4edda;
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    border: 1px solid #c3e6cb;
                ">
                    <p style="color: #155724; margin: 0; font-size: 14px;">
                        <strong>🎉 Parabéns!</strong> Sua extensão está ativa e todas as funcionalidades foram liberadas.
                    </p>
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    border-left: 4px solid #25D366;
                ">
                    <div style="font-size: 16px; font-weight: bold; color: #25D366; margin-bottom: 5px;">
                        💰 Valor da Licença: R$ 14,90
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        Acesso completo a todas as funcionalidades por 30 dias
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <button id="close-details-modal" style="
                        background: #25D366;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: background-color 0.3s;
                    ">
                        ✅ Entendi
                    </button>
                </div>
                
                <p style="font-size: 12px; color: #666; margin: 0;">
                    <strong>💡 Dica:</strong> Sua licença será verificada automaticamente a cada 5 minutos
                </p>
            </div>
        </div>
    `;
    
    $('body').append(detailsModalHtml);
    
    // Event listeners
    $('#close-details-modal').click(function() {
        $('#activation-details-modal').hide();
    });
    
    // Adicionar eventos hover para o botão
    $('#close-details-modal').hover(
        function() {
            $(this).css('background-color', '#1ea952');
        },
        function() {
            $(this).css('background-color', '#25D366');
        }
    );
}


// ========================================
// MODAL DE EXPIRAÇÃO
// ========================================
// Função que exibe o modal de expiração
function showExpirationModal() {
    // Criar modal de expiração se não existir
    if ($('#expiration-modal').length === 0) {
        createExpirationModal();
    }
    
    $('#expiration-modal').show();
}

// ========================================
// CRIAÇÃO DO MODAL DE EXPIRAÇÃO
// ========================================
// Função que cria o modal de expiração
function createExpirationModal() {
    const expirationModalHtml = `
        <div id="expiration-modal" class="expiration-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10004;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div class="expiration-content" style="
                background: white;
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div style="font-size: 64px; margin-bottom: 20px;">⏰</div>
                <h2 style="color: #dc3545; margin-bottom: 15px; font-size: 24px;">Licença Expirada</h2>
                <p style="color: #666; margin-bottom: 25px; line-height: 1.5; font-size: 16px;">
                    Sua licença expirou! Para continuar usando o Sender, você precisa ativar uma nova chave.
                </p>
                
                <div style="
                    background: #f8d7da;
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 25px;
                    border: 1px solid #f5c6cb;
                ">
                    <p style="color: #721c24; margin: 0; font-size: 14px;">
                        <strong>🧪 Modo de Teste:</strong> Esta é uma simulação de expiração para testar o sistema.
                    </p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <button id="reactivate-extension" style="
                        background: #25D366;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                        margin-bottom: 10px;
                        font-weight: bold;
                        transition: background-color 0.3s;
                    ">
                        🔑 Reativar Agora
                    </button>
                    <button id="contact-expired" style="
                        background: #17a2b8;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                        margin-bottom: 10px;
                        font-weight: bold;
                        transition: background-color 0.3s;
                    ">
                        📱 Entrar em Contato
                    </button>
                    <button id="close-expiration-modal" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: background-color 0.3s;
                    ">
                        ❌ Fechar
                    </button>
                </div>
                
                <p style="font-size: 12px; color: #999; margin: 0;">
                    Escolha entre reativar com uma nova chave ou entrar em contato para obter suporte
                </p>
            </div>
        </div>
    `;
    
    $('body').append(expirationModalHtml);
    
    // Event listeners
    $('#reactivate-extension').click(function() {
        $('#expiration-modal').hide();
        showKeyInputModal();
    });
    
    $('#contact-expired').click(function() {
        $('#expiration-modal').hide();
        showContactModal();
    });
    
    $('#close-expiration-modal').click(function() {
        $('#expiration-modal').hide();
    });
    
    // Adicionar eventos hover para os botões
    $('#reactivate-extension').hover(
        function() {
            $(this).css('background-color', '#1ea952');
        },
        function() {
            $(this).css('background-color', '#25D366');
        }
    );
    
    $('#contact-expired').hover(
        function() {
            $(this).css('background-color', '#138496');
        },
        function() {
            $(this).css('background-color', '#17a2b8');
        }
    );
    
    $('#close-expiration-modal').hover(
        function() {
            $(this).css('background-color', '#5a6268');
        },
        function() {
            $(this).css('background-color', '#6c757d');
        }
    );
}

// ========================================
// ATUALIZAÇÃO DE DIAS RESTANTES
// ========================================
// Função que atualiza os dias restantes em tempo real
function updateDaysRemaining() {
    chrome.storage.local.get(['statusApp'], function(result) {
        if (result.statusApp && result.statusApp.activation === 'Ativado') {
            const activationData = result.statusApp;
            
            // Calcular dias restantes
            const today = new Date();
            const expiration = new Date(activationData.dateValidity.split('/').reverse().join('-'));
            const timeDiff = expiration.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            // Atualizar banner se existir
            const banner = document.querySelector('.activation-status.activated');
            if (banner) {
                const daysElement = banner.querySelector('.days-remaining');
                if (daysElement) {
                    daysElement.textContent = `${daysLeft > 0 ? daysLeft : 0} dias restantes`;
                }
            }
            
            // Atualizar modal de detalhes se estiver aberto
            const detailsModal = document.getElementById('activation-details-modal');
            if (detailsModal && detailsModal.style.display !== 'none') {
                const daysLeftElement = document.getElementById('days-left');
                if (daysLeftElement) {
                    daysLeftElement.textContent = daysLeft > 0 ? daysLeft : 0;
                }
            }
        }
    });
}

// ========================================
// EXIBIÇÃO DO STATUS DE ATIVAÇÃO
// ========================================
// Função que exibe o status de ativação na interface
function showActivationStatus(status) {
    // Remover status anterior se existir
    $('.activation-status').remove();
    
    if (status === 'Ativado') {
        // Buscar informações da ativação para mostrar no banner
        chrome.storage.local.get(['statusApp'], function(result) {
            if (result.statusApp && result.statusApp.activation === 'Ativado') {
                const activationData = result.statusApp;
                
                // Calcular dias restantes
                const today = new Date();
                const expiration = new Date(activationData.dateValidity.split('/').reverse().join('-'));
                const timeDiff = expiration.getTime() - today.getTime();
                const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                
                const statusElement = `
                    <div class="activation-status activated" style="
                        position: fixed;
                        top: 15px;
                        right: 15px;
                        background: #25D366;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: bold;
                        z-index: 1000;
                        cursor: pointer;
                        transition: background-color 0.3s;
                        box-shadow: 0 1px 3px rgba(37, 211, 102, 0.15);
                        min-width: 120px;
                        text-align: center;
                    ">
                        <div style="font-size: 11px; margin-bottom: 1px;">✅ Ativada</div>
                        <div style="font-size: 8px; font-weight: normal; opacity: 0.9;">
                            ${daysLeft} dias restantes
                        </div>
                    </div>
                `;
                
                $('body').append(statusElement);
                
                // Adicionar eventos
                $('.activation-status').click(function() {
                    showActivationDetailsFromStorage();
                });
                
                $('.activation-status').hover(
                    function() {
                        $(this).css('background-color', '#1ea952');
                    },
                    function() {
                        $(this).css('background-color', '#25D366');
                    }
                );
            }
        });
    } else {
        const statusElement = `
            <div class="activation-status not-activated" style="
                position: fixed;
                top: 15px;
                right: 15px;
                background: #ff4444;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                z-index: 1000;
                cursor: pointer;
                transition: background-color 0.3s;
                box-shadow: 0 1px 3px rgba(255, 68, 68, 0.15);
                min-width: 120px;
                text-align: center;
            ">
                <div style="font-size: 11px; margin-bottom: 1px;">❌ Não Ativada</div>
                <div style="font-size: 8px; font-weight: normal; opacity: 0.9;">
                    Clique para ativar
                </div>
            </div>
        `;
        
        $('body').append(statusElement);
        
        // Adicionar eventos
        $('.activation-status').click(function() {
            showActivationModal();
        });
        
        $('.activation-status').hover(
            function() {
                $(this).css('background-color', '#e63939');
            },
            function() {
                $(this).css('background-color', '#ff4444');
            }
        );
    }
}

// ========================================
// LISTENER PARA MENSAGENS DE ATIVAÇÃO
// ========================================
// Escuta mensagens do background sobre mudanças de ativação
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'extension_activated') {
        console.log("🎉 Extensão ativada via mensagem");
        isExtensionActivated = true;
        enableAllFeatures();
        // Remover barra de trial se existir
        $('#trial-status-bar').remove();
        // Remover botão flutuante se existir
        $('#floating-activation-button').remove();
    } else if (request.type === 'extension_trial_started') {
        console.log("🧪 Trial iniciado via mensagem");
        isExtensionActivated = true;
        enableAllFeatures();
        showTrialStatus();
    } else if (request.type === 'extension_expired') {
        console.log("❌ Extensão expirada via mensagem");
        isExtensionActivated = false;
        disableAllFeatures();
        showActivationModal();
        // Remover barra de trial se existir
        $('#trial-status-bar').remove();
        // Remover botão flutuante se existir
        $('#floating-activation-button').remove();
    } else if (request.type === 'reload_interface') {
        console.log("🔄 Recarregando interface da extensão");
        // Recarregar a verificação de status
        checkActivationStatus();
        sendResponse({success: true});
    } else if (request.type === 'show_trial_activation_modal') {
        console.log("🧪 Mostrando modal de ativação do trial");
        showTrialActivationModal(request.trialData);
        sendResponse({success: true});
    }
});

// ========================================
// INICIALIZAÇÃO DA EXTENSÃO
// ========================================
// Função principal executada quando o DOM está carregado
$(function () {
    // Verificar status de ativação primeiro
    checkActivationStatus();
    
    // Inicializar normalmente
    init();
});

// ========================================
// GERENCIAMENTO DE BOTÕES DE TUTORIAL
// ========================================
// Função para controlar a exibição de botões de ajuda
function handleMoreButtons() {
    const buttonContainer = $('#tours'); 
    const buttons = buttonContainer.find('.attachment-instructions-btn'); 
    const maxVisibleButtons = 3; // Máximo de 3 botões visíveis

    // Se há mais de 3 botões, esconde os extras e cria botão "mais"
    if (buttons.length > maxVisibleButtons) {
        buttons.slice(maxVisibleButtons).hide();
        const moreButton = $('<button class="attachment-instructions-btn more-btn"><span class="attachment-instructions-text attachment-instructions CtaBtn">...more</span></button>');
        buttonContainer.append(moreButton);
        
        // Ao clicar em "mais", mostra todos os botões
        moreButton.on('click', function () {
            buttons.slice(maxVisibleButtons).addClass('active-class');  
            moreButton.remove();  
        });
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    handleMoreButtons()
    handleDeleteBin()
    handleShowTooltip()
    document.querySelectorAll('input[name="message_type"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            const selectedValue = document.querySelector('input[name="message_type"]:checked').value;
            toggleSendMessageToInput(selectedValue);
        });
    });
});

// ========================================
// GERENCIAMENTO DE CONTAINER DE PERSONALIZAÇÃO
// ========================================
// Função para mostrar o container de personalização quando há dados CSV
function showCustomizeContainer(){
    const message_box= document.querySelector(".message-box");
    const customize_container= document.querySelector(".customize_container");
    const attachment_instructions_container= document.querySelector(".message-box .attachment-instruction-secondary");
    
    // Ajusta o estilo da caixa de mensagem
    if(message_box){
        message_box.style.marginBottom= "0px";
        message_box.style.borderRadius= "3px 3px 0px 0px";
    }
    
    // Esconde instruções de anexo
    if(attachment_instructions_container){
        attachment_instructions_container.hidden= "true"
    }
    
    // Mostra o container de personalização
    if(customize_container){
        customize_container.style.display= "flex";
    }
}

// Função para esconder o container de personalização
function hideCustomizationContainer(){
    const message_box= document.querySelector(".message-box");
    const customize_container= document.querySelector(".customize_container");
    const caption_customize_container= document.querySelector(".caption_customize_container");
    const attachment_instructions_container= document.querySelector(".message-box .attachment-instruction-secondary");
    
    // Restaura o estilo original da caixa de mensagem
    if(message_box){
        message_box.style.marginBottom= "10px";
        message_box.style.borderRadius= "3px";
    }
    
    // Mostra instruções de anexo novamente
    if(attachment_instructions_container){
        attachment_instructions_container.hidden= false
    }
    
    // Esconde containers de personalização
    if(customize_container){
        customize_container.style.display= "none";
    }
    if(caption_customize_container){
        caption_customize_container.style.display= "none";
    }
    
    // Esconde personalização de legendas
    showCaptionCustomizationContainer(false);
}

// ========================================
// POPULAÇÃO DE DADOS DE PERSONALIZAÇÃO
// ========================================
// Função que cria os botões de personalização baseados nos cabeçalhos do CSV
function populateCustomizeData() {
    // Pega os cabeçalhos da primeira linha do CSV
    column_headers = csv_data[0];
    const customize_section= document.querySelector(".customize_section");
    const caption_customize_section= document.querySelector(".caption_customize_section");
    
    // Cria botões de personalização para mensagens
    if(customize_section){
        customize_section.innerHTML='';
        let customizeHtml= `
            <div class="customize_heading">Customizations: </div>
        `;
        
        // Para cada cabeçalho do CSV, cria um botão clicável
        column_headers.forEach((header, index)=>{
            customizeHtml+= `<div class="customize_box CtaBtn">${header}</div>`
        })

        customize_section.innerHTML= customizeHtml;
        
        // Adiciona event listeners aos botões de personalização
        const customizeBoxes= document.querySelectorAll(".customize_box");
        customizeBoxes.forEach((box, index)=>{
            box.addEventListener("click", (event)=>{
                // Adiciona a variável {{campo}} à mensagem
                var message = document.querySelector("textarea#message").value;
                message += " {{" + event.target.innerText + "}}";
                document.querySelector("textarea#message").value = message;
                
                // Salva a mensagem no storage local
                chrome.storage.local.set({ popup_message: message });
            })
        })
    }
    if(caption_customize_section){
        caption_customize_section.innerHTML='';
        let customizeHtml=
        `
            <div class="customize_heading">Customizations: </div>
        `;
        column_headers.forEach((header, index)=>{
            customizeHtml+= `<div class="caption_customize_box CtaBtn">${header}</div>`
        })

        caption_customize_section.innerHTML= customizeHtml;
        const customizeBoxes= document.querySelectorAll(".caption_customize_box");
        customizeBoxes.forEach((box, index)=>{
            box.addEventListener("click", async(event)=>{
                let captionForIndividualAttachment = await new Promise((resolve) => {
                    chrome.storage.local.get(['captionForIndividualAttachment'], (res) => {
                        resolve(res.captionForIndividualAttachment|| []);
                    });
                });
                document.querySelectorAll(".caption-input").forEach((ele) => {
                    if(!ele.classList.contains("hide")){
                        var eleId=ele.id.substring(ele.id.search(/\d/))
                        ele.value+=" {{" + event.target.innerText + "}}";
                        captionForIndividualAttachment[eleId]=ele.value;
                        chrome.storage.local.set({ 'captionForIndividualAttachment': captionForIndividualAttachment })
                        return;
                    }
                })
            })
        })
    }
}

function showCaptionCustomizationContainer(showConatiner){
    const captionCustomizationContainer= document.querySelector(".caption_customize_container");
    if(captionCustomizationContainer){
        if(showConatiner)
            captionCustomizationContainer.style.display= "flex";
        else 
            captionCustomizationContainer.style.display= "none";
    }
}

 async function toggleCaptionCustomizationInputDiv(){
    const captionCustomizationInputDiv = document.querySelector('.caption_customization_input_div');
    let internal_csv_data=await new Promise((resolve) => {
        chrome.storage.local.get(['csv_data'], (res) => {
            resolve(res.csv_data|| []);
        });
    });
    if (captionCustomizationInputDiv) {
        if(internal_csv_data.length>0)
             showCaptionCustomizationContainer(true);
        else
            showCaptionCustomizationContainer(false);
    }
}

function renderItems({ name, objId, serizalizeId, isFirst = false, isGroup = true }) {
    const displayBoxClass = '.groups_display_box' 
    const displayBox = document.querySelector(displayBoxClass);
    let selectedArray = isGroup ? groups_selected : contacts_selected;

    let htmlContent = displayBox.innerHTML;
    if (selectedArray.length <= 1 || isFirst) {
        htmlContent = ``;
    }

    htmlContent +=
        `<span class="group_tag CtaBtn" id=${objId} data-id-field=${serizalizeId}>
            <span class="group">${name}</span>
            <img class="delete_group_tag" src="./logo/closeBtn.png" title="Remove ${isGroup ? 'Group' : 'Contact'}">
        </span>`;

   
    displayBox.innerHTML = htmlContent;
}

function showItems(isGroup = true) {
    const itemsContainer = document.querySelector('#groups_container');
    itemsContainer.innerHTML = '';

    const selectedArray = isGroup ? groups_selected : contacts_selected;
    const allItems = isGroup ? allGroups : allContacts;

    const containerHtml = allItems
        .filter(item => !selectedArray.includes(item.id._serialized))
        .map(item => `
            <div class="dropdown-item" id="${item.objId}" data-id-field="${item.id._serialized}">
                ${item.name}
            </div>
        `).join('');

    itemsContainer.innerHTML = containerHtml;

    const searchInput = document.querySelector('.search_group_input');
    searchInput.addEventListener('input', function () {
        const inputValue = this.value.toLowerCase();
        allItems.forEach(item => {
            const itemElement = document.querySelector(`#groups_container #${item.objId}`);
            if (!itemElement) {
                console.warn(`Element with id "${item.objId}" not found.`);
                return;
            }
            const isMatch = item.name?.toLowerCase().includes(inputValue);
            const isSelected = selectedArray.includes(item.id._serialized);
            if (isMatch && !isSelected) {
                itemElement.classList.remove('hide');
            } else {
                itemElement.classList.add('hide');
            }
        });
    });

    document.querySelectorAll("#groups_container .dropdown-item").forEach(listItem => {
        listItem.addEventListener('click', function () {
            const objId = this.id;
            const name = this.innerText;
            const serizalizeId = this.getAttribute('data-id-field');

            if (!selectedArray.includes(serizalizeId)) {
                selectedArray.push(serizalizeId);
                chrome.storage.local.set({
                    [isGroup ? 'groups_selected' : 'contacts_selected']: selectedArray
                });
                renderItems({ name, objId, serizalizeId, isGroup });
                listItem.classList.add('hide');
            }
            if (itemsContainer.clientHeight === 0) {
                document.querySelector(".groups_searchbar").click();
            }
            handleDeleteBin();
            showGroupsCampaignSelectorOrSave();
        });
    });
}

async function handleSelectAll() {
    const listItems = document.querySelectorAll("#groups_container .dropdown-item");
    const listItemContainer = document.querySelector("#groups_container");
    let isGroup = messageToggleSwitchValue === "groups";
    let selectedArray = isGroup ? groups_selected : contacts_selected;
    let allItems = isGroup ? allGroups : allContacts;

    if (selectedArray.length === allItems.length) {
        let msg = await translate(`All ${messageToggleSwitchValue} are selected`);
        alert(msg);
        return;
    }

    if (listItemContainer.classList.contains("hide")) {
        fetching = true;
        if (isGroup) {
            groups_selected = allGroups.map(item => item.id._serialized);
            chrome.storage.local.set({ 'groups_selected': groups_selected });
            selectedAll = true;
        } else {
            contacts_selected = allContacts.map(item => item.id._serialized);
            chrome.storage.local.set({ 'contacts_selected': contacts_selected });
            selectedAll = true;
        }

    } else {
        const visibleItems = Array.from(listItems).filter(item => !item.classList.contains('hide'));
        let updatedSelectedArray = visibleItems.map(item => item.getAttribute('data-id-field'));

        if (isGroup) {
            groups_selected = [...new Set([...groups_selected, ...updatedSelectedArray])];
            chrome.storage.local.set({ 'groups_selected': groups_selected });
        } else {
            contacts_selected = [...new Set([...contacts_selected, ...updatedSelectedArray])];
            chrome.storage.local.set({ 'contacts_selected': contacts_selected });
        }

        listItemContainer.classList.add("hide");
        document.querySelector(".message-box").classList.remove("hide_visibility");
    }
    renderSelectedItems()
}

function initvars() {
    document.getElementById("time_gap_type").style.display = 'none';
    chrome.storage.local.get(['popup_message', 'show_advance_options', 'time_gap', 'time_gap_checked', 'time_gap_type', 'batch_checked', 'batch_size', 'batch_gap', 'file_name', 'csv_data', 'customization', 'my_number', 'plan_type', 'last_plan_type','customer_name','customer_email', 'countOfDaysTranslateUsed', 'lastDaySinceTranslateUsed', 'attachmentShimmerLastShowed', 'countOfDaysAttachmentShimmerShown', 'allGroupData', 'allContactData','groups_selected', 'contacts_selected', 'send_messages_to', 'subscribed_date', 'linuxInputAttachments'], function (result) {
        if (result.popup_message !== undefined) {
            document.querySelector("textarea#message").value = result.popup_message;
        }
        if(result.allGroupData){
            allGroups= result.allGroupData; 
        }
        if(result.allContactData){
            allContacts = result.allContactData;
        }
        if(result.subscribed_date) {
            subscribed_date = result.subscribed_date;
        }
        if ((result.file_name !== undefined) && (result.file_name !== '')) {
            set_csv_styles(result.file_name);
            showCustomizeContainer();
            csv_data = result.csv_data;
            if (csv_data) {
                var column_headers = csv_data[0];
                // $('#customized_arr').empty();
                // $('#customized_arr').append($('<option disabled selected></option>').val('Select Option').html('Select Option'));
                // $.each(column_headers, function (i, p) {
                //     $('#customized_arr').append($('<option></option>').val(p).html(p));
                // });
                populateCustomizeData();
            }
        }
        if (result.my_number === undefined)
            my_number = null;
        else {
            my_number = result.my_number;
        }
        if (!my_number) {
            document.getElementById("add_number_popup").style.display = 'block';
            trackButtonView('add_number_popup');
            trackSystemEvent('no_number_popup', 'track');
        } else {
            trackSystemEvent('my_number_popup', my_number);
        }
        if (result.plan_type !== undefined){
            plan_type = result.plan_type;
        }
        if(result.last_plan_type !== undefined) {
            last_plan_type = result.last_plan_type;
        }

        if(result.customer_email !== undefined)
            customer_email = result.customer_email;
     
        const premiumBlock = document.querySelector(".premium_feature_block");
        const nonPremiumHeader = document.getElementById("non_premium_header_text");
        
        if (premiumBlock) premiumBlock.style.display = "flex";
        if (nonPremiumHeader) nonPremiumHeader.style.display = 'none';
    
        if (result.time_gap_checked) {
            document.querySelector("#time_gap_checked").checked = result.time_gap_checked;
            document.getElementById("time_gap_type").style.display = 'flex';
            if (result.time_gap_type) {
                document.querySelector("#" + result.time_gap_type).checked = true;
            }
            if(result.time_gap_type=="random")
                disableNumberTimeGapInput("sec");
            else
                disableNumberTimeGapInput("random");
        }
        if (result.time_gap) {
            var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
            if (values.includes(parseInt(result.time_gap))) {
                const index = values.indexOf(parseInt(result.time_gap));
                document.querySelector("#slider_time_gap_sec").value = index;
            }
            else if (result.time_gap > 20) {
                document.querySelector("#slider_time_gap_sec").value = values.length - 1;
            }
            else if (result.time_gap == 0) {
                document.querySelector("#slider_time_gap_sec").value = 3;
            }
            document.querySelector("#time_gap_sec").value = result.time_gap;
        }
        if (result.batch_checked) {
            document.querySelector("#batch_checked").checked = result.batch_checked;
            document.getElementById("batch_info").style.display = 'grid';
        }
        if (result.batch_size) {
            var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50];
            if (values.includes(parseInt(result.batch_size))) {
                const index = values.indexOf(parseInt(result.batch_size));
                document.querySelector("#slider_batch_size").value = index;
            }
            else if (result.batch_size > 50) {
                document.querySelector("#slider_batch_size").value = values.length - 1;
            }
            else if (result.batch_gap == 0) {
                document.querySelector("#slider_batch_size").value = values.length - 1;
            }
            document.querySelector("#batch_size").value = result.batch_size;
        }
        if (result.batch_gap) {
            var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50];
            if (values.includes(parseInt(result.batch_gap))) {
                const index = values.indexOf(parseInt(result.batch_gap));
                document.querySelector("#slider_batch_gap").value = index;
            }
            else if (result.batch_gap > 50) {
                document.querySelector("#slider_batch_gap").value = values.length - 1;
            }
            else if (result.batch_gap == 0) {
                document.querySelector("#slider_batch_gap").value = 13;
            }
            document.querySelector("#batch_gap").value = result.batch_gap;
        }
        
        // Showing shimmer effect for translate feature - first 5 days
        let today = new Date().toDateString();
        let lastDay = result.lastDaySinceTranslateUsed || "";
        let countDays = result.countOfDaysTranslateUsed || 0;
        if(lastDay == today || countDays > 5) {
            $('#language-selector').removeClass('shimmer');
            $('#translate-icon').removeClass('shimmer');
        }
        else {
            chrome.storage.local.set({'countOfDaysTranslateUsed': countDays + 1});
            chrome.storage.local.set({'lastDaySinceTranslateUsed': today});
        }

        // Showing shimmer effect for attachment feature - first 3 days
        const lastDayWhenAttachmentShimmerShown = result.attachmentShimmerLastShowed || "";
        const countOfDaysAttachmentShimmerShown = result.countOfDaysAttachmentShimmerShown || 0;
        if(lastDayWhenAttachmentShimmerShown==today || countOfDaysAttachmentShimmerShown>3){
            $('#add-attachments').removeClass('shimmer');
        } else {
            chrome.storage.local.set({'countOfDaysAttachmentShimmerShown': countOfDaysAttachmentShimmerShown + 1});
            chrome.storage.local.set({'attachmentShimmerLastShowed': today});
        }
        if (result.groups_selected) {
            groups_selected = result.groups_selected;
        }
        if (result.contacts_selected) {
            contacts_selected = result.contacts_selected;
            console.log(contacts_selected)
        }
        if(result.send_messages_to){
            if (result.send_messages_to == "groups") {
                messageToggleSwitchValue = "groups";
                document.querySelector("#message_type_groups").click()
            }
            else if (result.send_messages_to == "contacts"){
                messageToggleSwitchValue = "contacts";
                document.querySelector("#message_type_contact").click()
            } else {
                messageToggleSwitchValue = "numbers";
            }

            if (result.popup_message !== undefined) {
                document.querySelector('#message').value= result.popup_message;
            }
        }
        if (result.linuxInputAttachments) {
            const files = result.linuxInputAttachments.map(fileData => {
                return dataURLtoFile(fileData.data, fileData.name, fileData.type);
            });

            const dataTransfer = new DataTransfer();

            files.forEach(file => {
                dataTransfer.items.add(file);
            });

            const inputElement = document.getElementById('select-attachments');
            inputElement.files = dataTransfer.files;

            const event = new Event('change', { bubbles: true });
            inputElement.dispatchEvent(event);

            chrome.storage.local.set({ 'linuxInputAttachments': null });
        }
    });
}

function dataURLtoFile(dataurl, filename, mimeType) {
    const arr = dataurl.split(',');
    const mime = mimeType || arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

function init() {
    checkVisit();
    initvars();
    getMessage();
    loadConfigData();
}

function checkVisit() {
    chrome.storage.local.get(['no_of_visit'], function (res) {
        let visit_count = res.no_of_visit || 0;

        // Check if there is an open WhatsApp Web tab
        chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, function (tabs) {
            if (tabs.length > 0) {
                // If WhatsApp Web tab is already open and is not active, activate it
                if(!tabs[0].active) {
                    chrome.tabs.update(tabs[0].id, { active: true });
                }
            } else {
                // Else open a new tab for WhatsApp Web
                chrome.tabs.create({ url: "https://web.whatsapp.com" });
            }
        });
        
        chrome.storage.local.set({no_of_visit: visit_count + 1});
        trackSystemEvent('extension_visit', visit_count);
    })
};

// Load AWS Config Data from Chrome Storage to Local Data (for popup js and ga-code js)
function loadConfigData() {
    chrome.storage.local.get(['CONFIG_DATA'], (res) => {
        if(res.CONFIG_DATA) {
            if(res.CONFIG_DATA.ALL_LANGUAGE_CODES) 
                allLanguageCodes = res.CONFIG_DATA.ALL_LANGUAGE_CODES;
            if(res.CONFIG_DATA.GA_CONFIG)
                GA_CONFIG = res.CONFIG_DATA.GA_CONFIG;
        }
    })
}

function sendMessageToBackground(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
}

function show_error(error) {
    document.getElementById("error_message").style.display = 'block';
    document.getElementById("error_message").innerText = error;
}

function reset_error() {
    document.getElementById("error_message").innerText = '';
    document.getElementById("error_message").style.display = 'none';
}

async function sendMessageFunction() {
    let caption =await new Promise((resolve) => {
        chrome.storage.local.get(['captionForIndividualAttachment'], (res) => {
            resolve(res.captionForIndividualAttachment|| []);
        });
    });
    chrome.storage.local.set({ 'captionForIndividualAttachment': [] })
    document.querySelector(".captionTextAreas").innerHTML="";
    const messageSendingTo= messageToggleSwitchValue;
    var numbers_str = document.querySelector("textarea#numbers").value;
    var message = document.querySelector("textarea#message").value;
    var attachments_str = document.querySelector("#attachments-container").innerText;
    var customization = true;
    let caption_customization = true;
    var time_gap, random_delay = false, batch_size, batch_gap;
    let send_attachment_first = false;
    if ($("#time_gap_checked").is(":checked")) {
        if ($("#time_gap_type input[type='radio']:checked").val() === 'sec') {
            time_gap = parseInt(document.querySelector("#time_gap_sec").value);
        }
        if($("#time_gap_type input[type='radio']:checked").val() === 'random') {
            time_gap = 4; //Avg of random delay
            random_delay = true;
        }
    }
    else {
        time_gap = parseInt(3);
    }
    if ($("#batch_checked").is(":checked")) {
        batch_size = document.querySelector("#batch_size").value;
        batch_gap = document.querySelector("#batch_gap").value;
        if (batch_gap)
            batch_gap = parseInt(batch_gap);
        if (batch_size)
            batch_size = parseInt(batch_size);
    }
    if ($('#attachment-first-checkbox').is(":checked")) {
        send_attachment_first = true;
    }

    var numbers = getFilteredNumbers(numbers_str).split(",").map((num) => (country_info.dial_code + num));
    if (!numbers_str && messageSendingTo=='numbers') {
        show_error("Please enter numbers to send")
        return;
    }
    if(groups_selected.length == 0 && messageSendingTo=='groups') {
        show_error("Please select groups to send")
        return;
    }
    if(contacts_selected.length == 0 && messageSendingTo=='contacts') {
        show_error("Please select contacts to send")
        return;
    }
    if(message.trim().length == 0 && attachments_str.length == 0) {
        show_error("Please enter message or attachment");
        return;
    }
    chrome.storage.local.get(["daysSinceInstallation"], (res) => {
        let daysSinceInstallation = res.daysSinceInstallation;
        if(caption.length > 0 && daysSinceInstallation < 10){
            chrome.storage.local.set({ isCaptionUsed:true });
        }
    });

    let recipients, recipients_type, campaign_type;
    if (messageSendingTo === 'numbers') {
        recipients = numbers;
        recipients_type = 'numbers';
        campaign_type = 'number_message';
    } else if (messageSendingTo === 'groups') {
        recipients = groups_selected;
        recipients_type = 'groups';
        campaign_type = 'group_message';
    } else if (messageSendingTo === 'contacts') {
        recipients = contacts_selected.map(number => number.replace("@c.us", ""));
        recipients_type = 'numbers';
        campaign_type = 'number_message'; 
    }

    sendMessageToBackground({
        type: campaign_type,
        [recipients_type]: recipients,
        message,
        time_gap,
        csv_data,
        customization,
        caption_customization,
        random_delay,
        batch_size,
        batch_gap,
        caption,
        send_attachment_first
    });
    window.close();
}

async function messagePreparation() {
    reset_error();
    let attachments = await new Promise((resolve) => {
        chrome.storage.local.get(['attachmentsData'], (res) => {
            resolve(res.attachmentsData || []);
        });
    });

    if (attachments.length > 3) {
        const confirmOverlay = document.querySelector(".confirm-ovelay");
        confirmOverlay.style.display = "flex";
        const cancelButton = document.querySelector(".cancelAction");
        const okButton = document.querySelector(".doAction");
        cancelButton.addEventListener("click", () => {
            confirmOverlay.style.display = "none";
        })
        okButton.addEventListener("click", () => {
            confirmOverlay.style.display = "none";
            sendMessageFunction();
        })
    }
    else {
        sendMessageFunction();
    }
}

function processExcel(data) {
    var workbook = XLSX.read(data, {
        type: 'binary'
    });

    var firstSheet = workbook.SheetNames[0];
    var data = to_json(workbook);
    return data
};

function to_json(workbook) {
    var result = {};
    workbook.SheetNames.forEach(function (sheetName) {
        var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1
        });
        if (roa.length) result[sheetName] = roa;
    });
    return JSON.stringify(result, 2, 2);
};

function convertCSVtoExcel(csvFile) {
    return new Promise((resolve, reject) => {
        Papa.parse(csvFile, {
            complete: function (result) {
                try {
                    const worksheet = XLSX.utils.json_to_sheet(result.data);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');
                    const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            },
            header: true,
            error: function (error) {
                reject(error);
            }
        });
    });
}

function checkIfValidPhoneNumber(phoneNumber) {
    let doesContainAlphabet = /[a-zA-Z]/.test(phoneNumber);
    console.log("checkValid == ", phoneNumber, !doesContainAlphabet);
    return !doesContainAlphabet;
}

function showInvalidExcelPopup() {
    trackSystemEvent('invalid_excel', 'invalid_excel');
    const invalidTextDiv = document.querySelector('.invalid-excel-popup-description');
    invalidTextDiv.innerHTML = 'First column should only contain phone numbers.</br>Check template excel below.';
    const uploadAnywayBtn = document.getElementById('upload-anyway-button');
    if(uploadAnywayBtn)
      uploadAnywayBtn.style.display = 'none';
    let invalidExcelPopup = document.getElementById('invalid-excel-popup');
    invalidExcelPopup.classList.remove('hide');
}  

function process_sheet_data_and_validate(data, checkForValid) {
    if (data && data.length > 0) {
        csv_data = [data[0]];
        var numbers = '';
        var column_headers = data[0];
        for (var i = 1; i < data.length; i++) {
            if (data[i][0]) {
                isValidPhoneNumber = checkIfValidPhoneNumber(data[i][0]);
                if(!isValidPhoneNumber){
                    customization_obj && driver(translatedCustomObj).destroy();
                    customization_obj = false;
                    showInvalidExcelPopup();
                    unset_csv_styles();
                    return;
                }
                csv_data.push(data[i]);
                numbers += data[i][0];
                if (i !== (data.length - 1))
                    numbers += ',';
            }
        }
        document.getElementById("numbers").value = numbers;
        populateCustomizeData();
        chrome.storage.local.set({ csv_data: csv_data });
        chrome.storage.local.set({ popup_numbers: numbers });
        $('#numbers').click();
        replaceNumbers(numbers);
        let isFirstRowValid = true;
        if(checkForValid){
            for (const element of column_headers) {
                if(!isNaN(Number(element)) && element.toString().length >= 10){
                    isFirstRowValid = false;
                }
            }
        }
        if(!isFirstRowValid){
            let invalidExcelPopup = document.getElementById('invalid-excel-popup');
            invalidExcelPopup.classList.remove('hide');      
            const uploadAnywayBtn = document.getElementById('upload-anyway-button');
            uploadAnywayBtn.addEventListener('click',()=>{
                invalidExcelPopup.classList.add('hide');      
            })
        }
    }
}

function process_sheet_data(evt,checkForValid = true) {
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = e => {
            var data = processExcel(e.target.result);
            data = JSON.parse(data);
            data = data[Object.keys(data)[0]];
            process_sheet_data_and_validate(data, checkForValid);
        };
        r.readAsBinaryString(f);
    }
}

function set_csv_styles(file_name) {
    if (file_name) {
        csv_name = file_name.substring(0, 15)
        if(file_name.length > 15) 
            file_name = csv_name + '...';
        
        $('#campaign-name').val(csv_name);
        $('#campaign-selector').css('display', 'none');
        $('#uploaded-csv').prop('hidden', false).text(file_name);
        $('#customization').prop('checked', true).trigger('change');
        
        chrome.storage.local.set({ file_name: csv_name });
    }
}

function unset_csv_styles() {
    $('#csv').val('');
    $('#campaign-name').val('');
    $('#campaign-selector').css('display', 'flex');
    $('#uploaded-csv').prop('hidden', true).text('');
    $('#customization').prop('checked', false).trigger('change');
    chrome.storage.local.set({ csv_data: [], file_name: '' });
    csv_data=[];
}

function getMessage() {

    $('#sender').click(function () {
        messagePreparation();
        trackButtonClick('send_message_button');
    });
    $('#how_to_use').click(function () {
        trackButtonClick('how_to_use_pro_sender');
        if (messageToggleSwitchValue !== "numbers") {
            document.querySelector("#message_type_numbers").click()
          }
        driver(translatedSendObj).drive()
    });
   
    $('#chat_link').click(function () {
        sendMessageToBackground({ type: 'chat_link' });
        window.close();
    });

    $('#select_premium_features').click(function () {           
        document.querySelector('.premium_features_parent_div').classList.add('black_background');
        document.getElementById("popup_functionality").style.display = 'none';
        document.getElementById("show_premium_features").style.display = 'block';
        
        document.getElementById("select_functionality_container").classList.remove('active');
        document.getElementById("select_premium_container").classList.add('active');

        document.getElementById("add_business_text").style.color = '#fff';
        // document.getElementById("add_business_img").src = 'logo/plus (1).png';
        document.getElementById("ps-logo-right").style.color="#C4C4C4"
        showFaqsSection();

    });
    $('#select_functionality').click(function () {
        document.querySelector('.premium_features_parent_div').classList.remove('black_background');
        document.getElementById("popup_functionality").style.display = 'block';
        document.getElementById("show_premium_features").style.display = 'none';
        
        document.getElementById("select_functionality_container").classList.add('active');
        document.getElementById("select_premium_container").classList.remove('active');

        document.getElementById("add_business_text").style.color = '#C4C4C4';
        document.getElementById("ps-logo-right").style.color="#fff"
        // document.getElementById("add_business_img").src = 'logo/plus.png';
        // user info
    });
    $('#back_to_functionality').click(function () {
        document.getElementById("popup_functionality").style.display = 'block';
        document.getElementById("show_premium_features").style.display = 'none';
        document.getElementById("select_functionality").style.background = '#62D9C7';
    });

    $("#csv").on("change", async function (e) {
        var file = document.getElementById("csv").files[0];
        if (file){
            set_csv_styles(file.name);
            showCustomizeContainer();
            showCaptionCustomizationContainer(true);
        }
        if(file.type=='text/csv' || file.name.endsWith(".csv")){
            let parsedData = await convertCSVtoExcel(file);
            process_sheet_data_and_validate(parsedData, true);
        } else {
            process_sheet_data(e);
        }
        trackButtonClick('csv_uploaded');
    });

    // check whether the time gap feature is enabled or not
    $("#time_gap_checked").on("change", function () {
        var checked = $("#time_gap_checked").is(":checked");
        var style = checked ? "flex" : "none";
        document.getElementById("time_gap_type").style.display = style;
        chrome.storage.local.set({ time_gap_checked: checked });
    });
    $("#batch_checked").on("change", function () {
        var checked = $("#batch_checked").is(":checked");
        var style = checked ? "grid" : "none";
        document.getElementById("batch_info").style.display = style;
        chrome.storage.local.set({ batch_checked: checked });
    });
    // if the slider_time_gap values is changed assign its value to the time_gap_value
    $("#slider_time_gap_sec").on("change", function () {
        var sliderBtn = document.querySelector("#slider_time_gap_sec");
        var numberBtn = document.querySelector("#time_gap_sec");
        var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
        numberBtn.value = values[sliderBtn.value];
        time_gap = numberBtn.value;
        chrome.storage.local.set({ time_gap: time_gap });
    })
    // take input from the input section and stores it in the local storage
    $("#time_gap_sec").on("change", function () {
        var time_gap = document.querySelector("#time_gap_sec").value;
        var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
        if (values.includes(parseInt(time_gap))) {
            const index = values.indexOf(parseInt(time_gap));
            document.querySelector("#slider_time_gap_sec").value = index;
        }
        else if (time_gap > 20) {
            document.querySelector("#slider_time_gap_sec").value = values.length - 1;
        }
        else if (time_gap == 0) {
            document.querySelector("#slider_time_gap_sec").value = 3;
            document.querySelector("#time_gap_sec").value = 3;
            time_gap = 3;
        }
        chrome.storage.local.set({ time_gap: time_gap });
    })
    // check if the random feature is selected or not
    $("#random").on("change", function () {
        disableNumberTimeGapInput("sec");
        trackButtonClick('random_delay_changed');
    });
    $("#sec").on("change", function(){
        disableNumberTimeGapInput("random");
    });
    $("#slider_batch_size").on("change", function () {
        var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        const batchSize = document.querySelector("#batch_size");
        const sliderBatchSize = document.querySelector("#slider_batch_size");
        batchSize.value = values[sliderBatchSize.value];
        var batch_size = document.querySelector("#batch_size").value;
        chrome.storage.local.set({ batch_size: batch_size });
        trackButtonClick('batch_size_changed');
    })
    $("#batch_size").on("change", function () {
        var batch_size = document.querySelector("#batch_size").value;
        var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        if (values.includes(parseInt(batch_size))) {
            const index = values.indexOf(parseInt(batch_size));
            document.querySelector("#slider_batch_size").value = index;
        }
        else if (batch_size > 50) {
            document.querySelector("#slider_batch_size").value = values.length - 1;
        }
        else if (batch_size == 0) {
            document.querySelector("#slider_batch_size").value = values.length - 1;
            document.querySelector("#slider_batch_size").value = 50;
            batch_size = 50;
        }
        chrome.storage.local.set({ batch_size: batch_size });
        trackButtonClick('batch_size_changed');
    });
    $("#slider_batch_gap").on("change", function () {
        var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        const batchGap = document.querySelector("#batch_gap");
        const sliderBatchGap = document.querySelector("#slider_batch_gap");
        batchGap.value = values[sliderBatchGap.value];
        var batch_gap = document.querySelector("#batch_gap").value;
        chrome.storage.local.set({ batch_gap: batch_gap });
        trackButtonClick('batch_gap_changed');
    })
    $("#batch_gap").on("change", function () {
        var batch_gap = document.querySelector("#batch_gap").value;
        var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        if (values.includes(parseInt(batch_gap))) {
            const index = values.indexOf(parseInt(batch_gap));
            document.querySelector("#slider_batch_gap").value = index;
        }
        else if (batch_gap > 50) {
            document.querySelector("#slider_batch_gap").value = values.length - 1;
        }
        else if (batch_gap == 0) {
            document.querySelector("#slider_batch_gap").value = 13;
            batch_gap = 30;
        }
        chrome.storage.local.set({ batch_gap: batch_gap });
        trackButtonClick('batch_gap_changed');
    });
    // this check whether input type is random or sec
    $("#time_gap_type input[type=radio]").on("change", function (e) {
        var value = e.target.value;
        chrome.storage.local.set({ time_gap_type: value });
        trackButtonClick('batch_gap_changed');
    });
    $('#chat_link_info').click(function () {
        document.getElementById("chat_link_info_popup").style.display = 'block';
    });
    $('.help_popup_okay').click(function () {
        document.getElementById("help_popup").style.display = 'none';
        chrome.storage.local.get(["first_visit_attachment", "first_attachment_click_count"], (res) => {
            let first_attachment_click_count = res.first_attachment_click_count;
            if (first_attachment_click_count == 1) {
                if(isLinux)
                    sendMessageToBackground({type: "add_attachments"});
                else
                    $('#select-attachments').click();
                chrome.storage.local.set({ first_attachment_click_count: -1 })
            }
            let first_visit_attachment = res.first_visit_attachment;
            if (first_visit_attachment == true) {
                chrome.storage.local.set({ first_visit_attachment: false })
            }
        })
    });
    $('#chat_link_info_popup_okay').click(function () {
        document.getElementById("chat_link_info_popup").style.display = 'none';
    });
    $("#numbers").on("change", function (e) {
        var numbers = document.querySelector("textarea#numbers").value;
        chrome.storage.local.set({ popup_numbers: numbers });
        trackButtonClick('number_changed');
    });
    $("#message").on("change", function (e) {
        var message = document.querySelector("textarea#message").value;
        chrome.storage.local.set({ popup_message: message });
        trackButtonClick('message_changed');
    });
    $("#time_gap").on("change", function (e) {
        var time_gap = document.querySelector("#time_gap").value;
        trackButtonClick('time_gap_chnaged');
    });
    $("#customization").on("change", function (e) {
        var customization = document.querySelector("#customization").checked;
        chrome.storage.local.set({ customization: customization });
        trackButtonClick('customization_added');
    });
    $("#customized_arr").on("change", function (e) {
        var val = document.querySelector("#customized_arr").value;
        var message = document.querySelector("textarea#message").value;
        message += " {{" + val + "}}";
        document.querySelector("textarea#message").value = message;
        chrome.storage.local.set({ popup_message: message });
    });
   
    $("#survey_click").click(function () {
        document.getElementById("survey").style.display = 'none';
        chrome.storage.local.set({ survey_click: true });
        trackButtonClick('survey_click');
        window.open("https://forms.gle/uWMMreyGvkGozURb9", "_blank");
    });
    $("#my_number_submit").click(function () {
        var code = document.querySelector("#my_number_code").value;
        var number = document.querySelector("#my_number").value;
        if (!(code && number))
            return;
        my_number = ('' + code + number).replace('+', '');
        trackButtonClick('my_number_submit');
        document.getElementById("add_number_popup").style.display = 'none';
        document.getElementById("confirm_number_popup").style.display = 'block';
        document.getElementById("confirm_my_number").innerText = "+" + my_number;
    });
    $("#confirm_number_submit").click(function () {
        document.getElementById("confirm_number_popup").style.display = 'none';
        chrome.storage.local.set({ my_number: my_number });
        trackButtonClick('confirm_number_submit');
        sendMessageToBackground({ type: 'fetch_plan_details' });
        window.close();
    });
    $("#edit_number_submit").click(function () {
        document.getElementById("confirm_number_popup").style.display = 'none';
        document.getElementById("add_number_popup").style.display = 'block';
        trackButtonClick('edit_number_submit');
    });
    $("#unsubscribe").click(function () {
        sendMessageToBackground({ type: 'unsubscribe' });
        trackButtonClick('unsubscribe');
    });
   
}

function convertToTimestamp(date, time) {
    let dateTime = new Date(date + 'T' + time);
    return dateTime.getTime();
}

function timeToTimestamp(time) {
    let [hours, minutes] = time.split(':');
    return new Date().setHours(parseInt(hours), parseInt(minutes), 0, 0);
}

function convertTo12Hour(time) {
    let [hours, minutes] = time.split(':');
    let date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    let period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    // minutes = minutes < 10 ? '0'+minutes : minutes;

    return `${hours}:${minutes} ${period}`;
}

function calculateCampaignDuration(time_gap, random_delay, batch_size, batch_gap, numbers){
    let total_time = 0;
    for (let i = 0; i < numbers.length; i++) {
        let curr_time_gap = time_gap;
        if(random_delay)
            curr_time_gap = 7;
        if(batch_size && (i%batch_size === 0))
            curr_time_gap = batch_gap;
        if(i===0)
            curr_time_gap = 2;
        total_time += curr_time_gap;
    }

    // add 15 minutes to this total time
    total_time += 15*60;
    return total_time;
}



function hasDateTimePassed(date, time) {
    let dateTime = new Date(date + 'T' + time);
    let now = new Date();
    return now > dateTime;
}

// Google Analytics
function getTrackLabel(){
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

    // Filters null and undefined values
    let combinedData = { ...location, ...data };
    let eventData = Object.fromEntries(
        Object.entries(combinedData).filter(([key, value]) => value != null || value != undefined) 
    );
    GoogleAnalytics.trackEvent(event, { label, ...eventData });
}

function getFilteredNumbers(numbers_str) {
    let numbers = numbers_str.replace(/\n/g, ",").split(",");
    numbers = numbers.map(num => num.replace(/\D/g, ''));
    numbers = numbers.filter((num) =>  (num.length >= 5 && num.length <= 15));
    let filteredNumbers = numbers.join(',')
    return filteredNumbers;   
}

function getItemsName() {
    let itemsElements = document.querySelectorAll(".group");
    let itemsString = Array.from(itemsElements)
        .slice(0, -1)
        .map(item => item.innerHTML.trim()) 
        .join(", "); 
    return itemsString;
}

function getCampaigns(callback) {
    chrome.storage.local.get(['campaigns'], (res) => {
        let campaigns = res.campaigns || [];
        callback(campaigns);
    });
}

function saveCampaign(campName, campData, callback) {
    getCampaigns((campaigns) => {
        let isCampNameExists = campaigns.some(campaign => campaign.name === campName);
        if (isCampNameExists) {
            alert(`Campaign name "${campName}" already exists!`);
            callback(false);
        } else {
            campaigns.push({ name: campName, ...campData });
            chrome.storage.local.set({ campaigns }, () => callback(true)); 
        }
    });
}

function updateCampaign(index, campName, campData, callback) {
    getCampaigns((campaigns) => {
        if (campaigns[index]) {
            campaigns[index] = { name: campName, ...campData };
            chrome.storage.local.set({ campaigns }, () => callback(true)); 
        } else {
            alert("Invalid campaign index.");
            callback(false); 
        }
    });
}

function showGroupsCampaignSelectorOrSave() {
    chrome.storage.local.get(['campaigns'], (res) => {
        let isCampaignPresent = false;
        const numbers = getItemsName();
        const campaigns = res.campaigns || [];
        let filteredCampaigns = filterCampaignsByType(campaigns, messageToggleSwitchValue)
        let selectedArray = messageToggleSwitchValue === "groups" ? groups_selected : contacts_selected
        filteredCampaigns.forEach(campaign => {
            if (numbers === campaign[messageToggleSwitchValue]) {
                isCampaignPresent = true;
            }
        })
        console.log(isCampaignPresent)
        console.log(selectedArray.length)
        if (isCampaignPresent || selectedArray.length === 0) {
            $('#campaign_selector_groups').removeClass('hide');
            $('#campaign-save-icon-items').addClass('hide') 
        } else {
            $('#campaign_selector_groups').addClass('hide');
            $('#campaign-save-icon-items').removeClass('hide');
        }
    })
}

// Helper function to filter campaigns based on the messageToggleSwitchValue
function filterCampaignsByType(campaigns, type) {
    return campaigns.filter(campaign => campaign[type] && campaign[type].length > 0);
}

function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return "th";
    }
    switch (day % 10) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
}

function getReportDateFormat(date_ms, isDownloadName = false) {
    const today = new Date();
    const reportDate = new Date(date_ms);
    const diffDays = Math.round(Math.abs((today - reportDate) / (24 * 60 * 60 * 1000)));

    const reportDay = reportDate.getDate();
    const dayString = reportDay + getDaySuffix(reportDay);

    let reportTimeString = reportDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" });
    let reportDateString;

    if (isDownloadName || diffDays > 1) {
        reportDateString = `${dayString} ${reportDate.toLocaleDateString("en-US", { month: "short" })}`
    } else if (diffDays === 0) {
        reportDateString = "Today";
    } else if (diffDays === 1) {
        reportDateString = "Yesterday";
    }

    if(isDownloadName) {
        return `(Last Run at ${reportDateString} ${reportTimeString})`;
    }
    return `(Last Run: ${reportDateString} ${reportTimeString})`;
}

function serizalize_csv_rows(rows) {
    return "data:text/csv;charset=utf-8," + rows.map(row => {
        return row.map((col, index) => {
            if (index === 0 && /^\d+$/.test(col.trim())) {
                return `"${col}"`;
            }
            return `"${col.replace(/"/g, '""')}"`; 
        }).join(",");
    }).join("\n");
}

// Download CSV
function download_csv(data, filename) {
    const encodedUri = encodeURI(data);
    const link = $('<a>').attr({ href: encodedUri, download: filename }).appendTo('body');
    link[0].click();
    link.remove();
}

function getCustomNumberPlaceholder() {
    let defaulltPlaceholder = 'Enter numbers separated by comma or one below the other. Eg. ';
    let sampleNumber = $('#country-code-input').attr('placeholder').replace(/\D/g, '');
    if(sampleNumber === '') {
        sampleNumber = '+55 8123456789, +1 2015550123'
    } else if(sampleNumber.startsWith('0')) {
        sampleNumber = sampleNumber.substr(1);
    }

    let customPlaceholder='';
    if(sampleNumber != '+55 8123456789, +1 2015550123'){
        let startingDigits= sampleNumber.slice(0, -6);
        let lastSixDigits = sampleNumber.slice(-6);
        let reversedLastSixDigits = lastSixDigits.split('').reverse().join('');
        let sampleNumberTwo = startingDigits + reversedLastSixDigits;
        customPlaceholder = defaulltPlaceholder + sampleNumber + ', ' + sampleNumberTwo;
    }
    else 
        customPlaceholder = defaulltPlaceholder + sampleNumber;
    return customPlaceholder;
}

// Add Country Code Selector
function addCountryCodeSelector() {
    // Country Code Selector/Input
    const countrySelector = document.querySelector('#country-code-input');
    const initialCountry = country_info.name_code;
    const preferredCountries = initialCountry === 'XX' ? [initialCountry] : ['XX', initialCountry];

    const intlTelInputConfig = {
        separateDialCode: true,
        autoHideDialCode: false,
        autoPlaceholder: 'off',
        initialCountry: initialCountry,
        preferredCountries: preferredCountries,
        autoPlaceholder: 'aggressive',
        utilsScript: 'library/intlTelInput.utils.js'
    };
    window.intlTelInput(countrySelector, intlTelInputConfig);
    updateCountryInfo();

    countrySelector.addEventListener('countrychange', () => {
        updateCountryInfo();
        refreshNumbers();
    });
}

function updateCountryInfo() {
    const countrySelector = document.querySelector('#country-code-input');
    const intlTelInputInstance = window.intlTelInputGlobals.getInstance(countrySelector);
    let { name, iso2, dialCode } = intlTelInputInstance.getSelectedCountryData();
    if (dialCode === '00') dialCode = '';
    country_info = {
        name: name,
        name_code: iso2.toUpperCase(),
        dial_code: dialCode,
    };
    chrome.storage.local.set({ country_info: country_info });

    // Update Numbers Input Placeholder
    $('#numbers-input').attr('placeholder', getCustomNumberPlaceholder())
}

function refreshNumbers() {
    const numberTags = $('#numbers-display .number-tag .number');
    const numbers = [];
    numberTags.each(function () {
        let nationalNumber = $(this).text().trim();
        numbers.push(nationalNumber);
    });
    const numbers_str = numbers.join(', ');
    replaceNumbers(numbers_str);
}

function replaceNumbers(newNumbers) {
    // Delete all numbers
    $('#numbers-display').empty();
    $('#numbers-input').val('');

    // Add new numbers
    addNumberTags(newNumbers);
}

// Validate the Number and return National Number
function isValidNumber(number) {
    let { dial_code, name_code } = country_info;
    let default_invalid_reason = { isValid: false, nationalNumber: number, reason: 'INCORRECT COUNTRY CODE' };

    const checkNumber = (num) => {
        try {
            let parsedNumber = libphonenumber.parsePhoneNumber('+' + num);

            if (parsedNumber && parsedNumber.isValid()) {
                if(name_code === 'XX') {
                    return { isValid: true, nationalNumber: num, reason: '' }
                }
                else if(name_code === parsedNumber.country) {
                    return { isValid: true, nationalNumber: parsedNumber.nationalNumber, reason: '' }
                } else {
                    return default_invalid_reason;
                }
            }
            return default_invalid_reason;
        } catch (error) {
            return { isValid: false, nationalNumber: num, reason: error.message };
        }
    };

    // check number with / without country code, then return valid response
    let response1 = checkNumber(number);
    let response2 = checkNumber(dial_code + number);

    if (response1.isValid) {
        return response1;
    } else if (response2.isValid) {
        return response2;
    } else {
        return default_invalid_reason;
    }
}

function toggleUploadExcelText(show){
    const isNumberTagPresent= document.querySelectorAll(".number-tag").length;
    const uploadExcelText = document.querySelector(".upload_excel_text");
    if(uploadExcelText && isNumberTagPresent && !show){
            uploadExcelText.style.display= "none";
    }
    else if(uploadExcelText && !isNumberTagPresent && show){
            uploadExcelText.style.display= "flex";
    }
}

// Adds number tags html from numbers string
function addNumberTags(numbers_str) {
    const numbers = getFilteredNumbers(numbers_str).split(',');
    let numberTagsHtml = '';
    for (let number of numbers) {
        if (number) {
            let { isValid, nationalNumber, reason } = isValidNumber(number);
            numberTagsHtml += `
                <span class="number-tag CtaBtn ${isValid ? '' : 'invalid'}">
                    ${isValid ? '' : '<span class="invalid-reason" hidden="true">' + reason + '</span>'}
                    <span class="number" title="Edit Number">${nationalNumber}</span>
                    <img class="delete-number-tag" src="./logo/closeBtn.png" title="Remove Number">
                </span>`;
        }
    }

    $('#numbers-display').append(numberTagsHtml);
    updateNumbersAndDisplay();

    // removing upload excel text if number tag is present
    toggleUploadExcelText(false);
}

// Edit / Update Number Tag
function editNumberTag(tag) {
    const currentNumber = $(tag).text();
    const numberTag = $(tag).parent('.number-tag');

    // Add input inside number tag
    const numberTagWidth = $(tag).width() + 7 + 'px';
    const numberInput = $(`<input type="text" class="number-tag-input" maxlength="16" style="max-width:${numberTagWidth};">`);

    // Adding Input inside number tag and some style changes
    numberTag.html(numberInput);
    numberTag.addClass('active-input');
    numberTag.removeClass('CtaBtn');
    numberInput.val(currentNumber);
    numberInput.focus();

    // Handle edit
    numberInput.on('blur keydown keyup', function (event) {
        if (event.keyCode && ![13, 188].includes(event.keyCode)) return;
        let editedNumber = getFilteredNumbers($(this).val()).split(',')[0];

        if (editedNumber) {
            let { isValid, nationalNumber, reason } = isValidNumber(editedNumber);
            //change the edited context inside excel 
            for(let i=0;i<csv_data.length;i++){
                if(csv_data[i][0] && csv_data[i][0].toString().includes(currentNumber)){
                    csv_data[i][0]=parseInt(editedNumber);
                    break;
                }
            }
            chrome.storage.local.set({ csv_data: csv_data });
            numberTag.toggleClass('invalid', !isValid);
            numberTag.removeClass('active-input');
            numberTag.addClass('CtaBtn');

            numberTag.html(`
                ${isValid ? '' : '<span class="invalid-reason" hidden="true">' + reason + '</span>'}
                <span class="number" title="Edit Number">${nationalNumber}</span>
                <img class="delete-number-tag" src="./logo/closeBtn.png" title="Remove Number">
            `);
        } else {
            $(this).parent('.number-tag').remove();
        }
        updateNumbersAndDisplay();
    });
}

// Updates the real numbers input and numbers display
function updateNumbersAndDisplay() {
    // Update actual number input
    const numberTags = $('#numbers-display .number-tag .number');
    const numbers = [];
    numberTags.each(function () {
        let nationalNumber = $(this).text().trim();
        numbers.push(nationalNumber);
    });
    $('#numbers').val(numbers.join(', '));
    $('#numbers').trigger('change');

    // Update invalid number count
    let invalidCount = $('.number-tag.invalid').length;
    if(Number(invalidCount)>500)
        invalidCount= '500+'
    $('#invalid-numbers').css('display', invalidCount ? 'flex' : 'none');
    $('#invalid-count').text(invalidCount);

    // Show/Hide delete all numbers icon
    $('#delete-all-numbers').css('display', numbers.length ? 'block' : 'none');

    // Show/Hide Placeholder
    $('#numbers-input').attr('placeholder', numbers.length ? '' : getCustomNumberPlaceholder());
    
    // Scroll number display to bottom
    $('#numbers-display').animate({ scrollTop: $('#numbers-display')[0].scrollHeight }, 500);
}

// For attachment and Template
function handleDeleteBin(){
    $('#delete-all').css('display', 
        messageToggleSwitchValue === 'groups' 
        ? (groups_selected.length > 0 ? 'block' : 'none') 
        : (contacts_selected.length > 0 ? 'block' : 'none')
    );
}

// ========================================
// NAVEGAÇÃO ENTRE ABAS
// ========================================
// Função para mostrar a aba selecionada
function showTab(tabName) {
    console.log("🔄 Mudando para aba:", tabName);
    
    // Remover classe active de todas as abas
    $('.header-tab').removeClass('active');
    
    // Ocultar todos os conteúdos
    $('#popup_functionality').hide();
    $('#show_premium_features').hide();
    $('#show_warmup_features').hide();
    
    // Mostrar conteúdo baseado na aba selecionada
    if (tabName === 'functionality') {
        $('#select_functionality_container').addClass('active');
        $('#popup_functionality').show();
    } else if (tabName === 'warmup') {
        $('#select_warmup_container').addClass('active');
        $('#show_warmup_features').show();
        // Inicializar interface de aquecimento
        initializeWarmupInterface();
    } else if (tabName === 'premium') {
        $('#select_premium_container').addClass('active');
        $('#show_premium_features').show();
    }
    
    // Salvar aba ativa no storage
    chrome.storage.local.set({ activeTab: tabName });
}

        // ========================================
        // CONFIGURAÇÃO DE LISTENERS DE NAVEGAÇÃO
        // ========================================
        // Função para configurar os listeners de navegação entre abas
        function setupTabNavigation() {
            console.log("🔧 Configurando navegação entre abas");
            
            // Listener para aba Sender
            $('#select_functionality_container').on('click', function() {
                showTab('functionality');
            });
            
            // Listener para aba Aquecimento de Chip
            $('#select_warmup_container').on('click', function() {
                showTab('warmup');
                initializeWarmupInterface();
            });
            
            // Listener para aba Features
            $('#select_premium_container').on('click', function() {
                showTab('premium');
            });
        }

        // Função para carregar aba salva
        function loadSavedTab() {
            chrome.storage.local.get(['activeTab'], function(result) {
                const savedTab = result.activeTab || 'functionality';
                console.log("📂 Carregando aba salva:", savedTab);
                showTab(savedTab);
            });
        }

        // ========================================
        // SISTEMA DE AQUECIMENTO DE NÚMEROS
        // ========================================
        // Função para inicializar a interface de aquecimento
        function initializeWarmupInterface() {
            console.log("🔥 Inicializando interface de aquecimento");
            
            // Carregar configurações salvas
            loadWarmupSettings();
            
            // Configurar listeners
            setupWarmupListeners();
            
            // Atualizar lista de números
            updateWarmupNumbersList();
            
            // Detectar e configurar número conectado
            detectAndSetupConnectedNumber();
            
            // Carregar dados existentes do número conectado
            loadExistingConnectedNumberData();
            
            // Verificar números para aquecer
            checkWarmupNumbers();
            
            // Inicializar status de conexão como desconectado
            updateWarmupConnectionStatus(false);
            
            // Atualizar informações úteis
            updateDisconnectedStatus();
            
            // Verificar se há campanha ativa no storage e limpar se necessário
            chrome.storage.local.get(['warmupCampaign', 'warmupStatus'], function(result) {
                if (result.warmupCampaign && result.warmupCampaign.status === 'active') {
                    console.log("🧹 Limpando campanha ativa do storage");
                    chrome.storage.local.set({ warmupCampaign: { status: 'stopped' } });
                }
                
                // Limpar status de conexão salvo se existir
                if (result.warmupStatus && result.warmupStatus.connected) {
                    console.log("🧹 Limpando status de conexão salvo");
                    chrome.storage.local.set({ warmupStatus: { connected: false, lastUpdate: new Date().toISOString() } });
                }
            });
            
            // Atualizar status
            updateWarmupStatus();
        }

        // Função para carregar dados existentes do número conectado
        function loadExistingConnectedNumberData() {
            chrome.storage.local.get(['connectedNumberStats'], function(result) {
                if (result.connectedNumberStats && result.connectedNumberStats.number) {
                    console.log("📱 Carregando dados existentes do número conectado:", result.connectedNumberStats);
                    updateConnectedNumberDisplay(result.connectedNumberStats);
                } else {
                    console.log("⚠️ Nenhum dado de número conectado encontrado");
                }
            });
        }
        
        // Função para detectar e configurar número conectado
        function detectAndSetupConnectedNumber() {
            console.log("📱 Detectando número conectado...");
            
            // Solicitar número do WhatsApp Web
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0] && tabs[0].url.includes('web.whatsapp.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'getConnectedNumber'
                    }, function(response) {
                        if (response && response.number) {
                            console.log("✅ Número conectado detectado:", response.number);
                            setupConnectedNumberStats(response.number);
                        } else {
                            console.log("⚠️ Número conectado não detectado");
                            // Tentar método alternativo
                            chrome.storage.local.get(['my_number'], function(result) {
                                if (result.my_number) {
                                    console.log("✅ Número encontrado no storage:", result.my_number);
                                    setupConnectedNumberStats(result.my_number);
                                }
                            });
                        }
                    });
                }
            });
        }
        
        // Função para forçar atualização do display (para debug)
        function forceUpdateDisplay() {
            chrome.storage.local.get(['connectedNumberStats'], function(result) {
                if (result.connectedNumberStats) {
                    updateConnectedNumberDisplay(result.connectedNumberStats);
                    console.log("🔄 Display atualizado forçadamente");
                } else {
                    console.log("⚠️ Nenhum dado para atualizar");
                }
            });
        }
        
        // Tornar função global para debug
        window.forceUpdateDisplay = forceUpdateDisplay;
        function setupConnectedNumberStats(connectedNumber) {
            chrome.storage.local.get(['connectedNumberStats'], function(result) {
                const stats = result.connectedNumberStats || {
                    number: connectedNumber,
                    totalSent: 0,
                    totalReceived: 0,
                    lastActivity: null,
                    firstSeen: new Date().toISOString(),
                    sessions: []
                };
                
                // Atualizar número se mudou
                stats.number = connectedNumber;
                
                // Adicionar sessão atual se não existir
                const currentSession = {
                    startTime: new Date().toISOString(),
                    messagesSent: 0,
                    messagesReceived: 0
                };
                
                stats.sessions.push(currentSession);
                
                chrome.storage.local.set({ 
                    connectedNumberStats: stats,
                    connectedNumber: connectedNumber
                }, function() {
                    updateConnectedNumberDisplay(stats);
                    console.log("📊 Estatísticas do número conectado configuradas");
                });
            });
        }

        // Função para calcular risco de banimento baseado na proporção enviadas/recebidas
        function getBanRisk(totalSent, totalReceived) {
            if (totalSent === 0) return { risk: 'Baixo', color: '#4CAF50', icon: '✅' };
            
            const ratio = totalReceived / totalSent;
            
            if (ratio >= 0.8) {
                return { risk: 'Baixo', color: '#4CAF50', icon: '✅', description: 'Proporção saudável' };
            } else if (ratio >= 0.5) {
                return { risk: 'Médio', color: '#FF9800', icon: '⚠️', description: 'Atenção - enviar menos' };
            } else if (ratio >= 0.3) {
                return { risk: 'Alto', color: '#FF5722', icon: '🚨', description: 'Risco alto - reduzir envios' };
            } else {
                return { risk: 'Crítico', color: '#F44336', icon: '🛑', description: 'PERIGO - risco de ban!' };
            }
        }

        // Função para calcular progresso do aquecimento (0-100%)
        function getWarmingProgress(totalSent) {
            if (totalSent >= 200) return 100;
            return Math.min((totalSent / 200) * 100, 100);
        }

        // Função para calcular mensagens enviadas hoje
        function getTodaySentMessages(stats) {
            if (!stats.sessions || stats.sessions.length === 0) return 0;
            
            const today = new Date().toDateString();
            let todaySent = 0;
            
            stats.sessions.forEach(session => {
                const sessionDate = new Date(session.startTime).toDateString();
                if (sessionDate === today) {
                    todaySent += session.messagesSent || 0;
                }
            });
            
            return todaySent;
        }

        // Função para obter status do chip baseado nas mensagens enviadas
        function getChipStatus(totalSent) {
            if (totalSent < 50) {
                return {
                    status: 'Frio',
                    color: '#2196F3',
                    icon: '❄️',
                    description: 'Chip frio - precisa aquecer mais',
                    dailyGoal: 10,
                    level: 'Álgido'
                };
            } else if (totalSent < 100) {
                return {
                    status: 'Melhorando',
                    color: '#FF9800',
                    icon: '🔥',
                    description: 'Chip melhorando - continue aquecendo',
                    dailyGoal: 20,
                    level: 'Morno'
                };
            } else if (totalSent < 150) {
                return {
                    status: 'Quase Quente',
                    color: '#FF5722',
                    icon: '🌡️',
                    description: 'Chip quase quente - quase lá!',
                    dailyGoal: 30,
                    level: 'Quente'
                };
            } else if (totalSent < 200) {
                return {
                    status: 'Quente',
                    color: '#F44336',
                    icon: '🔥',
                    description: 'Chip quente - funcionando bem!',
                    dailyGoal: 40,
                    level: 'Muito Quente'
                };
            } else {
                return {
                    status: 'Aquecido',
                    color: '#4CAF50',
                    icon: '✅',
                    description: 'Chip totalmente aquecido!',
                    dailyGoal: 50,
                    level: 'Aquecido'
                };
            }
        }

        // Função para atualizar exibição do número conectado
        function updateConnectedNumberDisplay(stats) {
            // Remover painel existente se houver
            $('#connected-number-display').remove();
            
            const chipStatus = getChipStatus(stats.totalSent || 0);
            const progress = Math.round(getWarmingProgress(stats.totalSent || 0) * 10) / 10; // Arredondar para 1 casa decimal
            const todaySent = getTodaySentMessages(stats);
            const dailyProgress = Math.min((todaySent / chipStatus.dailyGoal) * 100, 100);
            
            const displayText = `
                <div id="connected-number-display" style="background: #2d5a2d; padding: 12px; border-radius: 8px; margin: 8px 0;">
                    <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">📱 Número Conectado</div>
                    <div style="color: #fff; font-size: 12px; margin: 2px 0;">Número: ${stats.number}</div>
                    <div style="color: #4CAF50; font-size: 11px; margin: 2px 0;">📤 Enviadas: ${stats.totalSent}</div>
                    
                    <!-- Meta Diária -->
                    <div style="margin: 6px 0; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="color: ${chipStatus.color}; font-size: 11px; font-weight: bold;">
                                🎯 Meta Diária: ${chipStatus.level}
                            </span>
                            <span style="color: #ccc; font-size: 10px;">${todaySent}/${chipStatus.dailyGoal}</span>
                        </div>
                        <div style="background: #444; height: 6px; border-radius: 3px; overflow: hidden;">
                            <div style="background: ${chipStatus.color}; height: 100%; width: ${dailyProgress}%; transition: width 0.3s;"></div>
                        </div>
                        <div style="color: #ccc; font-size: 9px; margin-top: 2px;">${dailyProgress.toFixed(1)}% da meta diária</div>
                    </div>
                    
                    <!-- Status do Chip -->
                    <div style="margin: 6px 0; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="color: ${chipStatus.color}; font-size: 11px; font-weight: bold;">
                                🔥 Status do Chip: ${chipStatus.level}
                            </span>
                            <span style="color: #ccc; font-size: 10px;">${progress}%</span>
                        </div>
                        <div style="color: #ccc; font-size: 9px;">${chipStatus.description}</div>
                        <div style="background: #444; height: 4px; border-radius: 2px; overflow: hidden; margin-top: 4px;">
                            <div style="background: ${chipStatus.color}; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    
                    <div style="color: #ccc; font-size: 10px; margin: 2px 0;">🕐 Última atividade: ${stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Nunca'}</div>
                </div>
            `;
            
            // Inserir antes da lista de números
            $('#warmup_numbers_selection').before(displayText);
        }

        // Função para configurar os listeners do sistema de aquecimento
        function setupWarmupListeners() {
            // Botão de conectar/desconectar
            $('#warmup_toggle_btn').on('click', function() {
                toggleWarmupConnection();
            });
            
            // Botão para adicionar números
            $('#warmup_add_numbers_btn').on('click', function() {
                showAddNumbersModal();
            });
            
            // Botão para upload Excel
            $('#warmup_upload_excel_btn').on('click', function() {
                showUploadExcelModal();
            });
            
            // Seleção de tipo de conversa
            $('.conversation-type-btn').on('click', function() {
                const conversationType = $(this).data('type');
                selectConversationType(conversationType);
            });
            
            // Mudança no intervalo
            $('#warmup_interval').on('change', function() {
                saveWarmupSettings();
            });
            
            // Mudança na duração
            $('#warmup_duration').on('change', function() {
                saveWarmupSettings();
            });
            
        }

        // Função para alternar conexão do aquecimento
        function toggleWarmupConnection() {
            chrome.storage.local.get(['warmupStatus'], function(result) {
                const isConnected = result.warmupStatus && result.warmupStatus.connected;
                
                if (isConnected) {
                    // Desconectar
                    disconnectWarmup();
                } else {
                    // Conectar
                    connectWarmup();
                }
            });
        }

        // Função para conectar o sistema de aquecimento
        function connectWarmup() {
            console.log("🔥 Conectando sistema de aquecimento");
            
            // Verificar se a extensão está ativada
            chrome.storage.local.get(['statusApp'], function(result) {
                if (!result.statusApp || result.statusApp.activation !== 'Ativado') {
                    alert('⚠️ Sistema de aquecimento requer licença ativada!');
                    return;
                }
                
                // Obter números do aquecimento
                chrome.storage.local.get(['warmupNumbers'], function(numberResult) {
                    const numbers = numberResult.warmupNumbers || [];
                    
                    if (numbers.length === 0) {
                        alert('⚠️ Adicione pelo menos um número para aquecer!');
                        return;
                    }
                    
                    // Verificar se um tipo de conversa foi selecionado
                    const selectedConversationType = getSelectedConversationType();
                    if (!selectedConversationType || selectedConversationType === '') {
                        alert('⚠️ Selecione um tipo de conversa antes de ativar o aquecimento!');
                        return;
                    }
                    
                    const settings = getWarmupSettings();
                    settings.numbers = numbers;
                    
                    // Criar modal ANTES de iniciar a campanha
                    console.log("🔥 Criando modal de status...");
                    createWarmupStatusModal();
                    
                    // Aguardar um pouco para o modal ser criado
                    setTimeout(() => {
                        console.log("🚀 Iniciando campanha de aquecimento...");
                        // Iniciar sistema de aquecimento automático
                        startWarmupCampaign(numbers, settings);
                        
                        updateWarmupConnectionStatus(true);
                        console.log("✅ Sistema de aquecimento conectado");
                    }, 500);
                });
            });
        }

        // Função para iniciar campanha de aquecimento
        function startWarmupCampaign(numbers, settings) {
            console.log("🚀 Iniciando campanha de aquecimento:", numbers);
            
            // Salvar configurações da campanha
            chrome.storage.local.set({
                warmupCampaign: {
                    numbers: numbers,
                    settings: settings,
                    startTime: new Date().toISOString(),
                    status: 'active'
                }
            });
            
            // Iniciar envio automático
            scheduleWarmupMessages(numbers, settings);
        }

        // Variáveis globais para controle do progresso
        let warmupProgressInterval = null;
        let nextMessageTime = null;
        let countdownInterval = null;

        // Função para atualizar barra de progresso
        function updateWarmupProgress() {
            if (!nextMessageTime) return;
            
            const now = Date.now();
            const timeUntilNext = nextMessageTime - now;
            
            if (timeUntilNext <= 0) {
                if ($('#progress-bar').length > 0) {
                    $('#progress-bar').css('width', '100%');
                    $('#progress-text').text('Enviando mensagem...');
                    $('#next-message-countdown').text('0s');
                }
                return;
            }
            
            // Calcular progresso baseado no intervalo configurado
            chrome.storage.local.get(['warmupSettings'], function(result) {
                const settings = result.warmupSettings || {};
                const intervalMs = (settings.interval || 1) * 60 * 1000; // Converter minutos para ms
                const progress = Math.max(0, Math.min(100, ((intervalMs - timeUntilNext) / intervalMs) * 100));
                
                if ($('#progress-bar').length > 0) {
                    $('#progress-bar').css('width', progress + '%');
                    $('#progress-text').text(`Aguardando próxima mensagem...`);
                }
            });
        }

        // Função para iniciar contador regressivo
        function startCountdown() {
            if (countdownInterval) clearInterval(countdownInterval);
            
            countdownInterval = setInterval(() => {
                if (!nextMessageTime) return;
                
                const now = Date.now();
                const timeUntilNext = nextMessageTime - now;
                
                if (timeUntilNext <= 0) {
                    if ($('#next-message-countdown').length > 0) {
                        $('#next-message-countdown').text('0s');
                    }
                    clearInterval(countdownInterval);
                    return;
                }
                
                const seconds = Math.ceil(timeUntilNext / 1000);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                
                if ($('#next-message-countdown').length > 0) {
                    if (minutes > 0) {
                        $('#next-message-countdown').text(`${minutes}m ${remainingSeconds}s`);
                    } else {
                        $('#next-message-countdown').text(`${remainingSeconds}s`);
                    }
                }
            }, 1000);
        }

        // Função para agendar próxima mensagem
        function scheduleNextMessage(intervalMinutes) {
            nextMessageTime = Date.now() + (intervalMinutes * 60 * 1000);
            
            // Iniciar atualizações de progresso
            if (warmupProgressInterval) clearInterval(warmupProgressInterval);
            warmupProgressInterval = setInterval(updateWarmupProgress, 1000);
            
            // Iniciar contador regressivo
            startCountdown();
            
            updateWarmupProgress();
        }

        // Função para criar modal de status do aquecimento (igual ao sistema atual)
        function createWarmupStatusModal() {
            // Verificar se o modal já existe
            if ($('#warmup-status-modal').length > 0) {
                console.log("⚠️ Modal já existe, removendo anterior");
                $('#warmup-status-modal').remove();
            }
            
            const modal = `
                <div id="warmup-status-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; width: 500px; max-width: 90%; max-height: 80%; overflow-y: auto;">
                        <div style="color: #fff; font-weight: bold; margin-bottom: 16px; text-align: center; font-size: 18px;">
                            🔥 Aquecimento de Números - Sender
                        </div>
                        
                        <!-- Aviso importante -->
                        <div style="background: #ff9800; color: #000; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-weight: bold; text-align: center;">
                            ⚠️ IMPORTANTE: Mantenha esta aba aberta para continuar o aquecimento!
                        </div>
                        
                        <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #fff; margin: 0 0 10px 0;">📊 Status da Campanha</h3>
                            <p style="color: #ccc; margin: 5px 0;"><strong>Status:</strong> <span id="campaign-status" style="color: #4CAF50;">Ativo</span></p>
                            <p style="color: #ccc; margin: 5px 0;"><strong>Números:</strong> <span id="numbers-count">0</span></p>
                            <p style="color: #ccc; margin: 5px 0;"><strong>Mensagens Enviadas:</strong> <span id="messages-sent">0</span></p>
                            <p style="color: #ccc; margin: 5px 0;"><strong>Última Atividade:</strong> <span id="last-activity">Nunca</span></p>
                        </div>
                        
                        <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #fff; margin: 0 0 10px 0;">⏰ Progresso</h3>
                            <div style="background: #444; height: 20px; border-radius: 10px; overflow: hidden;">
                                <div id="progress-bar" style="background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 50%, #CDDC39 100%); height: 100%; width: 0%; transition: width 0.3s;"></div>
                            </div>
                            <p id="progress-text" style="color: #ccc; margin: 10px 0 0 0;">Iniciando campanha...</p>
                            <p id="progress-details" style="color: #888; margin: 5px 0 0 0; font-size: 11px;">Próxima mensagem em: <span id="next-message-countdown">--</span></p>
                        </div>
                        
                        <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="color: #fff; margin: 0 0 10px 0;">📝 Log de Atividades</h3>
                            <div id="activity-log" style="background: #222; padding: 10px; border-radius: 4px; height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px;">
                                <div style="color: #2196F3;">[INFO] Sistema de aquecimento iniciado</div>
                            </div>
                        </div>
                        
                        <div style="text-align: center;">
                            <button id="close-warmup-modal" style="background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                                ⏹️ Parar Aquecimento
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modal);
            console.log("✅ Modal de status adicionado ao DOM");
            
            // Listener para fechar modal
            $('#close-warmup-modal').on('click', function() {
                // Parar campanha de aquecimento
                chrome.storage.local.set({ warmupCampaign: { status: 'stopped' } });
                
                // Limpar intervalos de progresso
                if (warmupProgressInterval) {
                    clearInterval(warmupProgressInterval);
                    warmupProgressInterval = null;
                }
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                }
                
                // Atualizar status de conexão para desconectado
                updateWarmupConnectionStatus(false);
                
                // Fechar modal
                $('#warmup-status-modal').remove();
                
                console.log("🛑 Aquecimento parado pelo usuário");
            });
            
            // Inicializar valores do modal
            initializeWarmupModal();
            
            console.log("✅ Modal de status do aquecimento criado");
        }

        // Função para agendar mensagens de aquecimento
        function scheduleWarmupMessages(numbers, settings) {
            const interval = settings.interval * 60 * 1000; // Converter para ms
            const conversationType = settings.conversationType;
            
            console.log(`⏰ Agendando mensagens a cada ${settings.interval} minutos`);
            
            // Agendar próxima mensagem para mostrar progresso
            scheduleNextMessage(settings.interval);
            
            // Função para enviar próxima mensagem
            function sendNextWarmupMessage() {
                chrome.storage.local.get(['warmupCampaign'], function(result) {
                    if (!result.warmupCampaign || result.warmupCampaign.status !== 'active') {
                        console.log("🛑 Campanha de aquecimento pausada");
                        return;
                    }
                    
                    // Selecionar número aleatório
                    const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
                    
                    // Obter mensagem do vasco
                    const message = getWarmupMessage(conversationType);
                    
                    console.log(`📤 Enviando mensagem de aquecimento para ${randomNumber}: ${message}`);
                    
                    // Usar sistema de envio existente
                    sendWarmupMessage(randomNumber, message);
                    
                    // Agendar próxima mensagem
                    setTimeout(() => {
                        // Reiniciar progresso para próxima mensagem
                        scheduleNextMessage(settings.interval);
                        sendNextWarmupMessage();
                    }, interval);
                });
            }
            
            // Iniciar primeira mensagem imediatamente
            setTimeout(sendNextWarmupMessage, 1000); // 1 segundo para garantir que o modal abriu
        }

        // Função para obter mensagem do vasco
        // Variáveis para controle de mensagens
        let messageIndex = {};
        let messageCount = {};

        // Função para obter mensagem do vasco com rotação
        function getWarmupMessage(conversationType) {
            // Inicializar contadores se não existirem
            if (!messageIndex[conversationType]) {
                messageIndex[conversationType] = 0;
                messageCount[conversationType] = 0;
            }
            
            // Importar vasco de conversas
            if (typeof conversationBanks !== 'undefined' && conversationBanks[conversationType]) {
                const bank = conversationBanks[conversationType];
                
                // Se chegou ao final da lista, reiniciar
                if (messageIndex[conversationType] >= bank.messages.length) {
                    messageIndex[conversationType] = 0;
                    console.log(`🔄 Reiniciando lista de mensagens para ${conversationType}`);
                }
                
                const message = bank.messages[messageIndex[conversationType]];
                messageIndex[conversationType]++;
                messageCount[conversationType]++;
                
                console.log(`📝 Mensagem ${messageCount[conversationType]} de ${conversationType}: ${message}`);
                return message;
            }
            
            // Fallback para mensagens padrão
            const defaultMessages = {
                business: [
                    "Oi! Como você está?",
                    "Olá! Tudo bem?",
                    "Oi! Como foi seu dia?",
                    "Olá! O que você está fazendo?",
                    "Oi! Como está indo?",
                    "Olá! Tudo certo?",
                    "Oi! Como tem passado?",
                    "Olá! Como vai?",
                    "Oi! Tudo tranquilo?",
                    "Olá! Como está?"
                ],
                social: [
                    "Oi! Como você está?",
                    "Olá! Tudo bem?",
                    "Oi! Como foi seu dia?",
                    "Olá! O que você está fazendo?",
                    "Oi! Como está indo?",
                    "Olá! Tudo certo?",
                    "Oi! Como tem passado?",
                    "Olá! Como vai?",
                    "Oi! Tudo tranquilo?",
                    "Olá! Como está?"
                ],
                customer: [
                    "Olá! Precisa de algum produto?",
                    "Oi! Tem alguma dúvida?",
                    "Olá! Como posso ajudar?",
                    "Oi! Precisa de informações?",
                    "Olá! Tem interesse em nossos produtos?",
                    "Oi! Posso te ajudar com algo?",
                    "Olá! Tem alguma pergunta?",
                    "Oi! Precisa de suporte?",
                    "Olá! Como posso te auxiliar?",
                    "Oi! Tem alguma necessidade?"
                ],
                support: [
                    "Olá! Como posso ajudar?",
                    "Oi! Precisa de suporte?",
                    "Olá! Tem alguma dúvida?",
                    "Oi! Como posso ser útil?",
                    "Olá! Posso te auxiliar?",
                    "Oi! Tem alguma pergunta?",
                    "Olá! Como posso ajudar hoje?",
                    "Oi! Precisa de assistência?",
                    "Olá! Posso ser útil?",
                    "Oi! Como posso te ajudar?"
                ]
            };
            
            const messages = defaultMessages[conversationType] || defaultMessages.social;
            
            // Se chegou ao final da lista, reiniciar
            if (messageIndex[conversationType] >= messages.length) {
                messageIndex[conversationType] = 0;
                console.log(`🔄 Reiniciando lista padrão para ${conversationType}`);
            }
            
            const message = messages[messageIndex[conversationType]];
            messageIndex[conversationType]++;
            messageCount[conversationType]++;
            
            console.log(`📝 Mensagem padrão ${messageCount[conversationType]} de ${conversationType}: ${message}`);
            return message;
        }

        // Função para enviar mensagem usando sistema existente
        function sendWarmupMessage(number, message) {
            console.log(`📤 Enviando mensagem de aquecimento para ${number}: ${message}`);
            
            // Usar sistema de envio direto via content script (igual ao sistema atual)
            const cleanNumber = number.replace(/\D/g, '');
            const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : '55' + cleanNumber;
            
            console.log(`📱 Número formatado: ${formattedNumber}`);
            
            // Enviar para content script usar o sistema de envio existente
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0] && tabs[0].url.includes('web.whatsapp.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'sendWarmupMessage',
                        number: formattedNumber,
                        message: message
                    }, function(response) {
                        if (response && response.success) {
                            console.log("✅ Mensagem de aquecimento enviada via content script");
                            updateWarmupStats(formattedNumber);
                        } else {
                            console.error("❌ Erro ao enviar mensagem de aquecimento");
                        }
                    });
                } else {
                    console.log("❌ WhatsApp Web não está aberto");
                }
            });
        }

        // Função para enviar via content script como fallback
        function sendWarmupMessageViaContentScript(number, message) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'sendWarmupMessage',
                    number: number,
                    message: message
                }, function(response) {
                    if (response && response.success) {
                        console.log("✅ Mensagem enviada via content script");
                        updateWarmupStats(number);
                    } else {
                        console.error("❌ Erro ao enviar via content script");
                    }
                });
            });
        }

        // Função alternativa para envio de mensagem
        function sendWarmupMessageAlternative(number, message) {
            console.log(`📤 Método alternativo para ${number}: ${message}`);
            
            // Usar o sistema de envio existente do popup
            if (typeof sendMessageToNumber !== 'undefined') {
                sendMessageToNumber(number, message).then(result => {
                    console.log("✅ Mensagem enviada via método alternativo:", result);
                    updateWarmupStats(number);
                }).catch(error => {
                    console.error("❌ Erro no método alternativo:", error);
                });
            } else {
                console.error("❌ Sistema de envio não disponível");
            }
        }

        // Função para atualizar estatísticas
        // Função para atualizar estatísticas (geral e por número)
        function updateWarmupStats(number) {
            chrome.storage.local.get(['warmupStats', 'warmupStatsByNumber', 'connectedNumberStats'], function(result) {
                // Atualizar estatísticas gerais
                const stats = result.warmupStats || {
                    totalSent: 0,
                    lastActivity: null,
                    totalResponses: 0,
                    uniqueContacts: 0,
                    todayResponses: 0,
                    uptime: 0
                };
                
                stats.totalSent = (stats.totalSent || 0) + 1;
                stats.lastActivity = new Date().toISOString();
                
                // Atualizar estatísticas por número
                const statsByNumber = result.warmupStatsByNumber || {};
                if (number) {
                    if (!statsByNumber[number]) {
                        statsByNumber[number] = {
                            sent: 0,
                            lastSent: null,
                            firstSent: null
                        };
                    }
                    statsByNumber[number].sent = (statsByNumber[number].sent || 0) + 1;
                    statsByNumber[number].lastSent = new Date().toISOString();
                    if (!statsByNumber[number].firstSent) {
                        statsByNumber[number].firstSent = new Date().toISOString();
                    }
                }
                
                // Atualizar estatísticas do número conectado
                const connectedStats = result.connectedNumberStats || {};
                if (connectedStats.number) {
                    connectedStats.totalSent = (connectedStats.totalSent || 0) + 1;
                    connectedStats.lastActivity = new Date().toISOString();
                    
                    // Atualizar sessão atual
                    if (connectedStats.sessions && connectedStats.sessions.length > 0) {
                        const currentSession = connectedStats.sessions[connectedStats.sessions.length - 1];
                        currentSession.messagesSent = (currentSession.messagesSent || 0) + 1;
                    }
                }
                
                chrome.storage.local.set({ 
                    warmupStats: stats,
                    warmupStatsByNumber: statsByNumber,
                    connectedNumberStats: connectedStats
                }, function() {
                    updateWarmupStatus();
                    updateWarmupModal(stats);
                    updateWarmupNumbersList(); // Atualizar lista com estatísticas
                });
            });
        }

        // Função para atualizar modal de aquecimento
        function updateWarmupModal(stats) {
            // Atualizar contadores no modal
            $('#messages-sent').text(stats.totalSent || 0);
            $('#last-activity').text(stats.lastActivity ? new Date(stats.lastActivity).toLocaleTimeString() : 'Nunca');
            
            // Atualizar contador de números
            chrome.storage.local.get(['warmupNumbers'], function(result) {
                const numbers = result.warmupNumbers || [];
                $('#numbers-count').text(numbers.length);
            });
            
            // Adicionar log de atividade apenas se o modal existir
            if ($('#activity-log').length > 0) {
                const timestamp = new Date().toLocaleTimeString();
                const logEntry = `<div style="color: #4CAF50;">[${timestamp}] Mensagem enviada - Total: ${stats.totalSent || 0}</div>`;
                $('#activity-log').append(logEntry);
                
                // Scroll para baixo no log
                const logContainer = $('#activity-log')[0];
                if (logContainer) {
                    logContainer.scrollTop = logContainer.scrollHeight;
                }
            }
        }

        // Função para adicionar log inicial
        function addInitialLog() {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = `<div style="color: #2196F3;">[${timestamp}] Primeira mensagem será enviada em 1 segundo...</div>`;
            
            // Verificar se o modal existe antes de adicionar log
            if ($('#activity-log').length > 0) {
                $('#activity-log').append(logEntry);
                
                // Scroll para baixo no log
                const logContainer = $('#activity-log')[0];
                if (logContainer) {
                    logContainer.scrollTop = logContainer.scrollHeight;
                }
            }
        }

        // Função para inicializar modal de aquecimento
        function initializeWarmupModal() {
            // Carregar estatísticas atuais
            chrome.storage.local.get(['warmupStats', 'warmupNumbers'], function(result) {
                const stats = result.warmupStats || { totalSent: 0, lastActivity: null };
                const numbers = result.warmupNumbers || [];
                
                // Atualizar valores iniciais
                $('#messages-sent').text(stats.totalSent || 0);
                $('#last-activity').text(stats.lastActivity ? new Date(stats.lastActivity).toLocaleTimeString() : 'Nunca');
                $('#numbers-count').text(numbers.length);
                
                // Adicionar log inicial
                addInitialLog();
            });
        }

        // Função para desconectar o sistema de aquecimento
        function disconnectWarmup() {
            console.log("🔥 Desconectando sistema de aquecimento");
            
            // Parar campanha de aquecimento
            chrome.storage.local.set({
                warmupCampaign: {
                    status: 'stopped'
                }
            });
            
            // Limpar intervalos de progresso
            if (warmupProgressInterval) {
                clearInterval(warmupProgressInterval);
                warmupProgressInterval = null;
            }
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            
            // Fechar modal se estiver aberto
            $('#warmup-status-modal').remove();
            
            // Atualizar status de conexão
            updateWarmupConnectionStatus(false);
            console.log("✅ Sistema de aquecimento desconectado");
        }

        // Função para atualizar informações úteis quando desconectado
        function updateDisconnectedStatus() {
            chrome.storage.local.get(['warmupNumbers', 'warmupSettings'], function(result) {
                const numbersCount = result.warmupNumbers ? result.warmupNumbers.length : 0;
                const hasSettings = result.warmupSettings && result.warmupSettings.interval && result.warmupSettings.conversationType;
                const hasConversationType = getSelectedConversationType() !== null;
                
                $('#warmup_numbers_count').text(numbersCount);
                
                if (hasSettings && hasConversationType) {
                    $('#warmup_settings_status').text('Configurado');
                } else {
                    $('#warmup_settings_status').text('Não configurado');
                }
                
                if (numbersCount === 0) {
                    $('#warmup_tip').text('Adicione números para começar o aquecimento');
                } else if (!hasConversationType) {
                    $('#warmup_tip').text('Selecione um tipo de conversa');
                } else if (!hasSettings) {
                    $('#warmup_tip').text('Configure intervalo e duração');
                } else {
                    $('#warmup_tip').text('Pronto para ativar o aquecimento!');
                }
            });
        }
        
        // Função para atualizar status da conexão
        function updateWarmupConnectionStatus(connected) {
            const statusIndicator = $('#warmup_status_indicator');
            const statusText = $('#warmup_status_text');
            const toggleBtn = $('#warmup_toggle_btn');
            
            if (connected) {
                statusIndicator.css('background', '#4CAF50');
                statusText.text('Conectado');
                toggleBtn.text('Desconectar').css('background', '#ff4444');
            } else {
                statusIndicator.css('background', '#ff4444');
                statusText.text('Desconectado');
                toggleBtn.text('Ativar Aquecimento').css('background', '#4CAF50');
                
                // Atualizar informações úteis quando desconectado
                updateDisconnectedStatus();
            }
            
            // Salvar status
            chrome.storage.local.set({
                warmupStatus: {
                    connected: connected,
                    lastUpdate: new Date().toISOString()
                }
            });
            
            // Verificar se há números para aquecer
            checkWarmupNumbers();
        }

        // Função para verificar se há números para aquecer
        function checkWarmupNumbers() {
            chrome.storage.local.get(['warmupNumbers'], function(result) {
                const numbers = result.warmupNumbers || [];
                const toggleBtn = $('#warmup_toggle_btn');
                
                if (numbers.length > 0) {
                    // Há números - botão ativo
                    toggleBtn.prop('disabled', false).css('opacity', '1');
                } else {
                    // Não há números - botão desabilitado
                    toggleBtn.prop('disabled', true).css('opacity', '0.5');
                }
            });
        }

        // Função para selecionar tipo de conversa
        function selectConversationType(type) {
            console.log("💬 Selecionando tipo de conversa:", type);
            
            // Remover seleção anterior
            $('.conversation-type-btn').css('opacity', '0.7');
            
            // Destacar seleção atual
            $(`.conversation-type-btn[data-type="${type}"]`).css('opacity', '1');
            
            // Atualizar display
            const typeNames = {
                business: "🏢 Negócios/Vendas",
                social: "👥 Social/Amigos", 
                customer: "🛒 Clientes/Produtos",
                support: "📞 Suporte/Atendimento"
            };
            
            $('#selected_conversation_type').text(typeNames[type] || 'Tipo não encontrado');
            
            // Salvar configurações
            saveWarmupSettings();
            
            // Atualizar informações úteis
            updateDisconnectedStatus();
        }

        // Função para mostrar modal de adicionar números
        function showAddNumbersModal() {
            // Limpar completamente qualquer modal anterior
            clearAddNumbersModal();
            
            // Aguardar um pouco para garantir que o modal anterior foi removido
            setTimeout(() => {
                createAddNumbersModal();
            }, 100);
        }

        function createAddNumbersModal() {
            const modal = `
                <div id="warmup-add-numbers-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%;">
                        <div style="color: #fff; font-weight: bold; margin-bottom: 16px; text-align: center;">📱 Adicionar Números para Aquecimento</div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="color: #ccc; font-size: 12px; display: block; margin-bottom: 8px;">Digite os números (um por linha):</label>
                            <textarea id="warmup_numbers_input" rows="8" style="width: 100%; padding: 12px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; resize: vertical; font-family: monospace; font-size: 12px;" placeholder="Digite os números aqui (um por linha):&#10;+5511999999999&#10;+5511888888888&#10;11999999999&#10;11888888888&#10;&#10;Você pode colar uma lista inteira de números!"></textarea>
                            <div style="color: #888; font-size: 10px; margin-top: 4px;">💡 Dica: Você pode colar uma lista inteira de números de uma vez!</div>
                        </div>
                        
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button id="warmup-add-numbers-confirm" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                                ✅ Adicionar
                            </button>
                            <button id="warmup-add-numbers-cancel" style="background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modal);
            
            // Listeners
            $('#warmup-add-numbers-confirm').on('click', function() {
                console.log("🔘 Botão Adicionar clicado");
                const numbersText = $('#warmup_numbers_input').val() || '';
                console.log("📝 Texto digitado:", numbersText);
                
                const numbers = numbersText.split('\n')
                    .filter(n => n.trim())
                    .map(n => n.trim().replace(/\D/g, ''))
                    .filter(n => n.length >= 10);
                console.log("📱 Números processados:", numbers);
                
                if (numbers.length > 0) {
                    console.log("✅ Adicionando números:", numbers);
                    addWarmupNumbers(numbers);
                    // Usar função de limpeza completa
                    clearAddNumbersModal();
                    console.log("✅ Modal fechado completamente");
                } else {
                    console.log("⚠️ Nenhum número encontrado no texto:", numbersText);
                    alert('Por favor, digite pelo menos um número!');
                }
            });
            
            $('#warmup-add-numbers-cancel').on('click', function() {
                console.log("🔘 Botão Cancelar clicado");
                // Usar função de limpeza completa
                clearAddNumbersModal();
                console.log("✅ Modal cancelado e fechado completamente");
            });
            
            // Listener para detectar paste no textarea
            $('#warmup_numbers_input').on('paste', function(e) {
                console.log("📋 Paste detectado no textarea");
                setTimeout(() => {
                    const text = $(this).val();
                    console.log("📋 Texto colado:", text);
                }, 100);
            });
            
            // Focar no textarea automaticamente
            setTimeout(() => {
                $('#warmup_numbers_input').focus();
                console.log("✅ Modal de adicionar números criado e focado");
            }, 100);
        }

        // Função para limpar completamente o modal
        function clearAddNumbersModal() {
            console.log("🧹 Limpando modal de adicionar números");
            $('#warmup-add-numbers-modal').remove();
            // Limpar qualquer listener que possa ter ficado
            $('#warmup_numbers_input').off();
            $('#warmup-add-numbers-confirm').off();
            $('#warmup-add-numbers-cancel').off();
        }

        // Função para mostrar modal de upload Excel
        function showUploadExcelModal() {
            const modal = `
                <div id="warmup-upload-excel-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%;">
                        <div style="color: #fff; font-weight: bold; margin-bottom: 16px; text-align: center;">📊 Upload Excel para Aquecimento</div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="color: #ccc; font-size: 12px; display: block; margin-bottom: 8px;">Selecione o arquivo Excel/CSV:</label>
                            <input type="file" id="warmup-excel-file" accept=".xlsx,.xls,.csv" style="width: 100%; padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="color: #ccc; font-size: 12px; display: block; margin-bottom: 8px;">Coluna com os números:</label>
                            <select id="warmup-excel-column" style="width: 100%; padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;">
                                <option value="telefone">Telefone</option>
                                <option value="numero">Número</option>
                                <option value="phone">Phone</option>
                                <option value="celular">Celular</option>
                            </select>
                        </div>
                        
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button id="warmup-upload-excel-confirm" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                                📊 Upload
                            </button>
                            <button id="warmup-upload-excel-cancel" style="background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modal);
            
            // Listeners
            $('#warmup-upload-excel-confirm').on('click', function() {
                const file = $('#warmup-excel-file')[0].files[0];
                const column = $('#warmup-excel-column').val();
                
                if (file) {
                    processWarmupExcelFile(file, column);
                    $('#warmup-upload-excel-modal').remove();
                } else {
                    alert('Por favor, selecione um arquivo!');
                }
            });
            
            $('#warmup-upload-excel-cancel').on('click', function() {
                $('#warmup-upload-excel-modal').remove();
            });
        }

        // Função para adicionar números ao aquecimento
        function addWarmupNumbers(numbers) {
            console.log("📱 Função addWarmupNumbers chamada com:", numbers);
            chrome.storage.local.get(['warmupNumbers'], function(result) {
                const existingNumbers = result.warmupNumbers || [];
                console.log("📱 Números existentes:", existingNumbers);
                const newNumbers = [...new Set([...existingNumbers, ...numbers])]; // Remove duplicatas
                console.log("📱 Novos números (sem duplicatas):", newNumbers);
                
                chrome.storage.local.set({ warmupNumbers: newNumbers }, function() {
                    console.log("📱 Números salvos no storage");
                    updateWarmupNumbersList();
                    console.log("📱 Lista de números atualizada");
                });
            });
        }

        // Função para processar arquivo Excel
        function processWarmupExcelFile(file, column) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    const numbers = jsonData.map(row => {
                        const phone = row[column] || row['telefone'] || row['numero'] || row['phone'] || row['celular'];
                        return phone ? phone.toString().replace(/\D/g, '') : null;
                    }).filter(n => n && n.length >= 10);
                    
                    if (numbers.length > 0) {
                        addWarmupNumbers(numbers);
                    } else {
                        alert('Nenhum número válido encontrado no arquivo!');
                    }
                } catch (error) {
                    console.error('Erro ao processar Excel:', error);
                    alert('Erro ao processar arquivo Excel!');
                }
            };
            reader.readAsBinaryString(file);
        }

        // Função para atualizar lista de números
        function updateWarmupNumbersList() {
            chrome.storage.local.get(['warmupNumbers', 'warmupStatsByNumber'], function(result) {
                const numbers = result.warmupNumbers || [];
                const statsByNumber = result.warmupStatsByNumber || {};
                const listContainer = $('#warmup_numbers_list');
                
                if (numbers.length === 0) {
                    listContainer.html('<div style="color: #ccc; font-size: 11px; text-align: center; padding: 20px;">Nenhum número selecionado</div>');
                } else {
                    let html = '';
                    numbers.forEach((number, index) => {
                        const stats = statsByNumber[number] || { sent: 0, lastSent: null };
                        const lastSentText = stats.lastSent ? new Date(stats.lastSent).toLocaleTimeString() : 'Nunca';
                        
                        html += `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #444; margin: 2px 0; border-radius: 4px;">
                                <div style="flex: 1;">
                                    <div style="color: #fff; font-size: 11px;">${number}</div>
                                    <div style="color: #4CAF50; font-size: 9px;">📤 ${stats.sent} enviadas | 🕐 ${lastSentText}</div>
                                </div>
                                <button class="remove-warmup-number" data-index="${index}" style="background: #f44336; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;">×</button>
                            </div>
                        `;
                    });
                    listContainer.html(html);
                    
                    // Listener para remover números
                    $('.remove-warmup-number').on('click', function() {
                        const index = $(this).data('index');
                        removeWarmupNumber(index);
                    });
                }
                
                // Atualizar contador
                $('#warmup_numbers_count').text(numbers.length);
                $('#warmup_numbers_total_count').text(`${numbers.length} números`);
                
                // Atualizar informações úteis quando desconectado
                updateDisconnectedStatus();
                
                // Verificar se há números para aquecer
                checkWarmupNumbers();
            });
        }

        // Função para remover número
        function removeWarmupNumber(index) {
            chrome.storage.local.get(['warmupNumbers'], function(result) {
                const numbers = result.warmupNumbers || [];
                numbers.splice(index, 1);
                
                chrome.storage.local.set({ warmupNumbers: numbers }, function() {
                    updateWarmupNumbersList();
                });
            });
        }

        // Função para obter configurações do aquecimento
        function getWarmupSettings() {
            return {
                interval: parseInt($('#warmup_interval').val()) || 5,
                duration: parseInt($('#warmup_duration').val()) || 7,
                conversationType: getSelectedConversationType()
            };
        }

        // Função para obter números do aquecimento
        function getWarmupNumbers() {
            return new Promise((resolve) => {
                chrome.storage.local.get(['warmupNumbers'], function(result) {
                    resolve(result.warmupNumbers || []);
                });
            });
        }

        // Função para obter tipo de conversa selecionado
        function getSelectedConversationType() {
            const selectedBtn = $('.conversation-type-btn[style*="opacity: 1"]');
            if (selectedBtn.length > 0) {
                return selectedBtn.data('type');
            }
            
            // Verificar se há algum botão com opacity 1 (selecionado)
            const allBtns = $('.conversation-type-btn');
            for (let i = 0; i < allBtns.length; i++) {
                const btn = $(allBtns[i]);
                const opacity = btn.css('opacity');
                if (opacity === '1' || opacity === 1) {
                    return btn.data('type');
                }
            }
            
            // Se nenhum estiver selecionado, retornar null
            return null;
        }

        // Função para salvar configurações do aquecimento
        function saveWarmupSettings() {
            const settings = getWarmupSettings();
            chrome.storage.local.set({
                warmupSettings: settings
            });
        }

        // Função para carregar configurações do aquecimento
        function loadWarmupSettings() {
            chrome.storage.local.get(['warmupSettings'], function(result) {
                if (result.warmupSettings) {
                    const settings = result.warmupSettings;
                    $('#warmup_interval').val(settings.interval || 5);
                    $('#warmup_duration').val(settings.duration || 7);
                    
                    // Selecionar tipo de conversa
                    if (settings.conversationType) {
                        selectConversationType(settings.conversationType);
                    } else {
                        // Selecionar social por padrão
                        selectConversationType('social');
                    }
                } else {
                    // Configurações padrão
                    selectConversationType('social');
                }
            });
        }

        // Função para atualizar status do aquecimento
        function updateWarmupStatus() {
            chrome.storage.local.get(['warmupStatus', 'warmupStats', 'warmupStatsByNumber'], function(result) {
                // Atualizar status de conexão
                if (result.warmupStatus) {
                    updateWarmupConnectionStatus(result.warmupStatus.connected);
                }
                
                // Atualizar estatísticas
                if (result.warmupStats) {
                    const stats = result.warmupStats;
                    $('#warmup_total_responses').text(stats.totalSent || 0);
                    $('#warmup_unique_contacts').text(Object.keys(result.warmupStatsByNumber || {}).length);
                    
                    // Calcular respostas de hoje
                    const today = new Date().toDateString();
                    let todayResponses = 0;
                    if (result.warmupStatsByNumber) {
                        Object.values(result.warmupStatsByNumber).forEach(numberStats => {
                            if (numberStats.lastSent) {
                                const lastSentDate = new Date(numberStats.lastSent).toDateString();
                                if (lastSentDate === today) {
                                    todayResponses += numberStats.sent || 0;
                                }
                            }
                        });
                    }
                    $('#warmup_today_responses').text(todayResponses);
                    
                    // Calcular tempo ativo (baseado na primeira atividade)
                    let uptime = 0;
                    if (result.warmupStatsByNumber) {
                        const firstActivity = Object.values(result.warmupStatsByNumber)
                            .map(s => s.firstSent)
                            .filter(s => s)
                            .sort()[0];
                        if (firstActivity) {
                            uptime = Math.floor((Date.now() - new Date(firstActivity).getTime()) / 1000);
                        }
                    }
                    $('#warmup_uptime').text(formatUptime(uptime));
                }
            });
        }

        // Função para formatar tempo de atividade
        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        // Listener para mensagens do runtime (aquecimento)
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'updateWarmupPhone') {
                $('#warmup_phone_number').text(request.phoneNumber || 'Não detectado');
            }
        });

$(document).ready(async function () {
    // show version of extension in popup from manifest file
    const manifest = chrome.runtime.getManifest();
    const version = manifest.version;
    document.getElementById('extension-version').textContent = version;

        // Configurar navegação entre abas
        setupTabNavigation();
        
        // Carregar aba salva
        loadSavedTab();

        // Função para mostrar notificação de mensagem recebida
        function showReceivedMessageNotification(count) {
            // Criar notificação temporária
            const notification = $(`
                <div id="received-message-notification" style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #4CAF50;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 10000;
                    font-weight: bold;
                    animation: slideInRight 0.3s ease-out;
                ">
                    📥 ${count} mensagem(ns) recebida(s)!
                </div>
            `);
            
            // Adicionar CSS para animação
            if (!$('#notification-styles').length) {
                $('head').append(`
                    <style id="notification-styles">
                        @keyframes slideInRight {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                        @keyframes slideOutRight {
                            from { transform: translateX(0); opacity: 1; }
                            to { transform: translateX(100%); opacity: 0; }
                        }
                    </style>
                `);
            }
            
            $('body').append(notification);
            
            // Remover após 3 segundos
            setTimeout(() => {
                notification.css('animation', 'slideOutRight 0.3s ease-in');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
        }

    // Listener para mensagens recebidas removido - focando apenas nas enviadas

    // Atualizar dias restantes a cada minuto
    setInterval(updateDaysRemaining, 60000); // 60 segundos

    chrome.storage.local.get(['country_info', 'popup_numbers'], (res) => {
        // Get Country Info and add Country Code Selector
        country_info = res.country_info || { name: 'India', name_code: 'IN', dial_code: '91' };
        addCountryCodeSelector();

        // Get Popup Numbers and set it
        popup_numbers = res.popup_numbers || '';
        replaceNumbers(popup_numbers);
    });

    // Add new number tags
    $('#numbers-input').on('blur keydown keyup', function (event) {
        if (event.keyCode && ![13, 188].includes(event.keyCode)) return;

        const numbers_str = $(this).val();
        $(this).val('');
        addNumberTags(numbers_str);
    });

    // Edit number tag
    $('#numbers-display').on('click', '.number', function () {
        const numberTag = $(this);
        editNumberTag(numberTag);
    });

    // Delete number tag
    $('#numbers-display').on('click', '.delete-number-tag', function () {
        $(this).parent('.number-tag').remove();
        let deleted_num=$(this).parent('.number-tag').children().text()
        for(let i=0;i<csv_data.length;i++){
            if(csv_data[i][0] && csv_data[i][0].toString().includes(deleted_num)){
                csv_data.splice(i,1);
                break;
            }
        }
        chrome.storage.local.set({ csv_data: csv_data });
        updateNumbersAndDisplay();
        
        // adding upload excel text if number tag is not present
        toggleUploadExcelText(true);
    });

    // Focus numbers-input if user clicks on blank space
    $('#numbers-display').on('click', function (e) {
        const ele = $(e.target);
        if (ele && !ele.is('.number, .delete-number-tag, .number-tag-input')) {
            $('#numbers-input').focus();
        }
    })

    // Delete all number tags
    $('#delete-all-numbers').on('click', async function () {
        let msg = await translate('Are you sure, you want to delete all numbers?');
        const __confirm = confirm(msg);
        if (__confirm) {
            replaceNumbers('');
            unset_csv_styles();
            hideCustomizationContainer();
            toggleUploadExcelText(true);
        }
    });

    $("#groups_container").on('scroll',function(){
        const dropdownContainer = document.getElementById('groups_container');
        let visibleElementsCount = $('#groups_container .dropdown-item:visible').length;
        if(messageToggleSwitchValue==="groups" && (allGroups.length - groups_selected.length)===visibleElementsCount ){
            lastScrollPosition = dropdownContainer.scrollTop;
        }
        else if(messageToggleSwitchValue==="contacts" && (allContacts.length - contacts_selected.length) === visibleElementsCount ){
            lastScrollPosition_contacts = dropdownContainer.scrollTop;
        }
    })

    $('#delete-all').on('click', async function () {
        let msg = await translate(`Are you sure, you want to delete all ${messageToggleSwitchValue==="groups"?"groups":"contacts"}?`);
        const __confirm = confirm(msg);
        if (__confirm) {
            if(messageToggleSwitchValue==="groups"){
                groups_selected=[];
                chrome.storage.local.set({ "groups_selected" : groups_selected });
            }
            else{
                contacts_selected=[]
                chrome.storage.local.set({ "contacts_selected" : contacts_selected });
            }
            updateGroupBoxDisplay()
        }
    });

    $("#select_all_text").on('click', function () {
        document.getElementById('select-all').checked = true;
    })
    $('.select_all').on('click', function () {
        if(document.getElementById('select-all').checked){
            !fetching && handleSelectAll()
            handleDeleteBin()
            showGroupsCampaignSelectorOrSave()
        }
    })

    // Show Invalid Numbers Popup
    $('#invalid-numbers').on('click', function () {
        const topPosition = Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + 'px';
        $('.invalid-numbers-popup').css('top', topPosition);
        $('.invalid-numbers-popup-container').removeClass('hide');

        const invalidCount = $('.number-tag.invalid').length;
        $('#popup-invalid-count').text(invalidCount);
    });

    // Close Invalid Numbers Popup
    $('.invalid-numbers-popup-close-button').on('click', function () {
        $('.invalid-numbers-popup-container').addClass('hide');
    });

    function getIndexOfInvalidNumbers(){
        let index=[];
        $('.number-tag.invalid').each(function () {
            index.push($(this).index());
        });
        let new_data = csv_data.filter((item, i)=> !index.includes(i-1));
        csv_data= new_data;
        chrome.storage.local.set({ csv_data: new_data });
    }

    // Remove all invalid numbers from list
    $('#remove-all-invalid').on('click', function () {
        getIndexOfInvalidNumbers()
        $('.number-tag.invalid').remove();
        $('.invalid-numbers-popup-container').addClass('hide');
        updateNumbersAndDisplay();
    });

    // Download excel containing the invalid number and reason
    $('#download-all-invalid').on('click', function () {
        const rows = [['Invalid Number', 'Reason']];

        $('.number-tag.invalid').each(function () {
            const number = country_info.dial_code + $(this).find('.number').text();
            const reason = $(this).find('.invalid-reason').text();
            rows.push([number, reason]);
        });

        download_csv(serizalize_csv_rows(rows), 'Invalid Numbers');
        $('.invalid-numbers-popup-container').addClass('hide');
    });

    // $('#input-container').on('click', function () {

    // })

    function handleCaption(attLen,attachments,captionForIndividualAttachment,captionAreaHasValue){
        let a=captionForIndividualAttachment
        if($('#caption-checkbox').prop('checked')&& !document.querySelector(".captionCheckBoxDiv")){
            let captionCheckBoxDiv= document.createElement("div");
            captionCheckBoxDiv.className="captionCheckBoxDiv";
            document.querySelector("#caption-section").insertBefore(captionCheckBoxDiv,document.querySelector("#caption-section").children[0])
        }
        let captionHtml="",captionTextAreaHtml="";
        for(let i=0;i<attLen;i++){
            let file = attachments[i];
            let name = (file.name.length > 9) ? (file.name.trim().substring(0, 9) + "...") : (file.name.trim());

            captionHtml += `
                <div>
                    <input type="radio" id="radio${i}" name="attachment" class="attachmentNames" value="${name}" style="margin: 0px 5px; cursor: pointer" ${i == 0 ? 'checked' : ''}>
                    <label for="radio${i}" style="cursor: pointer">${name}</label>
                </div>
            `;
            captionTextAreaHtml += `
                <textarea type="text" id="caption-input${i}" class="caption-input ${i === 0 ? '' : 'hide'}" 
                        style="width: 434px; font-size: 12px; padding: 7px; resize: none" 
                        placeholder="Type your caption for the file: ${file.name.trim().length > 50 ? file.name.trim().substring(0, 50) + '...' : file.name.trim()}"
                ></textarea>
            `;
        }
        if(attLen==1) captionHtml= ``;
        $(".captionCheckBoxDiv").html(`${captionHtml}`)
        $(".captionTextAreas").html(`${captionTextAreaHtml}`)
        if(captionAreaHasValue){
            for(let i=0;i<attLen;i++){
                if(document.querySelector(`#caption-input${i}`)&&captionForIndividualAttachment[i])
                document.querySelector(`#caption-input${i}`).value=captionForIndividualAttachment[i]
            }
        }
        document.querySelectorAll(".attachmentNames").forEach((ele) => {
            ele.addEventListener("change",()=>{
            for(let i=0;i<attLen;i++){
                if(document.getElementById(`radio${i}`).checked){
                    document.querySelector(`#caption-input${i}`).classList.remove("hide")
                }
                else{
                    if(!document.getElementById(`radio${i}`).classList.contains("hide"))
                    document.querySelector(`#caption-input${i}`).classList.add("hide")
                }
            }
            })
        })
        document.querySelectorAll(".caption-input").forEach((ele) => {
            ele.addEventListener("input",async ()=>{
                var eleId=ele.id.substring(ele.id.search(/\d/))
                let captionForIndividualAttachment= await new Promise((resolve) => {
                    chrome.storage.local.get(['captionForIndividualAttachment'], (res) => {
                        resolve(res.captionForIndividualAttachment);
                    })
                });
                captionForIndividualAttachment[eleId]=ele.value;
                chrome.storage.local.set({ 'captionForIndividualAttachment': captionForIndividualAttachment })
            })
        })
    }

    async function showAttachments() {
        $('#attachments-container').html(`<span style="margin-right:10px">Fetching...</span>`);
        let attachments = await new Promise((resolve) => {
            chrome.storage.local.get(['attachmentsData'], (res) => {
                resolve(res.attachmentsData || []);
            });
        });
        let showAllAttachments = await new Promise((resolve) => {
            chrome.storage.local.get('showAllAttachments', (res) => {
                resolve(res.showAllAttachments || false);
            });
        });
        if (attachments.length > 0) {
            let attHtml = "", attLen = attachments.length;
            let containsMedia = true, addAttHtml = true;
            for (let i = 0; i < attLen; i++) {
                let file = attachments[i];
                let addComma=true;
                let name = file.name.trim();
            
                if(attLen-1==i){
                    addComma=false;
                }
                if (attLen <= 3) {
                    if (name.length > (24 / attLen)) {
                        name = name.slice(0, (24 / attLen)) + "...";
                    }
                } else if (i < 2) {
                    if (name.length > 8) {
                        name = name.slice(0, 8) + "...";
                    }
                } else if(!showAllAttachments){
                    addAttHtml = false;
                }
                if(showAllAttachments){
                    if(name.length > 7)
                    name = file.name.trim().slice(0, 7) + "...";
                    else
                    name=file.name.trim();
                }

                if (addAttHtml && addComma) {
                    attHtml += `<span class="attachment-name">${name}<img src="/logo/remove-attachments-icon.png" alt="Remove Icon" id="${i}"/>,</span>`;
                }else if(addAttHtml){
                    attHtml += `<span class="attachment-name">${name}<img src="/logo/remove-attachments-icon.png" alt="Remove Icon" id="${i}"/></span>`;
                }
            };

            if (attLen > 3 && !showAllAttachments) {
                attHtml += `<span class="show_more" style="margin-right: 5px;">and <span style="text-decoration:underline;">${attLen - 2} more</span></span>`
            }
            if (attLen > 3 && showAllAttachments) {
                attHtml += `<span class="show_less" style="margin-right: 5px;">... <span style='text-decoration:underline'>show less</span></span>`
            }
            $('#attachments-container').html(attHtml);
            if(showAllAttachments){
                // document.querySelector("#attachments-container").style.textDecoration="underline";
                if($('#message').val().length==0)
                document.querySelector("#attachments-container").style.maxWidth="250px";
                else
                document.querySelector("#attachments-container").style.maxWidth="333px";
            }
            else{
                document.querySelector("#attachments-container").style.textDecoration="none";
                document.querySelector("#attachments-container").style.maxWidth="270px";
            }
            document.querySelector("#message").addEventListener("input",()=>{
                if($('#message').val().length==0)
                document.querySelector("#attachments-container").style.maxWidth="250px";
                else
                document.querySelector("#attachments-container").style.maxWidth="333px";
            })
            document.querySelectorAll(".attachment-name img").forEach((element)=>{
                element.addEventListener("click",async(e)=>{
                    let captionForIndividualAttachment = await new Promise((resolve) => {
                        chrome.storage.local.get(['captionForIndividualAttachment'], (res) => {
                            resolve(res.captionForIndividualAttachment|| []);
                        });
                    });
                    attachments.splice(element.id,1)
                    captionForIndividualAttachment.splice(element.id,1)
                   if(attachments.length<=3){
                    chrome.storage.local.set({ 'showAllAttachments': false })
                   }
                   chrome.storage.local.set({ 'attachmentsData': attachments })
                   chrome.storage.local.set({ 'captionForIndividualAttachment': captionForIndividualAttachment })
                   showAttachments();
                })
            })
            if(document.querySelector(".show_more")){
                document.querySelector(".show_more").addEventListener("click",()=>{
                    chrome.storage.local.set({ 'showAllAttachments': true })
                    showAttachments();
                })
            }
            if(document.querySelector(".show_less")){
                document.querySelector(".show_less").addEventListener("click",()=>{
                    document.querySelector("#attachments-container").style.textDecoration="none";
                    chrome.storage.local.set({ 'showAllAttachments': false })
                    showAttachments();
                })
            }
            $('#add-attachments').removeClass('contrast-0');
            $('#attachment-first-checkbox-section').prop('hidden', $('#message').val().trim().length == 0 || $('#attachments-container').html().trim().length == 0);

            // For Caption
            if (containsMedia) {
                let captionForIndividualAttachment = await new Promise((resolve) => {
                    chrome.storage.local.get(['captionForIndividualAttachment'], (res) => {
                        resolve(res.captionForIndividualAttachment|| []);
                    });
                });
                $('#add-caption-container').prop('hidden', false);
                $('#add-caption-checkbox-section').prop('hidden', false);
                let captionAreaHasValue=false;
                for(let i=0;i<captionForIndividualAttachment.length;i++){
                    let text=captionForIndividualAttachment[i].replace(/\s/g, "")
                    if(text.length!=0){
                        $('#caption-checkbox').prop('checked', true);
                        captionAreaHasValue=true;
                        break;
                    }
                }
                toggleCaptionCustomizationInputDiv();
                $('#caption-section').prop('hidden', !$('#caption-checkbox').is(":checked"));
                // const captionInputElement=document.querySelector(".caption-input");
                handleCaption(attLen,attachments,captionForIndividualAttachment,captionAreaHasValue);
                document.querySelector("#caption-checkbox").addEventListener("change", () =>{
                    handleCaption(attLen,attachments,captionForIndividualAttachment,captionAreaHasValue);
                })
                chrome.storage.local.get(["daysSinceInstallation", "isTooltipClosed","isCaptionUsed","tooltip_popup_count"], (res) => {
                    let daysSinceInstallation = res.daysSinceInstallation;
                    if(res.daysSinceInstallation===undefined){
                        daysSinceInstallation = res.tooltip_popup_count || 1;
                    }
                    let isTooltipClosed = res.isTooltipClosed;
                    let isCaptionUsed = res.isCaptionUsed;
                    if ([11,14,17,20].includes(daysSinceInstallation) && !isTooltipClosed && !isCaptionUsed) {
                        $('.caption-tooltip').removeClass('hide');
                        $('.checkbox-section > .add-tooltip-overlay').removeClass('hide');
                    }
                })
            }
        } else {
            $('#attachments-container').html('');
            $('#add-attachments').addClass('contrast-0');
            $('#add-caption-container').prop('hidden', true);
            $('#add-caption-checkbox-section').prop('hidden', true);
            $('#attachment-first-checkbox-section').prop('hidden', true);
        }
    }
    showAttachments();

    function dataURItoBlob(file) {
        return new Promise((response, reject) => {
            const fr = new FileReader;
            fr.readAsDataURL(file);
            fr.onload = () => response(fr.result);
            fr.onerror = err => reject(err)
        })
    }

    async function validateAttachments(attachments) {
        let isValid = true;
        let alertMessage = null;

        if (!attachments || attachments.length === 0) {
            isValid = false;
        } else if (attachments.length > 7) {
            alertMessage = await translate('Maximum 7 files can be send at a time.');
            isValid = false;
        } else {
            let totalSize = 0;
            for (const file of attachments) {
                if (file.size) {
                    // Max size is 20 MB for file
                    if (file.size > 20e6) {
                        let fileSizeInMB = (file.size / 1000000).toFixed(2);
                        alertMessage = await translate(`${file.name} size (${fileSizeInMB} MB) is too large. Maximum size allowed per attachment is 20MB.`);
                        isValid = false;
                        break;
                    }
                    totalSize += file.size;
                } 
            }
    
            // Max size is 100 MB in total for all files
            if (isValid && totalSize > 100e6) {
                let totalSizeInMB = (totalSize / 1000000).toFixed(2);
                alertMessage = await translate(`The total size (${totalSizeInMB} MB) of all attachments exceeds the limit. Maximum allowed size is 100MB.`);
                isValid = false;
            }
        }

        if (alertMessage) {
            $('#select-attachments').val("");
            alert(alertMessage);
        }
        return isValid;
    }

    $('#select-attachments').change(async function () {
        const selectedFileList = $(this).get(0).files;
        let selectedFiles = Array.from(selectedFileList);
        trackEvent('add_attachments', selectedFiles.length);
        
        $('#attachments-container').html(`<span style="margin-right:10px">Fetching...</span>`);
        let attachmentsData = await new Promise((resolve) => {
            chrome.storage.local.get(['attachmentsData'], async (res) => {
                let attachmentsData = res.attachmentsData || [];
                let allAttachments = attachmentsData.concat(selectedFiles).map(file => ({ 'name': file?.name, 'size': file?.size }));
                let isValidAttachments = await validateAttachments(allAttachments);
                
                if (isValidAttachments) {
                    for (const file of selectedFiles) {
                        let blob = await dataURItoBlob(file)
                        attachmentsData.push({
                            'name': file.name,
                            'size': file.size,
                            'data': JSON.stringify(blob)
                        });
                    }
                }   
                
                resolve(attachmentsData);
            });
        });

        await chrome.storage.local.set({ 'attachmentsData': attachmentsData });
        await showAttachments();
        $(this).val("");
    });

    $('#add-attachments').click(function () {
        chrome.storage.local.get(["first_visit_attachment", "first_attachment_click_count"], (res) => {
            let first_attachment_click_count = res.first_attachment_click_count;
            if (first_attachment_click_count == 0) {
                chrome.storage.local.set({ first_attachment_click_count: 1 })
            }
            let first_visit_attachment = res.first_visit_attachment;
            if (first_visit_attachment == true) {
                $('.tooltip-container ').addClass('hide');
                $('#add-attachments').addClass('contrast-0');
                document.getElementById("help_popup").style.display = "block";
            } else {
                if(isLinux)
                    sendMessageToBackground({type: "add_attachments"});
                else
                    $('#select-attachments').click();
            }
        })
    })

    $('#how_to_send_messages_to_groups').click(async function(){
        trackButtonClick('how_to_send_messages_to_groups');

        translatedGroupMsgObj=await fetchTranslations(groupMsgObj)
        if (messageToggleSwitchValue !== "groups") {
            document.querySelector("#message_type_groups").click()
        }
        driver(translatedGroupMsgObj).drive();
    })

    $('#how_to_send_messages_to_contacts').click(async function(){
        trackButtonClick('how_to_send_messages_to_contacts');

        translatedContactMsgObj=await fetchTranslations(contactMsgObj)
        if (messageToggleSwitchValue !== "contacts") {
            document.querySelector("#message_type_contact").click()
        }
        driver(translatedContactMsgObj).drive();
    });

    $('#how_to_send_customized_messages').click(async function() {
        trackButtonClick('how_to_send_customized_messages');
        
        translatedCustomObj = await fetchTranslations(customizationObj);
        translatedCustomObj.steps[1].popover.onNextClick = () => {
            const excelElement = document.querySelector(".upload_excel_text");
            excelElement.click();
            $("#csv").on("change", function (e) {
                driver(translatedCustomObj).moveNext();
            });
        };
        if (messageToggleSwitchValue !== "numbers") {
            document.querySelector("#message_type_numbers").click()
        }
        customization_obj = true;
        driver(translatedCustomObj).drive();
    });
    
    $('#how_to_send_attachments').click(async function() {
        trackButtonClick('how_to_send_attachments');

        translatedAttachments = await fetchTranslations(attachmentObj);
        translatedAttachments.steps[2].popover.onNextClick = () => {
            attachment_obj = true;
            const fileInput = document.querySelector("#select-attachments");
            fileInput.click();
            fileInput.addEventListener('change', () => {
                driver(translatedAttachments).moveNext();
            }, { once: true });
        };
        if (messageToggleSwitchValue !== "numbers") {
            document.querySelector("#message_type_numbers").click()
        }
        driver(translatedAttachments).drive();
    });

    $('#caption-checkbox').change(function () {
        $('#caption-section').prop('hidden', !$(this).is(":checked"))
        const isChecked= $(this).is(":checked");
        toggleCaptionCustomizationInputDiv();
        
        trackButtonClick('add_caption');
    })

    // tooltip popup code starts
    chrome.storage.local.get(["daysSinceInstallation", "lastTooltipOpenDate", "installDate","tooltip_popup_count"], (result) => {
        let daysSinceInstallation = result.daysSinceInstallation;
        if(result.daysSinceInstallation===undefined){
            daysSinceInstallation = result.tooltip_popup_count || 1;
        }
        const installDate = new Date(result.installDate).toDateString();
        const lastTooltipOpenDate = result.lastTooltipOpenDate ? new Date(result.lastTooltipOpenDate) : null;
        const today = new Date().toDateString();
        if (installDate && today !== installDate) {
            if (lastTooltipOpenDate == null || lastTooltipOpenDate.toDateString() !== today) {
                chrome.storage.local.set({ lastTooltipOpenDate: today });
                chrome.storage.local.set({ daysSinceInstallation: daysSinceInstallation + 1 });
                chrome.storage.local.set({ isTooltipClosed: false });
                if (daysSinceInstallation < 3) {
                    chrome.storage.local.set({ first_visit_attachment: true });
                }
            }
        }

        chrome.storage.local.get(["daysSinceInstallation", "isTooltipClosed"], (res) => {
            let daysSinceInstallation = res.daysSinceInstallation;
            let isTooltipClosed = res.isTooltipClosed;
            if ([1, 4, 7, 10].includes(daysSinceInstallation) && !isTooltipClosed) {
                $('.tooltip-popup-container').removeClass('hide');
                $('.add-tooltip-overlay').removeClass('hide');
            }
        })
    });

    $('.close-tooltip').on('click', () => {
        $('.tooltip-popup-container').addClass('hide');
        $('.caption-tooltip').addClass('hide');
        $('.add-tooltip-overlay').addClass('hide');
        chrome.storage.local.set({ lastTooltipOpenDate: new Date().toDateString() });
        chrome.storage.local.set({ isTooltipClosed: true });
    })

    // tooltip popup code ends

    // show overlay and help popup when ? is clicked
    // $(".attachment-instructions").click(function () {
    //     document.getElementById("help_popup").style.display = "block";
    // })

    // Message Template - Feature
    function showTemplateSelectorOrSave() {
        chrome.storage.local.get(['templates'], (res) => {
            let isTextPresent = false;
            const text = $('#message').val().trim();
            const templates = res.templates || [];
            templates.forEach(template => {
                if (text === template.message) {
                    isTextPresent = true;
                }
            })

            if (isTextPresent || text.length == 0) {
                $('#template-selector').removeClass('hide');
                $('#template-save-icon').addClass('hide');
                $('.tooltip-popup-content').removeClass('right-side');
            } else {
                $('#template-selector').addClass('hide');
                $('#template-save-icon').removeClass('hide');
                $('.tooltip-popup-content').addClass('right-side');
            }
        })
    }

    showTemplateSelectorOrSave();
    $('#message').on('input click', function () {
        showTemplateSelectorOrSave();

        $('#template-selector').removeClass('active');
        $('.tooltip-container ').addClass('hide');
        $('#templates-container').addClass('hide');
        $('#attachment-first-checkbox-section').prop('hidden', $('#message').val().trim().length == 0 || $('#attachments-container').html().trim().length == 0);
    })

    $('#message').on('keydown', function (event) {
        if (event.ctrlKey || event.metaKey) {
            if (event.shiftKey) {
                switch (event.key.toLowerCase()) {
                    case 'x': // Ctrl + Shift + X for Strikethrough
                        event.preventDefault();
                        wrapSelectedTextOfMessage('~');
                        break;
                    case 'i': // Ctrl + Shift + I for InlineCode
                        event.preventDefault();
                        wrapSelectedTextOfMessage('`');
                        break;
                }
            } else {
                switch (event.key.toLowerCase()) {
                    case 'b': // Ctrl + B for Bold
                        event.preventDefault();
                        wrapSelectedTextOfMessage('*');
                        break;
                    case 'i': // Ctrl + I for Italic
                        event.preventDefault();
                        wrapSelectedTextOfMessage('_');
                        break;
                }
            }
        }
    })

    function wrapSelectedTextOfMessage(ch) {
        const textarea = document.querySelector('#message');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        if (start !== end) {
            const selectedText = text.substring(start, end);

            if (selectedText.startsWith(ch) && selectedText.endsWith(ch)) {
                const unwrappedText = selectedText.slice(ch.length, -(ch.length));
                textarea.value = text.substring(0, start) + unwrappedText + text.substring(end);
                textarea.setSelectionRange(start, start + unwrappedText.length);
            } else {
                const boldText = `${ch}${selectedText}${ch}`;
                textarea.value = text.substring(0, start) + boldText + text.substring(end);
                textarea.setSelectionRange(start, start + boldText.length);
            }
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    $('#template-save-icon').click(function () {
        const topPosition = Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + 'px';
        $('.template-save-popup').css('top', topPosition);
        $('.template-save-popup-container').removeClass("hide")
        $('#template-msg').val($('#message').val().trim());
        $('#template-name').val("").focus();
    });

    $('#save-template-form').submit(function (e) {
        e.preventDefault();
    
        const tempName = $('#template-name').val();
        const tempMessage = $('#template-msg').val();
        const editIndex = $('#edit-template-index').val();
    
        chrome.storage.local.get(['templates'], (res) => {
            let templates = res.templates || [];
            console.log("Existing Teplates :", [...templates]);
            console.log("editIndex :", editIndex);
            let isTempNameExists = false;

            if (editIndex === "") { 
                templates.forEach(template => {
                    if (template.name === tempName) {
                        isTempNameExists = true;
                    }
                });
    
                if (isTempNameExists) {
                    alert(`Template name "${tempName}" already exists!`);
                } else {
                    templates.push({ name: tempName, message: tempMessage });
                }
            } else { 
                const index = parseInt(editIndex);
                console.log("int 5editIndex :", editIndex);
                templates[index].name = tempName;
                templates[index].message = tempMessage;
            }
    

            chrome.storage.local.set({ templates: templates });
            console.log("Final Teplates :", [...templates]);

            $('.template-save-popup-container').addClass('hide');
            $('.template-container').addClass('hide');
            $('#template-save-icon').addClass('hide');
            $('#template-selector').removeClass('hide');
            $('.tooltip-popup-content').removeClass('right-side');
            $('#edit-template-index').val("");
    
            trackButtonClick('save_template_message');
        });
    });

    function editTemplate(index){
        chrome.storage.local.get(['templates'], async (res) => {
            let templates = res.templates;
            let message=templates[index].message
            let name=templates[index].name
            const topPosition = Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + 'px';
            $('.template-save-popup').css('top', topPosition);
            $('.template-save-popup-container').removeClass("hide")
            $('#template-msg').val(message);
            $('#template-name').val(name).focus();
            $('#edit-template-index').val(index);
        })
    }

    function showTemplates() {
        $('#templates-container').html('');
        chrome.storage.local.get(['templates'], async (res) => {
            let templates = res.templates || [];
            if (templates.length > 0) {
                for (let index = templates.length - 1; index >= 0; index--) {
                    $('#templates-container').append(`
                    <div class="dropdown-item">
                    <p id="${index}" class="template-text text">${templates[index].name}</p>
                    <img id="${index}" class="template-edit btn" src="./logo/edit_icon.png" />
                    <img id="${index}" class="template-delete btn" src="./logo/template_delete.png" />
                    </div>`);
                }
            } else {
                $('#templates-container').append(`
                    <div class="dropdown-item">${await translate("Nothing to show!")}</div>
                    <div id="create_template_button" class="dropdown-item" style="justify-content:flex-start; gap:10px;font-size:13px;">
                        <img src="./logo/prime_template-save.png" style="width:18px;"/>
                        <span>Add Template</span>
                    </div>
                `);
                $('#create_template_button').click(function () {
                    const topPosition = Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + 'px';
                    $('.template-save-popup').css('top', topPosition);
                    $('.template-save-popup-container').removeClass("hide")
                    $('#template-msg').val($('#message').val().trim());
                    $('#template-name').val("").focus();
                });
            }

            $('.template-text').click(function () {
                let id = $(this).attr('id');
                let tempMsg = templates[id].message;
                $('#message').val(tempMsg)

                $('#templates-container').addClass('hide');
                $('#template-selector').removeClass('active');
            })

            $('.template-delete').click(async function () {
                let id = $(this).attr('id');
                let msg = await translate(`Are you sure, you want to remove template "TEMPLATE NAME" ?`);
                msg = msg.replace(/"(.*?)"/gi, `"${templates[id].name}"`);
                let __confirm = confirm(msg);
                if (__confirm) {
                    templates.splice(id, 1);
                    chrome.storage.local.set({ templates: templates });
                    showTemplates();
                }
            })
            $('.template-edit').click(async function () {
                let id = $(this).attr('id');
                editTemplate(id)
            })
        })
    }

    $('#template-selector').click(function (e) {
        showTemplates();
        trackButtonClick('select_template_message');

        $('.tooltip-container ').addClass('hide');
        $('#templates-container').toggleClass('hide');
        $('#template-selector').toggleClass('active');
    });

    $('.template-popup-close-button').click(function () {
        $('.template-save-popup-container').addClass('hide');
    })

    //Campaign Numbers - Feature
    function showCampaignSelectorOrSave() {
        chrome.storage.local.get(['campaigns'], (res) => {
            let isCampaignPresent = false;
            const numbers = getFilteredNumbers($('#numbers').val());
            const campaigns = res.campaigns || [];
            let filteredCampaigns = filterCampaignsByType(campaigns, messageToggleSwitchValue)

            filteredCampaigns.forEach(campaign => {
                if (numbers === campaign[messageToggleSwitchValue]) {
                    isCampaignPresent = true;
                }
            })

            if (isCampaignPresent || numbers.length == 0) {
                $('#campaign-selector').removeClass('hide');
                $('#campaign-save-icon').addClass('hide');
            } else {
                $('#campaign-selector').addClass('hide');
                $('#campaign-save-icon').removeClass('hide');
            }
        })
    }
    showCampaignSelectorOrSave();
    showGroupsCampaignSelectorOrSave();

    $('#numbers').on('click change', function () {
        showCampaignSelectorOrSave();

        $('#campaign-selector').removeClass('active');
        $('#campaigns-container').addClass('hide');
    })

    function helper(){
        const topPosition = Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + 'px';
        let popupTitle = document.querySelector(".campaign-title")
        let popupBtn = document.querySelector(".campaign-btn")
        let textArea = document.querySelector('#campaign-numbers')
        
        if(messageToggleSwitchValue !== "numbers")
            textArea.setAttribute("readonly",true)
        else
            textArea.removeAttribute("readonly")
        popupTitle.innerHTML=`Save Campaign ${String(messageToggleSwitchValue).charAt(0).toUpperCase() + String(messageToggleSwitchValue).slice(1)}`
        popupBtn.innerHTML=`Save Campaign ${String(messageToggleSwitchValue).charAt(0).toUpperCase() + String(messageToggleSwitchValue).slice(1)}`
        $('.campaign-save-popup').css('top', topPosition);
        $('.campaign-save-popup-container').removeClass("hide")
    }

    $('#campaign-save-icon').click(function () {
        let numbers = getFilteredNumbers($('#numbers').val());
        helper()
        $('#campaign-numbers').val(numbers);
        $('#campaign-name').val(csv_name).focus();
    });

    $('#campaign-save-icon-items').click(function () {
        let items = getItemsName()
        helper()
        $('#campaign-numbers').val(items);
        $('#campaign-name').val(csv_name).focus();
    });

    $('#save-campaign-form').submit(function (e) {
        e.preventDefault();
    
        const campName = $('#campaign-name').val();
        const editIndex = $('#edit-index').val();
        let campData = {};
    
        switch (messageToggleSwitchValue) {
            case "numbers":
                campData.numbers = getFilteredNumbers($('#campaign-numbers').val());
                break;
            case "groups":
                campData.groups = getItemsName();
                break;
            case "contacts":
                campData.contacts = getItemsName(); 
                break;
            default:
                alert("Invalid toggle value!");
                return;
        }

        if (editIndex === "") {
            saveCampaign(campName, campData, (success) => {
                if (success) finalizeCampaignSave();
            });
        } else {
            const index = parseInt(editIndex);
            updateCampaign(index, campName, campData, (success) => {
                if (success) finalizeCampaignSave();
            });
        }
    });

    function finalizeCampaignSave() {
        if(messageToggleSwitchValue === "numbers"){
            $('#campaign-selector').removeClass('hide');
            $('#campaigns-container').addClass('hide');
            $('#campaign-save-icon').addClass('hide');
        }  
        else {
            $('#campaign_selector_groups').removeClass('hide');
            $('#campaigns-container-groups').addClass('hide');
            $('#campaign-save-icon-items').addClass('hide');
        }
        $('.campaign-save-popup-container').addClass('hide');
        $('#edit-index').val("");
        trackButtonClick('save_campaign_numbers');
    }

    function editCampaignsNumber(index){
        chrome.storage.local.get(['campaigns'], async (res) => {
            let campaigns = res.campaigns;
            let numbers = campaigns[index][messageToggleSwitchValue]
            let name = campaigns[index].name
            helper()

            $('#campaign-numbers').val(numbers);
            $('#campaign-name').val(name).focus();
            $('#edit-index').val(index);
        })
    }

    function showCampaigns() {
        const containerMap = {
            numbers: '#campaigns-container',
            groups: '#campaigns-container-groups',
            contacts: '#campaigns-container-groups'
        };
    
        const containerSelector = containerMap[messageToggleSwitchValue] || '#campaigns-container';
        $(containerSelector).html('');
        chrome.storage.local.get(['campaigns'], async (res) => {
            let campaigns = res.campaigns || [];
            let filteredCampaigns = filterCampaignsByType(campaigns, messageToggleSwitchValue);
    
            if (filteredCampaigns.length > 0) {
                for (let index = filteredCampaigns.length - 1; index >= 0; index--) {
                    $(containerSelector).append(`
                        <div class="dropdown-item">
                            <p id="${index}" class="campaign-name text">${filteredCampaigns[index].name}</p>
                            <img id="${index}" class="campaign-edit btn ${messageToggleSwitchValue !== 'numbers' ? 'hide' : '' }" src="./logo/edit_icon.png" />
                            <img id="${index}" class="campaign-delete btn" src="./logo/template_delete.png" />
                        </div>`);
                }
            } else {
                $(containerSelector).append(`
                    <div class="dropdown-item">${await translate("Nothing to show!")}</div>
                    ${messageToggleSwitchValue==="numbers"?`<div id="create_campaign_button" class="dropdown-item" style="justify-content:flex-start; gap:10px;font-size:13px;">
                        <img src="./logo/floppy-disk.png" style="width:18px;"/>
                        <span>Add Campaign</span>
                    </div>`:``}
                `);
                $('#create_campaign_button').click(function () {
                    let numbers = getFilteredNumbers($('#numbers').val());
                    const topPosition = Math.max(0, (window.innerHeight - 250) / 2 + window.pageYOffset) + 'px';
                    $('.campaign-save-popup').css('top', topPosition);
    
                    $('.campaign-save-popup-container').removeClass("hide");
                    $('#campaign-numbers').val(numbers);
                    $('#campaign-name').val(csv_name).focus();
                });
            }
    
            // Campaign selection click handler
            $('.campaign-name').click(function () {
                let id = $(this).attr('id');
                let campaignNumbers = filteredCampaigns[id][messageToggleSwitchValue];
                messageToggleSwitchValue === "numbers" ? replaceNumbers(campaignNumbers):renderSelectedItems(campaignNumbers);
    
                $(containerSelector).addClass('hide');
                messageToggleSwitchValue==="numbers" ? $('#campaign-selector').removeClass('active'):$('#campaign_selector_groups').removeClass('active');
            });
    
            // Campaign delete handler
            $('.campaign-delete').click(async function () {
                let id = $(this).attr('id');
                let msg = await translate(`Are you sure, you want to remove campaign "CAMPAIGN NAME"?`);
                msg = msg.replace(/"(.*?)"/gi, `"${filteredCampaigns[id].name}"`);
                let __confirm = confirm(msg);
                if (__confirm) {
                    campaigns = campaigns.filter(campaign => campaign !== filteredCampaigns[id]);
                    chrome.storage.local.set({ campaigns });
                    showCampaigns();
                }
            });
    
            // Campaign edit handler
            $('.campaign-edit').click(async function () {
                let id = $(this).attr('id');
                let originalId = campaigns.indexOf(filteredCampaigns[id]); 
                editCampaignsNumber(originalId);
            });
        });
    }

    $('#campaign-selector').click(function (e) {
        showCampaigns();
        trackButtonClick('select_campaign_numbers');

        $('#campaigns-container').toggleClass('hide');
        $('#campaign-selector').toggleClass('active');
    });

    $('#campaign_selector_groups').click(function (e) {
        showCampaigns();
        // trackButtonClick('select_campaign_numbers');
        $('#campaigns-container-groups').toggleClass('hide');
        $('#campaign_selector_groups').toggleClass('active');
    });

    $('.campaign-popup-close-button').click(function () {
        $('.campaign-save-popup-container').addClass('hide');
    })
    
    $('.invalid-excel-popup-close-button').click(function () {
        $('.invalid-excel-popup-container').addClass('hide');
        unset_csv_styles();
        hideCustomizationContainer();
        replaceNumbers('');
        toggleUploadExcelText(true);
    })
    
    $('.template-excel-button').click(function () {
        $('.invalid-excel-popup-container').addClass('hide');
        unset_csv_styles();
        hideCustomizationContainer();
        replaceNumbers('');
        toggleUploadExcelText(true);
    })
    
    //Delivery Reports Dropdown - Feature
    function showReports() {
        $('#reports-container').html('');
        chrome.storage.local.get(['deliveryReports'], async (res) => {
            let reports = res.deliveryReports || [];

            if (reports.length > 0) {
                for (let index = reports.length - 1; index >= 0; index--) {
                    let reportDate = getReportDateFormat(reports[index].date);
                    let reportName = reports[index].name || "Campaign " + (index+1);

                    $('#reports-container').append(`
                        <div class="dropdown-item">
                            <p id="${index}" class="report-name text">
                                <img src="./logo/prime_excel_icon.png"/>
                                <span style="color: #259C46;">${reportName}</span>
                                <span style="color: #5D6063;">${reportDate}</span>
                            </p>
                            <img id="${index}" class="report-download btn CtaBtn" src="./logo/prime_download_icon.png" />
                        </div>`
                    );
                }
            } else {
                $('#reports-container').append(`<div class="dropdown-item">${await translate("Nothing to show!")}</div>`);
            }

            $('.report-download').click(function () {
                let id = $(this).prop('id');
                let reportDownloadDate = getReportDateFormat(reports[id].date, true);
                let reportName = reports[id].name || "Campaign " + (+id+1);
                let reportDownloadName = `${reportName} ${reportDownloadDate}.csv`;
                
                download_csv(reports[id].data, reportDownloadName);
                trackButtonClick('download_delivery_report');
            })
        })
    }

    $('#report-selector').click(function (e) {
        showReports();
        trackButtonClick('select_delivery_report');

        $('#reports-container').toggleClass('hide');
        $('#report-selector').toggleClass('active');
    })
    
    // Open groups/contacts selector if user clicks on blacnk space
    $('.groups_display_box').click(function (e) {
        e.stopPropagation();
        const ele = $(e.target);
        if (ele && !ele.is('.delete_group_tag')) {
            $('.search_group_input').click();
            console.log('CLICK');
        }
    })

    $('.search_group_input').click(function () {
        if (messageToggleSwitchValue === "contacts") {
            if (allContacts.length === 0 || contacts_selected.length === allContacts.length) return;
        }

        if (messageToggleSwitchValue === "groups") {
            if (allGroups.length === 0 || groups_selected.length === allGroups.length) return;
        }
    
        document.querySelector('.search_group_input').value = '';
        $('#select-all').prop('checked', false);
    
        showItems(messageToggleSwitchValue === "groups");
    
        $('#groups_container').removeClass('hide');
        const lastPosition = messageToggleSwitchValue === "groups" ? lastScrollPosition : lastScrollPosition_contacts;
        $('#groups_container').scrollTop(lastPosition);
    
        $('.message-box').addClass('hide_visibility');
    });

    document.querySelector('.groups_display_box').addEventListener('click', function (event) {
        if (event.target && event.target.classList.contains('delete_group_tag')) {
            const deleteTag = event.target;
            const parentTag = deleteTag.closest('.group_tag');

            if (parentTag) {
                let objId = parentTag.id;
                let serizalizeId = parentTag.getAttribute('data-id-field');

                let isGroup = messageToggleSwitchValue === 'groups';
                let selectedArray = isGroup ? groups_selected : contacts_selected;

                selectedArray = selectedArray.filter(item => item !== serizalizeId);

                if (isGroup) {
                    groups_selected = selectedArray;
                } else {
                    contacts_selected = selectedArray;
                }

                chrome.storage.local.set({ [isGroup ? 'groups_selected' : 'contacts_selected']: selectedArray });

                handleDeleteBin()
                const itemElement = document.querySelector(`#group_container #${objId}`);
                if (itemElement) itemElement.classList.remove('hide');

                parentTag.remove();

                const displayBox = document.querySelector('.groups_display_box');
                if (selectedArray.length === 0) {
                    displayBox.innerHTML = `<p style="color:gray;font-size:13px;margin:0px;">Select ${isGroup ? 'groups' : 'contacts'} from the dropdown . . .</p>`;
                }
            }
        }
    });

    // For closing dropdown container when user clicks outside of it
    document.addEventListener('click', function (event) {
        const dropdownContainers = document.querySelectorAll('.dropdown-container');
        const dropdownBoxes = document.querySelectorAll('.dropdown-box');
        const dropdownButtons = document.querySelectorAll('.dropdown');
        const groupsSearchBar= document.querySelectorAll('.groups_searchbar');
        for (let i = 0; i < dropdownBoxes.length; i++) {
            if (!dropdownBoxes[i].contains(event.target) && !dropdownContainers[i].contains(event.target) && !groupsSearchBar[0].contains(event.target) && !event.target.classList.contains('dropdown-item') && !event.target.classList.contains('dropdown-container')) {
                dropdownContainers[i]?.classList.add('hide');
                dropdownButtons[i]?.classList.remove('active');
                $('.message-box').removeClass('hide_visibility');
                document.querySelector('.search_group_input').value='';
                $('#select-all').prop('checked', false);
            }
        }
    });

    // Language Translate Feature
    setDefaultLanguageData();   // Initialize defaultTexts data
    populateLanguageOptions();  // Load the language optioins

    function setDefaultLanguageData() {
        let textElements = document.querySelectorAll('[data-translate-text]');
        let defaultTexts = Object.values(textElements).map(ele => ele.innerText);

        let placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
        let defaultPlaceholders = Object.values(placeholderElements).map(ele => ele.placeholder);

        chrome.storage.local.set({
            'defaultLanguageData': {
                'texts': defaultTexts,
                'placeholders': defaultPlaceholders
            }
        });
    }

    function populateLanguageOptions() {
        let languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
        let selectedLanguageCodes = navigator.languages.map(lang => lang.split('-')[0]);
        selectedLanguageCodes = selectedLanguageCodes.filter((value, index, self) => self.indexOf(value) === index);

        let languageSelector = document.getElementById('language-selector');
        languageSelector.innerHTML = '';
        languageSelector.appendChild(createOption('English (Default)', 'default'));

        chrome.storage.local.get(['currentLanguage'], (res) => {
            currentLanguage = res.currentLanguage || 'default';
            translateAll(currentLanguage);
            
            // Add selected language options
            selectedLanguageCodes.forEach((language) => {
                if (language === 'en') return;
                languageSelector.appendChild(createOption(languageNames.of(language), language, (language === currentLanguage)));
            });
            // Add a separator
            languageSelector.appendChild(createOption('-----------------------', '', false, true));
            // Add more language options
            allLanguageCodes.forEach((language) => {
                if (language === 'en' || selectedLanguageCodes.includes(language)) return;
                languageSelector.appendChild(createOption(languageNames.of(language), language, (language === currentLanguage)));
            });
        });
    }

    $('#language-selector').change(function () {
        currentLanguage = $(this).val();
        chrome.storage.local.set({ 'currentLanguage': currentLanguage });
        translateAll(currentLanguage);
        trackEvent('translate_language', currentLanguage);
        sendMessageToBackground({ type: 'translate_language', language: currentLanguage });
    })

    async function translateAll(targetLanguage) {
        let textElements = document.querySelectorAll('[data-translate-text]');
        let placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    
        chrome.storage.local.get(['defaultLanguageData', 'translatedCache'], async (res) => {
            let defaultTexts = res.defaultLanguageData.texts;
            let defaultPlaceholders = res.defaultLanguageData.placeholders;
            let cache = res.translatedCache || {};
    
            const textPromises = defaultTexts.map(async text => {
                // if (cache[text] && cache[text][targetLanguage]) {
                //     return cache[text][targetLanguage];
                // } 

                const translatedText = await translate(text);
                
                // if (!cache[text]) cache[text] = {};
                // cache[text][targetLanguage] = translatedText;
                return translatedText;
            });
    
            const placeholderPromises = defaultPlaceholders.map(async placeholder => {
                // if (cache[placeholder] && cache[placeholder][targetLanguage]) {
                //     return cache[placeholder][targetLanguage];
                // } 

                const translatedPlaceholder = await translate(placeholder);

                // if (!cache[placeholder]) cache[placeholder] = {};
                // cache[placeholder][targetLanguage] = translatedPlaceholder;
                return translatedPlaceholder;
            });
    
            const translatedTexts = await Promise.all(textPromises);
            const translatedPlaceholders = await Promise.all(placeholderPromises);
    
            textElements.forEach((ele, index) => ele.innerText = translatedTexts[index]);
            placeholderElements.forEach((ele, index) => ele.placeholder = translatedPlaceholders[index]);
    
            chrome.storage.local.set({ 'translatedCache': cache });
        });
    }
});

function createOption(__text, __value, __selected = false, __disabled = false) {
    let option = document.createElement('option');
    option.text = __text;
    option.value = __value;
    option.selected = __selected;
    option.disabled = __disabled;
    return option;
}


function getFet(key) {
    let fet;
    if (key == 'groupContactExport')
        fet = 'Export Group Contacts'
    if (key == 'customisation')
        fet = 'Customization'
    if (key == 'batching')
        fet = 'Batching'
    if (key == 'timeGap')
        fet = 'Time Gap'
    if (key == 'stop')
        fet = 'Stop'
    if (key == 'quickReplies')
        fet = 'Quick Replies'
    if (key == 'multipleAttachment')
        fet = 'Multiple Attachment'
    if (key == 'attachment')
        fet = 'Attachment'
    if (key == 'caption')
        fet = 'Caption'
    return fet;
}

async function getMultipleAccountsData() {
    chrome.storage.local.get(['multipleAccountsData'], async function (res) {
        if (!res || !res?.isFetchedToday || subscribed_date == getTodayDate()) {
            try {
                const res = await fetch('api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: parentEmail })
                });
                // const data = await 
            } catch (error) {
                console.log("Error while fetching multiple accounts data", error);
            }
        } else {
        }
    });
}

function showMultipleAccountSection() {
    getMultipleAccountsData();
    if (!isMultipleAccount) return;
    const multiple_account_bloc = document.querySelector(".mult_account_block");
    multiple_account_bloc.classList.remove('hide');
    let show_more_html = "", show_less_html = "";
    let top_html = `<div style="color:#fff;display:flex;justify-content:flex-start;align-items:center;gap:5px;flex-wrap:wrap;">
            <p style="margin:0px !important;">Other numbers in the plan :</p>`;
    show_more_html = top_html
    for(let i=0; i<5; i++)
        show_more_html+=`<span class="mult_num_tag" style="background:#009a88 !important">${otherNumbers[i]}</span>`
    show_more_html+=`<span class="mult_show_more_section">... <span class="show_all_mult_numbers" style="cursor:pointer;text-decoration:underline;">show more</span></span></div>`;
    show_more_html+= '</div>';

    show_less_html= top_html;
    for(let i=5; i<otherNumbers.length; i++)
        show_less_html+= `<span class="mult_num_tag" style="background:#009a88 !important">${otherNumbers[i]}</span>`
    show_less_html+=`<span class="mult_show_more_section"><span class="show_all_mult_numbers" style="cursor:pointer;text-decoration:underline;">show less</span></span></div>`;
    show_less_html+= '</div>';
    multiple_account_bloc.innerHTML = show_more_html;

    document.querySelector('.mult_show_more_section').addEventListener('click', function(){
        showAllMultNumbers = !showAllMultNumbers;
        if(showAllMultNumbers)
            multiple_account_bloc.innerHTML = show_more_html;
        else
            multiple_account_bloc.innerHTML = show_less_html;
        document.querySelector('.show_all_mult_numbers').addEventListener('click', function(){
            showAllMultNumbers = !showAllMultNumbers;
            showMultipleAccountSection();
        });
    })
}

function showFaqsSection() {
    const faqSection = document.querySelector('.premium_feature_faq');
    if(!faqSection) return;
    let faqHtml = "";
    FAQS.forEach((faq, index) => {
        faqHtml+=
            `
            <div class="premium_feature_block">
                <div class="faq_question_block">
                    <p class="faq_question">${index+1}) ${faq.question}</p>
                    <img src="logo/prime_dropdown_icon.png" />
                </div>
                <p class="faq_answer">${faq.answer}</p>
            </div>
            `
    });

    faqSection.innerHTML = faqHtml;

    const allQuestions = document.querySelectorAll('.faq_question_block');
    if(allQuestions.length>0){
        allQuestions.forEach((question, _) => {
            question.addEventListener('click', function(){
                const answer = question.nextElementSibling;
                if(answer.style.display == 'block'){
                    answer.style.display = 'none';
                    question.children[1].style.transform = 'rotate(0deg)';
                } else {
                    answer.style.display = 'block';
                    question.children[1].style.transform = 'rotate(180deg)';
                }
            })
        });
    }


}

// Getting invoice data from the local storage and showing it in the popup
async function getInvoiceData(){
    chrome.storage.local.get(['invoiceObject'], function(result){
        let data=[];
        const dates= result.invoiceObject;
        if(dates==undefined){
            data=[];
        }
        else
            data = dates;
        const invoiceInputSection = document.getElementById("invoice_input");
        let optionsHtml = "";

        if(data.length>0){
            data.map((item) => optionsHtml += `<option value="${item.date}">${item.date}</option>`);
            document.getElementById('download_invoice_button').href = data[0]?.invoice_pdf_url;
        }
        else{
            optionsHtml= `<option value="invoice_not_found">No Invoice Found</option>`
        }
        if(optionsHtml=='')
            optionsHtml=`<option value="invoice_not_found">No Invoice Found</option>`
        invoiceInputSection.innerHTML = optionsHtml;

        invoiceInputSection.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            const invoice = data.find((item) => {
                return item.date == selectedDate;
            })
            // if invoice found
            if(invoice){
                document.getElementById('download_invoice_button').href = invoice.invoice_pdf_url;
            }
        })

        const invoiceButtonLoader=document.getElementById("invoice_button_loader")
        const invoiceButtonText= document.getElementById("invoice_button_text");

        const downloadInvoiceButtton= document.getElementById('download_invoice_button');
        downloadInvoiceButtton.addEventListener("click", ()=>{
            invoiceButtonLoader.style.display="flex";
            invoiceButtonText.style.display="none";

            setTimeout(()=>{
                    const invoiceButtonLoader=document.getElementById("invoice_button_loader")
                    const invoiceButtonText= document.getElementById("invoice_button_text");
                    if(invoiceButtonLoader && invoiceButtonText){
                        invoiceButtonLoader.style.display="none";
                        invoiceButtonText.style.display="flex";
                    }
                }, 5000)
            })
    })
}

async function makeNewDesignResponse(res) {
    try {
        const response = await fetch('https://sheetdb.io/api/v1/wbzt6s0lud7bg', {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify([
            {
                "Contact Number": my_number,
                "Yes/No": res,
                "Date/time": new Date().toLocaleString('en-in')
            }])
        });
        await response.json();
    } catch (error) {
        console.log("error from sheetdb api call",error)
    }
}

async function showNewDesignReviewButtons() {
    chrome.storage.local.get(['campaignNumber', 'newDesignLiked', 'newDesignSessions'], function(res){
        let campaignNumber= res.campaignNumber;
        let newDesignLiked= res.newDesignLiked;
        let newDesignSessions= res.newDesignSessions;
        if(res.newDesignLiked == undefined || res.newDesignLiked == null){
            chrome.storage.local.set({'newDesignLiked': false});
            newDesignLiked= false;
        }
        if(res.newDesignSessions == undefined || res.newDesignSessions == null){
            chrome.storage.local.set({'newDesignSessions': 0});
            newDesignSessions= 0;
        }
        const showReviewStrip= (campaignNumber && !newDesignLiked && newDesignSessions<10);
        if(showReviewStrip){
            const getReviewStripInterval= setInterval(() => {
                const reviewStrip= document.querySelector('.new_popup_question_strip');
                if(reviewStrip){
                    clearInterval(getReviewStripInterval);
                    reviewStrip.style.display="flex";
                    reviewStrip.hidden= false;
                    
                    const yesButton= document.querySelector('.question_yes_button');
                    const noButton= document.querySelector('.question_no_button');
        
                    yesButton.addEventListener('click', async ()=>{
                        await makeNewDesignResponse('Yes');
                        chrome.storage.local.set({'newDesignLiked': true});
                        document.body.removeChild(reviewStrip);
                    });
                    noButton.addEventListener('click', async ()=>{
                        await makeNewDesignResponse('No');
                        chrome.storage.local.set({'newDesignLiked': true});
                        document.body.removeChild(reviewStrip);
                    });
                    chrome.storage.local.set({'newDesignSessions': newDesignSessions+1});
                }
            }, 200);
        }
    })
}

showNewDesignReviewButtons();

function elementsToBeHighlighted() {
    const numbersBox = document.querySelector('.numbers-box');
    const messageBox = document.querySelector('.message-box');
    const numberBoxTitle = document.querySelector('.numbers-box .text_title');
    const messageBoxTitle = document.querySelector('.message-box .text_title');
    const actionsButtonContainer = document.querySelector('.action_buttons_div');
    const numbersBoxNavigationContainer = document.querySelectorAll('.numbers-box .navigation_container');
    const messageBoxNavigationContainer = document.querySelectorAll('.message-box .navigation_container');
    const buttonsBoxNavigationContainer = document.querySelectorAll('.action_buttons_div .navigation_container');
    const reportBox = document.querySelector('#report-box');
    const textBody = document.querySelector('.action_buttons_div .message_not_sent_error');
    const sendButton = document.getElementById('sender');
    const tooltipContainer = document.querySelector('.tooltip-popup-container');

    return [
        {
            element: numbersBox,
            element2: numberBoxTitle,
            child: numbersBoxNavigationContainer,
        },
        {
            element: messageBox,
            child: messageBoxNavigationContainer,
            element2: messageBoxTitle,
            element6: tooltipContainer,
        },
        {
            element: actionsButtonContainer,
            child: buttonsBoxNavigationContainer,
            element3: reportBox,
            element4: textBody,
            element5: sendButton,
            // element6: tooltipContainer
        },
    ];
}

function highlightIndexedSection(index) {
    const elements = elementsToBeHighlighted();
    elements.forEach((element, i) => {
        if (index == i) {
            element.element.classList.add('focus_element');
            element.element2?.classList.add('title_focus');
            element.element3?.classList.add('reduce_opacity');
            element.element4?.classList.add('reduce_opacity');
            element.element5?.classList.add('focus_border');
            element.element6?.classList.add('display_none_class');
            element.child.forEach((child) => {
                child.hidden = false;
            });
        } else {
            element.element.classList.remove('focus_element');
            element.element2?.classList.remove('title_focus');
            element.element3?.classList.remove('reduce_opacity');
            element.element4?.classList.remove('reduce_opacity');
            element.element5?.classList.remove('focus_border');
            element.element6?.classList.remove('display_none_class');
            element.child.forEach((child) => {
                child.hidden = true;
            });
        }
    });
    const tooltipContainer = document.querySelector('.tooltip-popup-container');
    if (tooltipContainer) {
        if (index == 1 || index == 2) {
            tooltipContainer.classList.add('display_none_class');
        } else {
            tooltipContainer.classList.remove('display_none_class');
        }
    }
}

function scrollToSection(index) {
    let currentSection = null;
    if (index == 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (index == 1) {
        currentSection = document.querySelector('.message-box');
    } else {
        currentSection = document.querySelector('.action_buttons_div');
    }
    if (currentSection) currentSection.scrollIntoView({ behavior: 'smooth' });
}

function startNavigationTour() {
    let index = 0;
    const backgroundOverlay = document.querySelector('.background_overlay');
    if (backgroundOverlay) {
        backgroundOverlay.hidden = false;
        const navigationButtons = document.querySelector('.how_to_use_buttons');
        const prev_button = document.querySelector('.how_to_use_left');
        const next_button = document.querySelector('.how_to_use_right');
        if (navigationButtons) {
            navigationButtons.style.display = 'flex';
            navigationButtons.hidden = false;
            prev_button.style.display = 'none';
            prev_button.hidden = true;
        }
        scrollToSection(index);
        highlightIndexedSection(index);
        prev_button.addEventListener('click', () => {
            index--;
            index = Math.max(Number(index), 0);
            highlightIndexedSection(index);
            if (index == 0) {
                prev_button.hidden = true;
                prev_button.style.display = 'none';
            }
            next_button.innerHTML = '<span>Next</span><img src="logo/arrow-right.png" alt="left_arrow">';
            scrollToSection(index);
        });
        next_button.addEventListener('click', () => {
            index++;
            if (index > 2) {
                index = 0;
                backgroundOverlay.hidden = true;
                navigationButtons.hidden = true;
                navigationButtons.style.display = 'none';
                next_button.innerHTML = '<span>Next</span><img src="logo/arrow-right.png" alt="left_arrow">';
                highlightIndexedSection(3);
                scrollToSection(0);
                return;
            }
            highlightIndexedSection(index);
            if (index == 2) {
                next_button.innerHTML = '<span>Close</span>';
            }
            prev_button.hidden = false;
            prev_button.style.display = 'flex';
            scrollToSection(index);
        });
    }
}

function startNavigationTourOnFirstVisit() {
    const navigationInterval = setInterval(async () => {
        const numbersBox = document.querySelector('.numbers-box');
        translatedSendObj= await fetchTranslations(sendObj);
        if (numbersBox) {
            clearInterval(navigationInterval);
            // Removido o código que iniciava o tour automaticamente na primeira visita
        }
    }, 500);
}

startNavigationTourOnFirstVisit();

function getCurrentTimein24HourFormat() {
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes}`;
}

function getCurrentDate() {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1; // Months are 0-based in JavaScript
    let day = now.getDate();
    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    return `${year}-${month}-${day}`;
}

async function renderSelectedItems(nameFiltersString = '') {
    let isFirst = true;
    const items = messageToggleSwitchValue === 'groups' ? allGroups : allContacts;

    const BATCH_SIZE = 100;
    let currentBatch = 0;

    const displayBoxClass = '.groups_display_box';
    const displayBox = document.querySelector(displayBoxClass);

    let selectedArray = messageToggleSwitchValue === 'groups' ? groups_selected : contacts_selected;

    if (nameFiltersString.trim() !== '') {
        selectedArray = [];
        displayBox.innerHTML = '';
    } else if (selectedArray.length <= 1 || isFirst) {
        displayBox.innerHTML = '';
    }

    const nameFilters = nameFiltersString.split(',').map(name => name.trim().toLowerCase());
    const filteredItems = nameFilters.length > 0
        ? items.filter(item => nameFilters.some(filter => item.name.toLowerCase() === filter))
        : [];
    filteredItems.forEach(item => {
        if (!selectedArray.includes(item.id._serialized)) {
            selectedArray.push(item.id._serialized);
        }
    });
    messageToggleSwitchValue === "groups" ? groups_selected = selectedArray : contacts_selected = selectedArray
    function renderBatch() {
        const fragment = document.createDocumentFragment();
        for (let i = currentBatch * BATCH_SIZE; i < Math.min(selectedArray.length, (currentBatch + 1) * BATCH_SIZE); i++) {
            const itemId = selectedArray[i];
            const item = items.find(item => item.id._serialized === itemId);
            if (!item) continue;
            const span = document.createElement('span');
            span.className = 'group_tag CtaBtn';
            span.id = item.objId;
            span.setAttribute('data-id-field', item.id._serialized);
            span.innerHTML = `
                <span class="group">${item.name}</span>
                <img class="delete_group_tag" src="./logo/closeBtn.png" title="Remove ${messageToggleSwitchValue === 'groups' ? 'Group' : 'Contact'}">
            `;
            fragment.appendChild(span);
        }

        displayBox.appendChild(fragment);
        currentBatch++;

        if (currentBatch * BATCH_SIZE < selectedArray.length) {
            requestAnimationFrame(renderBatch);
        }
    }

    requestAnimationFrame(renderBatch);
    chrome.storage.local.set({
        [messageToggleSwitchValue === 'groups' ? 'groups_selected' : 'contacts_selected']: selectedArray
    });
    if (nameFilters.length > 0) handleDeleteBin();
}

function updateGroupBoxDisplay() {
    const boxLabel = document.querySelector("#box_label");
    const template_btn = document.querySelector("#campaign-save-icon-items");
    const displayBox = document.querySelector(".groups_display_box");
    const search = document.querySelector(".search_group_input");
    const boxName = document.querySelector(".selector-box-name");

    boxLabel.innerHTML = `Select ${messageToggleSwitchValue} to message`;
    template_btn.setAttribute("title",`Save ${String(messageToggleSwitchValue).charAt(0).toUpperCase() + String(messageToggleSwitchValue).slice(1)}`)
    boxName.innerHTML=`Campaign ${String(messageToggleSwitchValue).charAt(0).toUpperCase() + String(messageToggleSwitchValue).slice(1)}`
    search.placeholder = `Search ${messageToggleSwitchValue} by name`;
    displayBox.innerHTML = `<p style="color:gray;font-size:13px;margin:0px;">Select ${messageToggleSwitchValue} from the dropdown . . .</p>`;

    if ((messageToggleSwitchValue === "groups" && groups_selected.length > 0) || (messageToggleSwitchValue === "contacts" && contacts_selected.length > 0)) {
       renderSelectedItems();
    }
    handleDeleteBin()
}

function toggleSendMessageToInput(selectedValue) {
    messageToggleSwitchValue = selectedValue;
    chrome.storage.local.set({ 'send_messages_to': messageToggleSwitchValue });

    if (messageToggleSwitchValue === 'numbers') {
        document.querySelector('.numbers-box').style.display = 'revert';
        document.querySelector('.groups_box').style.display = 'none';
        if (csv_data && csv_data.length > 0) {
            document.querySelector('.customize_container').style.display = 'flex';
        }
    } else {
        document.querySelector('.numbers-box').style.display = 'none';
        document.querySelector('.groups_box').style.display = 'flex';
        document.querySelector('.customize_container').style.display = 'none';
        updateGroupBoxDisplay();
    }
}

// disable number and slider timegap input when random delay enabled
function disableNumberTimeGapInput(type = "random") {
    const sliderTimeGapSec = document.querySelector("#slider_time_gap_sec");
    const numberTimeInput = document.querySelector("#time_gap_sec");
    const randomLabelText = document.querySelector("#random_label_text");
    const shouldDisable = (type == "sec") ? true : false;

    if (sliderTimeGapSec)
        sliderTimeGapSec.disabled = shouldDisable;
    if (numberTimeInput)
        numberTimeInput.disabled = shouldDisable;
    if (randomLabelText)
        randomLabelText.classList.toggle("text_color_gray", !shouldDisable);
}

function showTooltip({elementParentClass, text, positionTop, positionBottom, positionLeft, positionRight}){
    const parentElement = document.querySelector(elementParentClass);
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip_main_container";
    if(positionTop)
        tooltip.style.top = positionTop;
    if(positionBottom)
        tooltip.style.bottom = positionBottom ;
    if(positionLeft)
        tooltip.style.left = positionLeft;
    if(positionRight)
        tooltip.style.right = positionRight;
    tooltip.innerHTML = `
        <div>
            ${text}
        </div>
        <div class="tooltip_arrow"></div>
    `;
    parentElement.appendChild(tooltip);
}

function removeTooltip(){
    const tooltip = document.querySelector(".tooltip_main_container");
    if(tooltip){
        tooltip.remove();
    }
}

function handleShowTooltip(){
    const elements = [
        {
            query: ".attach_symbol",
            hoverElement: "#add-attachments",
            text: "Add attachment",
            bottom: "-30px",
        },
        {
            query: ".template-box",
            hoverElement: "#template-save-icon",
            text: "Save template",
            bottom: "-30px",
        },
        {
            query: ".campaign-box",
            hoverElement: "#campaign-save-icon",
            text: "Save numbers",
            bottom: "-30px",
        },
        {
            query: ".upload_excel_box",
            hoverElement: ".upload_excel_box",
            text: "upload excel",
            bottom: "-35px",
        },
        {
            query: "#download_template",
            hoverElement: "#download_template",
            text: "Download template excel",
            bottom: "-35px",
            left: "20px",
        },
    ];

    for (let element of elements) {
        const parentElement = document.querySelector(element.query);
        const hoverElement = document.querySelector(element.hoverElement);
        if(parentElement && hoverElement){
            hoverElement.addEventListener("mouseover", () => {
                showTooltip({
                    elementParentClass: element.query,
                    text: element.text,
                    positionTop: element.top,
                    positionLeft: element.left,
                    positionRight: element.right,
                    positionBottom: element.bottom,
                });
            });
            hoverElement.addEventListener("mouseout", () => {
                removeTooltip();
            });
        }
    }
}