async function verificarAcessoAdmin() {
    const salvo = sessionStorage.getItem("motrix_usuario");
    let usuarioAba = null;

    if (salvo) {
        try {
            usuarioAba = JSON.parse(salvo);
        } catch (e) {
            usuarioAba = null;
        }
    }

    if (usuarioAba) {
        if (usuarioAba.tipo !== "Administrador") {
            window.location.href = "inicial-mecanico.html";
            return;
        }
        preencherTopoAdmin(usuarioAba.nome);
        return;
    }

    try {
        const resposta = await fetch("php/sessao.php");
        if (!resposta.ok) {
            window.location.href = "login.html";
            return;
        }

        const sessao = await resposta.json();

        if (!sessao.autenticado) {
            window.location.href = "login.html";
            return;
        }

        if (sessao.tipo !== "Administrador") {
            window.location.href = "inicial-mecanico.html";
            return;
        }

        sessionStorage.setItem("motrix_usuario", JSON.stringify({
            id: sessao.id,
            nome: sessao.nome,
            tipo: sessao.tipo
        }));

        preencherTopoAdmin(sessao.nome);
    } catch (erro) {
        window.location.href = "login.html";
    }
}

function preencherTopoAdmin(nome) {
    if (!nome) return;

    const elNome = document.getElementById("nomeUsuarioLogado");
    if (elNome) elNome.textContent = nome;

    const elSaudacao = document.getElementById("saudacaoAdmin");
    if (elSaudacao) elSaudacao.textContent = `Olá, ${nome}!`;

    const elAvatar = document.getElementById("avatarAdmin");
    if (elAvatar) {
        const iniciais = nome
            .trim()
            .split(" ")
            .slice(0, 2)
            .map(p => p[0]?.toUpperCase() || "")
            .join("");
        elAvatar.textContent = iniciais || "A";
    }
}

document.addEventListener("click", function (evento) {
    const linkSair = evento.target.closest(".botao-sair");
    if (linkSair) {
        sessionStorage.removeItem("motrix_usuario");
    }
});

verificarAcessoAdmin();