const formulario = document.querySelector("#formLogin");

formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const identificador = document.querySelector("#nome").value.trim();
	const senha = document.querySelector("#senha").value;

	console.log("Identificador enviado:", JSON.stringify(identificador));

    try {

        const resposta = await fetch("/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                identificador,
                senha
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            alert(resultado.erro);
            return;
        }

        alert(resultado.mensagem);

        window.location.href = "../Home/Home.html";

    } catch (erro) {

        console.error(erro);

        alert("Não foi possível conectar ao servidor.");

    }

});