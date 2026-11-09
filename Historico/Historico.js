const listaHistorico = document.getElementById("listaHistorico");
const mensagemHistorico = document.getElementById("mensagemHistorico");

const paginaAnterior = document.getElementById("paginaAnterior");
const paginaProxima = document.getElementById("paginaProxima");
const informacaoPagina = document.getElementById("informacaoPagina");

let paginaAtual = 1;
let totalPaginas = 1;

const imagemPadrao = "../imagens/gato.jpeg";


/* ========================================
   FORMATAR DATA E HORÁRIO
======================================== */

function formatarData(data) {

    const dataAtividade = new Date(data);

    if (Number.isNaN(dataAtividade.getTime())) {
        return "Data indisponível";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(dataAtividade);
}


/* ========================================
   CRIAR ELEMENTO COM TEXTO SEGURO
======================================== */

function criarElemento(tag, classe, texto) {

    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
}


/* ========================================
   CRIAR IMAGEM
======================================== */

function criarImagem(src, classe, descricao) {

    const imagem = document.createElement("img");

    imagem.className = classe;
    imagem.alt = descricao;
    imagem.src = src || imagemPadrao;

    imagem.addEventListener("error", function () {

        const caminhoAlternativo = new URL(
            imagemPadrao,
            document.baseURI
        ).href;

        if (imagem.src !== caminhoAlternativo) {
            imagem.src = imagemPadrao;
        }

    });

    return imagem;
}


/* ========================================
   CRIAR CARTÃO DO HISTÓRICO
======================================== */

function criarCartaoHistorico(atividade) {

    const cartao = criarElemento("article", "cartaoHistorico");

    const ehCompra = atividade.tipo === "jogo_comprado";

    // Ícone visual.
    const icone = criarElemento(
        "div",
        ehCompra
            ? "iconeHistorico iconeCompra"
            : "iconeHistorico iconeWishlist",
        ehCompra ? "🛒" : "♥"
    );

    icone.setAttribute("aria-hidden", "true");

    cartao.appendChild(icone);

    // Conteúdo principal.
    const conteudo = criarElemento("div", "conteudoHistorico");

    const texto = criarElemento(
        "p",
        "textoHistorico",
        ehCompra
            ? "Você comprou um jogo."
            : "Você adicionou um jogo à sua lista de desejos."
    );

    conteudo.appendChild(texto);

    // Data da atividade.
    const data = criarElemento(
        "time",
        "dataHistorico",
        formatarData(atividade.data_atividade)
    );

    data.dateTime = atividade.data_atividade;

    conteudo.appendChild(data);

    // Informações do jogo.
    const jogo = criarElemento("div", "jogoHistorico");

    const imagemJogo = criarImagem(
        atividade.img1,
        "imagemJogoHistorico",
        atividade.Game_Name || "Imagem do jogo"
    );

    jogo.appendChild(imagemJogo);

    const informacoesJogo = criarElemento(
        "div",
        "informacoesJogoHistorico"
    );

    const nomeJogo = criarElemento(
        "h2",
        "nomeJogoHistorico",
        atividade.Game_Name || "Jogo sem nome"
    );

    informacoesJogo.appendChild(nomeJogo);

    const etiqueta = criarElemento(
        "span",
        ehCompra
            ? "etiquetaHistorico etiquetaCompra"
            : "etiquetaHistorico etiquetaWishlist",
        ehCompra ? "Jogo comprado" : "Lista de desejos"
    );

    informacoesJogo.appendChild(etiqueta);

    jogo.appendChild(informacoesJogo);
    conteudo.appendChild(jogo);
    cartao.appendChild(conteudo);

    return cartao;
}


/* ========================================
   ATUALIZAR PAGINAÇÃO
======================================== */

function atualizarPaginacao(paginacao) {

    paginaAtual = paginacao.pagina;
    totalPaginas = Math.max(1, paginacao.totalPaginas);

    informacaoPagina.textContent =
        `Página ${paginaAtual} de ${totalPaginas}`;

    paginaAnterior.disabled = paginaAtual <= 1;
    paginaProxima.disabled = paginaAtual >= totalPaginas;
}


/* ========================================
   BUSCAR HISTÓRICO DO USUÁRIO
======================================== */

async function carregarHistorico(pagina = 1) {

    mensagemHistorico.textContent = "Carregando seu histórico...";
    mensagemHistorico.hidden = false;

    listaHistorico.replaceChildren();

    paginaAnterior.disabled = true;
    paginaProxima.disabled = true;

    try {

        const resposta = await fetch(
            `/atividades/minhas?pagina=${pagina}`,
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const dados = await resposta.json();

        if (resposta.status === 401) {

            mensagemHistorico.textContent =
                "Você precisa entrar na sua conta para consultar seu histórico.";

            informacaoPagina.textContent = "Página 1 de 1";

            return;
        }

        if (!resposta.ok) {

            throw new Error(
                dados.erro || "Não foi possível carregar seu histórico."
            );
        }

        atualizarPaginacao(dados.paginacao);

        if (!dados.atividades || dados.atividades.length === 0) {

            mensagemHistorico.textContent =
                paginaAtual === 1
                    ? "Você ainda não possui atividades no histórico."
                    : "Não existem atividades nesta página.";

            return;
        }

        const fragmento = document.createDocumentFragment();

        dados.atividades.forEach(function (atividade) {

            fragmento.appendChild(
                criarCartaoHistorico(atividade)
            );

        });

        listaHistorico.appendChild(fragmento);

        mensagemHistorico.hidden = true;

    } catch (erro) {

        console.error("Erro ao carregar histórico:", erro);

        mensagemHistorico.textContent =
            erro.message || "Ocorreu um erro ao carregar seu histórico.";

    }
}


/* ========================================
   BOTÕES DE PAGINAÇÃO
======================================== */

paginaAnterior.addEventListener("click", function () {

    if (paginaAtual > 1) {
        carregarHistorico(paginaAtual - 1);
    }

});

paginaProxima.addEventListener("click", function () {

    if (paginaAtual < totalPaginas) {
        carregarHistorico(paginaAtual + 1);
    }

});


/* ========================================
   INICIALIZAÇÃO
======================================== */

carregarHistorico(1);