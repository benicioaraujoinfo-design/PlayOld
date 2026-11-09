const capaJogo =
    document.querySelector("#capaJogo");

const nomeJogo =
    document.querySelector("#nomeJogo");

const precoOriginal =
    document.querySelector("#precoOriginal");

const desconto =
    document.querySelector("#desconto");

const precoFinal =
    document.querySelector("#precoFinal");

const nomeComprador =
    document.querySelector("#nomeComprador");

const botaoComprar =
    document.querySelector("#botaoComprar");

const mensagemErro =
    document.querySelector("#mensagemErro");

const areaCompra =
    document.querySelector("#areaCompra");

const compraConcluida =
    document.querySelector("#compraConcluida");

const voltarJogo =
    document.querySelector("#voltarJogo");

const parametros =
    new URLSearchParams(
        window.location.search
    );


const idJogo =
    parametros.get("id");


if (!idJogo) {

    window.location.href =
        "../Home/Home.html";

}

let dadosJogo = null;

function formatarPreco(valor) {

    return `R$ ${Number(valor)
        .toFixed(2)
        .replace(".", ",")}`;

}

function mostrarErro(mensagem) {

    mensagemErro.textContent =
        mensagem;

    mensagemErro.style.display =
        "block";

}

function ocultarErro() {

    mensagemErro.textContent =
        "";

    mensagemErro.style.display =
        "none";

}

async function carregarJogo() {

    try {

        const resposta =
            await fetch(
                `/jogo/${idJogo}`
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            mostrarErro(
                resultado.erro ||
                "Não foi possível carregar o jogo."
            );

            return;

        }


        dadosJogo =
            resultado.jogo;


        nomeJogo.textContent =
            dadosJogo.Game_Name;


        capaJogo.src =
            dadosJogo.img1 ||
            "../imagens/semImagem.png";


        capaJogo.onerror =
            function() {

                capaJogo.src =
                    "../imagens/semImagem.png";

            };


        const valor =
            Number(dadosJogo.preco) || 0;


        const valorDesconto =
            Number(dadosJogo.desconto) || 0;


        const valorFinal =
            valor *
            (1 - valorDesconto / 100);


        precoOriginal.textContent =
            formatarPreco(valor);


        precoFinal.textContent =
            formatarPreco(valorFinal);


        if (valorDesconto > 0) {

            desconto.textContent =
                `-${valorDesconto}%`;

        } else {

            document.querySelector(
                "#linhaDesconto"
            ).style.display =
                "none";

        }


        voltarJogo.href =
            `../PGJogo/PGJogo.html?id=${idJogo}`;


    } catch (erro) {

        console.error(erro);

        mostrarErro(
            "Erro ao carregar os dados do jogo."
        );

    }

}

async function carregarUsuario() {

    try {

        const resposta =
            await fetch("/usuario");

        const resultado =
            await resposta.json();


        if (!resposta.ok) {

    console.error(
        "Erro na rota /usuario:",
        resposta.status,
        resultado
    );

    return;

}


        const fotoUsuario =
            document.querySelector("#fotoUsuario");


        if (resultado.usuario.foto_perfil) {

            fotoUsuario.src =
                resultado.usuario.foto_perfil;

        } else {

            fotoUsuario.src =
                "../imagens/usuario.png";

        }

        nomeComprador.value =
            resultado.usuario.UsrName;


    } catch (erro) {

        console.error(
            "Erro ao carregar usuário:",
            erro
        );

        const fotoUsuario =
            document.querySelector("#fotoUsuario");

        if (fotoUsuario) {

            fotoUsuario.src =
                "../imagens/usuario.png";

        }

    }

}

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

botaoComprar.addEventListener(
    "click",
    async function() {

        ocultarErro();


        const nome =
            nomeComprador.value.trim();


        const metodoElemento =
            document.querySelector(
                'input[name="pagamento"]:checked'
            );


        const metodo =
            metodoElemento
                ? metodoElemento.value
                : "";


        if (nome === "") {

            mostrarErro(
                "Digite seu nome para continuar."
            );

            nomeComprador.focus();

            return;

        }


        if (!metodo) {

            mostrarErro(
                "Escolha uma forma de pagamento."
            );

            return;

        }


        if (!dadosJogo) {

            mostrarErro(
                "Os dados do jogo ainda não foram carregados."
            );

            return;

        }

        botaoComprar.disabled =
            true;

        botaoComprar.textContent =
            "Processando...";


        try {

            const resposta =
                await fetch(
                    "/comprar",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            IDjgo:
                                Number(idJogo),

                            nome:
                                nome,

                            metodo:
                                metodo

                        })

                    }
                );


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                mostrarErro(
                    resultado.erro ||
                    "Não foi possível concluir a compra."
                );

                botaoComprar.disabled =
                    false;

                botaoComprar.textContent =
                    "Confirmar compra";

                return;

            }

            areaCompra.style.display =
                "none";


            document.querySelector(
                "#tituloCompra"
            ).style.display =
                "none";


            document.querySelector(
                "#principal"
            ).style.minHeight =
                "80vh";


            document.querySelector(
                "#textoSucesso"
            ).textContent =
                `${dadosJogo.Game_Name} foi adicionado à sua biblioteca.`;

            compraConcluida.style.display =
                "block";


        } catch (erro) {

            console.error(
                "Erro ao finalizar compra:",
                erro
            );


            mostrarErro(
                "Erro de conexão com o servidor."
            );


            botaoComprar.disabled =
                false;

            botaoComprar.textContent =
                "Confirmar compra";

        }

    }
);

carregarUsuario();
carregarJogo();