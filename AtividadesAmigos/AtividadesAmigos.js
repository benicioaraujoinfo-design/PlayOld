
/* ========================================
   ELEMENTOS DA PÁGINA
======================================== */

const listaAtividades = document.getElementById("listaAtividades");
const mensagemFeed = document.getElementById("mensagemFeed");

const paginaAnterior = document.getElementById("paginaAnterior");
const paginaProxima = document.getElementById("paginaProxima");
const informacaoPagina = document.getElementById("informacaoPagina");

let paginaAtual = 1;
let totalPaginas = 1;


/* ========================================
   IMAGEM ALTERNATIVA
======================================== */

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

function criarImagem(src, classe, descricao, imagemAlternativa) {

    const imagem = document.createElement("img");

    imagem.className = classe;
    imagem.alt = descricao;
    imagem.src = src || imagemAlternativa;

    imagem.addEventListener("error", function () {

        if (imagem.src !== new URL(imagemAlternativa, document.baseURI).href) {
            imagem.src = imagemAlternativa;
        }

    });

    return imagem;
}


/* ========================================
   MONTAR CARTÃO DE ATIVIDADE
======================================== */

function criarCartaoAtividade(atividade) {

    const cartao = criarElemento("article", "cartaoAtividade");

    // Foto do amigo.
    const fotoAmigo = criarImagem(
        atividade.foto_perfil,
        "fotoAmigo",
        "Foto de " + atividade.UsrName,
        imagemPadrao
    );

    cartao.appendChild(fotoAmigo);

    // Conteúdo textual.
    const conteudo = criarElemento("div", "conteudoAtividade");

    const texto = criarElemento("p", "textoAtividade");

    const nomeAmigo = criarElemento(
        "span",
        "nomeAmigo",
        atividade.UsrName || "Usuário"
    );

    texto.appendChild(nomeAmigo);
    texto.appendChild(document.createTextNode(" "));

    // Define a frase conforme o tipo de atividade.
    let descricaoAtividade;

    if (atividade.tipo === "jogo_comprado") {

        descricaoAtividade = "comprou um jogo";

    } else if (atividade.tipo === "wishlist_adicionado") {

        descricaoAtividade = "adicionou um jogo à lista de desejos";

    } else {

        descricaoAtividade = "realizou uma atividade";

    }

    texto.appendChild(document.createTextNode(descricaoAtividade + "."));

    conteudo.appendChild(texto);

    // Data da atividade.
    const data = criarElemento(
        "time",
        "dataAtividade",
        formatarData(atividade.data_atividade)
    );

    data.dateTime = atividade.data_atividade;

    conteudo.appendChild(data);

    // Cartão com as informações do jogo.
    const jogo = criarElemento("div", "jogoAtividade");

    const imagemJogo = criarImagem(
        atividade.img1,
        "imagemJogo",
        atividade.Game_Name || "Imagem do jogo",
        imagemPadrao
    );

    jogo.appendChild(imagemJogo);

    const informacoesJogo = criarElemento("div", "informacoesJogo");

    const nomeJogo = criarElemento(
        "h2",
        "nomeJogo",
        atividade.Game_Name || "Jogo sem nome"
    );

    informacoesJogo.appendChild(nomeJogo);

    // Etiqueta visual do tipo de atividade.
    let textoTipo;
    let classeTipo;

    if (atividade.tipo === "jogo_comprado") {

        textoTipo = "Jogo comprado";
        classeTipo = "tipoAtividade tipoCompra";

    } else {

        textoTipo = "Lista de desejos";
        classeTipo = "tipoAtividade tipoWishlist";

    }

    const etiqueta = criarElemento(
        "span",
        classeTipo,
        textoTipo
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
   BUSCAR ATIVIDADES DOS AMIGOS
======================================== */

async function carregarAtividades(pagina = 1) {

    // Mostra o estado de carregamento.
    mensagemFeed.textContent = "Carregando atividades...";
    mensagemFeed.hidden = false;

    listaAtividades.replaceChildren();

    paginaAnterior.disabled = true;
    paginaProxima.disabled = true;

    try {

        const resposta = await fetch(
            `/atividades/amigos?pagina=${pagina}`,
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const dados = await resposta.json();

        // Verifica se o usuário está conectado.
        if (resposta.status === 401) {

            mensagemFeed.textContent =
                "Você precisa entrar na sua conta para ver as atividades dos amigos.";

            informacaoPagina.textContent = "Página 1 de 1";

            return;
        }

        // Verifica se o servidor retornou algum erro.
        if (!resposta.ok) {

            throw new Error(
                dados.erro || "Não foi possível carregar as atividades."
            );
        }

        // Atualiza os números da paginação.
        atualizarPaginacao(dados.paginacao);

        // Exibe uma mensagem caso não existam atividades.
        if (!dados.atividades || dados.atividades.length === 0) {

            mensagemFeed.textContent =
                paginaAtual === 1
                    ? "Ainda não há atividades dos seus amigos para mostrar."
                    : "Não existem atividades nesta página.";

            return;
        }

        // Monta os cartões das atividades recebidas.
        const fragmento = document.createDocumentFragment();

        dados.atividades.forEach(function (atividade) {

            const cartao = criarCartaoAtividade(atividade);

            fragmento.appendChild(cartao);

        });

        listaAtividades.appendChild(fragmento);

        mensagemFeed.hidden = true;

    } catch (erro) {

        console.error("Erro ao carregar atividades:", erro);

        mensagemFeed.textContent =
            erro.message || "Ocorreu um erro ao carregar as atividades.";

    }
}


/* ========================================
   BOTÕES DE PAGINAÇÃO
======================================== */

paginaAnterior.addEventListener("click", function () {

    if (paginaAtual > 1) {
        carregarAtividades(paginaAtual - 1);
    }

});

paginaProxima.addEventListener("click", function () {

    if (paginaAtual < totalPaginas) {
        carregarAtividades(paginaAtual + 1);
    }

});


/* ========================================
   INICIALIZAÇÃO
======================================== */

carregarAtividades(1);
