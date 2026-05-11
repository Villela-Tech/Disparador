// ========================================
// CÓDIGO PRINCIPAL DE INJEÇÃO NO WHATSAPP
// ========================================
// Este arquivo é injetado no WhatsApp Web e acessa suas APIs internas

// ========================================
// FUNÇÕES DE VERIFICAÇÃO DE ESTADO
// ========================================
// Verifica se o WhatsApp Web está carregado
const isWhatsappLoaded = () => (document.querySelector('#pane-side') ? true : false);

// Verifica se o Webpack (sistema de módulos do WhatsApp) está carregado
const isWebpackLoaded = () => ('function' === typeof webpackJsonp || window.webpackChunkwhatsapp_web_client || window.require);

// Função de delay para aguardar carregamento
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// ========================================
// FUNÇÕES DE CONSOLE PERSONALIZADAS
// ========================================
// Console com cores para diferentes tipos de mensagem
console.logSuccess = (message) => console.log(`%c${message}`, 'color: lightGreen; font-weight: bold; font-size: 14px;');
console.logError = (message) => console.log(`%c${message}`, 'color: red; font-weight: bold;');
console.logWarn = (message) => console.log(`%c${message}`, 'color: orange; font-weight: bold;');

// ========================================
// INICIALIZAÇÃO DO STORE DO WHATSAPP
// ========================================
// Função principal para inicializar o acesso às APIs internas do WhatsApp
const initStore = function (useOldMethod = true) {
    if (useOldMethod) {
        return initStoreOld(); // Método antigo (mais compatível)
    } else {
        return initStoreNew(); // Método novo (mais eficiente)
    }
}

// ========================================
// MÉTODO ANTIGO DE INICIALIZAÇÃO
// ========================================
// Método mais compatível com versões antigas do WhatsApp Web
const initStoreOld = function () {
    const inject = function () {
        return (
            // Gera ID único para o módulo
            (inject.mID = Math.random().toString(36).substring(7)),
            (inject.mObj = {}),
            
            // Injeta no sistema de módulos do WhatsApp
            (window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client).push([
                [inject.mID],
                {},
                function (i) {
                    // Mapeia todos os módulos disponíveis
                    Object.keys(i.m).forEach(function (n) {
                        inject.mObj[n] = i(n);
                    });
                },
            ]),
            
            // Retorna objeto com acesso aos módulos
            {
                modules: inject.mObj,
                constructors: inject.cArr,
                
                // Função para encontrar módulos específicos
                findModule: function (i) {
                    let obj = [];
                    return (
                        Object.keys(inject.mObj).forEach(function (a) {
                            let element = inject.mObj[a];
                            if (void 0 !== element)
                                if ("string" == typeof i) {
                                    // Busca por string (nome do módulo)
                                    if ("object" == typeof element.default)
                                        for (let e in element.default) e == i && obj.push(element);
                                    for (let e in element) e == i && obj.push(element);
                                } else {
                                    // Busca por função (filtro)
                                    if ("function" != typeof i)
                                        throw new TypeError(
                                            "findModule can only find via string and function, " +
                                            typeof i +
                                            " was passed"
                                        );
                                    i(element) && obj.push(element);
                                }
                        }),
                        obj
                    );
                },
                
                // Função para obter módulo por ID
                get: function (i) {
                    return inject.mObj[i];
                },
            }
        );
    };

    return new Promise((resolve, reject) => {
        try {
            if (window.require && window.importDefault) {
                // Create store by importing whatsapp collection
                const e = (e) => window.require(e);
                const i = (e) => window.importDefault(e);

                window.Store = {
                    Chat: e("WAWebChatCollection")?.ChatCollection,
                    Contact: e("WAWebContactCollection")?.ContactCollection,
                    Msg: e("WAWebMsgCollection")?.MsgCollection,
                    MsgKey: i("WAWebMsgKey"),
                    BusinessProfile: e("WAWebBusinessProfileCollection")?.BusinessProfileCollection,
                    GroupMetadata: i("WAWebGroupMetadataCollection"),
                    TextMsgChatAction: e("WAWebSendTextMsgChatAction"),
                    MediaCollection: i("WAWebAttachMediaCollection"),
                    UserConstructor: i("WAWebWid"),
                    EnumTypes: e("WAWebWamEnumMediaPickerOriginType"),
                    MediaPrep: e("WAWebMediaPrep"),
                    MsgType: e("WAWebMsgType")?.MSG_TYPE,
                    OpaqueData: typeof window.importNamespace === 'function' ? window.importNamespace("WAWebMediaOpaqueData") : null,
                };

                if (window.Store) {
                    window.Store.InitType = "old_method_1";
                }
            } else {
                // Create store using inject function
                let mR = inject();
                window.Store = Object.assign({}, mR.findModule(e => e.default && e.default.Chat)[0]?.default || {});
                window.Store.MediaCollection = mR.findModule(e => e.default && e.default.prototype?.processAttachments)[0]?.default;
                window.Store.UserConstructor = mR.findModule(e => e.default && e.default.prototype?.isServer && e.default.prototype?.isUser)[0]?.default;
                window.Store.TextMsgChatAction = mR.findModule("sendTextMsgToChat")[0];
                window.Store.WidFactory = mR.findModule("createWid")[0];
                window.Store.Cmd = mR.findModule("Cmd")[0]?.Cmd;
                window.Store.ChatState = mR.findModule("sendChatStateComposing")[0];
                window.Store.ContactMethods = mR.findModule("getUserid")[0];
                window.Store.ChatHelper = mR.findModule("findChat")[0];
                window.Store.EnumTypes = mR.findModule("MEDIA_PICKER_ORIGIN_TYPE")[0];
                window.Store.MenuClasses = mR.findModule(e => e?.default?.menu && e?.default?.item ? e.default : null)[0]?.default;
                window.Store.MediaPrep = mR.findModule(e => e?.MediaPrep || e?.default?.MediaPrep)[0]?.MediaPrep || mR.findModule(e => e?.default?.prototype?.waitForPrep)[0]?.default;
                window.Store.MsgType = mR.findModule(e => e?.MSG_TYPE || e?.IMAGE)[0]?.MSG_TYPE || mR.findModule(e => e?.default?.IMAGE)[0]?.default;

                if (window.Store) {
                    window.Store.InitType = "old_method_2";
                }
            }

            // Extend Store functionality
            if (window.Store?.Chat?.modelClass?.prototype) {
                window.Store.Chat.modelClass.prototype.sendMessage = function (e) {
                    window.Store.TextMsgChatAction.sendTextMsgToChat(this, ...arguments);
                };
            }

            if (window.Store?.Chat && !window.Store.Chat._find) {
                window.Store.Chat._findAndParse = window.Store.BusinessProfile?._findAndParse;
                window.Store.Chat._find = window.Store.BusinessProfile?._find;
            }

            resolve();
        } catch (error) {
            reject("InjectJS :: initStoreOld :: Error :: " + error);
        }
    });
}

const initStoreNew = function () {
    let neededObjects = [
        { id: "MediaCollection", module: "WAWebAttachMediaCollection", conditions: (module) => (module.default && module.default.prototype && (module.default.prototype.processFiles !== undefined || module.default.prototype.processAttachments !== undefined)) ? module.default : null },
        { id: "Archive", module: "WAWebSetArchiveChatAction", conditions: (module) => (module.setArchive) ? module : null },
        { id: "Block", module: "WAWebBlockContactUtils", conditions: (module) => (module.blockContact && module.unblockContact) ? module : null },
        { id: "ChatUtil", module: "WAWebSendClearChatAction", conditions: (module) => (module.sendClear) ? module : null },
        { id: "GroupInvite", module: "WAWebGroupInviteJob", conditions: (module) => (module.queryGroupInviteCode) ? module : null },
        { id: "Wap", module: "WAWebCreateGroupAction", conditions: (module) => (module.createGroup) ? module : null },
        { id: "State", module: "WAWebSocketModel", conditions: (module) => (module.STATE && module.STREAM) ? module : null },
        { id: "_Presence", module: "WAWebContactPresenceBridge", conditions: (module) => (module.setPresenceAvailable && module.setPresenceUnavailable) ? module : null },
        { id: "WapDelete", module: "WAWebChatDeleteBridge", conditions: (module) => (module.sendConversationDelete && module.sendConversationDelete.length == 2) ? module : null },
        { id: "WapQuery", module: "WAWebQueryExistsJob", conditions: (module) => (module.queryExist) ? module : ((module.default && module.default.queryExist) ? module.default : null) },
        { id: "UserConstructor", module: "WAWebWid", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null },
        { id: "SendTextMsgToChat", module: "WAWebSendTextMsgChatAction", resolver: (module) => module.sendTextMsgToChat },
        { id: "ReadSeen", module: "WAWebUpdateUnreadChatAction", conditions: (module) => (module.sendSeen) ? module : null },
        { id: "sendDelete", module: "WAWebDeleteChatAction", conditions: (module) => (module.sendDelete) ? module.sendDelete : null },
        { id: "addAndSendMsgToChat", module: "WAWebSendMsgChatAction", conditions: (module) => (module.addAndSendMsgToChat) ? module.addAndSendMsgToChat : null },
        { id: "Catalog", module: "WAWebCatalogCollection", conditions: (module) => (module.Catalog) ? module.Catalog : null },
        { id: "MsgKey", module: "WAWebMsgKey", conditions: (module) => (module.default && module.default.toString && module.default.toString().includes('MsgKey error: obj is null/undefined')) ? module.default : null },
        { id: "Parser", module: "WAWebE2EProtoUtils", conditions: (module) => (module.convertToTextWithoutSpecialEmojis) ? module.default : null },
        { id: "Builders", module: "WAWebProtobufsE2E.pb", conditions: (module) => (module.TemplateMessage && module.HydratedFourRowTemplate) ? module : null },
        { id: "Me", module: "WAWebUserPrefsMeUser", conditions: (module) => (module.PLATFORMS && module.Conn) ? module.default : null },
        { id: "MyStatus", module: "WAWebContactStatusBridge", conditions: (module) => (module.getStatus && module.setMyStatus) ? module : null },
        { id: "ChatStates", module: "WAWebChatStateBridge", conditions: (module) => (module.sendChatStatePaused && module.sendChatStateRecording && module.sendChatStateComposing) ? module : null },
        { id: "GroupActions", module: "WAWebExitGroupAction", conditions: (module) => (module.sendExitGroup && module.localExitGroup) ? module : null },
        { id: "Participants", module: "WAWebGroupsParticipantsApi", conditions: (module) => (module.addParticipants && module.removeParticipants && module.promoteParticipants && module.demoteParticipants) ? module : null },
        { id: "WidFactory", module: "WAWebWidFactory", conditions: (module) => (module.isWidlike && module.createWid && module.createWidFromWidLike) ? module : null },
        { id: "Sticker", module: "WAWebStickerPackCollection", resolver: m => m.StickerPackCollection, conditions: (module) => (module.default && module.default.Sticker) ? module.default.Sticker : null },
        { id: "UploadUtils", module: "WAWebUploadManager", conditions: (module) => (module.default && module.default.encryptAndUpload) ? module.default : null }
    ];

    return new Promise((resolve, reject) => {
        try {
            const e = (m) => require("__debug").modulesMap[m] || false;

            const shouldRequire = m => {
                const a = e(m);
                if (!a) return false;
                return a.dependencies != null && a.depPosition >= a.dependencies.length
            };

            neededObjects.map((needObj) => {
                const m = needObj.module;
                if (!m) return;
                if (!e(m)) return;
                if (shouldRequire(m)) {
                    let neededModule = require(m)
                    needObj.foundedModule = neededModule;
                }
            });

            window.Store = {
                ...{ ...require("WAWebCollections") },
                ...(window.Store || {})
            }

            neededObjects.forEach((needObj) => {
                if (needObj.foundedModule) {
                    window.Store[needObj.id] = needObj.resolver ? needObj.resolver(needObj.foundedModule) : needObj.foundedModule;
                }
            });

            if (window.Store.Chat) {
                window.Store.Chat.modelClass.prototype.sendMessage = function (e) {
                    window.Store.SendTextMsgToChat(this, ...arguments);
                }
            }

            if (window.Store) {
                window.Store.InitType = "new_method";
            }

            resolve();
        } catch (error) {
            reject("InjectJS :: initStoreNew :: Error :: " + error);
        }
    });
}

// Init ProSender Object function
const initProSender = function () {
    // Initalize ProSender object
    window.ProSender = { lastRead: {} };

    // Send media attachment - Usa MediaPrep (API do WhatsApp Web) como método principal (referência: lpkcglgkpkloheddkmehdapeclclnecm)
    window.ProSender.sendAttachment = async function (mediaBlob, chatid, caption, waitTillSend) {
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            if (!mediaBlob) throw new Error("mediaBlob is required");

            // Normalize chat ID
            const normalizeChatId = (chatId) => {
                if (chatId && typeof chatId === 'object' && chatId._serialized) {
                    return chatId._serialized;
                }
                let normalized = String(chatId ?? "").trim();
                if (!normalized) throw new Error("chatid vacío");
                return /@(?:c\.us|g\.us|lid)$/.test(normalized) ? normalized : 
                       normalized.includes("-") ? normalized.replace(/[^\d-]/g, "") + "@g.us" : 
                       normalized.replace(/\D/g, "") + "@c.us";
            };

            const normalizedChatId = normalizeChatId(chatid);

            // Resolver chat igual ao envio de texto: get → _find → find (e wid quando existir)
            const resolveChatForAttachment = async (jid) => {
                let chat = window.Store?.Chat?.get?.(jid);
                const wid = window.Store?.WidFactory?.createWid ? window.Store.WidFactory.createWid(jid) : null;
                if (!chat && wid && window.Store?.Chat?.get) {
                    try { chat = window.Store.Chat.get(wid); } catch (e) {}
                }
                if (!chat && window.Store.Chat._find) {
                    try { chat = await window.Store.Chat._find(jid); } catch (e) {}
                    if (!chat && wid) {
                        try { chat = await window.Store.Chat._find(wid); } catch (e2) {}
                    }
                }
                if (!chat && window.Store.Chat.find) {
                    try { chat = await window.Store.Chat.find(jid); } catch (e) {}
                    if (!chat && wid) {
                        try { chat = await window.Store.Chat.find(wid); } catch (e2) {}
                    }
                }
                return chat || null;
            };

            // Método 1: MediaPrep (API oficial do WhatsApp Web - mais confiável)
            if (window.Store?.MediaPrep?.MediaPrep && window.Store?.MsgType) {
                let chat = await resolveChatForAttachment(normalizedChatId);
                if (!chat) throw new Error("Chat no encontrado: " + normalizedChatId);

                const getMsgType = (file) => {
                    const mime = (file.type || "").toLowerCase();
                    if (mime.startsWith("image/")) return window.Store.MsgType.IMAGE;
                    if (mime.startsWith("video/")) return window.Store.MsgType.VIDEO;
                    if (mime.startsWith("audio/")) return window.Store.MsgType.AUDIO;
                    return window.Store.MsgType.DOCUMENT;
                };

                const msgType = getMsgType(mediaBlob);
                const mediaData = { mediaBlob, type: msgType, mimetype: mediaBlob.type, size: mediaBlob.size };
                const mediaPrep = new window.Store.MediaPrep.MediaPrep(msgType, Promise.resolve(mediaData));
                await mediaPrep.waitForPrep();

                const options = { type: msgType };
                if (caption && /\S/.test(caption)) {
                    options.caption = caption;
                    options.isCaptionByUser = true;
                }

                try {
                    await mediaPrep.sendToChat({ chat, options });
                } catch (e) {
                    await mediaPrep.sendToChat(chat, options);
                }

                if (waitTillSend) {
                    const startTime = Date.now();
                    const waitForSent = () => {
                        const lastMsg = document.querySelectorAll(".message-out");
                        return lastMsg[lastMsg.length - 1] || (Date.now() - startTime > 3000) ? null : setTimeout(waitForSent, 250);
                    };
                    await new Promise(r => { const t = waitForSent(); t ? setTimeout(r, 500) : r(); });
                }
                return { is_attachments_sent: "YES", comments: "" };
            }

            // Método 2: Fallback - WPP.chat.sendFileMessage
            if (window.WPP?.chat?.sendFileMessage) {
                const fileToBase64 = (file) => new Promise((resolve, reject) => {
                    if (typeof file === 'string') return resolve(file);
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                const base64Data = await fileToBase64(mediaBlob);
                await window.WPP.chat.sendFileMessage(normalizedChatId, base64Data, {
                    createChat: true,
                    filename: mediaBlob?.name || "file",
                    caption: caption && /\S/.test(caption) ? caption : undefined
                });
                if (waitTillSend) { const startTime = Date.now(); while (Date.now() - startTime < 5000) await sleep(250); }
                return { is_attachments_sent: "YES", comments: "" };
            }

            // Método 3: Fallback - MediaCollection (método antigo)
            let chat = await resolveChatForAttachment(normalizedChatId);
            if (!chat) throw new Error("Chat no encontrado: " + normalizedChatId);

            const mc = new window.Store.MediaCollection(chat);
            let processed = false;
            if (mc.processAttachmentsForChat) {
                try { await mc.processAttachmentsForChat([{ file: mediaBlob }], undefined, chat); processed = true; } catch (e) {}
            }
            if (!processed && mc.processAttachments) {
                try { await mc.processAttachments([{ file: mediaBlob }, 1], chat, chat); processed = true; } catch (e) {
                    try { await mc.processAttachments([{ file: mediaBlob }], chat); processed = true; } catch (e2) {
                        try { await mc.processAttachments([{ file: mediaBlob }]); processed = true; } catch (e3) {}
                    }
                }
            }
            if (!processed && mc.processFiles) {
                try { await mc.processFiles([{ file: mediaBlob }], chat); processed = true; } catch (e) {}
            }
            if (!processed) throw new Error("No se pudo procesar el archivo");

            const media = (mc.getValidMedias?.() ?? mc._models ?? mc.models ?? [])[0];
            if (!media) throw new Error("No media model created");
            const captionObject = caption && /\S/.test(caption) ? { caption } : {};
            let sent = false;
            if (typeof media.sendToChat === 'function') {
                try { await media.sendToChat(chat, captionObject); sent = true; } catch (e) { if (!/mediaprep/i.test(String(e))) throw e; }
            }
            if (!sent && typeof window.Store?.addAndSendMsgToChat === 'function') {
                if (typeof media.upload === 'function') {
                    try { await media.upload(); } catch (e) {}
                }
                await window.Store.addAndSendMsgToChat(chat, media, captionObject);
                sent = true;
            }
            if (!sent) throw new Error("No hay ruta interna para enviar media en este build");
            if (waitTillSend) { const startTime = Date.now(); while (Date.now() - startTime < 6000) await sleep(300); }
            return { is_attachments_sent: "YES", comments: "" };

        } catch (error) {
            console.error("Error in sendAttachment:", error);
            throw error;
        }
    };

    window.ProSender._isContact = function (obj, isAddressBookContact) {
        if (obj) {
            return obj.id?.server === 'c.us'
                && obj.isBusiness !== true
                && obj.isAddressBookContact === isAddressBookContact;
        }
        return false;
    }

    window.ProSender._serializeContact = function (obj) {
        if (obj) {
            return {
                id: obj.id,
                server: obj.id?.server,
                number: obj.id?.user,
                name: obj.name || obj.pushname || obj.formattedTitle || 'Unkown'
            }
        }
        return {};
    }

    // Get unsaved contacts
    window.ProSender.getMyUnsavedContacts = function () {
        return window.Store.Contact
            .filter(contact => window.ProSender._isContact(contact, 0))
            .map(contact => window.ProSender._serializeContact(contact));
    }

    // Get all contacts
    window.ProSender.getAllContacts = function () {
        return window.Store.Contact
            .filter(contact => window.ProSender._isContact(contact, 1))
            .map(contact => window.ProSender._serializeContact(contact));
    }

    // to get the recent chats based on contact or group
    window.ProSender.getRecentChats = function () {
        return window.Store.Chat
            .filter(chat => chat && window.ProSender._isContact(chat.contact, 1))
            .map(chat => window.ProSender._serializeContact(chat.contact));
    }

    window.ProSender._isGroup = function (obj) {
        if (obj) {
            return obj.id?.server === 'g.us' || obj.groupMetadata;
        }
        return false;
    }

    window.ProSender._serializeGroup = function (obj) {
        if (obj) {
            return {
                id: obj.id,
                name: obj.name || obj.formattedTitle || 'Unkown',
                attributes: obj.attributes,
                groupMetadata: obj.groupMetadata
            }
        }
        return {};
    }

    // Get all groups
    window.ProSender.getAllGroups = function () {
        return window.Store.Chat
            .filter(chat => window.ProSender._isGroup(chat))
            .map(chat => window.ProSender._serializeGroup(chat));
    };

    // Get group by id
    window.ProSender.getGroupById = function (group_id) {
        return window.ProSender.getAllGroups().find(group => group.id._serialized === group_id);
    }

    // Get group contacts
    window.ProSender.getGroupContacts = function (group_id, callback) {
        let group = window.ProSender.getGroupById(group_id);
        if (group) {
            let participants = group.groupMetadata?.participants || [];
            return participants.map(p => p.contact && window.ProSender._serializeContact(p.contact));
        }
        return [];
    };

    // Get group name
    window.ProSender.getGroupName = function (group_id) {
        let group = window.ProSender.getGroupById(group_id);
        return group ? group.name : 'Group';
    }

    // Get chat (group or contact) by id
    window.ProSender.getChat = function (id, done) {
        id = typeof id == "string" ? id : id._serialized;
        const found = window.Store.Chat.get(id);
        found.sendMessage = (found.sendMessage) ? found.sendMessage : function () { return window.Store.sendMessage.apply(this, arguments); };
        if (done !== undefined) done(found);
        return found;
    }

    // Send a message
    window.ProSender.sendMessage = function (id, message) {
        return new Promise(async (resolve, reject) => {
            try {
                const chatId = typeof id == "string" ? id : id._serialized;

                // Tenta obter o chat do Store (já carregado em memória)
                let chat = window.Store.Chat.get(chatId);

                // Fallback: busca o chat assincronamente se não estiver no Store
                if (!chat && window.Store.Chat._find) {
                    try { chat = await window.Store.Chat._find(chatId); } catch(e) {}
                }
                if (!chat && window.Store.Chat.find) {
                    try { chat = await window.Store.Chat.find(chatId); } catch(e) {}
                }

                if (chat !== undefined && chat !== null) {
                    // Garante que o método sendMessage está disponível no objeto
                    if (!chat.sendMessage) {
                        chat.sendMessage = function() {
                            window.Store.TextMsgChatAction.sendTextMsgToChat(this, ...arguments);
                        };
                    }
                    chat.sendMessage(message);
                    resolve();
                } else {
                    reject("chat or group not found: " + chatId);
                }
            } catch (err) {
                reject(err);
            }
        });
    };

    // Convert base64 string data to File
    window.ProSender.base64toFile = function (data, fileName) {
        let arr = data.split(",");
        let mime = arr[0].match(/:(.*?);/)[1];
        let bstr = atob(arr[1]);
        let n = bstr.length;
        let u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], fileName, { type: mime });
    }
}

// InitMain :: Load Store and ProSender
var initStoreInterval = null;
var initStoreRetryCount = 0;
var useOldMethod = true;

const initMain = function () {
    initStoreRetryCount = 0;
    initStoreInterval = setInterval(() => {
        if (isWhatsappLoaded() && isWebpackLoaded()) {

            initStore(useOldMethod)
                .then(() => {
                    initProSender();

                    // Check store and ProSender loaded or not
                    if (window.Store && window.ProSender) {
                        clearInterval(initStoreInterval);
                        handleInitMainSuccess();
                    } else {
                        initStoreRetryCount++;
                        handleInitMainError();
                    }
                })
                .catch((e) => {
                    initStoreRetryCount++;
                    handleInitMainError();
                })

        } else {
            handleInitMainError();
        }

        if (!useOldMethod && initStoreRetryCount == 5) {
            reloadInitMain(true);
        }
    }, 1000);
}

const reloadInitMain = function (method) {
    clearInterval(initStoreInterval);
    sessionStorage.removeItem('inject_pro_session');

    setTimeout(() => {
        console.logWarn(`InjectJS :: reloadInitMain :: useOldMethod = ${method}`);
        useOldMethod = method;
        initMain();
    }, 2000)
}

const handleInitMainSuccess = function () {
    const isInjectExecuted = sessionStorage.getItem('inject_pro_session');
    if (isInjectExecuted) {
        console.logSuccess("InjectJS :: initMain - Already executed in this session. Skipping...");
        return;
    } else {
        sessionStorage.setItem('inject_pro_session', 'executed');
    }

    if (isWhatsappLoaded() && window.Store && window.ProSender) {
        console.logSuccess(`InjectJS :: initMain - Success :: useOldMethod = ${useOldMethod}`);
        console.logSuccess(`InjectJS :: Init Store Type  :: ${getInitStoreType()}`);
        console.logSuccess(`InjectJS :: Whatsapp Version :: ${getWhatsappVersion()}`);

        getAllGroups();
        getAllContacts();
    }
}

const handleInitMainError = function (error = null) {
    let objName = null;
    if (!isWhatsappLoaded())
        objName = 'Whatsapp';
    else if (!isWebpackLoaded())
        objName = 'Webpack';
    else if (!window.Store)
        objName = 'Store';
    else if (!window.ProSender)
        objName = 'ProSender';

    if (error) {
        console.logError(`InjectJS :: initMain - Error :: useOldMethod = ${useOldMethod}`);
        console.error(error);
    } else if (objName) {
        console.logError(`InjectJS :: initMain - Error :: ${objName} is not loaded! :: useOldMethod = ${useOldMethod}`);
    } else {
        console.logError(`InjectJS :: initMain - Unkown Error :: useOldMethod = ${useOldMethod}`);
    }
}

// ======= CORE INJECT JS CODE ENDS HERE =======

//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

// ======= Pro SENDER CODE STARTS =====

// Normalize chat ID function (used in event listeners)
function normalizeChatId(chatId) {
    if (chatId && typeof chatId === 'object' && chatId._serialized) {
        return chatId._serialized;
    }
    let normalized = String(chatId ?? "").trim();
    if (!normalized) return "";
    return /@[a-z.]+$/i.test(normalized) ? normalized : 
           normalized.includes("-") ? normalized.replace(/[^\d-]/g, "") + "@g.us" : 
           (normalized = normalized.replace(/[^\d]/g, ""), normalized + "@c.us");
}

// Event Listeners and Pro Sender Functions
window.addEventListener('ProSender::init', function (e) {
    reloadInitMain(e.detail.useOldMethod);
});

window.addEventListener('ProSender::send-attachments', async function (e) {
    const attachments = e.detail.attachments;
    const caption = e.detail.caption;
    const number = e.detail.number;
    const waitTillSend = e.detail.waitTillSend;
    const fileName = e.detail.name;
    const quick = e.detail.quick;
    const normalizedChatId = normalizeChatId(number) || (typeof number === 'string' && number.includes("@lid") ? number : (number || "") + "@c.us");

    try {
        if (quick) {
            let fileData = attachments;
            if (typeof fileData === 'string') {
                try { fileData = fileData.startsWith('"') ? JSON.parse(fileData) : fileData; } catch (e) { /* já é data URL */ }
            }
            const fileBlob = await window.ProSender.base64toFile(fileData, fileName || "file");
            await window.ProSender.sendAttachment(fileBlob, normalizedChatId, caption || "", false);
            window.postMessage({
                type: "send_attachments_to_number",
                payload: { chat_id: normalizedChatId, is_attachments_sent: "YES", comments: "" }
            }, "*");
        } else {
            const sendPromises = attachments.map(async (file, index) => {
                let fileData = file.data;
                if (typeof fileData === 'string') {
                    try { fileData = fileData.startsWith('"') ? JSON.parse(fileData) : fileData; } catch (e) { /* já é data URL */ }
                }
                const fileBlob = await window.ProSender.base64toFile(fileData, file.name || "file");
                const currCaption = Array.isArray(caption) ? caption[index] : caption;
                await window.ProSender.sendAttachment(fileBlob, normalizedChatId, currCaption || "", waitTillSend);
            });
            await Promise.all(sendPromises);
            window.postMessage({
                type: "send_attachments_to_number",
                payload: { chat_id: normalizedChatId, is_attachments_sent: "YES", comments: "" }
            }, "*");
        }
    } catch (error) {
        console.error(error);
        window.postMessage({
            type: "send_attachments_to_number_error",
            payload: {
                chat_id: normalizedChatId,
                error: error,
                is_attachments_sent: "NO",
                comments: "Error while sending the attachments to number"
            }
        }, "*");
    }
});


window.addEventListener("ProSender::send-message", async function (e) {
    const number = e.detail.number;
    const message = e.detail.message;
    const normalizedChatId = normalizeChatId(number);

    try {
        await window.ProSender.sendMessage(normalizedChatId, message);
        window.postMessage({
            type: "send_message_to_number",
            payload: {
                chat_id: normalizedChatId,
                is_message_sent: "YES",
                comments: ""
            }
        }, "*");
    } catch (error) {
        console.error(error);
        window.postMessage({
            type: "send_message_to_number_new_error",
            payload: {
                chat_id: normalizedChatId,
                error: error,
                is_message_sent: "NO",
                comments: "Error while sending the message to number"
            }
        }, "*");
    }
});

window.addEventListener('ProSender::send-message-to-group', async function (e) {
    const groupId = e.detail.group_id;
    const message = e.detail.message;
    const groupIdObj = { "_serialized": e.detail.group_id };

    try {
        await window.ProSender.sendMessage(groupIdObj, message);
        window.postMessage({
            type: "send_message_to_group",
            payload: {
                group_id: groupId,
                is_message_sent: "YES",
                comments: ""
            }
        }, "*");
    } catch (error) {
        console.error(error);
        window.postMessage({
            type: "send_message_to_group_error",
            payload: {
                chat_id: groupId,
                error: error,
                is_message_sent: "NO",
                comments: "Error while sending the message to group"
            }
        }, "*");
    }
});

window.addEventListener('ProSender::send-attachments-to-group', async function (e) {
    const attachments = e.detail.attachments;
    const caption = e.detail.caption;
    const groupId = e.detail.groupId;
    const waitTillSend = e.detail.waitTillSend;
    const fileName = e.detail.name;
    const quick = e.detail.quick;
    const normalizedGroupId = normalizeChatId(groupId) || (typeof groupId === 'string' && groupId.includes("@g.us") ? groupId : (groupId || "").replace(/[^\d-]/g, "") + "@g.us");

    try {
        if (quick) {
            let fileData = attachments;
            if (typeof fileData === 'string') {
                try { fileData = fileData.startsWith('"') ? JSON.parse(fileData) : fileData; } catch (e) { /* já é data URL */ }
            }
            const fileBlob = await window.ProSender.base64toFile(fileData, fileName || "file");
            await window.ProSender.sendAttachment(fileBlob, normalizedGroupId, caption || "", false);
            window.postMessage({
                type: "send_attachments_to_group",
                payload: { group_id: normalizedGroupId, is_attachments_sent: "YES", comments: "" }
            }, "*");
        } else {
            const sendPromises = attachments.map(async (file, index) => {
                let fileData = file.data;
                if (typeof fileData === 'string') {
                    try { fileData = fileData.startsWith('"') ? JSON.parse(fileData) : fileData; } catch (e) { /* já é data URL */ }
                }
                const fileBlob = await window.ProSender.base64toFile(fileData, file.name || "file");
                const currCaption = Array.isArray(caption) ? caption[index] : caption;
                await window.ProSender.sendAttachment(fileBlob, normalizedGroupId, currCaption || "", waitTillSend);
            });
            await Promise.all(sendPromises);
            window.postMessage({
                type: "send_attachments_to_group",
                payload: { group_id: normalizedGroupId, is_attachments_sent: "YES", comments: "" }
            }, "*");
        }
    } catch (error) {
        console.error(error);
        window.postMessage({
            type: "send_attachments_to_group_error",
            payload: {
                group_id: normalizedGroupId,
                error: error,
                is_attachments_sent: "NO",
                comments: "Error while sending the attachments to group"
            }
        }, "*");
    }
});

window.addEventListener('ProSender::export-group', function (e) {
    const groupId = e.detail.groupId;

    try {
        let groupName = ProSender.getGroupName(groupId);
        let contacts = ProSender.getGroupContacts(groupId);
        let rows = [];

        contacts.forEach(contact => {
            rows.push([contact.number, contact.name]);
        })

        // rows.sort();
        rows.unshift(['Number', 'Name'])

        let csvContent = "data:text/csv;charset=utf-8," + rows.map(row => row.join(",")).join("\n");
        let data = encodeURI(csvContent);
        let link = document.createElement("a");

        link.setAttribute("href", data);
        link.setAttribute("download", groupName + ".csv");
        document.body.appendChild(link);
        link.click()
        document.body.removeChild(link);
    } catch (error) {
        window.postMessage({ type: "export_group_error", payload: { group_id: groupId, error: error } }, "*");
    }
});

window.addEventListener('ProSender::export-unsaved-contacts', function (e) {
    let type = e.detail.type;

    try {
        let rows = [];
        let contacts = ProSender.getMyUnsavedContacts();

        let numContacts = (type == 'Advance') ? contacts.length : 10;
        for (let i = 0; i < numContacts; i++) {
            if (contacts[i].number) {
                let correctNumber = "+" + contacts[i].number;
                let whatsappName = contacts[i].name;
                rows.push([correctNumber, whatsappName]);
            }
        }

        rows.unshift(['Numbers', 'Name']);
        if (type == 'Expired') {
            for (let i = 0; i < 3; i++)
                rows.push([]);
            rows.push(['To download all contacts please buy Advance Premium']);
        }

        let csvContent = rows.map(row => row.join(",")).join("\n");
        let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        let link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", "Advanced_All_Unsaved_Chats_Export.csv");

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        window.postMessage({ type: "export_unsaved_contacts_error", payload: { type: type, error: error } }, "*");
    }
});

const getAllGroups = function () {
    try {
        let groups = window.ProSender.getAllGroups();

        let allGroups = groups.map(group => ({
            id: group.id,
            name: group.name,
        }));

        window.postMessage({ type: "get_all_groups", payload: allGroups }, "*");
        return allGroups;
    } catch (error) {
        window.postMessage({ type: "get_all_groups_error", payload: { error: error } }, "*");
        return [];
    }
}

window.addEventListener('ProSender::get-all-groups', getAllGroups);

const getAllContacts = function () {
    try {
        let recentContacts = window.ProSender.getRecentChats();
        let contacts = window.ProSender.getAllContacts();

        const recentContactIds = new Set(recentContacts.map(contact => contact.id._serialized));
        const remainingContacts = contacts.filter(contact => !recentContactIds.has(contact.id._serialized));
        remainingContacts.sort((a, b) => {
            const nameA = a.name || "";
            const nameB = b.name || "";
            return nameA.localeCompare(nameB);
        });

        const uniqueContactIds = new Set();
        const combinedContacts = [...recentContacts, ...remainingContacts].filter(contact => {
            if (uniqueContactIds.has(contact.id._serialized)) {
                return false;
            }
            uniqueContactIds.add(contact.id._serialized);
            return true;
        });

        const allContacts = combinedContacts.map(contact => ({
            id: contact.id,
            name: contact.name
        }));

        window.postMessage({ type: "get_all_contacts", payload: allContacts }, "*");
        return allContacts;
    } catch (error) {
        window.postMessage({ type: "get_all_contacts_error", payload: { error: error } }, "*");
        return [];
    }
}

window.addEventListener('ProSender::get-all-contacts', getAllContacts);

const getInitStoreType = function () {
    let InitType = window?.Store?.InitType;
    window.postMessage({ type: "get_init_store_type", payload: InitType }, "*");
    return InitType;
}

const getWhatsappVersion = function () {
    let whatsappVersion = (window?.Debug?.VERSION ? window.Debug.VERSION : 'Not Found');
    window.postMessage({ type: "get_whatsapp_version", payload: whatsappVersion }, "*");
    return whatsappVersion;
}

// Start Init Main
reloadInitMain(true);

// ======= Sender CODE STARTS =====
// Event Listeners and Sender Functions