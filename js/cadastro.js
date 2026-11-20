const formCadastro = document.getElementById("formCadastro");

if (formCadastro) {
    formCadastro.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const dados = new FormData(formCadastro);

        try {
            const resposta = await fetch("php/cadastro.php", {
                method: "POST",
                body: dados
            });

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                alert(resultado.mensagem || "Não foi possível realizar o cadastro.");
                return;
            }

            alert(resultado.mensagem);
            window.location.href = "login.html";
        } catch (erro) {
            alert("Erro de comunicação com o servidor.");
        }
    });
}