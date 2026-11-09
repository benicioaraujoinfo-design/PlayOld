const container = document.querySelector("#cardsBiblioteca");
const ordenar = document.querySelector("#ordenar");
const bibliotecaVazia = document.querySelector("#bibliotecaVazia");
const painelJogo = document.querySelector("#painelJogo");
const fundoPainel = document.querySelector("#fundoPainel");
const fecharPainel = document.querySelector("#fecharPainel");
const painelCapa = document.querySelector("#painelCapa");
const painelNome = document.querySelector("#painelNome");
const painelTempo = document.querySelector("#painelTempo");
const painelCompra = document.querySelector("#painelCompra");
const painelUltimoJogo = document.querySelector("#painelUltimoJogo");
const botaoJogar = document.querySelector("#botaoJogar");
const botaoPaginaJogo = document.querySelector("#botaoPaginaJogo");

let jogoSelecionado = null;

function abrirPainel(jogo) {

    jogoSelecionado = jogo;

    painelCapa.src =
        jogo.img1 ||
        "../imagens/semImagem.png";

    painelCapa.alt =
        jogo.Game_Name;


    painelCapa.onerror =
        function() {

            painelCapa.src =
                "../imagens/semImagem.png";

        };

    painelNome.textContent =
        jogo.Game_Name;

    const tempo =
        Number(jogo.temp_jogo) || 0;


    if (tempo === 0) {

        painelTempo.textContent =
            "Ainda não jogado";

    } else {

        painelTempo.textContent =
            `${tempo.toFixed(1)} horas`;

    }

    if (jogo.data_compra) {

        const dataCompra =
            new Date(jogo.data_compra);


        painelCompra.textContent =
            dataCompra.toLocaleDateString(
                "pt-BR"
            );

    } else {

        painelCompra.textContent =
            "—";

    }

    if (jogo.ultima_jogado) {

        const ultimaJogada =
            new Date(jogo.ultima_jogado);


        painelUltimoJogo.textContent =
            ultimaJogada.toLocaleString(
                "pt-BR"
            );

    } else {

        painelUltimoJogo.textContent =
            "Nunca jogado";

    }

    painelJogo.classList.add(
        "aberto"
    );

    fundoPainel.classList.add(
        "aberto"
    );

}

function fecharPainelJogo() {

    painelJogo.classList.remove(
        "aberto"
    );

    fundoPainel.classList.remove(
        "aberto"
    );

    jogoSelecionado = null;

}

fecharPainel.addEventListener(
    "click",
    fecharPainelJogo
);


fundoPainel.addEventListener(
    "click",
    fecharPainelJogo
);

botaoJogar.addEventListener("click", async function() {

    if (!jogoSelecionado) return;

    try {

        const resposta = await fetch(
            `/jogo/${jogoSelecionado.IDgme}/jogado`,
            {
                method: "POST"
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {

            console.error(
                "Erro ao registrar jogo:",
                resultado.erro
            );

            return;
        }

        window.location.href =
            `../Jogar/Jogar.html?id=${jogoSelecionado.IDgme}&origem=biblioteca`;

    } catch (erro) {

        console.error(
            "Erro ao registrar última vez jogado:",
            erro
        );

    }

});

botaoPaginaJogo.addEventListener(
    "click",
    function() {

        if (!jogoSelecionado) {
            return;
        }

        window.location.href =
            `../PGJogo/PGJogo.html?id=${jogoSelecionado.IDgme}`;

    }
);


let jogosBiblioteca = [];

async function carregarBiblioteca() {

    try {

        const resposta =
            await fetch("/biblioteca");

        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            console.error(resultado.erro);

            if (resposta.status === 401) {

                window.location.href =
                    "../Login/Login.html";

            }

            return;
        }


        jogosBiblioteca =
            resultado.jogos;


        mostrarJogos(
            jogosBiblioteca
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar a biblioteca:",
            erro
        );

    }

}

function mostrarJogos(jogos) {

    container.innerHTML = "";


    if (jogos.length === 0) {

        bibliotecaVazia.style.display =
            "block";

        return;

    }


    bibliotecaVazia.style.display =
        "none";


    jogos.forEach(
        function(jogo, indice) {

            const card =
                document.createElement("div");


            card.classList.add("card");

            card.style.animationDelay =
                `${indice * 0.08}s`;

            const imagem =
                document.createElement("img");


            imagem.src =
                jogo.img1 ||
                "../imagens/semImagem.png";


            imagem.alt =
                jogo.Game_Name;


            imagem.onerror =
                function() {

                    imagem.src =
                        "../imagens/semImagem.png";

                };

            card.appendChild(
                imagem
            );

			card.addEventListener(
				"click",
				function() {

					abrirPainel(jogo);

				}
			);


			container.appendChild(
				card
			);

        }
    );

}

ordenar.addEventListener(
    "change",
    function() {

        const jogos =
            [...jogosBiblioteca];


        if (
            ordenar.value === "az"
        ) {

            jogos.sort(
                function(a, b) {

                    return a.Game_Name.localeCompare(
                        b.Game_Name
                    );

                }
            );

        }

        if (
            ordenar.value === "za"
        ) {

            jogos.sort(
                function(a, b) {

                    return b.Game_Name.localeCompare(
                        a.Game_Name
                    );

                }
            );

        }

        if (
            ordenar.value === "compra"
        ) {

            jogos.sort(
                function(a, b) {

                    const dataA =
                        a.data_compra
                            ? new Date(a.data_compra)
                            : new Date(0);

                    const dataB =
                        b.data_compra
                            ? new Date(b.data_compra)
                            : new Date(0);


                    return dataB - dataA;

                }
            );

        }

        if (
            ordenar.value === "maisJogados"
        ) {

            jogos.sort(
                function(a, b) {

                    return Number(b.temp_jogo)
                        - Number(a.temp_jogo);

                }
            );

        }

        if (
            ordenar.value === "menosJogados"
        ) {

            jogos.sort(
                function(a, b) {

                    return Number(a.temp_jogo)
                        - Number(b.temp_jogo);

                }
            );

        }

        mostrarJogos(jogos);

    }
);

async function carregarUsuario() {

    try {

        const resposta =
            await fetch("/usuario");

        const resultado =
            await resposta.json();

        const fotoUsuario =
            document.querySelector("#fotoUsuario");


        if (!resposta.ok) {

            fotoUsuario.src =
                "../imagens/usuario.png";

            return;
        }


        if (resultado.usuario.foto_perfil) {

            fotoUsuario.src =
                resultado.usuario.foto_perfil;

        } else {

            fotoUsuario.src =
                "../imagens/usuario.png";

        }

    } catch (erro) {

        console.error(
            "Erro ao carregar usuário:",
            erro
        );

        document.querySelector("#fotoUsuario").src =
            "../imagens/usuario.png";

    }

}

carregarUsuario();

const botaoUsuario =
    document.querySelector("#botaoUsuario");

const menuUsuario =
    document.querySelector("#menuUsuario");

const botaoLogout =
    document.querySelector("#botaoLogout");


botaoUsuario.addEventListener("click", () => {

    menuUsuario.classList.toggle("aberto");

});

botaoLogout.addEventListener("click", async () => {

    try {

        const resposta = await fetch("/logout", {
            method: "POST"
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {

            alert(resultado.erro);
            return;

        }

        window.location.href = "../Login/Login.html";

    } catch (erro) {

        console.error(erro);

        alert("Erro ao realizar logout.");

    }

});

const barraPesquisa =
    document.querySelector("#barraPesquisa");

const resultadosPesquisa =
    document.querySelector("#resultadosPesquisa");


barraPesquisa.addEventListener("input", async () => {

    const termo = barraPesquisa.value.trim();

    resultadosPesquisa.innerHTML = "";

    if (termo === "") {
        resultadosPesquisa.style.display = "none";
        return;
    }

    try {

        const resposta = await fetch(
            `/buscar-jogos?nome=${encodeURIComponent(termo)}`
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {

            console.error(resultado.erro);

            return;
        }

        resultadosPesquisa.style.display = "block";


        resultado.jogos.forEach(jogo => {

            const resultadoJogo =
                document.createElement("div");

            resultadoJogo.classList.add("resultadoPesquisa");


            const imagem =
                document.createElement("img");

            imagem.src = jogo.img1;


            const nome =
                document.createElement("span");

            nome.textContent = jogo.Game_Name;


            resultadoJogo.appendChild(imagem);

            resultadoJogo.appendChild(nome);


            resultadoJogo.addEventListener("click", () => {

			window.location.href =
				`../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

			});


            resultadosPesquisa.appendChild(resultadoJogo);

        });

    } catch (erro) {

        console.error(
            "Erro ao pesquisar jogos:",
            erro
        );

    }

});

carregarUsuario();

carregarBiblioteca();