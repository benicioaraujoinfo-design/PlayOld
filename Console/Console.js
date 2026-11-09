const botao = document.querySelector(".botao");
const cards = document.querySelector(".cards");
const capa = document.querySelector("#capa");
const texto = document.querySelector("#text");
const nome = document.querySelector("#nome");
const quant = document.querySelector("#quant");
const numQ = document.querySelector("#numQ");
const ano = document.querySelector("#ano");
const numA = document.querySelector("#numA");
const espacoJogos = document.querySelector("#espacoJogos");
const container = document.querySelector("#video-container");
const principal = document.querySelector("#principal");
const video = document.querySelector("#video video");
const consoleImg = document.querySelector("#consoleImg");
const cardsConsole = document.querySelector("#cardsConsole");
const ordenar = document.querySelector("#ordenar");
let jogos = [];

const parametros =
    new URLSearchParams(
        window.location.search
    );

const idConsole =
    parametros.get("id");

async function carregarConsole() {

    if (!idConsole) {

        console.error(
            "ID do console não encontrado."
        );

        return;
    }

    try {

        console.log(
            "Carregando console:",
            idConsole
        );


        const resposta =
            await fetch(
                `/console/${idConsole}`
            );


        const resultado =
            await resposta.json();


        console.log(
            "Dados recebidos:",
            resultado
        );


        if (!resposta.ok) {

            console.error(
                resultado.erro
            );

            return;
        }


        const consoleDados =
            resultado.console;
            

		numQ.textContent = consoleDados.QNTjogos;

		numA.textContent = consoleDados.Console_Data;

        nome.textContent =
            consoleDados.Console_Nome;

        consoleImg.src =
            consoleDados.imagem;

        const videoConsole =
            document.querySelector(
                "#videoConsole"
            );


        videoConsole.src =
            consoleDados.video;


        video.load();

        console.log(
            "Quantidade de jogos:",
            resultado.jogos.length
        );


        
jogos = resultado.jogos;

criarFundoJogos(jogos);

mostrarJogos(jogos);

ajustarFundoJogos();

        
        ajustarAlturaPrincipal();


        console.log(
            "Jogos carregados."
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar console:",
            erro
        );

    }

}


function mostrarJogos(lista) {

    cardsConsole.innerHTML = "";

    lista.forEach(function(jogo) {

        const card = document.createElement("div");
        card.classList.add("card");

        const imagem = document.createElement("img");
        imagem.src = jogo.img1;

        const nomeJogo = document.createElement("h3");
        nomeJogo.textContent = jogo.Game_Name;

        const desconto = document.createElement("span");
        desconto.classList.add("desconto");
        desconto.textContent = `-${jogo.desconto}%`;

        const preco = document.createElement("p");
        preco.textContent =
            `R$ ${Number(jogo.preco)
                .toFixed(2)
                .replace(".", ",")}`;

        card.appendChild(imagem);
        card.appendChild(nomeJogo);
        card.appendChild(desconto);
        card.appendChild(preco);

        card.addEventListener("click", function() {

            window.location.href =
                `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

        });

        cardsConsole.appendChild(card);

    });

}

let aberto = false;


botao.addEventListener(
    "click",
    function() {

        if (!aberto) {

            container.style.height =
                "70vh";
             
             principal.style.height =
				"190vh";

            botao.style.transform =
                "translateY(28vh)";
                
            consoleImg.style.transform = 
				"translateY(37vh)";

            nome.style.transform =
                "translateY(11vh)";
                
            espacoJogos.style.transform =
				"translateY(8vh)";
				
			quant.style.transform =
				"translateY(10vh)";
				
			numQ.style.transform =
				"translateY(10vh)";
				
			ano.style.transform =
				"translateY(10vh)";
				
			numA.style.transform =
				"translateY(10vh)";


            video.style.filter =
                "blur(0)";

            capa.style.opacity =
                "0";


            texto.innerHTML =
                "Fechar<br>vídeo<br>promocional";


            aberto = true;


        } else {

            container.style.height =
                "30vh";
                
            principal.style.height =
				"0";

            botao.style.transform =
                "translateY(0)";
                
            consoleImg.style.transform = 
				"translateY(0)";

            nome.style.transform =
                "translateY(0)";
                
            espacoJogos.style.transform =
                "translateY(0)";
                
            quant.style.transform =
				"translateY(0)";
				
            numQ.style.transform =
				"translateY(0)";
			ano.style.transform =
				"translateY(0)";
				
			numA.style.transform =
				"translateY(0)";

            video.style.filter =
                "blur(15px)";

            capa.style.opacity =
                "1";

            texto.innerHTML =
                "Abrir<br>vídeo<br>promocional";

            aberto = false;

        }

    }
);

carregarConsole();

function ajustarAlturaPrincipal() {
    if (!principal || !espacoJogos) {
        return;
    }

    const topoJogos = espacoJogos.offsetTop;
    const alturaJogos = espacoJogos.offsetHeight;

    principal.style.height =
        `${topoJogos + alturaJogos}px`;
}


ordenar.addEventListener("change", function() {

    const tipo = ordenar.value;

    console.log("Opção selecionada:", tipo);
    console.log("Quantidade de jogos:", jogos.length);

    let listaOrdenada = [...jogos];

    if (tipo === "az") {

        listaOrdenada.sort((a, b) =>
            a.Game_Name.localeCompare(b.Game_Name)
        );

    } else if (tipo === "za") {

        listaOrdenada.sort((a, b) =>
            b.Game_Name.localeCompare(a.Game_Name)
        );

    } else if (tipo === "menorPreco") {

        listaOrdenada.sort((a, b) =>
            Number(a.preco || 0) - Number(b.preco || 0)
        );

    } else if (tipo === "maiorPreco") {

        listaOrdenada.sort((a, b) =>
            Number(b.preco || 0) - Number(a.preco || 0)
        );

    } else if (tipo === "maiorDesconto") {

        listaOrdenada.sort((a, b) =>
            Number(b.desconto || 0) - Number(a.desconto || 0)
        );

    }

    mostrarJogos(listaOrdenada);

});

function criarFundoJogos(lista) {

    const fundo = document.querySelector(
        "#fundoJogosConsole"
    );

    if (!fundo) {
        console.error(
            "Elemento #fundoJogosConsole não encontrado."
        );
        return;
    }

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


function ajustarFundoJogos() {
    const fundo = document.querySelector("#fundoJogosConsole");
    const footer = document.querySelector("footer");

    if (!fundo || !footer) {
        return;
    }

    const inicioFundo = fundo.getBoundingClientRect().top
        + window.scrollY;

    const topoFooter = footer.getBoundingClientRect().top
        + window.scrollY;

    fundo.style.height =
        `${Math.max(0, topoFooter - inicioFundo)}px`;
}

window.addEventListener("resize", ajustarFundoJogos);