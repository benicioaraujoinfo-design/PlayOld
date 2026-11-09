const botaoControles = document.querySelector("#botaoControles");

const fundoControles =
    document.querySelector("#fundoControles");

const hubControles =
    document.querySelector("#hubControles");

const painelControles =
    document.querySelector("#painelControles");

const cardsControle =
    document.querySelectorAll(
        ".cardControle"
    );

const fecharHubControles =
    document.querySelector(
        "#fecharHubControles"
    );

const listaBotoesRemapeamento =
    document.querySelector("#listaBotoesRemapeamento");
   
const imagemControle =
    document.querySelector("#imagemControle");

const salvarControles =
    document.querySelector(
        "#salvarControles"
    );

const cancelarControles =
    document.querySelector(
        "#cancelarControles"
    );
    
const voltarHubControles =
    document.querySelector("#voltarHubControles");
    
function fecharJanelaControles() {
    fundoControles.style.display = "none";
    hubControles.style.display = "none";
    painelControles.style.display = "none";
}

voltarHubControles.addEventListener("click", function() {
    painelControles.style.display = "none";
    hubControles.style.display = "block";
});

let consoleSelecionado = null;

let controles = {};

const botoesPorConsole = {

    NES: [
        { id: "cima", nome: "Cima" },
        { id: "baixo", nome: "Baixo" },
        { id: "esquerda", nome: "Esquerda" },
        { id: "direita", nome: "Direita" },
        { id: "botao_a", nome: "Botão A" },
        { id: "botao_b", nome: "Botão B" },
        { id: "start", nome: "Start" },
        { id: "select_btn", nome: "Select" }
    ],

    SNES: [
        { id: "cima", nome: "Cima" },
        { id: "baixo", nome: "Baixo" },
        { id: "esquerda", nome: "Esquerda" },
        { id: "direita", nome: "Direita" },
        { id: "botao_a", nome: "Botão A" },
        { id: "botao_b", nome: "Botão B" },
        { id: "botao_x", nome: "Botão X" },
        { id: "botao_y", nome: "Botão Y" },
        { id: "botao_l", nome: "Botão L" },
        { id: "botao_r", nome: "Botão R" },
        { id: "start", nome: "Start" },
        { id: "select_btn", nome: "Select" }
    ],

    MEGA_DRIVE: [
        { id: "cima", nome: "Cima" },
        { id: "baixo", nome: "Baixo" },
        { id: "esquerda", nome: "Esquerda" },
        { id: "direita", nome: "Direita" },
        { id: "botao_a", nome: "Botão A" },
        { id: "botao_b", nome: "Botão B" },
        { id: "botao_c", nome: "Botão C" },
        { id: "start", nome: "Start" }
    ],

    GAME_BOY_COLOR: [
        { id: "cima", nome: "Cima" },
        { id: "baixo", nome: "Baixo" },
        { id: "esquerda", nome: "Esquerda" },
        { id: "direita", nome: "Direita" },
        { id: "botao_a", nome: "Botão A" },
        { id: "botao_b", nome: "Botão B" },
        { id: "start", nome: "Start" },
        { id: "select_btn", nome: "Select" }
    ],

    GAME_BOY_ADVANCE: [
        { id: "cima", nome: "Cima" },
        { id: "baixo", nome: "Baixo" },
        { id: "esquerda", nome: "Esquerda" },
        { id: "direita", nome: "Direita" },
        { id: "botao_a", nome: "Botão A" },
        { id: "botao_b", nome: "Botão B" },
        { id: "botao_l", nome: "Botão L" },
        { id: "botao_r", nome: "Botão R" },
        { id: "start", nome: "Start" },
        { id: "select_btn", nome: "Select" }
    ],

    N64: [
        { id: "cima", nome: "Cima" },
        { id: "baixo", nome: "Baixo" },
        { id: "esquerda", nome: "Esquerda" },
        { id: "direita", nome: "Direita" },
        { id: "botao_a", nome: "Botão A" },
        { id: "botao_b", nome: "Botão B" },
        { id: "botao_c_cima", nome: "Cima (C)" },
        { id: "botao_c_baixo", nome: "Baixo (C)" },
        { id: "botao_c_esquerda", nome: "Esquerda (C)" },
        { id: "botao_c_direita", nome: "Direita (C)" },
        { id: "botao_z", nome: "Botão Z" },
        { id: "botao_l", nome: "Botão L" },
        { id: "botao_r", nome: "Botão R" },
        { id: "start", nome: "Start" }
    ]

};

const imagensPorConsole = {
    NES: "NESc.jpg",
    N64: "N64c.jpg",
    MEGA_DRIVE: "MDc.jpg",
    GAME_BOY_COLOR: "GBCc.jpg",
    GAME_BOY_ADVANCE: "GBAc.jpg",
    SNES: "SNESc.jpg"
};

botaoControles.addEventListener(
    "click",
    function() {

        fundoControles.style.display =
            "flex";

        hubControles.style.display =
            "block";

        painelControles.style.display =
            "none";

    }
);

cardsControle.forEach(
    function(card) {

        card.addEventListener(
            "click",
            async function() {

                consoleSelecionado =
                    card.dataset.console;
                    
                 const arquivoImagem =
					imagensPorConsole[consoleSelecionado];

				if (arquivoImagem) {
					imagemControle.src =
						`/imagens/${arquivoImagem}`;

					imagemControle.alt =
						`Controle do console ${consoleSelecionado}`;

					imagemControle.style.display = "block";
				} else {
					imagemControle.removeAttribute("src");
					imagemControle.style.display = "none";
				}

                console.log(
                    "Controle selecionado:",
                    consoleSelecionado
                );


                hubControles.style.display =
                    "none";

                painelControles.style.display =
                    "flex";

                try {

                    const resposta = await fetch(
    `/controles?console=${encodeURIComponent(consoleSelecionado)}`
					);

                    const resultado =
                        await resposta.json();

                    if (!resposta.ok) {

                        console.error(
                            resultado.erro
                        );

                        return;
                    }

                    controles =
                        resultado.controles;

                    atualizarBotoesControles();

                }
                catch (erro) {

                    console.error(
                        "Erro ao carregar controles:",
                        erro
                    );

                }

            }
        );

    }
);

function atualizarBotoesControles() {

    listaBotoesRemapeamento.innerHTML = "";

    const lista =
        botoesPorConsole[consoleSelecionado] || [];

    lista.forEach(function(item) {

        const linha = document.createElement("div");
        linha.className = "controle";

        const texto = document.createElement("span");
        texto.textContent = item.nome;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.dataset.controle = item.id;

        botao.textContent =
            controles[item.id] || "Não definido";

        botao.addEventListener("click", function() {

            botao.textContent = "Pressione uma tecla...";

            function receberTecla(evento) {

                evento.preventDefault();

                controles[item.id] = evento.code;

                botao.textContent = evento.code;

                document.removeEventListener(
                    "keydown",
                    receberTecla
                );
            }

            document.addEventListener(
                "keydown",
                receberTecla
            );

        });

        linha.appendChild(texto);
        linha.appendChild(botao);

        listaBotoesRemapeamento.appendChild(linha);

    });

}

salvarControles.addEventListener(
    "click",
    async function() {

		if (!consoleSelecionado) {
		console.error("Nenhum console foi selecionado.");
		return;
	}

        try {

            const resposta =
                await fetch(
                    "/controles",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        
						body: JSON.stringify({
							console: consoleSelecionado,
							controles: controles
						})

                    }
                );

            const resultado =
                await resposta.json();

            if (!resposta.ok) {

                console.error(
                    resultado.erro
                );

                return;
            }

            console.log(
                resultado.mensagem
            );

            fecharJanelaControles();

        }
        catch (erro) {

            console.error(
                "Erro ao salvar controles:",
                erro
            );

        }

    }
);

cancelarControles.addEventListener("click", function() {
    fecharJanelaControles();
});

fecharHubControles.addEventListener(
    "click",
    function() {
        fecharJanelaControles();
    }
);