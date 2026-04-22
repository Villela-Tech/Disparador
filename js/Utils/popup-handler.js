const PRIME_ACCENT_COLOR = "#000000"
const LIGHT_ACCENT_COLOR = "#333333"
const LIGHT_GREY_COLOR = "#d3d3d3";

var how_to_use1 = chrome.runtime.getURL("logo/ProSender-GIF-1.gif");
var how_to_use2 = chrome.runtime.getURL("logo/ProSender-GIF-2.gif");
var how_to_use3 = chrome.runtime.getURL("logo/ProSender-GIF-3.gif");
var logo_img = chrome.runtime.getURL("logo/logo-img.png");

let HOW_TO_USE = [
    {
        image: how_to_use1,
        content: "Click on the 'Extensions' icons at the top right of the chrome window",
        index: 1,
        hasPrev: false,
        hasNext: true,
    },
    {
        image: how_to_use2,
        content: "Pin the Sender extension icon by clicking on the pin button ",
        index: 2,
        hasPrev: true,
        hasNext: true,
    },
    {
        image: how_to_use3,
        content: "Start using the extension by clicking on the Sender extension icon",
        index: 3,
        hasPrev: true,
        hasNext: true,
    },
];

function show_loader_and_close_popup(popup_name, delay, next_popup = false) {
    $(`#close_${popup_name}_popup`).addClass('loading').html('');
    setTimeout(() => {
        $(`#${popup_name}_popup`).remove();

        if (next_popup) {
            success_popup(next_popup);
        }
    }, delay)
}

function howToUsePopup() {
    const parentDiv = document.createElement("div");
    parentDiv.className = "how_to_use_popup";
    let currentIndex = 0;
    const popupHtml = `
        <div class="how_to_use_container">
            <div class="how_to_use_header">
                <div class="how_to_use_title">
                    <img style="width: 50px; margin-right:10px;" src=${bulb_icon} alt="" />
                    <p>How to use</p>
                </div>
                <div class="how_to_use_logo">
                    <img class="how_to_use_logo_img" src="${logo_img}"/>
                    <div class="how_to_use_logo_name">Sender</div>
                </div>
            </div>
            <div class="how_to_use_body">
                <div class="how_to_use_text ${currentIndex == 1 ? 'second' : ''}">
                    <p class="ins_number">${HOW_TO_USE[currentIndex].index}</p>
                    <p class="ins_text">${HOW_TO_USE[currentIndex].content}</p>
                </div>
                <div class="how_to_use_image">
                    <img src=${HOW_TO_USE[currentIndex].image} alt="" />
                </div>
            </div>
            <div class="how_to_use_buttons">
                <div class="how_to_use_button prev_button CtaBtn">
                    <img style="width: 22px" src=${arrow_left} alt="" />
                    Previous
                </div>
                <div class="how_to_use_button next_button CtaBtn">
                    Next
                    <img style="width: 22px" src=${arrow_right} alt="" />
                </div>
                <div class="how_to_use_button navigation_close_button CtaBtn" style="display: none; padding:13px 30px;">
                    Close
                </div>
            </div>
            <div class="navigation_section">
                <div class="nav_num nav_num_1 active_num_class">1</div>
                <div class="nav_line nav_line_1"></div>
                <div class="nav_num nav_num_2">2</div>
                <div class="nav_line nav_line_2"></div>
                <div class="nav_num nav_num_3">3</div>
            </div>
        </div>
    `

    parentDiv.innerHTML = popupHtml;
    document.body.appendChild(parentDiv);

    document.querySelector(".navigation_close_button").addEventListener("click", () => {
        document.body.removeChild(parentDiv);
        chrome.storage.local.set({ 'showHowToUsePopup': false })
    })

    document.querySelector(".next_button").addEventListener("click", () => {
        if (currentIndex < HOW_TO_USE.length - 1) {
            updateHowToUsePopupContent(++currentIndex);
        }
    });

    document.querySelector(".prev_button").addEventListener("click", () => {
        if (currentIndex > 0) {
            updateHowToUsePopupContent(--currentIndex);
        }
    });
}

function updateHowToUsePopupContent(currentIndex) {
    const isEven = currentIndex % 2 === 0;
    const popup = document.querySelector(".how_to_use_popup");
    const body = document.querySelector(".how_to_use_body");
    const lines = [".nav_line_1", ".nav_line_2"];
    const nums = [".nav_num_2", ".nav_num_3"];

    // Update content
    document.querySelector(".ins_number").innerText = HOW_TO_USE[currentIndex].index;
    document.querySelector(".ins_text").innerText = HOW_TO_USE[currentIndex].content;
    document.querySelector(".how_to_use_image img").src = HOW_TO_USE[currentIndex].image;

    // Update styles
    document.querySelector(".how_to_use_text").style.flexDirection = currentIndex === 1 ? "row-reverse" : "row";
    body.style.flexDirection = isEven ? "row" : "row-reverse";
    popup.style.background = isEven
        ? `linear-gradient(270deg, #FFFFFF 90.23%, ${PRIME_ACCENT_COLOR} 100%)`
        : `linear-gradient(90deg, #FFFFFF 90.23%, ${PRIME_ACCENT_COLOR} 100%)`;

    // Toggle buttons
    document.querySelector(".prev_button").style.display = currentIndex > 0 ? "flex" : "none";
    document.querySelector(".next_button").style.display = currentIndex < HOW_TO_USE.length - 1 ? "flex" : "none";
    document.querySelector(".navigation_close_button").style.display = currentIndex === HOW_TO_USE.length - 1 ? "flex" : "none";

    // Update Navigation line and num styles
    lines.forEach(line => document.querySelector(line).classList.remove("active_line_class"));
    nums.forEach(num => document.querySelector(num).classList.remove("active_num_class"));
    for (let i = 0; i < currentIndex && i < lines.length; i++) {
        document.querySelector(lines[i]).classList.add("active_line_class");
        document.querySelector(nums[i]).classList.add("active_num_class");
    }
}

function showHowToUsePopup() {
    chrome.storage.local.get(['showHowToUsePopup', 'no_of_visit'], (res) => {
        let visit_count = res.no_of_visit || 0;
        
        // Na primeira visita, não mostra o tutorial
        if (visit_count === 0) {
            chrome.storage.local.set({ "showHowToUsePopup": false });
            return;
        }
        
        // Verificar se deve mostrar o tutorial
        // Se showHowToUsePopup for undefined, false, ou explicitamente false, não mostra
        if (res.showHowToUsePopup === false || res.showHowToUsePopup === undefined) {
            return;
        }
        
        // Só mostra se explicitamente definido como true
        if (res.showHowToUsePopup !== true) {
            return;
        }
        
        const getSideBarInterval = setInterval(() => {
            const sidebar = document.getElementById("side");
            const trialPopup = document.querySelector(".trial_popup");
            if (sidebar && !trialPopup) {
                howToUsePopup();
                clearInterval(getSideBarInterval);
            }
        }, 500)
    })
}

// Função para ativar manualmente o tutorial (pode ser chamada por um botão)
function enableTutorial() {
    chrome.storage.local.set({ "showHowToUsePopup": true }, () => {
        showHowToUsePopup();
    });
}

// call this function if you want to show a popup only if there are no other popup on the screen
function callIfNoOtherPopups(fun) {
    const getPopupInterval = setInterval(() => {
        const trialPopup = document.querySelector('.trial_popup');
        const successPopup = document.querySelector('.success_popup');
        const sidebar = document.getElementById("side");
        const buyAnnualPopup = document.querySelector("#buy_annual_popup");
        const activationModal = document.querySelector("#activation-modal");
        
        // Só mostra popup se não houver outros popups e se não for o popup de tutorial
        if (!trialPopup && !successPopup && !buyAnnualPopup && !activationModal && sidebar) {
            // Verificação adicional para popup de tutorial
            if (fun === showHowToUsePopup) {
                // Para o popup de tutorial, verificar se o usuário já visitou antes
                chrome.storage.local.get(['no_of_visit'], (res) => {
                    let visit_count = res.no_of_visit || 0;
                    if (visit_count > 1) { // Só mostra após a segunda visita
                        clearInterval(getPopupInterval);
                        fun();
                    }
                });
            } else {
                clearInterval(getPopupInterval);
                fun();
            }
        }
    }, 500);
}


// ------- ASYNC FUNCTIONS ------

async function suggestion_popup() {
    if (!document.getElementsByClassName("modal")[0]) {
        var popup = document.createElement('div');
        popup.className = 'modal';
        var modal_content = document.createElement('div');
        modal_content.className = 'modal-content';
        modal_content.style.position = 'relative';
        modal_content.style.width = '600px';
        modal_content.style.maxHeight = '560px';
        modal_content.style.overflow = 'auto';
        popup.appendChild(modal_content);
        var body = document.querySelector('body');
        body.appendChild(popup);
        modal_content.appendChild($($.parseHTML('<div style="font-weight: bold;font-size: 20px;text-align: center;margin-bottom: 24px;color: #000;">Edit/Add quick replies</div>'))[0]);
        var inner_div = document.createElement('div');
        inner_div.id = 'sugg_message_list';
        inner_div.style.height = '210px';
        inner_div.style.overflowY = 'auto';
        inner_div.style.margin = '16px 0px';
        modal_content.appendChild(inner_div);
        referesh_messages();
        modal_content.appendChild($($.parseHTML('<span id="close_edit" class="CtaCloseBtn" style="position: absolute;top: 6px;right: 6px;font-size: 20px;width:14px"><img  class="CtaCloseBtn" src="' + close_img_src + '" style="width: 100%;" alt="x"></span>'))[0]);
        modal_content.appendChild($($.parseHTML('<textarea style="width: 400px;height: 100px;padding: 8px;" type="text" id="add_message" placeholder="Type your quick reply here"></textarea>'))[0]);
        modal_content.appendChild($($.parseHTML(`<button class="CtaBtn" style="background: ${LIGHT_ACCENT_COLOR};border-radius: 2px;padding: 8px 12px;float: right;color: #fff;" id="add_message_btn">Add Template</button>`))[0]);

        document.getElementById("close_edit").addEventListener("click", function (event) {
            document.getElementsByClassName("modal")[0].style.display = 'none';
        });
        popup.addEventListener("click",(e)=>{
            if(e.target.className === "modal"){
                document.getElementsByClassName("modal")[0].style.display = 'none';
            }
        })
        document.getElementById("sugg_message_list").addEventListener("click", async function (event) {
            var nmessage = event.target.value;
            if (event.target.localName != 'div') {
                var index = messages.indexOf(nmessage);
                messages.splice(index, 1);
                referesh_messages();
                trackButtonClick('smart_reply_deleted');
            } else if ((event.target.localName == 'div') && (event.target.className == 'popup_list_message')) {
                document.getElementsByClassName("modal")[0].style.display = 'none';
                var message = event.target.innerText;
                if (message != undefined) {
                    sendSuggestionMessage(message);
                }
                trackButtonClick("smart_reply_sent");
            }
        });
        document.getElementById("add_message_btn").addEventListener("click", function (event) {
            var nmessage = document.getElementById("add_message").value;
            if (nmessage !== '') {
                nmessage = nmessage
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");

                messages.push(nmessage);
                referesh_messages();
                document.getElementById("add_message").value = '';
                trackButtonClick('smart_reply_added');
            }
        });
    }
    else {
        document.getElementsByClassName("modal")[0].style.display = 'block';
    }

    document.getElementById('add_message').placeholder = await translate('Type your quick reply here')
    document.getElementById('add_message_btn').innerText = await translate('Add Template');
}

function validateCustomSheetFormat(data) {
    const requiredHeader = 'Numeros de Contato';
    const optionalHeaders = [
        'Nome/Empresa',
        'Mensagem 1',
        'Mensagem 2',
        'Cnpj',
        'Valor Divida'
    ];

    if (!data || data.length === 0) {
        return { valid: false, message: 'Planilha vazia' };
    }

    const headers = data[0];
    
    // Verifica se tem a coluna obrigatória de telefone
    if (!headers[0] || !headers[0].trim() || headers[0].trim() !== requiredHeader) {
        return { 
            valid: false, 
            message: `A coluna "${requiredHeader}" é obrigatória. Por favor, certifique-se que a primeira coluna seja "${requiredHeader}".` 
        };
    }

    return { valid: true };
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

function process_sheet_data_and_validate(data, checkForValid) {
    if (data && data.length > 0) {
        // Validar o formato da planilha
        const validationResult = validateCustomSheetFormat(data);
        if (!validationResult.valid) {
            customization_obj && driver(translatedCustomObj).destroy();
            customization_obj = false;
            showCustomErrorPopup(validationResult.message);
            unset_csv_styles();
            return;
        }

        csv_data = [data[0]];
        var numbers = '';
        var column_headers = data[0];
        
        // Encontrar o índice da coluna "Valor Divida"
        const valorDividaIndex = column_headers.findIndex(header => header === 'Valor Divida');

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
                
                // Formatar o valor da dívida se existir
                if (valorDividaIndex !== -1 && data[i][valorDividaIndex]) {
                    data[i][valorDividaIndex] = formatarValorMonetario(data[i][valorDividaIndex]);
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
    }
}

