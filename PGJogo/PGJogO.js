const slides =
document.querySelectorAll(".slide");

const miniaturas =
document.querySelector(".miniaturas");

const anterior =
document.getElementById("anterior");

const proximo =
document.getElementById("proximo");

let indice = 0;

const parametros =
    new URLSearchParams(
        window.location.search
    );

const idJogo =
    parametros.get("id");
    
function criarDegradeAleatorio() {

    const cores = [];


    for (let i = 0; i < 5; i++) {

        const matiz =
            Math.floor(Math.random() * 360);

        const saturacao =
            Math.floor(50 + Math.random() * 50);

        const luminosidade =
            Math.floor(25 + Math.random() * 50);


        cores.push(
            `hsl(
                ${matiz},
                ${saturacao}%,
                ${luminosidade}%
            )`
        );

    }


    const degrade =
        `linear-gradient(
            120deg,
            ${cores[0]},
            ${cores[1]},
            ${cores[2]},
            ${cores[3]},
            ${cores[4]}
        )`;


    document.body.style.background =
        degrade;

    document.body.style.backgroundSize =
        "400% 400%";

    document.body.style.animation =
        "degradêFundo 7s ease infinite";
}


criarDegradeAleatorio();

async function carregarJogo() {

    if (!idJogo) {
        console.error("ID do jogo não encontrado.");
        return;
    }

    try {

        const resposta =
            await fetch(`/jogo/${idJogo}`);

        const resultado =
            await resposta.json();

        if (!resposta.ok) {

            console.error(
                resultado.erro
            );

            return;
        }

        const jogo =
            resultado.jogo;	
                        
        const data =
			document.querySelector("#data");
			
		if (jogo.data_lancamento) {
			const dataLancamento = new Date(jogo.data_lancamento);

			data.textContent =
				dataLancamento.toLocaleDateString("pt-BR");
		} else {
			data.textContent =
				"Data não informada";
		}

		const distri =
			document.querySelector("#distri");

		const publi =
			document.querySelector("#publi");

		const conso =
			document.querySelector("#conso");

		distri.textContent =
			jogo.distribuidora || "Não informada";

		publi.textContent =
			jogo.produtora || "Não informada";


		if (resultado.consoles && resultado.consoles.length > 0) {

			conso.textContent =
				resultado.consoles
					.map(console => console.Console_Nome)
					.join(", ");

		} else {

			conso.textContent =
				"Não informado";

		}
            
        const precoOriginal =
			document.querySelector("#precoOriginal");

		const desconto =
			document.querySelector("#desconto");

		const preco =
			document.querySelector("#preco");


		if (Number(jogo.desconto) > 0) {

			precoOriginal.style.display = "inline";

			precoOriginal.textContent =
				`R$ ${Number(jogo.preco)
					.toFixed(2)
					.replace(".", ",")}`;


			desconto.style.display = "inline";

			desconto.textContent =
				`-${jogo.desconto}%`;


			const precoFinal =
				Number(jogo.preco) *
				(1 - Number(jogo.desconto) / 100);

			preco.style.display = "inline";

			preco.textContent =
				`R$ ${precoFinal
					.toFixed(2)
					.replace(".", ",")}`;

		} else {

			precoOriginal.style.display = "none";

			desconto.style.display = "none";


			preco.style.display = "inline";

			preco.textContent =
				`R$ ${Number(jogo.preco)
					.toFixed(2)
					.replace(".", ",")}`;

		}
            
        const textoDescricao =
			document.querySelector("#textoD");

		if (textoDescricao) {

			textoDescricao.textContent =
				jogo.Descricao;

		}

        const imagens = [
            jogo.img1,
            jogo.img2,
            jogo.img3,
            jogo.img4,
            jogo.img5,
            jogo.img6
        ];

        slides.forEach((slide, i) => {

            const img =
                slide.querySelector("img");

            if (imagens[i]) {

                img.src =
                    imagens[i];

            } else {

                img.src =
                    "../imagens/semImagem.png";

            }

        });

        criarMiniaturas();

        atualizar();


    } catch (erro) {

        console.error(
            "Erro ao carregar jogo:",
            erro
        );

    }

}

function criarMiniaturas() {

    miniaturas.innerHTML = "";

    slides.forEach((slide, i) => {

        const img =
            slide.querySelector("img");

        const thumb =
            document.createElement("img");

        thumb.src =
            img.src;

        thumb.classList.add("thumb");

        thumb.addEventListener("click", () => {

            indice = i;

            atualizar();

        });

        miniaturas.appendChild(thumb);

    });

}

function atualizar() {

    slides.forEach(slide => {

        slide.classList.remove(
            "ativo",
            "anterior",
            "proximo"
        );

    });


    document
        .querySelectorAll(".thumb")
        .forEach(t => {

            t.classList.remove("ativa");

        });


    let ant =
        indice - 1;

    if (ant < 0) {

        ant =
            slides.length - 1;

    }

    let prox =
        indice + 1;

    if (prox >= slides.length) {

        prox = 0;

    }

    slides[indice]
        .classList.add("ativo");

    slides[ant]
        .classList.add("anterior");

    slides[prox]
        .classList.add("proximo");


    const thumbs =
        document.querySelectorAll(".thumb");

    if (thumbs[indice]) {

        thumbs[indice]
            .classList.add("ativa");

    }

}

proximo.addEventListener("click", () => {

    indice++;

    if (indice >= slides.length) {

        indice = 0;

    }

    atualizar();

});

anterior.addEventListener("click", () => {

    indice--;

    if (indice < 0) {

        indice =
            slides.length - 1;

    }

    atualizar();

});

setInterval(() => {

    indice++;

    if (indice >= slides.length) {

        indice = 0;

    }

    atualizar();

}, 5000);

carregarJogo();

console.log("PGJOGO NOVO CARREGADO");

const wishlist =
    document.querySelector("#wishlist");

const imgD =
    document.querySelector("#imgD");
    
const botaoComprar =
    document.querySelector("#comprar");


if (botaoComprar && idJogo) {

    botaoComprar.href =
        `../Comprar/Comprar.html?id=${idJogo}`;

}

async function verificarCompra() {

    if (!idJogo || !botaoComprar) {
        return;
    }

    try {

        const resposta =
            await fetch(`/jogo/${idJogo}/comprado`);

        const resultado =
            await resposta.json();

        if (!resposta.ok) {
            console.error(resultado.erro);
            return;
        }

        if (resultado.comprado) {

            botaoComprar.textContent = "Jogar";

            botaoComprar.href = `../Jogar/Jogar.html?id=${idJogo}`;

            botaoComprar.classList.add("jogoComprado");

        }

    } catch (erro) {

        console.error(
            "Erro ao verificar compra:",
            erro
        );

    }

}

function atualizarImagemWishlist() {

    if (wishlist.checked) {

        imgD.src =
            "../imagens/listaPretoEditado.png";

    } else {

        imgD.src =
            "../imagens/listaEditado.png";

    }

}

async function verificarWishlist() {

    if (!idJogo) {

        console.error(
            "ID do jogo não foi encontrado na URL."
        );

        return;

    }


    try {

        const resposta =
            await fetch(
                `/wishlist/verificar/${idJogo}`
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            console.error(
                resultado.erro
            );

            return;

        }


        wishlist.checked =
            resultado.naWishlist;


        atualizarImagemWishlist();


    } catch (erro) {

        console.error(
            "Erro ao verificar lista de desejos:",
            erro
        );

    }

}

console.log("BOTÃO WISHLIST ENCONTRADO:", wishlist);
console.log("ID DO JOGO:", idJogo);
wishlist.addEventListener(
    "change",
    async function() {
console.log("WISHLIST CLICADA");
        if (!idJogo) {

            wishlist.checked = false;

            return;

        }


        try {

            if (wishlist.checked) {

                const resposta =
                    await fetch(
                        "/wishlist",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                IDjgo:
                                    Number(idJogo)
                            })
                        }
                    );


                const resultado =
                    await resposta.json();


                if (!resposta.ok) {

                    console.error(
                        resultado.erro
                    );

                    wishlist.checked =
                        false;

                    atualizarImagemWishlist();

                    return;

                }


                atualizarImagemWishlist();

            }

            else {

                const resposta =
                    await fetch(
                        `/wishlist/jogo/${idJogo}`,
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

                    wishlist.checked =
                        true;

                    atualizarImagemWishlist();

                    return;

                }


                atualizarImagemWishlist();

            }


        } catch (erro) {

            console.error(
                "Erro ao alterar lista de desejos:",
                erro
            );

        }

    }
);

verificarWishlist();
verificarCompra();

async function carregarJogosDaProdutora() {

    const container =
        document.querySelector("#cardsProdutora");

    if (!container || !idJogo) {
        return;
    }

    try {

        const resposta =
            await fetch(
                `/jogo/${idJogo}/mesma-produtora`
            );

        const resultado =
            await resposta.json();

        if (!resposta.ok) {

            console.error(
                resultado.erro
            );

            return;
        }

        container.innerHTML = "";

        resultado.jogos.forEach(jogo => {

            const card =
                document.createElement("div");

            card.classList.add("card");

            const imagem =
                document.createElement("img");

            imagem.src = jogo.img1;

            const nome =
                document.createElement("h3");

            nome.textContent =
                jogo.Game_Name;

            const desconto =
                document.createElement("span");

            desconto.classList.add("desconto");

            desconto.textContent =
                `-${jogo.desconto}%`;

            const preco =
                document.createElement("p");

            preco.textContent =
                `R$ ${Number(jogo.preco)
                    .toFixed(2)
                    .replace(".", ",")}`;

            card.appendChild(imagem);
            card.appendChild(nome);
            card.appendChild(desconto);
            card.appendChild(preco);

            card.addEventListener("click", () => {

                window.location.href =
                    `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

            });

            container.appendChild(card);

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar jogos da mesma produtora:",
            erro
        );

    }
}

carregarJogosDaProdutora();

async function carregarJogosDoGenero() {

    const container =
        document.querySelector("#cardsGenero");

    if (!container || !idJogo) {
        return;
    }

    try {

        const resposta =
            await fetch(
                `/jogo/${idJogo}/mesmo-genero`
            );

        const resultado =
            await resposta.json();

        if (!resposta.ok) {

            console.error(
                resultado.erro
            );

            return;
        }

        container.innerHTML = "";

        resultado.jogos.forEach(jogo => {

            const card =
                document.createElement("div");

            card.classList.add("card");

            const imagem =
                document.createElement("img");

            imagem.src = jogo.img1;

            const nome =
                document.createElement("h3");

            nome.textContent =
                jogo.Game_Name;

            const desconto =
                document.createElement("span");

            desconto.classList.add("desconto");

            desconto.textContent =
                `-${jogo.desconto}%`;

            const preco =
                document.createElement("p");

            preco.textContent =
                `R$ ${Number(jogo.preco)
                    .toFixed(2)
                    .replace(".", ",")}`;

            card.appendChild(imagem);
            card.appendChild(nome);
            card.appendChild(desconto);
            card.appendChild(preco);

            card.addEventListener("click", () => {

                window.location.href =
                    `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

            });

            container.appendChild(card);

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar jogos do mesmo gênero:",
            erro
        );

    }
}

carregarJogosDoGenero();

function configurarCarrosselJogos(
    idCards,
    idEsquerda,
    idDireita
) {

    const cards =
        document.getElementById(idCards);

    const esquerda =
        document.getElementById(idEsquerda);

    const direita =
        document.getElementById(idDireita);


    if (!cards || !esquerda || !direita) {
        return;
    }


    let pagina = 0;


    function atualizarCarrossel() {

        if (pagina === 0) {

            cards.style.transform =
                "translateX(0)";

        } else {

            cards.style.transform =
                "translateX(-50%)";

        }


        esquerda.style.display =
            pagina === 0
                ? "none"
                : "block";


        direita.style.display =
            pagina === 1
                ? "none"
                : "block";
    }


    direita.addEventListener("click", () => {

        if (pagina >= 1) {
            return;
        }

        pagina++;

        atualizarCarrossel();

    });


    esquerda.addEventListener("click", () => {

        if (pagina <= 0) {
            return;
        }

        pagina--;

        atualizarCarrossel();

    });


    atualizarCarrossel();

}

configurarCarrosselJogos(
    "cardsProdutora",
    "setaProdutoraEsquerda",
    "setaProdutoraDireita"
);


configurarCarrosselJogos(
    "cardsGenero",
    "setaGeneroEsquerda",
    "setaGeneroDireita"
);

const botaoCarrinho = document.getElementById("carrinho");

if (botaoCarrinho) {
    botaoCarrinho.addEventListener("click", async function () {
        if (!idJogo || !Number.isInteger(Number(idJogo))) {
            alert("Não foi possível identificar o jogo.");
            return;
        }

        botaoCarrinho.disabled = true;

        try {
            const resposta = await fetch("/carrinho", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    IDjgo: Number(idJogo)
                })
            });

            const dados = await resposta.json();

            if (resposta.status === 401) {
                alert("Você precisa entrar na sua conta para adicionar jogos ao carrinho.");
                return;
            }

            if (!resposta.ok) {
                alert(dados.mensagem || "Não foi possível adicionar o jogo.");
                return;
            }

            const irParaCarrinho = confirm(
                "Jogo adicionado ao carrinho!\n\n" +
                "Deseja ir para o carrinho agora?"
            );

            if (irParaCarrinho) {
                window.location.href = "../Carrinho/Carrinho.html";
            }

        } catch (erro) {
            console.error("Erro ao adicionar ao carrinho:", erro);
            alert("Não foi possível se comunicar com o servidor.");

        } finally {
            botaoCarrinho.disabled = false;
        }
    });
}

carregarComentario();