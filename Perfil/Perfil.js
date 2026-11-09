const arquivo = document.querySelector("#arquivo");
const imagem = document.querySelector("#img");

const fundoEditorFoto =
    document.querySelector("#fundoEditorFoto");

const editorFotoModal =
    document.querySelector("#editorFotoModal");

const fecharEditorFotoBotao =
    document.querySelector("#fecharEditorFoto");

const cancelarEditorFotoBotao =
    document.querySelector("#cancelarEditorFoto");

const salvarEditorFotoBotao =
    document.querySelector("#salvarEditorFoto");

const redefinirEditorFotoBotao =
    document.querySelector("#redefinirEditorFoto");

const areaRecorteFoto =
    document.querySelector("#areaRecorteFoto");

const imagemEditorFoto =
    document.querySelector("#imagemEditorFoto");

const zoomEditorFoto =
    document.querySelector("#zoomEditorFoto");

const mensagemEditorFoto =
    document.querySelector("#mensagemEditorFoto");

let urlTemporariaFoto = null;
let salvandoFoto = false;

let escalaBaseFoto = 1;
let zoomAtualFoto = 1;

let larguraImagemFoto = 0;
let alturaImagemFoto = 0;

let posicaoXFoto = 0;
let posicaoYFoto = 0;

let arrastandoFoto = false;
let inicioArrastoXFoto = 0;
let inicioArrastoYFoto = 0;
let posicaoInicialXFoto = 0;
let posicaoInicialYFoto = 0;

let larguraAreaFoto = 0;
let alturaAreaFoto = 0;

arquivo.addEventListener("change", () => {
    const foto = arquivo.files[0];

    if (!foto) return;

    if (!foto.type.startsWith("image/")) {
        alert("Selecione um arquivo de imagem válido.");
        arquivo.value = "";
        return;
    }
    
    if (foto.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5 MB.");
        arquivo.value = "";
        return;
    }

    if (urlTemporariaFoto) {
        URL.revokeObjectURL(urlTemporariaFoto);
        urlTemporariaFoto = null;
    }

    urlTemporariaFoto = URL.createObjectURL(foto);

    mensagemEditorFoto.textContent = "";
    zoomEditorFoto.value = "1";

    imagemEditorFoto.onload = () => {
        if (!fundoEditorFoto.classList.contains("aberto")) {
            fundoEditorFoto.classList.add("aberto");
            fundoEditorFoto.setAttribute("aria-hidden", "false");

            document.body.style.overflow = "hidden";
        }

        redefinirEnquadramentoFoto();
    };

    imagemEditorFoto.onerror = () => {
        mensagemEditorFoto.textContent =
            "Não foi possível abrir essa imagem.";

        if (urlTemporariaFoto) {
            URL.revokeObjectURL(urlTemporariaFoto);
            urlTemporariaFoto = null;
        }

        imagemEditorFoto.removeAttribute("src");
        arquivo.value = "";
    };

    imagemEditorFoto.src = urlTemporariaFoto;
});

function limitarPosicaoFoto() {
    const larguraArea =
        areaRecorteFoto.clientWidth;

    const alturaArea =
        areaRecorteFoto.clientHeight;

    const tamanhoRecorte =
        Math.min(larguraArea, alturaArea) * 0.78;

    const esquerdaRecorte =
        (larguraArea - tamanhoRecorte) / 2;

    const topoRecorte =
        (alturaArea - tamanhoRecorte) / 2;

    const minimoX =
        esquerdaRecorte + tamanhoRecorte -
        larguraImagemFoto;

    const maximoX = esquerdaRecorte;

    const minimoY =
        topoRecorte + tamanhoRecorte -
        alturaImagemFoto;

    const maximoY = topoRecorte;

    posicaoXFoto = Math.min(
        maximoX,
        Math.max(minimoX, posicaoXFoto)
    );

    posicaoYFoto = Math.min(
        maximoY,
        Math.max(minimoY, posicaoYFoto)
    );
}

function atualizarImagemEditorFoto() {
    limitarPosicaoFoto();

    imagemEditorFoto.style.width =
        `${larguraImagemFoto}px`;

    imagemEditorFoto.style.height =
        `${alturaImagemFoto}px`;

    imagemEditorFoto.style.left =
        `${posicaoXFoto}px`;

    imagemEditorFoto.style.top =
        `${posicaoYFoto}px`;
}

function redefinirEnquadramentoFoto() {
    if (!imagemEditorFoto.naturalWidth) return;

    const area =
        areaRecorteFoto.getBoundingClientRect();

    larguraAreaFoto = area.width;
    alturaAreaFoto = area.height;

    escalaBaseFoto = Math.max(
        larguraAreaFoto / imagemEditorFoto.naturalWidth,
        alturaAreaFoto / imagemEditorFoto.naturalHeight
    );

    zoomAtualFoto = 1;

    zoomEditorFoto.value = "1";

    larguraImagemFoto =
        imagemEditorFoto.naturalWidth * escalaBaseFoto;

    alturaImagemFoto =
        imagemEditorFoto.naturalHeight * escalaBaseFoto;

    posicaoXFoto =
        (larguraAreaFoto - larguraImagemFoto) / 2;

    posicaoYFoto =
        (alturaAreaFoto - alturaImagemFoto) / 2;

    atualizarImagemEditorFoto();
}

redefinirEditorFotoBotao.addEventListener(
    "click",
    redefinirEnquadramentoFoto
);

zoomEditorFoto.addEventListener("input", () => {
    if (!imagemEditorFoto.naturalWidth) return;

    const centroX =
        posicaoXFoto + larguraImagemFoto / 2;

    const centroY =
        posicaoYFoto + alturaImagemFoto / 2;

    zoomAtualFoto = Number(zoomEditorFoto.value);

    larguraImagemFoto =
        imagemEditorFoto.naturalWidth *
        escalaBaseFoto *
        zoomAtualFoto;

    alturaImagemFoto =
        imagemEditorFoto.naturalHeight *
        escalaBaseFoto *
        zoomAtualFoto;

    posicaoXFoto =
        centroX - larguraImagemFoto / 2;

    posicaoYFoto =
        centroY - alturaImagemFoto / 2;

    atualizarImagemEditorFoto();
});

areaRecorteFoto.addEventListener(
    "pointerdown",
    (evento) => {
        if (
            salvandoFoto ||
            !imagemEditorFoto.naturalWidth ||
            evento.button > 0
        ) {
            return;
        }

        arrastandoFoto = true;

        inicioArrastoXFoto = evento.clientX;
        inicioArrastoYFoto = evento.clientY;

        posicaoInicialXFoto = posicaoXFoto;
        posicaoInicialYFoto = posicaoYFoto;

        areaRecorteFoto.setPointerCapture(
            evento.pointerId
        );
    }
);

areaRecorteFoto.addEventListener(
    "pointermove",
    (evento) => {
        if (!arrastandoFoto) return;

        posicaoXFoto =
            posicaoInicialXFoto +
            evento.clientX - inicioArrastoXFoto;

        posicaoYFoto =
            posicaoInicialYFoto +
            evento.clientY - inicioArrastoYFoto;

        atualizarImagemEditorFoto();
    }
);

function pararArrastoFoto() {
    arrastandoFoto = false;
}

areaRecorteFoto.addEventListener(
    "pointerup",
    pararArrastoFoto
);

areaRecorteFoto.addEventListener(
    "pointercancel",
    pararArrastoFoto
);

function fecharEditorFoto() {
    if (salvandoFoto) return;

    fundoEditorFoto.classList.remove("aberto");

    fundoEditorFoto.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    arrastandoFoto = false;

    imagemEditorFoto.onload = null;
    imagemEditorFoto.onerror = null;

    imagemEditorFoto.removeAttribute("src");

    if (urlTemporariaFoto) {
        URL.revokeObjectURL(urlTemporariaFoto);
        urlTemporariaFoto = null;
    }

    arquivo.value = "";

    zoomEditorFoto.value = "1";

    mensagemEditorFoto.textContent = "";
}

fecharEditorFotoBotao.addEventListener(
    "click",
    fecharEditorFoto
);

cancelarEditorFotoBotao.addEventListener(
    "click",
    fecharEditorFoto
);

fundoEditorFoto.addEventListener(
    "click",
    (evento) => {
        if (evento.target === fundoEditorFoto) {
            fecharEditorFoto();
        }
    }
);

editorFotoModal.addEventListener(
    "click",
    (evento) => {
        evento.stopPropagation();
    }
);

document.addEventListener("keydown", (evento) => {
    if (
        evento.key === "Escape" &&
        fundoEditorFoto.classList.contains("aberto")
    ) {
        fecharEditorFoto();
    }
});

function gerarRecorteFoto() {
    return new Promise((resolve, reject) => {
        try {
            const tamanhoArea =
                areaRecorteFoto.clientWidth;

            const tamanhoRecorte =
                tamanhoArea * 0.78;

            const esquerdaRecorte =
                (tamanhoArea - tamanhoRecorte) / 2;

            const topoRecorte =
                (areaRecorteFoto.clientHeight -
                 tamanhoRecorte) / 2;

            const escalaPixels =
                imagemEditorFoto.naturalWidth /
                larguraImagemFoto;

            const origemX =
                (esquerdaRecorte - posicaoXFoto) *
                escalaPixels;

            const origemY =
                (topoRecorte - posicaoYFoto) *
                escalaPixels;

            const tamanhoFonte =
                tamanhoRecorte * escalaPixels;

            const canvas = document.createElement("canvas");

            canvas.width = 512;
            canvas.height = 512;

            const contexto = canvas.getContext("2d");

            if (!contexto) {
                reject(
                    new Error(
                        "Não foi possível processar a imagem."
                    )
                );

                return;
            }

            contexto.drawImage(
                imagemEditorFoto,
                origemX,
                origemY,
                tamanhoFonte,
                tamanhoFonte,
                0,
                0,
                canvas.width,
                canvas.height
            );

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(
                            new Error(
                                "Não foi possível gerar o recorte."
                            )
                        );

                        return;
                    }

                    resolve(blob);
                },
                "image/jpeg",
                0.92
            );

        } catch (erro) {
            reject(erro);
        }
    });
}

salvarEditorFotoBotao.addEventListener(
    "click",
    async () => {
        if (
            salvandoFoto ||
            !imagemEditorFoto.naturalWidth
        ) {
            return;
        }

        salvandoFoto = true;

        salvarEditorFotoBotao.disabled = true;
        cancelarEditorFotoBotao.disabled = true;
        fecharEditorFotoBotao.disabled = true;

        salvarEditorFotoBotao.textContent =
            "Salvando...";

        mensagemEditorFoto.textContent =
            "Processando e enviando a imagem...";

        try {
            const blob = await gerarRecorteFoto();

            const arquivoRecortado = new File(
                [blob],
                "foto-perfil.jpg",
                { type: "image/jpeg" }
            );

            const dados = new FormData();

            dados.append("foto", arquivoRecortado);

            const respostaUpload = await fetch(
                "/upload-foto",
                {
                    method: "POST",
                    body: dados
                }
            );

            const resultadoUpload =
                await respostaUpload.json();

            if (!respostaUpload.ok) {
                throw new Error(
                    resultadoUpload.erro ||
                    "Não foi possível enviar a imagem."
                );
            }

            const respostaBanco = await fetch(
                "/usuario/foto",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        url: resultadoUpload.url
                    })
                }
            );

            const resultadoBanco =
                await respostaBanco.json();

            if (!respostaBanco.ok) {
                throw new Error(
                    resultadoBanco.erro ||
                    "Não foi possível salvar a foto no perfil."
                );
            }

            imagem.src = resultadoUpload.url;

            if (usuarioAtual) {
                usuarioAtual.foto_perfil =
                    resultadoUpload.url;
            }

            salvandoFoto = false;

            fecharEditorFoto();

            alert(
                resultadoBanco.mensagem ||
                "Foto de perfil salva com sucesso!"
            );

        } catch (erro) {
            console.error(
                "Erro ao salvar a foto de perfil:",
                erro
            );

            mensagemEditorFoto.textContent =
                erro.message ||
                "Ocorreu um erro ao salvar a foto.";

        } finally {
            salvandoFoto = false;

            salvarEditorFotoBotao.disabled = false;
            cancelarEditorFotoBotao.disabled = false;
            fecharEditorFotoBotao.disabled = false;

            salvarEditorFotoBotao.textContent =
                "Salvar foto de perfil";
        }
    }
);

const nomeUsuarioPerfil =
    document.querySelector("#nomeUsuarioPerfil");

const descricaoPerfil =
    document.querySelector("#descricaoPerfil");

const painelPerfil =
    document.querySelector("#painelPerfil");

const fundoPainelPerfil =
    document.querySelector("#fundoPainelPerfil");

const botaoEditarPerfil =
    document.querySelector("#mudar");

const botaoFecharPerfil =
    document.querySelector("#fecharPainelPerfil");

const formEditarPerfil =
    document.querySelector("#formEditarPerfil");

const nomeEditarPerfil =
    document.querySelector("#nomeEditarPerfil");
    
const descricaoEditarPerfil =
    document.querySelector("#descricaoEditarPerfil");

const emailEditarPerfil =
    document.querySelector("#emailEditarPerfil");

const senhaEditarPerfil =
    document.querySelector("#senhaEditarPerfil");

const confirmarSenhaPerfil =
    document.querySelector("#confirmarSenhaPerfil");

const arquivoFundoPerfil =
    document.querySelector("#arquivoFundoPerfil");

const previewFundoPerfil =
    document.querySelector("#previewFundoPerfil");

const mensagemPerfil =
    document.querySelector("#mensagemPerfil");

const botaoSalvarPerfil =
    document.querySelector("#salvarPerfil");

const fundoPerfil = document.querySelector("#fundo");

let usuarioAtual = null;
let urlTemporariaFundo = null;

async function carregarUsuario() {

    try {

        const parametros = new URLSearchParams(
            window.location.search
        );

        const idPerfil = parametros.get("id");

        if (idPerfil !== null) {

            document.body.classList.remove("perfilProprio");
            document.body.classList.add("perfilVisitado");

            const resposta = await fetch(
                `/usuarios/${encodeURIComponent(idPerfil)}/perfil`
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro ||
                    "Não foi possível carregar este perfil."
                );
            }

            const usuario = resultado.usuario;

			nomeUsuarioPerfil.textContent =
				usuario.UsrName || "Usuário sem nome";

			imagem.src = usuario.foto_perfil ||
				"../imagens/gatinhoFeliz.jpg";

			descricaoPerfil.textContent =
				usuario.descricao || "Nenhuma descrição cadastrada.";	

            document.querySelector("#historico").style.display = "";

            await carregarJogosPerfil();
            await carregarAmigosPerfil();
			return;
        }

        document.body.classList.remove("perfilVisitado");
        document.body.classList.add("perfilProprio");

        const resposta = await fetch("/usuario");
const textoResposta = await resposta.text();

console.log("Status da rota /usuario:", resposta.status);
console.log("Resposta recebida de /usuario:", textoResposta);

let resultado;

try {
    resultado = JSON.parse(textoResposta);
} catch (erro) {
    throw new Error(
        "A rota /usuario não retornou JSON válido. " +
        "Confira o conteúdo mostrado no console."
    );
}

        if (!resposta.ok) {
            console.log("Usuário não está logado.");
            return;
        }

        const usuario = resultado.usuario;

        usuarioAtual = usuario;

        nomeUsuarioPerfil.textContent = usuario.UsrName;

        descricaoPerfil.textContent =
            usuario.descricao ||
            "Nenhuma descrição cadastrada.";

        imagem.src = usuario.foto_perfil ||
            "../imagens/gatinhoFeliz.jpg";

        if (usuario.fundo_perfil) {

            fundoPerfil.style.backgroundImage =
                `url("${usuario.fundo_perfil}")`;

            fundoPerfil.style.backgroundSize = "cover";
            fundoPerfil.style.backgroundPosition = "center";

        } else {

            fundoPerfil.style.backgroundImage = "";

        }

        console.log("Usuário carregado:", usuario);

    } catch (erro) {

        console.error("Erro ao carregar usuário:", erro);

        nomeUsuarioPerfil.textContent = "Perfil indisponível";
        descricaoPerfil.textContent = erro.message;

    }

}

function abrirPainelPerfil() {
    if (!usuarioAtual) {
        mensagemPerfil.textContent =
            "Não foi possível carregar os dados do perfil.";

        return;
    }

    nomeEditarPerfil.value = usuarioAtual.UsrName || "";
    emailEditarPerfil.value = usuarioAtual.Email || "";
    
    descricaoEditarPerfil.value =
		usuarioAtual.descricao || "";

    senhaEditarPerfil.value = "";
    confirmarSenhaPerfil.value = "";

    mensagemPerfil.textContent = "";

    if (usuarioAtual.fundo_perfil) {
        previewFundoPerfil.style.backgroundImage =
            `url("${usuarioAtual.fundo_perfil}")`;

        previewFundoPerfil.querySelector("span").textContent =
            "Fundo atual";
    } else {
        previewFundoPerfil.style.backgroundImage = "";

        previewFundoPerfil.querySelector("span").textContent =
            "Prévia do fundo";
    }

    arquivoFundoPerfil.value = "";

    painelPerfil.classList.add("aberto");
    fundoPainelPerfil.classList.add("aberto");

    document.body.style.overflow = "hidden";
}

function fecharPainelPerfil() {
    painelPerfil.classList.remove("aberto");
    fundoPainelPerfil.classList.remove("aberto");

    document.body.style.overflow = "";
}

botaoEditarPerfil.addEventListener("click", (evento) => {
    evento.preventDefault();
    abrirPainelPerfil();
});

botaoFecharPerfil.addEventListener(
    "click",
    fecharPainelPerfil
);

fundoPainelPerfil.addEventListener(
    "click",
    fecharPainelPerfil
);

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        fecharPainelPerfil();
    }
});

arquivoFundoPerfil.addEventListener("change", () => {
    const arquivoSelecionado =
        arquivoFundoPerfil.files[0];

    if (!arquivoSelecionado) return;

    if (!arquivoSelecionado.type.startsWith("image/")) {
        mensagemPerfil.textContent =
            "Selecione um arquivo de imagem válido.";

        arquivoFundoPerfil.value = "";
        return;
    }

    if (urlTemporariaFundo) {
        URL.revokeObjectURL(urlTemporariaFundo);
    }

    urlTemporariaFundo =
        URL.createObjectURL(arquivoSelecionado);

    previewFundoPerfil.style.backgroundImage =
        `url("${urlTemporariaFundo}")`;

    previewFundoPerfil.querySelector("span").textContent =
        "Pré-visualização da imagem";

    mensagemPerfil.textContent = "";
});

formEditarPerfil.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    mensagemPerfil.textContent = "";

    const nome = nomeEditarPerfil.value.trim();
    const email = emailEditarPerfil.value.trim();
    const descricao = descricaoEditarPerfil.value.trim();

    const senha = senhaEditarPerfil.value;
    const confirmarSenha = confirmarSenhaPerfil.value;

    if (!nome || !email) {
        mensagemPerfil.textContent =
            "Preencha o nome de usuário e o e-mail.";

        return;
    }

    if (
        senha !== confirmarSenha ||
        ((senha.length > 0) !==
         (confirmarSenha.length > 0))
    ) {
        mensagemPerfil.textContent =
            "As duas senhas devem estar preenchidas e ser iguais.";

        return;
    }

    botaoSalvarPerfil.disabled = true;
    botaoSalvarPerfil.textContent = "Salvando...";

    try {
        let urlFundo = null;

        const arquivoSelecionado =
            arquivoFundoPerfil.files[0];

        if (arquivoSelecionado) {
            const dadosImagem = new FormData();

            dadosImagem.append("fundo", arquivoSelecionado);

            const respostaImagem = await fetch(
                "/upload-fundo-perfil",
                {
                    method: "POST",
                    body: dadosImagem
                }
            );

            const resultadoImagem =
                await respostaImagem.json();

            if (!respostaImagem.ok) {
                throw new Error(
                    resultadoImagem.erro ||
                    "Não foi possível enviar a imagem de fundo."
                );
            }

            urlFundo = resultadoImagem.url;
        }

        
		const dadosPerfil = {
			UsrName: nome,
			Email: email,
			descricao: descricao,
			senha: senha,
			confirmarSenha: confirmarSenha
		};

        if (urlFundo) {
            dadosPerfil.fundo_perfil = urlFundo;
        }

        const resposta = await fetch("/usuario/editar", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dadosPerfil)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                "Não foi possível salvar as alterações."
            );
        }

        mensagemPerfil.textContent =
            resultado.mensagem ||
            "Perfil atualizado com sucesso!";

        await carregarUsuario();

        senhaEditarPerfil.value = "";
        confirmarSenhaPerfil.value = "";

        fecharPainelPerfil();

    } catch (erro) {
        console.error("Erro ao salvar perfil:", erro);

        mensagemPerfil.textContent = erro.message;

    } finally {
        botaoSalvarPerfil.disabled = false;
        botaoSalvarPerfil.textContent =
            "Salvar alterações";
    }
});

async function carregarAmigosPerfil() {
    const lista = document.querySelector("#listaAmigosPerfil");

    if (!lista) return;

    const parametros = new URLSearchParams(
        window.location.search
    );

    const idPerfil = parametros.get("id");

    const url = idPerfil !== null
        ? `/usuarios/${encodeURIComponent(idPerfil)}/amizades`
        : "/amizades";

    try {
        const resposta = await fetch(url);
        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível carregar os amigos."
            );
        }

        lista.replaceChildren();

        const amigos = resultado.amigos || [];

        if (amigos.length === 0) {
            lista.textContent = "Nenhum amigo encontrado.";
            return;
        }

        amigos.forEach((amigo) => {
            const cartao = document.createElement("div");
            cartao.classList.add("amigoPerfil");

            const foto = document.createElement("img");
            foto.src = amigo.foto_perfil ||
                "../imagens/gatinhoFeliz.jpg";
            foto.alt = `Foto de ${amigo.UsrName}`;

            const nome = document.createElement("span");
            nome.textContent = amigo.UsrName;

            cartao.append(foto, nome);

            cartao.addEventListener("click", () => {
                window.location.href =
                    `../Perfil/Perfil.html?id=${encodeURIComponent(amigo.IDusr)}`;
            });

            lista.appendChild(cartao);
        });

    } catch (erro) {
        console.error("Erro ao carregar amigos:", erro);
        lista.textContent = "Não foi possível carregar os amigos.";
    }
}

carregarUsuario();

const gradeJogosPerfil =
    document.querySelector("#gradeJogosPerfil");

const painelJogoPerfil =
    document.querySelector("#painelJogoPerfil");

const fundoPainelJogoPerfil =
    document.querySelector("#fundoPainelJogoPerfil");

const fecharPainelJogoPerfil =
    document.querySelector("#fecharPainelJogoPerfil");

const capaPainelJogoPerfil =
    document.querySelector("#capaPainelJogoPerfil");

const nomePainelJogoPerfil =
    document.querySelector("#nomePainelJogoPerfil");

const tempoPainelJogoPerfil =
    document.querySelector("#tempoPainelJogoPerfil");

const compraPainelJogoPerfil =
    document.querySelector("#compraPainelJogoPerfil");

const ultimaJogadaPainelJogoPerfil =
    document.querySelector("#ultimaJogadaPainelJogoPerfil");

const jogarPainelJogoPerfil =
    document.querySelector("#jogarPainelJogoPerfil");

const paginaPainelJogoPerfil =
    document.querySelector("#paginaPainelJogoPerfil");

let jogoSelecionadoPerfil = null;

async function carregarJogosPerfil() {
    try {
        const parametros = new URLSearchParams(
			window.location.search
		);

		const idPerfil = parametros.get("id");

		const urlBiblioteca = idPerfil !== null
			? `/usuarios/${encodeURIComponent(idPerfil)}/biblioteca`
			: "/biblioteca";

		const resposta = await fetch(urlBiblioteca);

        if (resposta.status === 401) {
            window.location.href = "../Login/Login.html";
            return;
        }

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível carregar os jogos."
            );
        }

        const jogos = resultado.jogos || [];

        gradeJogosPerfil.replaceChildren();

        if (jogos.length === 0) {
            gradeJogosPerfil.textContent =
                "Você ainda não possui jogos na biblioteca.";
            return;
        }

        jogos.forEach((jogo) => {
            const capa = document.createElement("img");

            capa.classList.add("capaJogoPerfil");

            capa.src = jogo.img1 || "../imagens/semImagem.png";
            capa.alt = jogo.Game_Name || "Capa de jogo";
            capa.title = jogo.Game_Name || "Jogo";

            capa.onerror = function () {
                this.onerror = null;
                this.src = "../imagens/semImagem.png";
            };

            capa.addEventListener("click", () => {
                abrirPainelJogoPerfil(jogo);
            });

            gradeJogosPerfil.appendChild(capa);
        });

    } catch (erro) {
        console.error("Erro ao carregar jogos do perfil:", erro);

        gradeJogosPerfil.textContent =
            "Não foi possível carregar seus jogos.";
    }
}

function abrirPainelJogoPerfil(jogo) {
    jogoSelecionadoPerfil = jogo;

    capaPainelJogoPerfil.src =
        jogo.img1 || "../imagens/semImagem.png";

    capaPainelJogoPerfil.onerror = function () {
        this.onerror = null;
        this.src = "../imagens/semImagem.png";
    };

    capaPainelJogoPerfil.alt =
        jogo.Game_Name || "Capa do jogo";

    nomePainelJogoPerfil.textContent =
        jogo.Game_Name || "Jogo sem nome";

    const tempo = Number(jogo.temp_jogo) || 0;

    tempoPainelJogoPerfil.textContent =
        tempo === 0
            ? "Ainda não jogado"
            : `${tempo.toFixed(1)} horas`;

    if (jogo.data_compra) {
        const dataCompra = new Date(jogo.data_compra);

        compraPainelJogoPerfil.textContent =
            Number.isNaN(dataCompra.getTime())
                ? "—"
                : dataCompra.toLocaleDateString("pt-BR");
    } else {
        compraPainelJogoPerfil.textContent = "—";
    }

    if (jogo.ultima_jogado) {
        const ultimaJogada = new Date(jogo.ultima_jogado);

        ultimaJogadaPainelJogoPerfil.textContent =
            Number.isNaN(ultimaJogada.getTime())
                ? "Nunca jogado"
                : ultimaJogada.toLocaleString("pt-BR");
    } else {
        ultimaJogadaPainelJogoPerfil.textContent =
            "Nunca jogado";
    }

    painelJogoPerfil.classList.add("aberto");
    fundoPainelJogoPerfil.classList.add("aberto");
}

function fecharDetalhesJogoPerfil() {
    painelJogoPerfil.classList.remove("aberto");
    fundoPainelJogoPerfil.classList.remove("aberto");

    jogoSelecionadoPerfil = null;
}

fecharPainelJogoPerfil.addEventListener(
    "click",
    fecharDetalhesJogoPerfil
);

fundoPainelJogoPerfil.addEventListener(
    "click",
    fecharDetalhesJogoPerfil
);

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        fecharDetalhesJogoPerfil();
    }
});

jogarPainelJogoPerfil.addEventListener("click", async () => {
    if (!jogoSelecionadoPerfil) return;

    const idJogo = jogoSelecionadoPerfil.IDgme;

    try {
        const resposta = await fetch(
            `/jogo/${idJogo}/jogado`,
            { method: "POST" }
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
            `../Jogar/Jogar.html?id=${idJogo}&origem=perfil`;

    } catch (erro) {
        console.error(
            "Erro ao registrar última vez jogado:",
            erro
        );
    }
});

paginaPainelJogoPerfil.addEventListener("click", () => {
    if (!jogoSelecionadoPerfil) return;

    window.location.href =
        `../PGJogo/PGJogo.html?id=${jogoSelecionadoPerfil.IDgme}`;
});


document.addEventListener("DOMContentLoaded", () => {

    const botaoSair = document.getElementById("botaoSair");

    if (!botaoSair) {
        console.error("Botão de logout não encontrado.");
        return;
    }

    botaoSair.addEventListener("click", async (evento) => {

        evento.preventDefault();

        try {

            const resposta = await fetch("/logout", {
                method: "POST"
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                alert(resultado.erro || "Não foi possível sair da conta.");
                return;
            }

            window.location.href = "../Login/Login.html";

        } catch (erro) {

            console.error("Erro ao realizar logout:", erro);

            alert("Erro ao realizar logout.");

        }

    });

});


document.addEventListener("DOMContentLoaded", () => {

    const botaoExcluir = document.getElementById("botaoExcluir");
    const dialogExcluir = document.getElementById("dialogExcluirConta");
    const formExcluir = document.getElementById("formExcluirConta");
    const senhaExcluir = document.getElementById("senhaExcluirConta");
    const botaoCancelar = document.getElementById("cancelarExcluirConta");

    if (!botaoExcluir || !dialogExcluir || !formExcluir) {
        console.error("Elementos de exclusão de conta não encontrados.");
        return;
    }

    botaoExcluir.addEventListener("click", () => {
        dialogExcluir.showModal();
    });

    botaoCancelar.addEventListener("click", () => {
        dialogExcluir.close();
        formExcluir.reset();
    });

    formExcluir.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        const senha = senhaExcluir.value;

        if (!senha) {
            alert("Digite sua senha atual.");
            return;
        }

        try {

            const resposta = await fetch("/usuario", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ senha })
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                alert(resultado.erro || "Não foi possível excluir a conta.");
                return;
            }

            alert(resultado.mensagem);

            window.location.href = "../Login/Login.html";

        } catch (erro) {

            console.error("Erro ao excluir conta:", erro);

            alert("Ocorreu um erro ao tentar excluir sua conta.");

        }

    });

});

const parametrosPerfil = new URLSearchParams(
    window.location.search
);

if (!parametrosPerfil.has("id")) {
    carregarJogosPerfil();
    carregarAmigosPerfil();
}