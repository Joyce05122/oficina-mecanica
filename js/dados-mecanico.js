const formMeusDados = document.getElementById("formMeusDados");

function obterUsuarioAba() {
    try {
        const salvo = sessionStorage.getItem("motrix_usuario");
        return salvo ? JSON.parse(salvo) : null;
    } catch (e) {
        return null;
    }
}

function obterIniciais(nome) {
    const partes = String(nome || "M").trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function atualizarExibicaoPerfil(usuario) {
    const iniciais = obterIniciais(usuario.nome);

    document.getElementById("avatarPerfilGrande").textContent = iniciais;
    document.getElementById("perfilNomeExibicao").textContent = usuario.nome;
    document.getElementById("perfilEmailExibicao").textContent = usuario.email;
    document.getElementById("perfilIdExibicao").textContent = `#${usuario.id}`;

    const avatarTopo = document.getElementById("avatarMecanico");
    const nomeTopo = document.getElementById("nomeUsuarioLogado");
    if (avatarTopo) avatarTopo.textContent = iniciais;
    if (nomeTopo) nomeTopo.textContent = usuario.nome;
}

async function carregarMeusDados() {
    const usuarioAba = obterUsuarioAba();
    const queryId = usuarioAba && usuarioAba.id ? `&usuario_id=${encodeURIComponent(usuarioAba.id)}` : "";

    try {
        const resposta = await fetch(`php/dados-mecanico.php?acao=buscar${queryId}`);
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.mensagem || "Não foi possível carregar seus dados.");
            return;
        }

        const usuario = resultado.usuario;
        document.getElementById("nome").value = usuario.nome || "";
        document.getElementById("email").value = usuario.email || "";
        atualizarExibicaoPerfil(usuario);
    } catch (erro) {
        console.error(erro);
        alert("Erro ao conectar com o servidor.");
    }
}

formMeusDados.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (novaSenha || confirmarSenha) {
        if (novaSenha !== confirmarSenha) {
            alert("A confirmação da senha não confere.");
            return;
        }
    }

    const usuarioAba = obterUsuarioAba();

    const dados = new FormData();
    if (usuarioAba && usuarioAba.id) {
        dados.append("usuario_id", usuarioAba.id);
    }
    dados.append("nome", nome);
    dados.append("email", email);
    dados.append("nova_senha", novaSenha);

    try {
        const resposta = await fetch("php/dados-mecanico.php?acao=salvar", {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.mensagem || "Não foi possível salvar os dados.");
            return;
        }

        alert(resultado.mensagem || "Dados atualizados com sucesso!");
        document.getElementById("novaSenha").value = "";
        document.getElementById("confirmarSenha").value = "";

        if (resultado.usuario) {
            sessionStorage.setItem("motrix_usuario", JSON.stringify({
                id: resultado.usuario.id,
                nome: resultado.usuario.nome,
                tipo: "Mecanico"
            }));
            atualizarExibicaoPerfil(resultado.usuario);
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro ao salvar suas alterações.");
    }
});

carregarMeusDados();