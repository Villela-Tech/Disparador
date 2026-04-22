// ========================================
// BACKGROUND SCRIPT - SERVICE WORKER
// ========================================
// Este arquivo roda em background e gerencia eventos da extensão

// Importação do sistema de chaves de ativação
// import './Utils/keys-validator.js';

// ========================================
// VARIÁVEIS GLOBAIS DO SISTEMA DE CHAVES
// ========================================
var DateToday = undefined;
var getKeys = new Array();
var getKeysUsed = new Array();
var date_today = "";

// URLs do sistema de chaves
var KEYS_URL = chrome.runtime.getURL("Keys.json"); // Usar arquivo local para testes
var USAGE_TRACKING_URL = "https://docs.google.com/spreadsheets/d/e/your-sheet-id/pubhtml";
var DATE_SOURCE_URL = "https://www.horariodebrasilia.org/";

// ========================================
// LISTENER DE INSTALAÇÃO DA EXTENSÃO
// ========================================
// Executado quando a extensão é instalada ou atualizada
chrome.runtime.onInstalled.addListener((async function (e) {
    // Envia notificação de instalação
    send_notification("Sender is installed", '');
    
    // Inicializa sistema de chaves na primeira instalação
    if (e.reason === "install") {
        setTimeout(function() {
            inviteToActivation();
        }, 3000);
    }
    
    // Busca informações do país do usuário
    fetchCountryInfo();
    
    // Verifica se há uma aba do WhatsApp Web aberta
    chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, function (tabs) {
        if (tabs.length > 0) {
            // Se WhatsApp Web já está aberto, ativa a aba e recarrega
            chrome.tabs.update(tabs[0].id, { active: true }, function () {
                chrome.tabs.reload(tabs[0].id);
            });
        } else {
            // Se não há WhatsApp Web aberto, abre uma nova aba
            chrome.tabs.create({ url: "https://web.whatsapp.com/" });
        }
    });
}));

// ========================================
// CONFIGURAÇÃO DE URL DE DESINSTALAÇÃO
// ========================================
// URL para formulário de feedback quando usuário desinstala a extensão
chrome.runtime.setUninstallURL("https://forms.gle/54vcaup39nfxmEsD8");

// ========================================
// SISTEMA DE MENSAGENS E NOTIFICAÇÕES
// ========================================
// Configura listener para mensagens entre componentes
function messageListner() {
    chrome.runtime.onMessage.addListener(listner);
}

// Processa mensagens recebidas de outros componentes
function listner(request, sender, sendResponse) {
    if (request.type === 'send_notification')
        send_notification(request.title, request.message);
}

// Função para exibir notificações ao usuário
function send_notification(title, message = '') {
    chrome.notifications.create({
        type: 'basic',                    // Tipo básico de notificação
        iconUrl: '../logo/large.png',     // Ícone da extensão
        title: title,                     // Título da notificação
        message: message                  // Mensagem da notificação
    });
}

function bcdinit() {
    messageListner();
    chrome.identity.getProfileUserInfo(function (userinfo) {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (request.email) {
                sendResponse({ email: userinfo.email })
            }
        });
    });
}

async function fetchCountryInfo() {
    let default_country_info = { name: 'Brazil', name_code: 'BR', dial_code: '55', currency: 'BRL', default: true };
    let default_location_info = { name: 'international', name_code: "US", currency: "USD", default: true };
    
    let current_country_info = await new Promise((resolve, reject) => {
        fetch('https://get.geojs.io/v1/ip/geo.json')
            .then((res) => res.json())
            .then((data) =>
                resolve({ 
                    name: data.country,
                    name_code: data.country_code,
                    dial_code: countryToDialCode[data.country_code],
                    currency: countryToCurrency[data.country_code],
                    city: data.city,
                    region: data.region,
                    country: data.country,
                    default: false
                })
            )
            .catch(() =>
                resolve(null)
            );
    }); 

    // country_info: used in popup js for country code selector
    // location_info: used in content js for contry wise pricing 
    if(current_country_info === null) {
        chrome.storage.local.set({ country_info: default_country_info, location_info: default_location_info });
    } else {
        chrome.storage.local.set({ country_info: current_country_info, location_info: current_country_info });
    }
}

chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    try {
        if (tab.url && tab.url.includes("web.whatsapp.com")) {
            if (changeInfo.status === 'loading') {
                chrome.storage.session.remove('whatsapp_session', () => {
                    console.log('WhatsApp session cleared on tab reload.');
                });
            }
        }
    } catch (error) {
        console.error("Error getting tab info:", error);
    }
});

bcdinit();

// ========================================
// SISTEMA DE CHAVES DE ATIVAÇÃO
// ========================================

// ========================================
// FUNÇÃO PRINCIPAL DE ATIVAÇÃO
// ========================================
function inviteToActivation() {
    chrome.storage.local.get(['statusApp'], function(result) {
        if(result.statusApp == undefined) {
            // Primeira instalação - não fazer nada automaticamente
            // O usuário deve clicar no botão do modal
            console.log("🔑 Extensão não ativada - aguardando ativação manual");
        } else {
            if(result.statusApp.activation == "Expirado") {
                // Licença expirada - não fazer nada automaticamente
                console.log("❌ Licença expirada - aguardando nova ativação");
            } else if(result.statusApp.activation == "Trial") {
                // Trial ativo - definir status
                setStatusActivated();
            } else {
                // Já ativado - apenas definir status
                setStatusActivated();
            }
        }
    });
}

// ========================================
// CARREGAMENTO DE CHAVES VÁLIDAS
// ========================================
function get_Keys() {
    console.log("🔑 Carregando chaves de ativação...");
    
    DateToday = undefined;
    getKeys = new Array();
    getKeysUsed = new Array();
    
    var xmlhttp1 = new XMLHttpRequest();
    xmlhttp1.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            try {
                var Obj_Json = JSON.parse(this.responseText);
                getKeys = Obj_Json.Keys;
                console.log("✅ Chaves carregadas:", getKeys.length);
                get_KeysUsed();
            } catch (e) {
                console.error("❌ Erro ao carregar chaves:", e);
                alert("Erro ao carregar chaves de ativação. Tente novamente mais tarde.");
            }
        } else if (this.readyState == 4 && this.status != 200) {
            console.error("❌ Erro HTTP:", this.status);
            alert("Erro ao conectar com o servidor de chaves. Verifique sua conexão.");
        }
    };
    
    xmlhttp1.open("GET", KEYS_URL, true);
    xmlhttp1.send();
}

// ========================================
// CARREGAMENTO DE CHAVES USADAS
// ========================================
function get_KeysUsed() {
    console.log("📊 Verificando chaves já utilizadas...");
    
    // Para testes, vamos usar apenas o storage local para controlar chaves usadas
    chrome.storage.local.get(['usedKeys'], function(result) {
        if (result.usedKeys) {
            getKeysUsed = result.usedKeys;
            console.log("📋 Chaves já utilizadas (local):", getKeysUsed.length);
        } else {
            getKeysUsed = [];
            console.log("📋 Nenhuma chave usada anteriormente");
        }
        startActivation();
    });
}

// ========================================
// INÍCIO DO PROCESSO DE ATIVAÇÃO
// ========================================
function startActivation() {
    get_Date();
    
    var ActiveExtension = setInterval(function() {
        if (DateToday != undefined) {
            clearInterval(ActiveExtension);
            Active_extension();
        }
    }, 3000);
}

// ========================================
// OBTENÇÃO DA DATA ATUAL
// ========================================
function get_Date() {
    fetch(DATE_SOURCE_URL)
        .then(response => response.text())
        .then(data => {
            var exp_toDate = /id="dia-topo">\w*\-feira\,\s\d{1,2}\b de \w*\b de \d{4}\<|\w*\,\s\d{1,2}\b de \w*\b de \d{4}\</;
            var textHTML = data.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (exp_toDate.test(textHTML) == true) {
                var data_ = String(exp_toDate.exec(textHTML)).replace('id="dia-topo">', '').replace('<', '').replace(',', '');
                var x = data_.split(" ").length;
                
                var data = {
                    diaSemana: data_.split(" ", x)[0],
                    diaMes: data_.split(" ", x)[1],
                    mes: getMes_num(data_.split(" ", x)[3]),
                    ano: data_.split(" ", x)[5]
                };
                
                date_today = data.diaMes + "/" + data.mes + "/" + data.ano;
                DateToday = new Date(date_today.split("/").reverse().join("/"));
                
                console.log("📅 Data atual:", date_today);
            }
        })
        .catch(error => {
            console.error("❌ Erro ao obter data:", error);
            // Fallback para data local
            DateToday = new Date();
            var today = new Date();
            date_today = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();
            console.log("⚠️ Usando data local:", date_today);
        });
}

// ========================================
// CONVERSÃO DE MÊS PARA NÚMERO
// ========================================
function getMes_num(mes) {
    var meses = {
        "janeiro": "01", "fevereiro": "02", "marco": "03", "abril": "04",
        "maio": "05", "junho": "06", "julho": "07", "agosto": "08",
        "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12"
    };
    return meses[mes.toLowerCase()] || "01";
}

// ========================================
// PROCESSO DE ATIVAÇÃO DA EXTENSÃO
// ========================================
function Active_extension() {
    var tempo = "";
    var ativacao = "";
    var Validity = "";
    
    var key = prompt('🔑 Insira sua chave de ativação:\n\nExemplo: SENDER2024PRO30DIAS');
    
    if (key == "5") {
        Active_extension();
    } else if (key != "5" && key != null && key != undefined) {
        
        if (key.indexOf("DIAS") != -1) {
            if (/\d+/.test(key) == true) {
                tempo = String(/\d+/.exec(key));
                ativacao = "✅ Extensão ativada por " + tempo + " dias";
                Validity = get_periodo(tempo);
            }
        } 
        else if (key.indexOf("LIFETIME") != -1) {
            ativacao = "✅ Extensão ativada com uso vitalício";
            Validity = get_periodo(720);
        }
        
        if (Validity != "" && Validity != undefined) {
            
            if (getKeys.indexOf(key) != -1 && getKeysUsed.indexOf(key) == -1) {
                
                var register = {
                    activation: 'Ativado',
                    dateActivation: date_today,
                    dateValidity: Validity,
                    key: key
                };
                
                chrome.storage.local.get(['statusApp'], function(getRegister) {
                    if (getRegister.statusApp != undefined) {
                        chrome.storage.local.remove(['statusApp']);
                    }
                    chrome.storage.local.set({statusApp: register});
                });
                
                setStatusActivated();
                
                // Registrar chave como usada no storage local
                getKeysUsed.push(key);
                chrome.storage.local.set({usedKeys: getKeysUsed});
                
                send_keyUsed(key);
                
                getKeys = new Array();
                getKeysUsed = new Array();
                
                alert(ativacao);
                alert("🎉 Ativação realizada com sucesso!\n\n" +
                      "⚠️ IMPORTANTE:\n" +
                      "- Evite desinstalar a extensão para não perder a ativação\n" +
                      "- Certifique-se de estar logado no WhatsApp Web antes de usar\n" +
                      "- Sua licença expira em: " + Validity);
                
            } else {
                alert("❌ Chave inválida ou já utilizada!\n\nVerifique se a chave está correta e não foi usada anteriormente.");
                Active_extension();
            }
        } else {
            alert("❌ Formato de chave inválido!\n\nUse o formato: SENDER2024PRO30DIAS");
            Active_extension();
        }
    }
}

// ========================================
// CÁLCULO DO PERÍODO DE VALIDADE
// ========================================
function get_periodo(dias) {
    var dataAtivacao = new Date(date_today.split("/").reverse().join("/"));
    var dataExpiracao = new Date(dataAtivacao);
    dataExpiracao.setDate(dataExpiracao.getDate() + parseInt(dias));
    
    var dia = dataExpiracao.getDate();
    var mes = dataExpiracao.getMonth() + 1;
    var ano = dataExpiracao.getFullYear();
    
    return dia + "/" + mes + "/" + ano;
}

// ========================================
// DEFINIÇÃO DE STATUS ATIVADO
// ========================================
function setStatusActivated() {
    chrome.action.setIcon({path: {"16": "../logo/small.png", "48": "../logo/medium.png", "128": "../logo/large.png"}});
    chrome.action.setTitle({title: "Sender - Ativado"});
    
    // Atualizar plan_type baseado no status atual
    chrome.storage.local.get(['statusApp'], function(result) {
        if (result.statusApp) {
            var planType = result.statusApp.activation === 'Trial' ? 'Trial' : 'Ativado';
            chrome.storage.local.set({plan_type: planType});
            console.log("📊 Plan type atualizado para:", planType);
        }
    });
    
    chrome.runtime.sendMessage({type: 'extension_activated'});
    
    console.log("✅ Extensão ativada com sucesso!");
    
    // Recarregar WhatsApp Web após ativação
    reloadWhatsAppWeb();
}

// ========================================
// VERIFICAÇÃO DE INTEGRIDADE DO TRIAL
// ========================================
function validateTrialIntegrity() {
    chrome.storage.local.get(['statusApp'], function(localData) {
        chrome.storage.sync.get(['trialUsed', 'trialId', 'userAgent', 'timezone'], function(syncData) {
            if (localData.statusApp && localData.statusApp.activation === 'Trial') {
                try {
                    // Verificar se o trial é válido
                    var isTrialValid = true;
                    var invalidReason = "";
                    
                    // Verificar se trial foi usado
                    if (!syncData.trialUsed) {
                        isTrialValid = false;
                        invalidReason = "Trial não foi marcado como usado";
                    }
                    
                    // Verificar ID do trial
                    if (!syncData.trialId) {
                        isTrialValid = false;
                        invalidReason = "ID do trial não encontrado";
                    } else if (localData.statusApp.trialId !== syncData.trialId) {
                        isTrialValid = false;
                        invalidReason = "ID do trial não confere";
                    }
                    
                    // Verificar User Agent (proteção contra reinstalação)
                    if (localData.statusApp.userAgent && syncData.userAgent && 
                        localData.statusApp.userAgent !== syncData.userAgent) {
                        isTrialValid = false;
                        invalidReason = "User Agent alterado (possível reinstalação)";
                    }
                    
                    // Verificar Timezone (proteção adicional)
                    if (localData.statusApp.timezone && syncData.timezone && 
                        localData.statusApp.timezone !== syncData.timezone) {
                        isTrialValid = false;
                        invalidReason = "Timezone alterado";
                    }
                    
                    // Verificar se trial não expirou por tempo
                    if (localData.statusApp.dateValidity) {
                        var expirationDate = new Date(localData.statusApp.dateValidity.split("/").reverse().join("/"));
                        if (expirationDate < new Date()) {
                            isTrialValid = false;
                            invalidReason = "Trial expirado por tempo";
                        }
                    }
                    
                    if (!isTrialValid) {
                        // Trial inválido - expirar imediatamente
                        console.log("🚨 Trial inválido detectado:", invalidReason);
                        
                        const register = {
                            activation: 'Expirado',
                            dateActivation: localData.statusApp.dateActivation,
                            dateValidity: localData.statusApp.dateValidity,
                            key: localData.statusApp.key,
                            invalidReason: invalidReason
                        };
                        
                        chrome.storage.local.set({statusApp: register});
                        chrome.runtime.sendMessage({type: 'extension_expired'});
                    }
                    
                } catch (error) {
                    console.error("❌ Erro ao validar integridade do trial:", error);
                }
            }
        });
    });
}

// ========================================
// VERIFICAÇÃO DE VALIDADE DA LICENÇA
// ========================================
function checkValidity() {
    chrome.storage.local.get(['statusApp'], function(result) {
        if (result.statusApp != undefined) {
            
            try {
                var dateActivation = new Date(result.statusApp.dateActivation.split("/").reverse().join("/"));
                var dateValidity = new Date(result.statusApp.dateValidity.split("/").reverse().join("/"));
                var currentDate = new Date();
                
                // Verificar se as datas são válidas
                if (isNaN(dateActivation.getTime()) || isNaN(dateValidity.getTime())) {
                    console.error("❌ Datas inválidas encontradas:", result.statusApp);
                    return;
                }
                
                // Verificar se a licença/trial expirou
                var isExpired = false;
                var expirationReason = "";
                
                // Verificar expiração por data de validade
                if (dateValidity < currentDate) {
                    isExpired = true;
                    expirationReason = "Data de validade expirada";
                }
                
                // Verificar expiração por DateToday (se disponível)
                if (DateToday && dateValidity < DateToday) {
                    isExpired = true;
                    expirationReason = "Data de validade expirada (servidor)";
                }
                
                // Verificar se a data de ativação é no futuro (erro)
                if (dateActivation > currentDate) {
                    isExpired = true;
                    expirationReason = "Data de ativação no futuro";
                }
                
                // Aplicar expiração se necessário
                if (isExpired && (result.statusApp.activation == "Ativado" || result.statusApp.activation == "Trial")) {
                    console.log("❌ Licença expirada:", expirationReason);
                    
                    chrome.action.setIcon({path: {"16": "../logo/small.png", "48": "../logo/medium.png", "128": "../logo/large.png"}});
                    chrome.action.setTitle({title: "Sender - Licença Expirada"});
                    
                    var register = {
                        activation: 'Expirado',
                        dateActivation: result.statusApp.dateActivation,
                        dateValidity: result.statusApp.dateValidity,
                        key: result.statusApp.key,
                        expirationReason: expirationReason
                    };
                    
                    chrome.storage.local.remove(['statusApp']);
                    chrome.storage.local.set({statusApp: register});
                    
                    // Se o trial expirou, marcar como usado
                    if (result.statusApp.activation === 'Trial') {
                        chrome.storage.sync.set({trialUsed: true});
                        console.log("🚨 Trial expirado - marcado como usado permanentemente");
                    }
                    
                    chrome.runtime.sendMessage({type: 'extension_expired'});
                }
                
            } catch (error) {
                console.error("❌ Erro ao verificar validade da licença:", error);
            }
        }
    });
}

// ========================================
// VERIFICAÇÃO DE DATA
// ========================================
function checkDate() {
    try {
        if (DateToday == undefined) {
            console.log("📅 DateToday não definido - obtendo data do servidor");
            get_Date();
        } else {
            var currentDate = new Date();
            var currentDay = currentDate.getDate();
            var storedDay = DateToday.getDate();
            
            // Verificar se mudou o dia ou se passou mais de 1 hora
            var timeDiff = Math.abs(currentDate.getTime() - DateToday.getTime());
            var hoursDiff = timeDiff / (1000 * 3600);
            
            if (currentDay != storedDay || hoursDiff > 1) {
                console.log("📅 Data mudou ou passou mais de 1 hora - atualizando");
                get_Date();
            }
        }
    } catch (error) {
        console.error("❌ Erro ao verificar data:", error);
        // Fallback para data local
        DateToday = new Date();
    }
}

// ========================================
// REGISTRO DE USO DA CHAVE
// ========================================
function send_keyUsed(key) {
    console.log("📝 Registrando uso da chave:", key);
    
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
// RECARREGAMENTO DO WHATSAPP WEB E EXTENSÃO
// ========================================
function reloadWhatsAppWeb() {
    // Buscar abas do WhatsApp Web
    chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, function (tabs) {
        if (tabs.length > 0) {
            // Recarregar todas as abas do WhatsApp Web
            tabs.forEach(function(tab) {
                chrome.tabs.reload(tab.id, function() {
                    console.log("🔄 WhatsApp Web recarregado após ativação");
                });
            });
        } else {
            // Se não há WhatsApp Web aberto, abrir uma nova aba
            chrome.tabs.create({ url: "https://web.whatsapp.com/" }, function(tab) {
                console.log("🆕 Nova aba do WhatsApp Web aberta");
            });
        }
    });
    
    // Enviar mensagem para recarregar a interface da extensão
    setTimeout(function() {
        // Enviar mensagem para o popup recarregar a interface
        chrome.runtime.sendMessage({type: 'reload_interface'}, function(response) {
            if (chrome.runtime.lastError) {
                console.log("🔄 Interface será recarregada quando o popup for reaberto");
            } else {
                console.log("🔄 Interface recarregada com sucesso");
            }
        });
    }, 1000);
}

// ========================================
// INÍCIO MANUAL DO TRIAL
// ========================================
function startTrialManually() {
    // Verifica se já usou trial antes
    chrome.storage.sync.get(['trialUsed', 'trialStartedAt', 'trialExpiresAt'], function(syncData) {
        if (syncData && syncData.trialUsed === true) {
            // Já usou trial - não permite novo
            send_notification('Trial já utilizado', 'Você já usou seu período de teste de 3 dias.');
            return;
        }
        
        // Verificação adicional: se há trial ativo no storage local
        chrome.storage.local.get(['statusApp'], function(localData) {
            if (localData.statusApp && localData.statusApp.activation === 'Trial') {
                // Já tem trial ativo - não permite novo
                send_notification('Trial já ativo', 'Você já possui um trial ativo.');
                return;
            }
        
            // Conceder 3 dias de trial
            const today = new Date();
            const expiration = new Date(today);
            expiration.setDate(expiration.getDate() + 3);
            
            // Gerar ID único para o trial (proteção adicional)
            const trialId = 'TRIAL_' + today.getTime() + '_' + Math.random().toString(36).substr(2, 9);
            
            const registerTrial = {
                activation: 'Trial',
                dateActivation: today.toLocaleDateString('pt-BR'),
                dateValidity: expiration.toLocaleDateString('pt-BR'),
                key: trialId,
                trialId: trialId,
                createdAt: today.toISOString(),
                userAgent: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            chrome.storage.local.set({ statusApp: registerTrial }, function() {
                // Enviar mensagem para mostrar modal de ativação do trial
                chrome.runtime.sendMessage({ 
                    type: 'show_trial_activation_modal',
                    trialData: registerTrial
                });
                
                // Recarregar WhatsApp Web após ativação
                reloadWhatsAppWeb();
            });
            
            // Marcar trial como usado com informações adicionais
            chrome.storage.sync.set({
                trialUsed: true,
                trialStartedAt: today.toISOString(),
                trialExpiresAt: expiration.toISOString(),
                trialId: trialId,
                userAgent: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                lastTrialDate: today.toISOString()
            });
        });
    });
}

// ========================================
// LISTENER PARA MENSAGENS DE ATIVAÇÃO
// ========================================
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'check_activation') {
        chrome.storage.local.get(['statusApp'], function(result) {
            if (result.statusApp != undefined) {
                sendResponse({status: result.statusApp.activation});
            } else {
                sendResponse({status: 'Não Ativado'});
            }
        });
        return true;
    }
    
    if (request.type === 'request_activation') {
        console.log("🔑 Solicitação de ativação recebida");
        // Executar ativação diretamente
        setTimeout(function() {
            get_Keys();
        }, 1000);
        sendResponse({success: true});
    }
    
    if (request.type === 'start_trial') {
        console.log("🧪 Solicitação de trial recebida");
        startTrialManually();
        sendResponse({success: true});
    }
    
});

// ========================================
// VERIFICAÇÃO PERIÓDICA DE VALIDADE
// ========================================
// Verificar validade a cada 5 minutos
setInterval(function() {
    checkDate();
    checkValidity();
    validateTrialIntegrity(); // Verificar integridade do trial
}, 300000); // 5 minutos

// Verificar validade imediatamente ao iniciar
setTimeout(function() {
    checkDate();
    checkValidity();
    validateTrialIntegrity();
}, 2000); // 2 segundos após inicialização