/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const container =
    document.querySelector("#cardsWishlist");

const ordenar =
    document.querySelector("#ordenar");

const listaVazia =
    document.querySelector("#listaVazia");


let jogosWishlist = [];


/* =========================================
   CARREGAR LISTA DE DESEJOS
========================================= */

async function carregarWishlist() {

    try {

        const resposta =
            await fetch("/wishlist");


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            console.error(
                resultado.erro
            );


            if (resposta.status === 401) {

                window.location.href =
                    "../Login/Login.html";

            }

            return;

        }


        jogosWishlist =
            resultado.jogos;


        mostrarJogos(
            jogosWishlist
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar lista de desejos:",
            erro
        );

    }

}


/* =========================================
   MOSTRAR JOGOS
========================================= */

function mostrarJogos(jogos) {

    container.innerHTML = "";


    if (jogos.length === 0) {

        listaVazia.style.display =
            "block";

        return;

    }


    listaVazia.style.display =
        "none";


    jogos.forEach(
        function(jogo, indice) {

            const card =
                document.createElement("div");

            card.classList.add("card");


            /*
                Animação em sequência
            */

            card.style.animationDelay =
                `${indice * 0.08}s`;


            /* ==============================
               CAPA
            ============================== */

            const imagem =
                document.createElement("img");


            imagem.classList.add("capa");


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


            /* ==============================
               NOME
            ============================== */

            const nome =
                document.createElement("h3");


            nome.textContent =
                jogo.Game_Name;


            /* ==============================
               ÁREA DE INFORMAÇÕES
            ============================== */

            const cardInfo =
                document.createElement("div");


            cardInfo.classList.add(
                "cardInfo"
            );


            /* ==============================
               PREÇO
            ============================== */

            const preco =
                document.createElement("p");


            const valor =
                Number(jogo.preco);


            const descontoNumero =
                Number(jogo.desconto);


            let precoFinal =
                valor;


            if (descontoNumero > 0) {

                precoFinal =
                    valor *
                    (1 - descontoNumero / 100);

            }


            if (!Number.isNaN(precoFinal)) {

                preco.textContent =
                    `R$ ${precoFinal
                        .toFixed(2)
                        .replace(".", ",")}`;

            } else {

                preco.textContent =
                    "Preço indisponível";

            }


            cardInfo.appendChild(
                preco
            );


            /* ==============================
               DESCONTO
            ============================== */

            if (
                descontoNumero &&
                descontoNumero > 0
            ) {

                const desconto =
                    document.createElement("span");


                desconto.classList.add(
                    "desconto"
                );


                desconto.textContent =
                    `-${descontoNumero}%`;


                cardInfo.appendChild(
                    desconto
                );

            }


            /* ==============================
               BOTÃO REMOVER
            ============================== */

            const botaoRemover =
                document.createElement("button");


            botaoRemover.classList.add(
                "botaoRemover"
            );


            botaoRemover.textContent =
                "Remover da Lista";


            botaoRemover.addEventListener(
				"click",
				async function(evento) {

					evento.stopPropagation();

					await removerDaWishlist(
						jogo.IDgme
					);

				}
			);


            /* ==============================
               MONTAGEM
            ============================== */

            card.appendChild(
                imagem
            );


            card.appendChild(
                nome
            );


            card.appendChild(
                cardInfo
            );


            card.appendChild(
                botaoRemover
            );


            /* ==============================
               CLIQUE NO CARD
            ============================== */

            card.addEventListener(
                "click",
                function() {

                    window.location.href =
                        `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

                }
            );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================
   REMOVER DA LISTA
========================================= */

async function removerDaWishlist(IDjgo) {

    try {

        const resposta =
            await fetch(
                `/wishlist/jogo/${IDjgo}`,
                {
                    method: "DELETE"
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


        /*
            Remove o jogo da lista
            exibida na página.
        */

        jogosWishlist =
            jogosWishlist.filter(
                function(jogo) {

                    return jogo.IDgme
                        !== IDjgo;

                }
            );


        mostrarJogos(
            jogosWishlist
        );


    } catch (erro) {

        console.error(
            "Erro ao remover da lista:",
            erro
        );

    }

}


/* =========================================
   ORDENAÇÃO
========================================= */

ordenar.addEventListener(
    "change",
    function() {

        const jogos =
            [...jogosWishlist];


        /* ==============================
           A - Z
        ============================== */

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


        /* ==============================
           Z - A
        ============================== */

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


        /* ==============================
           MAIS RECENTES
        ============================== */

        if (
            ordenar.value === "recentes"
        ) {

            jogos.sort(
                function(a, b) {

                    const dataA =
                        a.data_adicao
                            ? new Date(a.data_adicao)
                            : new Date(0);

                    const dataB =
                        b.data_adicao
                            ? new Date(b.data_adicao)
                            : new Date(0);


                    return dataB - dataA;

                }
            );

        }


        /* ==============================
           MAIS ANTIGOS
        ============================== */

        if (
            ordenar.value === "antigos"
        ) {

            jogos.sort(
                function(a, b) {

                    const dataA =
                        a.data_adicao
                            ? new Date(a.data_adicao)
                            : new Date(0);

                    const dataB =
                        b.data_adicao
                            ? new Date(b.data_adicao)
                            : new Date(0);


                    return dataA - dataB;

                }
            );

        }


        /* ==============================
           MENOR PREÇO
        ============================== */

        if (
            ordenar.value === "menorPreco"
        ) {

            jogos.sort(
                function(a, b) {

                    const precoA =
                        Number(a.preco) ||
                        0;

                    const precoB =
                        Number(b.preco) ||
                        0;


                    return precoA - precoB;

                }
            );

        }


        /* ==============================
           MAIOR PREÇO
        ============================== */

        if (
            ordenar.value === "maiorPreco"
        ) {

            jogos.sort(
                function(a, b) {

                    const precoA =
                        Number(a.preco) ||
                        0;

                    const precoB =
                        Number(b.preco) ||
                        0;


                    return precoB - precoA;

                }
            );

        }


        mostrarJogos(
            jogos
        );

    }
);

/* =========================================
   INICIALIZAÇÃO
========================================= */

carregarUsuario();

carregarWishlist();