// ========================================
// SISTEMA DE VALIDAÇÃO DE CHAVES DE ATIVAÇÃO
// ========================================
// Este arquivo gerencia o sistema de licenciamento da extensão

// ========================================
// VARIÁVEIS GLOBAIS DO SISTEMA DE CHAVES
// ========================================
var DateToday = undefined;
var getKeys = new Array();
var getKeysUsed = new Array();
var date_today = "";

// ========================================
// CONFIGURAÇÕES DO SISTEMA
// ========================================
var KEYS_URL = "https://raw.githubusercontent.com/your-repo/sender/main/Keys.json";
var USAGE_TRACKING_URL = "https://docs.google.com/spreadsheets/d/e/your-sheet-id/pubhtml";
var DATE_SOURCE_URL = "https://www.horariodebrasilia.org/";

// ========================================
// FUNÇÃO PRINCIPAL DE ATIVAÇÃO
// ========================================
// Função que inicia o processo de ativação da extensão
function inviteToActivation() {
    chrome.storage.local.get(['statusApp'], function(result) {
        if(result.statusApp == undefined) {
            // Primeira instalação - solicitar ativação
            if (confirm("Deseja ativar a extensão Sender agora?\n\nVocê precisará de uma chave de ativação válida.")) {
                setTimeout(function() {
                    get_Keys();
                }, 2000);
            }
        } else {
            if(result.statusApp.activation == "Expirado") {
                // Licença expirada - solicitar nova chave
                if (confirm("Sua licença de uso expirou!\n\nPara continuar usando os recursos da extensão, adquira uma nova chave de ativação.\n\nDeseja inserir uma nova chave?")) {
                    get_Keys();
                }
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
// Função que carrega as chaves válidas do repositório
function get_Keys() {
    console.log("🔑 Carregando chaves de ativação...");
    
    // Limpar arrays
    DateToday = undefined;
    getKeys = new Array();
    getKeysUsed = new Array();
    
    // Carregar chaves válidas
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
// Função que carrega as chaves já utilizadas do Google Sheets
function get_KeysUsed() {
    console.log("📊 Verificando chaves já utilizadas...");
    
    var xmlhttp2 = new XMLHttpRequest();
    xmlhttp2.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var exp_toKeys = />Key:\s\w*\</g;
            var textHTML = this.responseText;
            
            if (exp_toKeys.test(textHTML) == true) {
                var arrayKey = textHTML.match(exp_toKeys);
                
                for (var a = 0; a < arrayKey.length; a++) {
                    getKeysUsed[a] = arrayKey[a].replace(">Key: ", "").replace("<", "");
                }
                
                console.log("📋 Chaves já utilizadas:", getKeysUsed.length);
            }
            
            startActivation();
        } else if (this.readyState == 4 && this.status != 200) {
            console.log("⚠️ Não foi possível verificar chaves usadas, continuando...");
            startActivation();
        }
    };
    
    xmlhttp2.open("GET", USAGE_TRACKING_URL, true);
    xmlhttp2.send();
}

// ========================================
// INÍCIO DO PROCESSO DE ATIVAÇÃO
// ========================================
// Função que inicia o processo de ativação após carregar dados
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
// Função que obtém a data atual do servidor
function get_Date() {
    var xmlhttp3 = new XMLHttpRequest();
    
    xmlhttp3.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var exp_toDate = /id="dia-topo">\w*\-feira\,\s\d{1,2}\b de \w*\b de \d{4}\<|\w*\,\s\d{1,2}\b de \w*\b de \d{4}\</;
            var textHTML = this.responseText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
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
        } else if (this.readyState == 4 && this.status != 200) {
            // Fallback para data local se não conseguir obter do servidor
            DateToday = new Date();
            var today = new Date();
            date_today = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();
            console.log("⚠️ Usando data local:", date_today);
        }
    };
    
    xmlhttp3.open("GET", DATE_SOURCE_URL, true);
    xmlhttp3.send();
}

// ========================================
// CONVERSÃO DE MÊS PARA NÚMERO
// ========================================
// Função auxiliar para converter nome do mês para número
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
// Função principal que processa a ativação com a chave inserida
function Active_extension() {
    var tempo = "";
    var ativacao = "";
    var Validity = "";
    
    // Solicitar chave do usuário
    var key = prompt('🔑 Insira sua chave de ativação:\n\nExemplo: SENDER2024PRO30DIAS');
    
    if (key == "5") {
        // Código especial para cancelar
        Active_extension();
    } else if (key != "5" && key != null && key != undefined) {
        
        // Verificar se a chave contém "DIAS" (temporária)
        if (key.indexOf("DIAS") != -1) {
            if (/\d+/.test(key) == true) {
                tempo = String(/\d+/.exec(key));
                ativacao = "✅ Extensão ativada por " + tempo + " dias";
                Validity = get_periodo(tempo);
            }
        } 
        // Verificar se é chave vitalícia
        else if (key.indexOf("LIFETIME") != -1) {
            ativacao = "✅ Extensão ativada com uso vitalício";
            Validity = get_periodo(720); // 720 dias = ~2 anos (vitalício)
        }
        
        if (Validity != "" && Validity != undefined) {
            
            // Verificar se a chave é válida e não foi usada
            if (getKeys.indexOf(key) != -1 && getKeysUsed.indexOf(key) == -1) {
                
                var register = {
                    activation: 'Ativado',
                    dateActivation: date_today,
                    dateValidity: Validity,
                    key: key
                };
                
                // Salvar ativação no storage
                chrome.storage.local.get(['statusApp'], function(getRegister) {
                    if (getRegister.statusApp != undefined) {
                        chrome.storage.local.remove(['statusApp']);
                    }
                    chrome.storage.local.set({statusApp: register});
                });
                
                setStatusActivated();
                
                // Registrar uso da chave
                send_keyUsed(key);
                
                // Limpar arrays
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
// Função que calcula a data de expiração baseada nos dias
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
// Função que define o status da extensão como ativado
function setStatusActivated() {
    chrome.action.setIcon({path: {"16": "logo/small.png", "48": "logo/medium.png", "128": "logo/large.png"}});
    chrome.action.setTitle({title: "Sender - Ativado"});
    
    // Notificar popup sobre ativação
    chrome.runtime.sendMessage({type: 'extension_activated'});
    
    console.log("✅ Extensão ativada com sucesso!");
}

// ========================================
// VERIFICAÇÃO DE VALIDADE DA LICENÇA
// ========================================
// Função que verifica se a licença ainda é válida
function checkValidity() {
    chrome.storage.local.get(['statusApp'], function(result) {
        if (result.statusApp != undefined) {
            
            var dateActivation = new Date(result.statusApp.dateActivation.split("/").reverse().join("/"));
            var dateValidity = new Date(result.statusApp.dateValidity.split("/").reverse().join("/"));
            
            // Verificar se a licença expirou
            if (dateValidity < new Date() && result.statusApp.activation == "Ativado" ||
                dateValidity < DateToday && result.statusApp.activation == "Ativado" ||
                dateActivation > new Date() && result.statusApp.activation == "Ativado") {
                
                // Licença expirada
                chrome.action.setIcon({path: {"16": "logo/small.png", "48": "logo/medium.png", "128": "logo/large.png"}});
                chrome.action.setTitle({title: "Sender - Licença Expirada"});
                
                var register = {
                    activation: 'Expirado',
                    dateActivation: result.statusApp.dateActivation,
                    dateValidity: result.statusApp.dateValidity,
                    key: result.statusApp.key
                };
                
                chrome.storage.local.remove(['statusApp']);
                chrome.storage.local.set({statusApp: register});
                
                // Notificar popup sobre expiração
                chrome.runtime.sendMessage({type: 'extension_expired'});
                
                console.log("❌ Licença expirada!");
            }
        }
    });
}

// ========================================
// VERIFICAÇÃO DE DATA
// ========================================
// Função que verifica se a data mudou
function checkDate() {
    if (DateToday == undefined) {
        get_Date();
    } else if (new Date().getDate() != DateToday.getDate()) {
        get_Date();
    }
}

// ========================================
// REGISTRO DE USO DA CHAVE
// ========================================
// Função que registra o uso da chave no Google Sheets
function send_keyUsed(key) {
    // Esta função seria implementada para registrar o uso da chave
    // Por enquanto, apenas log
    console.log("📝 Registrando uso da chave:", key);
    
    // Aqui você pode implementar o envio para Google Forms ou Sheets
    // Exemplo: enviar para Google Forms com a chave usada
}

// ========================================
// VERIFICAÇÃO DE STATUS DA EXTENSÃO
// ========================================
// Função que verifica o status atual da extensão
function getExtensionStatus() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['statusApp'], function(result) {
            if (result.statusApp != undefined) {
                resolve(result.statusApp);
            } else {
                resolve({activation: 'Não Ativado'});
            }
        });
    });
}

// ========================================
// EXPORTAÇÃO DAS FUNÇÕES
// ========================================
// Exportar funções para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        inviteToActivation,
        checkValidity,
        checkDate,
        getExtensionStatus,
        setStatusActivated
    };
}
