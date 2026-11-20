let agendamentosMecanico = [];

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

function formatarData(data) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

async function carregarAgendaMecanico() {
    const usuarioAba = obterUsuarioAba();
    const query = usuarioAba && usuarioAba.id ? `?mecanico_id=${encodeURIComponent(usuarioAba.id)}` : "";

    try {
        const resposta = await fetch(`php/ordens-mecanico.php${query}`);
        if (!resposta.ok) throw new Error("Erro ao carregar agenda.");

        const dados = await resposta.json();
        agendamentosMecanico = Array.isArray(dados) ? dados : [];
        renderizarAgenda();
    } catch (erro) {
        console.error(erro);
        document.getElementById("mensagemAgenda").textContent =
            "Erro ao carregar os agendamentos do banco de dados.";
    }
}

function renderizarAgenda() {
    const tbody = document.getElementById("tabelaAgenda");
    const msg = document.getElementById("mensagemAgenda");
    const filtroData = document.getElementById("filtroData").value;

    const filtrados = agendamentosMecanico.filter(item =>
        !filtroData || item.data === filtroData
    );

    tbody.innerHTML = "";

    if (filtrados.length === 0) {
        msg.textContent = "Nenhum agendamento encontrado.";
        return;
    }

    msg.textContent = "";

    filtrados.forEach(item => {
        const horaTexto = item.horario ? ` às ${escaparHTML(item.horario)}` : "";
        tbody.innerHTML += `
            <tr>
                <td><strong>${formatarData(item.data)}${horaTexto}</strong></td>
                <td>${escaparHTML(item.cliente)}</td>
                <td>${escaparHTML(item.veiculo)}</td>
                <td>${escaparHTML(item.descricao)}</td>
                <td>${escaparHTML(item.status)}</td>
            </tr>
        `;
    });
}

function limparFiltro() {
    document.getElementById("filtroData").value = "";
    renderizarAgenda();
}

document.getElementById("filtroData").addEventListener("change", renderizarAgenda);

carregarAgendaMecanico();