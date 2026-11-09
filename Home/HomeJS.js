const slidesContainer =
    document.getElementById("slidesJogos");

const anterior =
    document.getElementById("anterior");

const proximo =
    document.getElementById("proximo");

let slides = [];

let indice = 0;


async function carregarCarrossel() {

    try {

        const resposta =
            await fetch("/jogos/carrossel");

        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            console.error(resultado.erro);

            return;
        }


        slidesContainer.innerHTML = "";


        resultado.jogos.forEach(
            (jogo, indiceJogo) => {

                const slide =
                    document.createElement("div");

                slide.classList.add("slide");


                if (indiceJogo === 0) {
                    slide.classList.add("ativo");
                }


                const imagem =
                    document.createElement("img");

                imagem.src = jogo.img1;

                imagem.alt = jogo.Game_Name;


                const info =
                    document.createElement("div");

                info.classList.add("info");


                const nome =
                    document.createElement("h2");

                nome.textContent =
                    jogo.Game_Name;


                info.appendChild(nome);


                slide.appendChild(imagem);

                slide.appendChild(info);


                slide.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

                    }
                );


                slidesContainer.appendChild(slide);

            }
        );


        slides =
            document.querySelectorAll(".slide");


    } catch (erro) {

        console.error(
            "Erro ao carregar carrossel:",
            erro
        );

    }

}


function mostrarSlide() {

    slides.forEach(slide => {

        slide.classList.remove("ativo");

    });


    if (slides.length > 0) {

        slides[indice].classList.add("ativo");

    }

}


proximo.addEventListener("click", () => {

    if (slides.length === 0) {
        return;
    }


    indice++;


    if (indice >= slides.length) {

        indice = 0;

    }


    mostrarSlide();

});


anterior.addEventListener("click", () => {

    if (slides.length === 0) {
        return;
    }


    indice--;


    if (indice < 0) {

        indice = slides.length - 1;

    }


    mostrarSlide();

});


carregarCarrossel();


setInterval(() => {

    if (slides.length === 0) {
        return;
    }


    indice++;


    if (indice >= slides.length) {

        indice = 0;

    }


    mostrarSlide();

}, 5000);



async function carregarPromocoes() {

    try {

        const resposta = await fetch("/jogos");

        const resultado = await resposta.json();

        if (!resposta.ok) {

            console.error(resultado.erro);

            return;
        }

        const container = document.querySelector("#cardsPromocoes");

        container.innerHTML = "";


        resultado.jogos.forEach(jogo => {

            const card = document.createElement("div");

            card.classList.add("card");
            
            card.addEventListener("click", () => {
				window.location.href = `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;
			});


            const imagem = document.createElement("img");

            imagem.src = jogo.img1;


            const nome = document.createElement("h3");

            nome.textContent = jogo.Game_Name;


            const desconto = document.createElement("span");

            desconto.classList.add("desconto");

            desconto.textContent = `-${jogo.desconto}%`;


            const preco = document.createElement("p");

            preco.textContent =
                `R$ ${Number(jogo.preco).toFixed(2).replace(".", ",")}`;


            card.appendChild(imagem);

            card.appendChild(nome);

            card.appendChild(desconto);

            card.appendChild(preco);


            container.appendChild(card);

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar as promoções:",
            erro
        );

    }

}

carregarPromocoes();

async function carregarMaisJogados() {

    try {

        const resposta = await fetch("/jogos/mais-jogados");

        const resultado = await resposta.json();

        if (!resposta.ok) {

            console.error(resultado.erro);

            return;
        }

        const container =
            document.querySelector("#cardsMaisJogados");

        container.innerHTML = "";


        resultado.jogos.forEach(jogo => {

            const card = document.createElement("div");

            card.classList.add("card");


            card.addEventListener("click", () => {

                window.location.href =
                    `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

            });


            const imagem = document.createElement("img");

            imagem.src = jogo.img1;


            const nome = document.createElement("h3");

            nome.textContent = jogo.Game_Name;


            const desconto = document.createElement("span");

            desconto.classList.add("desconto");

            desconto.textContent =
                `-${jogo.desconto}%`;


            const preco = document.createElement("p");

            preco.textContent =
                `R$ ${Number(jogo.preco)
                    .toFixed(2)
                    .replace(".", ",")}`;


            card.appendChild(imagem);

            card.appendChild(nome);

            card.appendChild(desconto);

            card.appendChild(preco);


            container.appendChild(card);

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar os mais jogados:",
            erro
        );

    }

}

carregarMaisJogados();

const botaoCategorias =
    document.getElementById("botaoCategorias");

const categoriasGrid =
    document.querySelector(".categorias-grid");


botaoCategorias.addEventListener("click", () => {

    categoriasGrid.classList.toggle("expandido");

    if (categoriasGrid.classList.contains("expandido")) {

        botaoCategorias.textContent = "▲";

    } else {

        botaoCategorias.textContent = "▼";

    }

});

const categorias =
    document.querySelectorAll(".categorias-grid div");

categorias.forEach((categoria) => {

    categoria.addEventListener("click", () => {

        const genero =
            categoria.textContent.trim();

        window.location.href =
            `../Categoria/Categoria.html?genero=${encodeURIComponent(genero)}`;

    });

});

// =========================================
// PUBLICADORAS E PRODUTORAS
// =========================================

const botoesEmpresas =
    document.querySelectorAll(".botaoCeta");

const publiGrid =
    document.querySelector("#publi-grid");

const prodGrid =
    document.querySelector("#prod-grid");


// =========================================
// CARREGAR PUBLICADORAS
// =========================================

async function carregarPublicadoras() {

    try {

        const resposta =
            await fetch("/publicadoras");

        const resultado =
            await resposta.json();

        if (!resposta.ok) {

            console.error(resultado.erro);

            return;

        }

        publiGrid.innerHTML = "";

        resultado.publicadoras.forEach(publicadora => {

            const card =
                document.createElement("div");

            const logo =
                document.createElement("img");

            logo.src =
                publicadora.logo;

            logo.alt =
                publicadora.Publicadora_Nome;
                
            card.addEventListener("click", () => {

				window.location.href =
					`../Publicadora/Publicadora.html?id=${publicadora.IDpub}`;

			});

            card.appendChild(logo);

            publiGrid.appendChild(card);

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar publicadoras:",
            erro
        );

    }

}


// =========================================
// CARREGAR PRODUTORAS
// =========================================

async function carregarProdutoras() {

    try {

        const resposta =
            await fetch("/produtoras");

        const resultado =
            await resposta.json();

        if (!resposta.ok) {

            console.error(resultado.erro);

            return;

        }

        prodGrid.innerHTML = "";

        resultado.produtoras.forEach(produtora => {

            const card =
                document.createElement("div");

            const logo =
                document.createElement("img");

            logo.src =
                produtora.logo;

            logo.alt =
                produtora.Produtora_Nome;
                
            card.addEventListener("click", () => {

				window.location.href =
					`../Produtora/Produtora.html?id=${produtora.IDpro}`;

			});

            card.appendChild(logo);

            prodGrid.appendChild(card);

        });

    } catch (erro) {

        console.error(
            "Erro ao carregar produtoras:",
            erro
        );

    }

}


// =========================================
// ABRIR / FECHAR SEÇÕES
// =========================================

botoesEmpresas.forEach((botao, indice) => {

    botao.addEventListener("click", () => {

        const grid =
            indice === 0
                ? publiGrid
                : prodGrid;

        grid.classList.toggle("expandido");

        if (grid.classList.contains("expandido")) {

            botao.textContent = "▲";

        } else {

            botao.textContent = "▼";

        }

    });

});


const consolesGrid = document.getElementById("consolesGrid");
const anteriorConsoles = document.getElementById("anteriorConsoles");
const proximoConsoles = document.getElementById("proximoConsoles");

let indiceConsoles = 0;

function atualizarCarrosselConsoles() {
    const cardsConsoles = consolesGrid.querySelectorAll(".consola");

    if (cardsConsoles.length === 0) {
        return;
    }

    // Quantos cards podem ser percorridos sem deixar espaços vazios.
    const maxIndice = Math.max(0, cardsConsoles.length - 3);

    indiceConsoles = Math.max(
        0,
        Math.min(indiceConsoles, maxIndice)
    );

    // Descobre a largura do card e o espaço entre os cards.
    const card = cardsConsoles[0];
    const estiloGrid = getComputedStyle(consolesGrid);
    const gap = parseFloat(estiloGrid.columnGap) || 0;

    const larguraCard = card.getBoundingClientRect().width;
    const deslocamento = indiceConsoles * (larguraCard + gap);

    // Desliza a fila horizontalmente.
    consolesGrid.style.transform = `translateX(-${deslocamento}px)`;

    // Desativa as setas quando chegam aos limites.
    anteriorConsoles.disabled = indiceConsoles === 0;
    proximoConsoles.disabled = indiceConsoles >= maxIndice;
}

proximoConsoles.addEventListener("click", () => {
    indiceConsoles++;
    atualizarCarrosselConsoles();
});

anteriorConsoles.addEventListener("click", () => {
    indiceConsoles--;
    atualizarCarrosselConsoles();
});

// Recalcula o deslocamento se a largura da página mudar.
window.addEventListener("resize", atualizarCarrosselConsoles);

atualizarCarrosselConsoles();



// =========================================
// INICIAR
// =========================================

carregarPublicadoras();
carregarProdutoras();