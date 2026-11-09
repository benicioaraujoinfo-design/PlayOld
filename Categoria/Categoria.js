const parametros =
    new URLSearchParams(window.location.search);

const genero =
    parametros.get("genero");

const tituloCategoria =
    document.getElementById("tituloCategoria");

const listaJogos =
    document.getElementById("listaJogos");

const mensagem =
    document.getElementById("mensagem");


console.log("Gênero recebido pela página:", genero);


if (!genero) {

    tituloCategoria.textContent =
        "Categoria não encontrada";

    mensagem.textContent =
        "Nenhuma categoria foi informada.";

} else {

    tituloCategoria.textContent =
        `Jogos da categoria ${genero}`;

    carregarJogos();
}

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

//menu do usuario

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

async function carregarJogos() {

    try {

        console.log(
            "Buscando jogos da categoria:",
            genero
        );

        const resposta =
            await fetch(
                `/jogos?genero=${encodeURIComponent(genero)}`
            );


        console.log(
            "Status da resposta:",
            resposta.status
        );


        const resultado =
            await resposta.json();


        console.log(
            "Jogos recebidos:",
            resultado
        );


        if (!resposta.ok) {

            mensagem.textContent =
                "Não foi possível carregar os jogos.";

            return;
        }


        listaJogos.innerHTML = "";


        if (
            !resultado.jogos ||
            resultado.jogos.length === 0
        ) {

            mensagem.textContent =
                "Nenhum jogo encontrado nesta categoria.";

            return;
        }


        mensagem.style.display = "none";


        resultado.jogos.forEach(
            (jogo, indice) => {

                console.log(
                    "Criando card:",
                    jogo.Game_Name
                );


                const card =
                    document.createElement("div");

                card.classList.add("cardJogo");

                card.style.animationDelay =
                    `${indice * 0.08}s`;


                const imagem =
                    document.createElement("img");

                imagem.src = jogo.img1;

                imagem.alt = jogo.Game_Name;


                const info =
                    document.createElement("div");

                info.classList.add("infoJogo");


                const nome =
                    document.createElement("h2");

                nome.textContent =
                    jogo.Game_Name;


                const preco =
                    document.createElement("p");

                preco.classList.add("preco");

                preco.textContent =
                    `R$ ${Number(jogo.preco)
                        .toFixed(2)
                        .replace(".", ",")}`;


                const desconto =
                    document.createElement("span");

                desconto.classList.add("desconto");

                desconto.textContent =
                    `-${jogo.desconto}%`;


                info.appendChild(nome);
                info.appendChild(preco);
                info.appendChild(desconto);


                card.appendChild(imagem);
                card.appendChild(info);


                card.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

                    }
                );


                listaJogos.appendChild(card);

            }
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar jogos:",
            erro
        );

        mensagem.textContent =
            "Erro ao conectar com o servidor.";

    }

}