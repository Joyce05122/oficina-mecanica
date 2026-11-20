let ordens = [];

let paginaAtual = 1;
const itensPorPagina = 5;

const tabela = document.getElementById("tabelaOrdens");
const modal = document.getElementById("modalOrdem");

function obterUsuarioAba() {
    try {
        const salvo = sessionStorage.getItem("motrix_usuario");
        return salvo ? JSON.parse(salvo) : null;
    } catch (e) {
        return null;
    }
}

async function carregarOrdens() {
    const usuarioAba = obterUsuarioAba();
    const query = usuarioAba && usuarioAba.id ? `?mecanico_id=${encodeURIComponent(usuarioAba.id)}` : "";

    try {
        const resposta = await fetch(`php/ordens-mecanico.php${query}`);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar ordens.");
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error(dados.erro || "Resposta inválida do servidor.");
        }

        ordens = dados;

        paginaAtual = 1;
        renderizarOrdens();

    } catch (erro) {
        console.error(erro);

        tabela.innerHTML = `
            <tr>
                <td colspan="7" class="vazio">
                    Erro ao carregar as ordens de serviço.
                </td>
            </tr>
        `;
    }
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function formatarData(data) {
    if (!data) return "-";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
}

function classeStatus(status) {
    const classes = {
        "Aberta": "status-aberta",
        "Em andamento": "status-andamento",
        "Aguardando peças": "status-aguardando",
        "Concluída": "status-concluida",
        "Cancelada": "status-cancelada"
    };

    return classes[status] || "";
}

function obterMinhasOrdens() {
    return ordens;
}

function obterOrdensFiltradas() {
    const busca = document.getElementById("campoBusca")
        .value.trim().toLowerCase();

    const status = document.getElementById("filtroStatus").value;
    const campoData = document.getElementById("filtroData");
    const dataFiltro = campoData ? campoData.value : "";

    return obterMinhasOrdens().filter(ordem => {

        const correspondeBusca =
            String(ordem.id).includes(busca) ||
            String(ordem.cliente ?? "").toLowerCase().includes(busca) ||
            String(ordem.veiculo ?? "").toLowerCase().includes(busca);

        const correspondeStatus =
            !status || ordem.status === status;

        const correspondeData =
            !dataFiltro || ordem.data === dataFiltro;

        return correspondeBusca && correspondeStatus && correspondeData;
    });
}

function atualizarIndicadores() {
    const minhasOrdens = obterMinhasOrdens();

    document.getElementById("ordensPendentes").textContent =
        minhasOrdens.filter(ordem =>
            ["Aberta", "Aguardando peças"].includes(ordem.status)
        ).length;

    document.getElementById("ordensAndamento").textContent =
        minhasOrdens.filter(ordem => ordem.status === "Em andamento").length;

    document.getElementById("ordensConcluidas").textContent =
        minhasOrdens.filter(ordem => ordem.status === "Concluída").length;
}

function renderizarOrdens() {
    const filtradas = obterOrdensFiltradas();

    const totalPaginas = Math.max(
        1,
        Math.ceil(filtradas.length / itensPorPagina)
    );

    if (paginaAtual > totalPaginas) {
        paginaAtual = totalPaginas;
    }

    const inicio = (paginaAtual - 1) * itensPorPagina;

    const ordensPagina = filtradas.slice(
        inicio,
        inicio + itensPorPagina
    );

    tabela.innerHTML = "";

    if (ordensPagina.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="7" class="sem-resultados">
                    Nenhuma ordem de serviço encontrada.
                </td>
            </tr>
        `;
    } else {
        ordensPagina.forEach(ordem => {
            const dataHora = `${formatarData(ordem.data)}${ordem.horario ? " às " + escaparHTML(ordem.horario) : ""}`;

            tabela.innerHTML += `
                <tr>
                    <td>#${ordem.id}</td>
                    <td>${escaparHTML(ordem.cliente)}</td>
                    <td>${escaparHTML(ordem.veiculo)}</td>
                    <td>${dataHora}</td>
                    <td>${escaparHTML(ordem.descricao)}</td>
                    <td>
                        <span class="status ${classeStatus(ordem.status)}">
                            ${escaparHTML(ordem.status || "Sem status")}
                        </span>
                    </td>
                    <td>
                        <div class="acoes">
                            <button class="botao-detalhes"
                                onclick="abrirDetalhes(${ordem.id})">
                                Detalhes
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    const primeiroItem = filtradas.length ? inicio + 1 : 0;
    const ultimoItem = inicio + ordensPagina.length;

    document.getElementById("informacaoPagina").textContent =
        `Exibindo ${primeiroItem} a ${ultimoItem} de ${filtradas.length} ordens`;

    document.getElementById("numeroPagina").textContent =
        `${paginaAtual} de ${totalPaginas}`;

    document.getElementById("paginaAnterior").disabled =
        paginaAtual === 1;

    document.getElementById("proximaPagina").disabled =
        paginaAtual === totalPaginas;

    atualizarIndicadores();
}

function mudarPagina(direcao) {
    paginaAtual += direcao;
    renderizarOrdens();
}

function abrirDetalhes(id) {
    const ordem = ordens.find(item => Number(item.id) === Number(id));

    if (!ordem) return;

    const statusBloqueado = ordem.status === "Cancelada";
    const dataHora = `${formatarData(ordem.data)}${ordem.horario ? " às " + escaparHTML(ordem.horario) : ""}`;

    document.getElementById("detalhesOrdem").innerHTML = `
        <div class="detalhe-item">
            <strong>Número da ordem</strong>
            <span>#${ordem.id}</span>
        </div>

        <div class="detalhe-item">
            <strong>Cliente</strong>
            <span>${escaparHTML(ordem.cliente)}</span>
        </div>

        <div class="detalhe-item">
            <strong>Veículo</strong>
            <span>${escaparHTML(ordem.veiculo)}</span>
        </div>

        <div class="detalhe-item">
            <strong>Data e horário</strong>
            <span>${dataHora}</span>
        </div>

        <div class="detalhe-item">
            <strong>Descrição</strong>
            <span>${escaparHTML(ordem.descricao)}</span>
        </div>

        <div class="detalhe-item">
            <strong>Status atual</strong>
            <span>${escaparHTML(ordem.status || "Sem status")}</span>
        </div>

        ${!statusBloqueado ? `
            <div class="detalhe-item">
                <strong>Atualizar status</strong>

                <select id="novoStatus">
                    <option value="Aberta">Aberta</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Aguardando peças">Aguardando peças</option>
                    <option value="Concluída">Concluída</option>
                </select>
            </div>

            <button class="botao-atualizar"
                onclick="atualizarStatus(${ordem.id})">
                Salvar alteração
            </button>
        ` : `
            <p>Esta ordem está cancelada e não pode ser atualizada.</p>
        `}
    `;

    if (!statusBloqueado) {
        document.getElementById("novoStatus").value =
            ordem.status || "Aberta";
    }

    modal.classList.add("aberto");
}

async function atualizarStatus(id) {
    const novoStatus = document.getElementById("novoStatus").value;
    const usuarioAba = obterUsuarioAba();

    try {
        const resposta = await fetch("php/atualizar-status-mecanico.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                status: novoStatus,
                mecanico_id: usuarioAba ? usuarioAba.id : 0
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok || resultado.erro) {
            throw new Error(resultado.erro || "Erro ao atualizar status.");
        }

        alert("Status atualizado com sucesso!");

        fecharModal();
        await carregarOrdens();

    } catch (erro) {
        alert(erro.message);
    }
}

function fecharModal() {
    modal.classList.remove("aberto");
}

function limparFiltros() {
    document.getElementById("campoBusca").value = "";
    if (document.getElementById("filtroData")) {
        document.getElementById("filtroData").value = "";
    }
    document.getElementById("filtroStatus").value = "";

    paginaAtual = 1;

    renderizarOrdens();
}

document.getElementById("campoBusca").addEventListener("input", () => {
    paginaAtual = 1;
    renderizarOrdens();
});

if (document.getElementById("filtroData")) {
    document.getElementById("filtroData").addEventListener("change", () => {
        paginaAtual = 1;
        renderizarOrdens();
    });
}

document.getElementById("filtroStatus").addEventListener("change", () => {
    paginaAtual = 1;
    renderizarOrdens();
});

carregarOrdens();