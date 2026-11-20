const formLogin = document.getElementById("formLogin");

if (formLogin) {
    formLogin.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const dados = new FormData(formLogin);

        try {
            const resposta = await fetch("php/login.php", {
                method: "POST",
                body: dados
            });

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                alert(resultado.mensagem || "Erro ao realizar login.");
                return;
            }

            sessionStorage.setItem("motrix_usuario", JSON.stringify(resultado.usuario));
            window.location.href = resultado.destino;
        } catch (erro) {
            alert("Erro de comunicação com o servidor.");
        }
    });
}