const quantidadeJogos = document.querySelector("#quantidadeJogos");
const cardsJogos = document.querySelector("#cardsJogos");
const semJogos = document.querySelector("#semJogos");
const ordenar = document.querySelector("#ordenar");

/* =========================================
   PRODUTORA DA URL
========================================= */

const parametros =
    new URLSearchParams(window.location.search);

const idProdutora =
    parametros.get("id");


/* =========================================
   JOGOS
========================================= */

let jogosCarregados = [];


/* =========================================
   BUSCAR PRODUTORA E JOGOS
========================================= */

async function carregarJogos() {

    if (!idProdutora) {

        nomeProdutora.textContent =
            "Produtora não informada";

        quantidadeJogos.textContent =
            "";

        mostrarSemJogos();

        return;
    }

    try {

        const resposta =
            await fetch(
                `/produtora/${encodeURIComponent(idProdutora)}`
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            console.error(resultado.erro);

            nomeProdutora.textContent =
                "Produtora não encontrada";

            mostrarSemJogos();

            return;
        }


        /* =================================
           DADOS DA PRODUTORA
        ================================= */

        const produtora =
            resultado.produtora;

        document.querySelector("#logoProdutora").src =
            produtora.logo;


        document.querySelector("#anoCriacao").textContent =
            produtora.ano_criacao;


        /* =================================
           JOGOS
        ================================= */

        jogosCarregados =
			resultado.jogos;


		quantidadeJogos.textContent =
			jogosCarregados.length;


		criarFundoJogos(jogosCarregados);

        /* =================================
           VERIFICAR SE POSSUI JOGOS
        ================================= */

        if (jogosCarregados.length === 0) {

            mostrarSemJogos();

            return;
        }


        esconderSemJogos();

        mostrarJogos(jogosCarregados);

    }

    catch (erro) {

        console.error(
            "Erro ao carregar produtora:",
            erro
        );

        nomeProdutora.textContent =
            "Erro ao carregar produtora";

        mostrarSemJogos();
    }
}

/* =========================================
   FUNDO COM IMAGENS DOS JOGOS
========================================= */

function criarFundoJogos(lista) {

    const fundo =
        document.querySelector("#fundoJogosProdutora");

    fundo.innerHTML = "";


    lista.forEach(function(jogo) {

        if (!jogo.img1) {
            return;
        }


        const imagem =
            document.createElement("img");


        imagem.src =
            jogo.img1;


        imagem.alt =
            "";


        fundo.appendChild(imagem);

    });

}

/* =========================================
   MOSTRAR JOGOS
========================================= */

function mostrarJogos(jogos) {

    cardsJogos.innerHTML = "";


    jogos.forEach(function(jogo, indice) {

        const card =
            document.createElement("div");

        card.classList.add("card");


        /* atraso da animação */

        card.style.animationDelay =
            `${indice * 0.08}s`;


        /* =================================
           IMAGEM
        ================================= */

        const imagem =
            document.createElement("img");


        if (jogo.img1) {

            imagem.src =
                jogo.img1;

        }

        else {

            imagem.src =
                "../imagens/semImagem.png";

        }


        imagem.alt =
            jogo.Game_Name;


        /* =================================
           INFORMAÇÕES
        ================================= */

        const informacoes =
            document.createElement("div");

        informacoes.classList.add(
            "informacoesCard"
        );


        const titulo =
            document.createElement("h3");

        titulo.textContent =
            jogo.Game_Name;


        informacoes.appendChild(titulo);


        /* =================================
           PREÇO
        ================================= */

        const areaPreco =
            document.createElement("div");


        const precoOriginal =
            Number(jogo.preco);


        const desconto =
            Number(jogo.desconto);


        if (
            !Number.isNaN(precoOriginal) &&
            precoOriginal > 0
        ) {

            if (desconto > 0) {

                const precoAntigo =
                    document.createElement("span");

                precoAntigo.classList.add(
                    "precoOriginal"
                );


                precoAntigo.textContent =
                    `R$ ${precoOriginal.toFixed(2).replace(".", ",")}`;


                const precoFinal =
                    precoOriginal *
                    (1 - desconto / 100);


                const preco =
                    document.createElement("span");

                preco.classList.add("preco");


                preco.textContent =
                    `R$ ${precoFinal.toFixed(2).replace(".", ",")}`;


                const descontoElemento =
                    document.createElement("span");

                descontoElemento.classList.add(
                    "desconto"
                );


                descontoElemento.textContent =
                    `-${desconto}%`;


                areaPreco.appendChild(
                    precoAntigo
                );

                areaPreco.appendChild(
                    preco
                );

                areaPreco.appendChild(
                    descontoElemento
                );

            }

            else {

                const preco =
                    document.createElement("span");

                preco.classList.add("preco");


                preco.textContent =
                    `R$ ${precoOriginal.toFixed(2).replace(".", ",")}`;


                areaPreco.appendChild(
                    preco
                );
            }

        }

        else {

            const gratuito =
                document.createElement("span");

            gratuito.classList.add("preco");

            gratuito.textContent =
                "Grátis";


            areaPreco.appendChild(
                gratuito
            );
        }


        informacoes.appendChild(
            areaPreco
        );


        /* =================================
           MONTAR CARD
        ================================= */

        card.appendChild(imagem);

        card.appendChild(
            informacoes
        );


        /* =================================
           ABRIR PÁGINA DO JOGO
        ================================= */

        card.addEventListener(
            "click",
            function() {

                window.location.href =
                    `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

            }
        );


        cardsJogos.appendChild(card);

    });
}


/* =========================================
   SEM JOGOS
========================================= */

function mostrarSemJogos() {

    cardsJogos.innerHTML = "";

    semJogos.style.display =
        "block";
}


function esconderSemJogos() {

    semJogos.style.display =
        "none";
}


/* =========================================
   ORDENAÇÃO
========================================= */

ordenar.addEventListener(
    "change",
    function() {

        const jogos =
            [...jogosCarregados];


        if (ordenar.value === "az") {

            jogos.sort(function(a, b) {

                return a.Game_Name.localeCompare(
                    b.Game_Name
                );

            });

        }


        if (ordenar.value === "za") {

            jogos.sort(function(a, b) {

                return b.Game_Name.localeCompare(
                    a.Game_Name
                );

            });

        }


        if (ordenar.value === "menorPreco") {

            jogos.sort(function(a, b) {

                return Number(a.preco) -
                       Number(b.preco);

            });

        }


        if (ordenar.value === "maiorPreco") {

            jogos.sort(function(a, b) {

                return Number(b.preco) -
                       Number(a.preco);

            });

        }


        if (ordenar.value === "maiorDesconto") {

            jogos.sort(function(a, b) {

                return Number(b.desconto) -
                       Number(a.desconto);

            });

        }


        mostrarJogos(jogos);

    }
);


/* =========================================
   INICIALIZAÇÃO
========================================= */

carregarUsuario();

carregarJogos();