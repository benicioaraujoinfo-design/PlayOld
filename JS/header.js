//
// PESQUISA DE JOGOS
//

const barraPesquisa =
    document.querySelector("#barraPesquisa");

const resultadosPesquisa =
    document.querySelector("#resultadosPesquisa");


barraPesquisa.addEventListener("input", async () => {

    const termo =
        barraPesquisa.value.trim();

    resultadosPesquisa.innerHTML = "";

    if (termo === "") {

        resultadosPesquisa.style.display = "none";

        return;
    }

    try {

        const resposta =
            await fetch(
                `/buscar-jogos?nome=${encodeURIComponent(termo)}`
            );

        const resultado =
            await resposta.json();

        if (!resposta.ok) {

            console.error(resultado.erro);

            return;
        }

        resultadosPesquisa.style.display = "block";


        resultado.jogos.forEach(jogo => {

            const resultadoJogo =
                document.createElement("div");

            resultadoJogo.classList.add(
                "resultadoPesquisa"
            );


            const imagem =
                document.createElement("img");

            imagem.src =
                jogo.img1;


            const nome =
                document.createElement("span");

            nome.textContent =
                jogo.Game_Name;


            resultadoJogo.appendChild(imagem);

            resultadoJogo.appendChild(nome);


            resultadoJogo.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `../PGJogo/PGJogo.html?id=${jogo.IDgme}`;

                }
            );


            resultadosPesquisa.appendChild(
                resultadoJogo
            );

        });

    } catch (erro) {

        console.error(
            "Erro ao pesquisar jogos:",
            erro
        );

    }

});

//
// USUÁRIO LOGADO
//

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

//
// MENU DO USUÁRIO
//

const botaoUsuario =
    document.querySelector("#botaoUsuario");

const menuUsuario =
    document.querySelector("#menuUsuario");

const botaoLogout =
    document.querySelector("#botaoLogout");


botaoUsuario.addEventListener("click", () => {

    menuUsuario.classList.toggle("aberto");

});


botaoLogout.addEventListener(
    "click",
    async () => {

        try {

            const resposta =
                await fetch("/logout", {
                    method: "POST"
                });

            const resultado =
                await resposta.json();

            if (!resposta.ok) {

                alert(resultado.erro);

                return;
            }

            window.location.href =
                "../Login/Login.html";

        } catch (erro) {

            console.error(erro);

            alert("Erro ao realizar logout.");

        }

    }
);