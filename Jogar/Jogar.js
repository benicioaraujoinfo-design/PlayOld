const parametros = new URLSearchParams(window.location.search);
    const idJogo = parametros.get("id");

const parametrosURL =
    new URLSearchParams(window.location.search);

const origemJogo = parametrosURL.get("origem");

const paginaRetorno = origemJogo === "perfil"
    ? "../Perfil/Perfil.html"
    : "../Biblioteca/Biblioteca.html";

    // Momento em que o jogo começou
    const inicioJogo = Date.now();

    // Impede que o tempo seja enviado mais de uma vez
    let tempoEnviado = false;
    let ultimoSaveState = null;


    async function registrarTempo() {

        // Evita enviar duas vezes
        if (tempoEnviado) return;

        tempoEnviado = true;

        // Calcula quanto tempo passou, em milissegundos
        const tempoDecorrido = Date.now() - inicioJogo;

        // Converte milissegundos para horas
        const tempoHoras = tempoDecorrido / 1000 / 60 / 60;

        console.log(
            "Tempo jogado:",
            tempoHoras,
            "horas"
        );

        try {

            const resposta = await fetch(
                `/jogo/${idJogo}/tempo`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        tempo: tempoHoras
                    }),
                    // Permite que o navegador envie a requisição
                    // mesmo durante a saída da página
                    keepalive: true
                }
            );

            if (!resposta.ok) {

                console.error(
                    "Não foi possível registrar o tempo."
                );

            }

        } catch (erro) {

            console.error(
                "Erro ao registrar tempo:",
                erro
            );

        }

    }
    
		async function salvarEstado() {
    if (!window.EJS_emulator || !EJS_emulator.gameManager) {
        console.log("EmulatorJS ainda não está pronto.");
        return false;
    }

    try {
        const estado = EJS_emulator.gameManager.getState();

        console.log("Estado capturado para salvar.");
        console.log("Tamanho:", estado.length);

        let binario = "";

        for (let i = 0; i < estado.length; i++) {
            binario += String.fromCharCode(estado[i]);
        }

        const saveData = btoa(binario);

        const resposta = await fetch(`/jogo/${idJogo}/save`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                save_data: saveData
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            console.error("Erro ao salvar:", resultado.erro);
            return false;
        }

        console.log("Estado salvo com sucesso!");
        return true;

    } catch (erro) {
        console.error("Erro ao salvar estado:", erro);
        return false;
    }
}
	
async function carregarEstado() {

    try {

        const resposta = await fetch(
            `/jogo/${idJogo}/save`
        );

        // O jogo nunca teve save.
        // Nesse caso, simplesmente continua normalmente.
        if (resposta.status === 404) {
            console.log("Nenhum save anterior encontrado.");
            return null;
        }

        const resultado = await resposta.json();

        if (!resposta.ok) {
            console.error(
                "Erro ao verificar o save:",
                resultado.erro
            );
            return null;
        }

        console.log("Save encontrado.");

        const saveData = resultado.save_data;

        // Converte o Base64 para bytes
        const binario = atob(saveData);

        const estado = new Uint8Array(
            binario.length
        );

        for (let i = 0; i < binario.length; i++) {
            estado[i] = binario.charCodeAt(i);
        }

        console.log(
            "Save baixado. Tamanho:",
            estado.length,
            "bytes"
        );

        return estado;

    } catch (erro) {

        console.error(
            "Erro ao verificar o save:",
            erro
        );

        return null;
    }
}

    async function iniciarJogo() {

        if (!idJogo) {

            mostrarMensagem(
                "O ID do jogo não foi informado."
            );

            return;
        }

        try {

            const resposta = await fetch(
                `/jogo/${idJogo}/rom`
            );

            const jogo = await resposta.json();

            if (!resposta.ok) {

                mostrarMensagem(
                    jogo.erro ||
                    "Não foi possível iniciar o jogo."
                );

                return;
            }

			
            // Carrega os controles do console deste jogo
            const respostaControles = await fetch(
                `/controles?console=${encodeURIComponent(jogo.console)}`
            );

            const resultadoControles =
                await respostaControles.json();

            if (!respostaControles.ok) {
                mostrarMensagem(
                    resultadoControles.erro ||
                    "Não foi possível carregar os controles."
                );
                return;
            }

            const controles = resultadoControles.controles;

            if (!controles) {
                mostrarMensagem(
                    "As configurações de controles não foram encontradas."
                );
                return;
            }

            console.log(
                "Controles carregados para:",
                jogo.console,
                controles
            );


            // Converte o código da tecla para o formato do EmulatorJS
            function converterTecla(code) {
                const conversoes = {
                    ArrowUp: "up arrow",
                    ArrowDown: "down arrow",
                    ArrowLeft: "left arrow",
                    ArrowRight: "right arrow",

                    Enter: "enter",
                    ShiftLeft: "shift",
                    ShiftRight: "shift",

                    Space: "space",
                    Escape: "escape",
                    Tab: "tab",
                    Backspace: "backspace",

                    ControlLeft: "ctrl",
                    ControlRight: "ctrl",
                    AltLeft: "alt",
                    AltRight: "alt",

                    CapsLock: "caps lock",

                    Minus: "-",
                    Equal: "=",
                    BracketLeft: "[",
                    BracketRight: "]",
                    Backslash: "\\",
                    Semicolon: ";",
                    Quote: "'",
                    Comma: ",",
                    Period: ".",
                    Slash: "/",
                    Backquote: "`"
                };

                if (!code) {
                    return "";
                }

                if (conversoes[code]) {
                    return conversoes[code];
                }

                // Letras: KeyA -> a
                if (/^Key[A-Z]$/.test(code)) {
                    return code.substring(3).toLowerCase();
                }

                // Números da fileira superior: Digit1 -> 1
                if (/^Digit[0-9]$/.test(code)) {
                    return code.substring(5);
                }

                // Teclado numérico: Numpad1 -> 1
                if (/^Numpad[0-9]$/.test(code)) {
                    return code.substring(6);
                }

                // Teclas de função: F1 -> f1
                if (/^F([1-9]|1[0-2])$/.test(code)) {
                    return code.toLowerCase();
                }

                // Outras teclas
                return code.toLowerCase();
            }


            /* =========================================
			   MAPEAMENTO DOS CONTROLES
			========================================= */

// Cria o mapa de teclas do jogador 1.
const mapeamentoJogador = {};

// Adiciona um botão somente se houver uma tecla definida.
function adicionarControle(indice, tecla, identificador) {

    if (!tecla) {
        return;
    }

    mapeamentoJogador[indice] = {
        value: converterTecla(tecla),
        value2: identificador
    };
}

// Direcionais
adicionarControle(4, controles.cima, "DPAD_UP");
adicionarControle(5, controles.baixo, "DPAD_DOWN");
adicionarControle(6, controles.esquerda, "DPAD_LEFT");
adicionarControle(7, controles.direita, "DPAD_RIGHT");

// Botões comuns
adicionarControle(0, controles.botao_b, "BUTTON_2");
adicionarControle(8, controles.botao_a, "BUTTON_1");

// Start e Select
adicionarControle(2, controles.select_btn, "SELECT");
adicionarControle(3, controles.start, "START");

// Botões específicos do SNES
if (jogo.console === "SNES") {

    adicionarControle(1, controles.botao_y, "BUTTON_4");
    adicionarControle(9, controles.botao_x, "BUTTON_3");

    adicionarControle(10, controles.botao_l, "LEFT_TOP_SHOULDER");
    adicionarControle(11, controles.botao_r, "RIGHT_TOP_SHOULDER");

}

// Entrega o mapeamento ao EmulatorJS.
EJS_defaultControls = {
    0: mapeamentoJogador,
    1: {},
    2: {},
    3: {}
};

console.log(
    "Console selecionado:",
    jogo.console
);

console.log(
    "Controles carregados do banco:",
    controles
);

console.log(
    "Mapeamento enviado ao EmulatorJS:",
    EJS_defaultControls
);
            
            console.log(
    "Mapeamento enviado ao EmulatorJS:",
    EJS_defaultControls
);


            EJS_player = "#game";

			if (jogo.console === "NES") {

				EJS_core = "nes";

			}
			else if (jogo.console === "SNES") {

				EJS_core = "snes";

			}
			else {

				mostrarMensagem(
					"Este jogo não possui um emulador configurado."
				);

				return;
			}
			
			EJS_controlScheme = jogo.console === "SNES" ? "snes" : "nes";
			
			EJS_disableLocalStorage = true;

			EJS_gameUrl = jogo.rom;

			EJS_pathtodata =
				"https://cdn.emulatorjs.org/stable/data/";

			EJS_gameName = jogo.Game_Name;

			EJS_startOnLoaded = true;

// Verifica se existe um save antes de iniciar o EmulatorJS
const estadoSalvo = await carregarEstado();

if (estadoSalvo) {
    console.log("Save encontrado. Ele será aplicado quando o EmulatorJS estiver pronto.");
} else {
    console.log("Nenhum save encontrado. O jogo iniciará normalmente.");
}
            
            EJS_onSaveState = function(dados) {
				ultimoSaveState = dados.state;

				console.log("Save state capturado.");
				console.log("Tamanho do callback:", ultimoSaveState.length);

				const estadoGetState = EJS_emulator.gameManager.getState();

				console.log("Tamanho do getState:", estadoGetState.length);
			};
			
			EJS_onGameStart = function() {

    if (!estadoSalvo) {
        console.log("Jogo iniciado sem save anterior.");
        return;
    }

    console.log("EmulatorJS iniciou. Aplicando save...");

    try {

        EJS_emulator.gameManager.loadState(estadoSalvo);

        console.log("Save aplicado ao EmulatorJS.");

    } catch (erro) {

        console.error(
            "Erro ao aplicar o save:",
            erro
        );

    }
};


            const script =
                document.createElement("script");

            script.src =
                "https://cdn.emulatorjs.org/stable/data/loader.js";

            document.body.appendChild(script);


        } catch (erro) {

            console.error(
                "Erro ao iniciar jogo:",
                erro
            );

            mostrarMensagem(
                "Ocorreu um erro ao tentar iniciar o jogo."
            );

        }

    }


    function mostrarMensagem(mensagem) {

        document.querySelector("#game").style.display =
            "none";

        document.querySelector("#mensagem").style.display =
            "flex";

        document.querySelector("#textoMensagem").textContent =
            mensagem;

    }


    iniciarJogo();
    
	document.getElementById("sairSemSalvar").addEventListener("click", function() {
		window.location.href = paginaRetorno;
	});
	
	document.getElementById("sairSalvar").addEventListener("click", async function() {
    const salvou = await salvarEstado();

    if (salvou) {
        window.location.href = paginaRetorno;
    }
});