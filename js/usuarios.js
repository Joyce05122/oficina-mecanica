let listaUsuarios = [];

const modalUsuario = document.getElementById("modalUsuario");
const formUsuario = document.getElementById("formUsuario");
const urlUsuarios = "php/usuarios.php";

function obterUsuarioAba() {
    try {
        const salvo = sessionStorage.getItem("motrix_usuario");
        return salvo ? JSON.parse(salvo) : null;
    } catch (e) {
        return null;
    }
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

async function carregarUsuarios() {
    const usuarioAba = obterUsuarioAba();
    const queryAdmin = usuarioAba && usuarioAba.id ? `&admin_id=${encodeURIComponent(usuarioAba.id)}` : "";

    try {
        const resposta = await fetch(`${urlUsuarios}?acao=listar${queryAdmin}`);
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.mensagem || "Erro ao carregar usuários.");
            return;
        }

        listaUsuarios = resultado.dados || [];
        atualizarIndicadores();
        renderizarTabela();
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar os usuários.");
    }
}

function atualizarIndicadores() {
    const total = listaUsuarios.length;
    const admins = listaUsuarios.filter(u => u.tipo === "Administrador").length;
    const mecanicos = listaUsuarios.filter(u => u.tipo === "Mecanico").length;

    document.getElementById("totalUsuarios").textContent = total;
    document.getElementById("totalAdmins").textContent = admins;
    document.getElementById("totalMecanicos").textContent = mecanicos;
    document.getElementById("totalAtivos").textContent = total;
}

function renderizarTabela() {
    const tbody = document.getElementById("tabelaUsuarios");
    const termo = document.getElementById("campoBuscaUsuario").value.toLowerCase().trim();
    const filtroPerfil = document.getElementById("filtroPerfil").value;

    const filtrados = listaUsuarios.filter(u => {
        const bateTexto =
            u.nome.toLowerCase().includes(termo) ||
            u.email.toLowerCase().includes(termo);
        const batePerfil = !filtroPerfil || u.tipo === filtroPerfil;
        return bateTexto && batePerfil;
    });

    tbody.innerHTML = "";

    if (filtrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="vazio">
                    Nenhum usuário encontrado.
                </td>
            </tr>
        `;
    } else {
        filtrados.forEach(u => {
            const labelPerfil = u.tipo === "Mecanico" ? "Mecânico" : "Administrador";

            tbody.innerHTML += `
                <tr>
                    <td><strong>${escaparHTML(u.nome)}</strong></td>
                    <td>${escaparHTML(u.email)}</td>
                    <td>${labelPerfil}</td>
                    <td><span class="status ativo">Ativo</span></td>
                    <td>#${u.id}</td>
                    <td>
                        <div class="acoes">
                            <button type="button" class="botao-editar" onclick="editarUsuario(${u.id})">
                                Editar
                            </button>
                            <button type="button" class="botao-excluir" onclick="excluirUsuario(${u.id})">
                                Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    document.getElementById("informacaoPagina").textContent =
        `Mostrando ${filtrados.length} de ${listaUsuarios.length} usuários cadastrados`;
}

function abrirModal() {
    formUsuario.reset();
    document.getElementById("idUsuario").value = "";
    document.getElementById("senha").required = true;
    document.getElementById("senha").placeholder = "Digite a senha";
    document.getElementById("tituloModal").textContent = "Novo Usuário";
    modalUsuario.classList.add("aberto");
}

function fecharModal() {
    modalUsuario.classList.remove("aberto");
}

function editarUsuario(id) {
    const usuario = listaUsuarios.find(u => Number(u.id) === Number(id));
    if (!usuario) return;

    document.getElementById("idUsuario").value = usuario.id;
    document.getElementById("nome").value = usuario.nome;
    document.getElementById("email").value = usuario.email;
    document.getElementById("senha").value = "";
    document.getElementById("senha").required = false;
    document.getElementById("senha").placeholder = "Deixe em branco para manter a senha atual";
    document.getElementById("perfil").value = usuario.tipo;

    document.getElementById("tituloModal").textContent = "Editar Usuário";
    modalUsuario.classList.add("aberto");
}

formUsuario.addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuarioAba = obterUsuarioAba();
    const dados = new FormData();
    if (usuarioAba && usuarioAba.id) {
        dados.append("admin_id", usuarioAba.id);
    }
    dados.append("id", document.getElementById("idUsuario").value);
    dados.append("nome", document.getElementById("nome").value.trim());
    dados.append("email", document.getElementById("email").value.trim());
    dados.append("senha", document.getElementById("senha").value);
    dados.append("perfil", document.getElementById("perfil").value);

    try {
        const resposta = await fetch(`${urlUsuarios}?acao=salvar`, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.mensagem || "Erro ao salvar usuário.");
            return;
        }

        alert(resultado.mensagem);
        fecharModal();
        await carregarUsuarios();
    } catch (erro) {
        console.error(erro);
        alert("Erro de comunicação ao salvar usuário.");
    }
});

async function excluirUsuario(id) {
    const usuarioAba = obterUsuarioAba();

    if (usuarioAba && Number(usuarioAba.id) === Number(id)) {
        alert("Você não pode excluir o próprio usuário logado nesta aba.");
        return;
    }

    if (!confirm("Deseja realmente excluir este usuário?")) return;

    const dados = new FormData();
    if (usuarioAba && usuarioAba.id) {
        dados.append("admin_id", usuarioAba.id);
    }
    dados.append("id", id);

    try {
        const resposta = await fetch(`${urlUsuarios}?acao=excluir`, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.mensagem || "Não foi possível excluir.");
            return;
        }

        alert(resultado.mensagem);
        await carregarUsuarios();
    } catch (erro) {
        console.error(erro);
        alert("Erro ao excluir usuário.");
    }
}

function limparFiltros() {
    document.getElementById("campoBuscaUsuario").value = "";
    document.getElementById("filtroPerfil").value = "";
    renderizarTabela();
}

document.getElementById("campoBuscaUsuario").addEventListener("input", renderizarTabela);
document.getElementById("filtroPerfil").addEventListener("change", renderizarTabela);

carregarUsuarios();