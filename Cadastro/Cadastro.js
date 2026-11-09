const formulario = document.querySelector("form");
const arquivo = document.querySelector("#arquivo");
const imagem = document.querySelector("#img");

arquivo.addEventListener("change", () => {

    const foto = arquivo.files[0];

    if (foto) {
        imagem.src = URL.createObjectURL(foto);
    }

});

formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const UsrName = document.querySelector("#nome").value;
    const Email = document.querySelector("#email").value;
    const DataNas = document.querySelector("#data").value;
    const pais = document.querySelector("#pais").value;
    const senha = document.querySelector("#senha").value;
    
    const dados = new FormData();

	dados.append("UsrName", UsrName);
	dados.append("Email", Email);
	dados.append("DataNas", DataNas);
	dados.append("pais", pais);
	dados.append("senha", senha);

	if (arquivo.files[0]) {
		dados.append("foto", arquivo.files[0]);
	}

    try {

        const resposta = await fetch("/cadastro", {
			method: "POST",
			body: dados
		});

        const resultado = await resposta.json();

        if (!resposta.ok) {
			alert(resultado.erro);
			return;
		}

		alert(resultado.mensagem);

		window.location.href = "../Login/Login.html";

    } catch (erro) {

        console.error(erro);

        alert("Não foi possível conectar ao servidor.");

    }

});