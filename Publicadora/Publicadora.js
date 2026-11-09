const params = new URLSearchParams(window.location.search);

const idPublicadora = params.get("id");

const cardsJogos = document.querySelector("#cardsJogos");
const semJogos = document.querySelector("#semJogos");
const quantidadeJogos = document.querySelector("#quantidadeJogos");
const ordenar = document.querySelector("#ordenar");

let jogos = [];


// ==========================================
// CARREGAR PUBLICADORA
// ==========================================

async function carregarPublicadora() {

	console.log("CARREGAR PUBLICADORA FOI EXECUTADA");

    if (!idPublicadora) {

        console.log("ID DA PUBLICADORA ESTÁ VAZIO!");

        semJogos.textContent = "Publicadora não encontrada.";
        semJogos.style.display = "block";

        return;
    }


    try {

        console.log("VOU FAZER O FETCH!");

        const resposta = await fetch(`/publicadora/${idPublicadora}`);

        console.log("FETCH TERMINOU!");

        const resultado = await resposta.json();

        console.log("RESULTADO:", resultado);

        if (!resposta.ok) {

            console.error(resultado.erro);

            semJogos.textContent =
                "Erro ao carregar os jogos.";

            semJogos.style.display = "block";

            return;
        }

        const publicadora = resultado.publicadora;

        document.querySelector("#logoPublicadora").src =
            publicadora.logo;

        document.querySelector("#anoCriacao").textContent =
            publicadora.ano_criacao;

        jogos = resultado.jogos;

		quantidadeJogos.textContent = jogos.length;

		criarFundoJogos(jogos);

		mostrarJogos(jogos);

    }

    catch (erro) {

        console.error(
            "Erro ao carregar publicadora:",
            erro
        );

        semJogos.textContent =
            "Não foi possível carregar os jogos.";

        semJogos.style.display = "block";

    }

}

function criarFundoJogos(lista) {

    const fundo = document.querySelector("#fundoJogosPublicadora");

    fundo.innerHTML = "";

    lista.forEach(jogo => {

        if (!jogo.img1) {
            return;
        }

        const imagem = document.createElement("img");

        imagem.src = jogo.img1;

        imagem.alt = "";

        fundo.appendChild(imagem);

    });

}

// ==========================================
// MOSTRAR JOGOS
// ==========================================

function mostrarJogos(lista) {

    cardsJogos.innerHTML = "";


    if (lista.length === 0) {

        semJogos.style.display = "block";

        return;

    }


    semJogos.style.display = "none";


    lista.forEach((jogo, indice) => {

        const card = document.createElement("article");

        card.classList.add("cardJogo");


        const imagem = document.createElement("img");

        imagem.src =
            jogo.img1 ||
            "../imagens/semImagem.png";

        imagem.alt = jogo.Game_Name;


        const info = document.createElement("div");

        info.classList.add("infoJogo");


        const nome = document.createElement("h3");

        nome.textContent = jogo.Game_Name;


        const preco = document.createElement("span");

        preco.classList.add("precoJogo");


        if (jogo.preco !== null) {

            preco.textContent =
                `R$ ${Number(jogo.preco)
                    .toFixed(2)
                    .replace(".", ",")}`;

        }
        else {

            preco.textContent = "Preço indisponível";

        }


        info.appendChild(nome);

        info.appendChild(preco);


        if (jogo.desconto > 0) {

            const desconto =
                document.createElement("span");

            desconto.classList.add("descontoJogo");

            desconto.textContent =
                `-${jogo.desconto}%`;

            info.appendChild(desconto);

        }


        card.appendChild(imagem);

        card.appendChild(info);


        // ----------------------------------
        // ANIMAÇÃO INDIVIDUAL
        // ----------------------------------

        card.style.animationDelay =
            `${indice * 0.08}s`;


        // ----------------------------------
        // ABRIR PÁGINA DO JOGO
        // ----------------------------------

        card.addEventListener("click", () => {

            card.style.transform =
                "scale(0.95)";

            setTimeout(() => {

                window.location.href =
                    `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

            }, 150);

        });


        cardsJogos.appendChild(card);

    });

}


// ==========================================
// ORDENAÇÃO
// ==========================================

ordenar.addEventListener("change", () => {

    const tipo = ordenar.value;

    let listaOrdenada =
        [...jogos];


    if (tipo === "az") {

        listaOrdenada.sort((a, b) =>
            a.Game_Name.localeCompare(
                b.Game_Name
            )
        );

    }


    if (tipo === "za") {

        listaOrdenada.sort((a, b) =>
            b.Game_Name.localeCompare(
                a.Game_Name
            )
        );

    }


    if (tipo === "menorPreco") {

        listaOrdenada.sort((a, b) =>
            Number(a.preco || 0) -
            Number(b.preco || 0)
        );

    }


    if (tipo === "maiorPreco") {

        listaOrdenada.sort((a, b) =>
            Number(b.preco || 0) -
            Number(a.preco || 0)
        );

    }


    if (tipo === "maiorDesconto") {

        listaOrdenada.sort((a, b) =>
            Number(b.desconto || 0) -
            Number(a.desconto || 0)
        );

    }


    // Animação de troca

    cardsJogos.classList.add(
        "trocandoJogos"
    );


    setTimeout(() => {

        mostrarJogos(listaOrdenada);

        cardsJogos.classList.remove(
            "trocandoJogos"
        );

    }, 200);

});


// ==========================================
// INICIALIZAÇÃO
// ==========================================

carregarUsuario();

carregarPublicadora();