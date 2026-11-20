let ordens = [];
let clientes = [];
let veiculos = [];
let mecanicos = [];

let paginaAtual = 1;
const itensPorPagina = 5;

const tabela = document.getElementById("tabelaOrdens");
const formulario = document.getElementById("formOrdem");
const modal = document.getElementById("modalOrdem");

const urlOrdens = "php/ordens.php";

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

async function carregarDados() {
    try {
        const resposta = await fetch("php/buscar-dados.php");
        if (!resposta.ok) throw new Error("Erro ao buscar cadastros.");

        const dados = await resposta.json();

        clientes = dados.clientes || [];
        veiculos = dados.veiculos || [];
        mecanicos = dados.mecanicos || [];

        preencherSelect("cliente", clientes, "Selecione um cliente");
        preencherSelect("mecanico", mecanicos, "Selecione um mecânico");
        definirVeiculoDoCliente("");

    } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar clientes, veículos e mecânicos.");
    }
}

function preencherSelect(id, lista, texto, mostrarNome = item => item.nome) {
    const campo = document.getElementById(id);
    if (!campo) return;

    campo.innerHTML = `<option value="">${texto}</option>`;

    lista.forEach(item => {
        campo.innerHTML += `
            <option value="${item.id}">
                ${escaparHTML(mostrarNome(item))}
            </option>
        `;
    });
}

function definirVeiculoDoCliente(clienteId, veiculoIdEspecifico = "") {
    const campoVeiculoId = document.getElementById("veiculo");
    const campoVeiculoNome = document.getElementById("veiculoNome");

    if (!campoVeiculoId) return;

    if (!clienteId) {
        campoVeiculoId.value = "";
        if (campoVeiculoNome) {
            campoVeiculoNome.value = "";
            campoVeiculoNome.placeholder = "Preenchido automaticamente ao selecionar o cliente";
        }
        return;
    }

    const veiculoEncontrado = veiculoIdEspecifico
        ? veiculos.find(v => String(v.id) === String(veiculoIdEspecifico))
        : veiculos.find(v => String(v.cliente_id) === String(clienteId));

    if (!veiculoEncontrado) {
        campoVeiculoId.value = "";
        if (campoVeiculoNome) {
            campoVeiculoNome.value = "Nenhum veículo cadastrado para este cliente";
        }
        return;
    }

    campoVeiculoId.value = veiculoEncontrado.id;
    if (campoVeiculoNome) {
        campoVeiculoNome.value = `${veiculoEncontrado.marca} ${veiculoEncontrado.modelo} - ${veiculoEncontrado.placa}`;
    }
}

async function carregarOrdens() {
    try {
        const resposta = await fetch(`${urlOrdens}?acao=listar`);

        if (!resposta.ok) throw new Error("Erro ao buscar ordens.");

        const resultado = await resposta.json();
        ordens = Array.isArray(resultado) ? resultado : (resultado.dados || []);

        renderizarOrdens();

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar as ordens de serviço.");
    }
}

function formatarData(data) {
    if (!data) return "-";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

function formatarValor(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
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

function obterOrdensFiltradas() {
    const busca = document.getElementById("campoBusca").value.trim().toLowerCase();
    const status = document.getElementById("filtroStatus").value;
    const campoData = document.getElementById("filtroData");
    const dataFiltro = campoData ? campoData.value : "";

    return ordens.filter(ordem => {
        const correspondeBusca =
            String(ordem.id).includes(busca) ||
            (ordem.cliente || "").toLowerCase().includes(busca) ||
            (ordem.veiculo || "").toLowerCase().includes(busca) ||
            (ordem.mecanico || "").toLowerCase().includes(busca);

        const correspondeStatus = !status || ordem.status === status;
        const correspondeData = !dataFiltro || ordem.data === dataFiltro;

        return correspondeBusca && correspondeStatus && correspondeData;
    });
}

function atualizarIndicadores() {
    document.getElementById("totalOrdens").textContent = ordens.length;

    document.getElementById("ordensAndamento").textContent =
        ordens.filter(o => o.status === "Em andamento").length;

    document.getElementById("ordensConcluidas").textContent =
        ordens.filter(o => o.status === "Concluída").length;

    document.getElementById("ordensPendentes").textContent =
        ordens.filter(o =>
            ["Aberta", "Aguardando peças"].includes(o.status)
        ).length;
}

function renderizarOrdens() {
    const filtradas = obterOrdensFiltradas();

    const totalPaginas = Math.max(
        1,
        Math.ceil(filtradas.length / itensPorPagina)
    );

    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

    const inicio = (paginaAtual - 1) * itensPorPagina;

    const ordensPagina = filtradas.slice(
        inicio,
        inicio + itensPorPagina
    );

    tabela.innerHTML = "";

    if (ordensPagina.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="8" class="sem-resultados">
                    Nenhuma ordem de serviço encontrada.
                </td>
            </tr>
        `;
    } else {
        ordensPagina.forEach(ordem => {
            const dataHora = `${formatarData(ordem.data)}${ordem.horario ? " às " + ordem.horario : ""}`;

            tabela.innerHTML += `
                <tr>
                    <td>#${ordem.id}</td>
                    <td>${escaparHTML(ordem.cliente)}</td>
                    <td>${escaparHTML(ordem.veiculo)}</td>
                    <td>${escaparHTML(ordem.mecanico || "Não atribuído")}</td>
                    <td>${dataHora}</td>
                    <td>${formatarValor(ordem.valor)}</td>
                    <td>
                        <span class="status ${classeStatus(ordem.status)}">
                            ${escaparHTML(ordem.status)}
                        </span>
                    </td>
                    <td>
                        <div class="acoes">
                            <button class="botao-editar"
                                onclick="editarOrdem(${ordem.id})">
                                Editar
                            </button>

                            <button class="botao-excluir"
                                onclick="excluirOrdem(${ordem.id})">
                                Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    const quantidade = ordensPagina.length;
    const primeiro = filtradas.length ? inicio + 1 : 0;
    const ultimo = inicio + quantidade;

    document.getElementById("informacaoPagina").textContent =
        `Exibindo ${primeiro} a ${ultimo} de ${filtradas.length} ordens`;

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

function abrirModal() {
    formulario.reset();

    document.getElementById("idOrdem").value = "";
    document.getElementById("tituloModal").textContent =
        "Nova Ordem de Serviço";

    definirVeiculoDoCliente("");

    modal.classList.add("aberto");
}

function fecharModal() {
    modal.classList.remove("aberto");
}

function editarOrdem(id) {
    const ordem = ordens.find(item => Number(item.id) === Number(id));

    if (!ordem) return;

    document.getElementById("idOrdem").value = ordem.id;
    document.getElementById("cliente").value = ordem.cliente_id;

    definirVeiculoDoCliente(ordem.cliente_id, ordem.veiculo_id);

    document.getElementById("mecanico").value = ordem.mecanico_id || "";
    document.getElementById("data").value = ordem.data;
    if (document.getElementById("horario")) {
        document.getElementById("horario").value = ordem.horario || "08:00";
    }
    document.getElementById("valor").value = ordem.valor;
    document.getElementById("descricao").value = ordem.descricao;
    document.getElementById("status").value =
        ordem.status === "Concluída" ? "Concluída" : ordem.status;

    document.getElementById("tituloModal").textContent =
        "Editar Ordem de Serviço";

    modal.classList.add("aberto");
}

formulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const veiculoId = document.getElementById("veiculo").value;
    if (!veiculoId) {
        alert("O cliente selecionado não possui veículo cadastrado.");
        return;
    }

    const dados = new FormData();

    dados.append("id", document.getElementById("idOrdem").value);
    dados.append("cliente_id", document.getElementById("cliente").value);
    dados.append("veiculo_id", veiculoId);
    dados.append("mecanico_id", document.getElementById("mecanico").value);
    dados.append("data", document.getElementById("data").value);
    dados.append("horario", document.getElementById("horario") ? document.getElementById("horario").value : "08:00");
    dados.append("valor", document.getElementById("valor").value);
    dados.append("descricao", document.getElementById("descricao").value);
    dados.append("status", document.getElementById("status").value);

    try {
        const resposta = await fetch(`${urlOrdens}?acao=salvar`, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.mensagem || "Não foi possível salvar a ordem.");
            return;
        }

        alert(resultado.mensagem || "Ordem de serviço salva com sucesso!");

        fecharModal();
        formulario.reset();

        paginaAtual = 1;

        await carregarOrdens();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao salvar a ordem de serviço.");
    }
});

async function excluirOrdem(id) {
    const confirmar = confirm(
        "Tem certeza de que deseja excluir esta ordem de serviço?"
    );

    if (!confirmar) return;

    const dados = new FormData();
    dados.append("id", id);

    try {
        const resposta = await fetch(`${urlOrdens}?acao=excluir`, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.mensagem || "Não foi possível excluir a ordem.");
            return;
        }

        alert("Ordem excluída com sucesso!");

        await carregarOrdens();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao excluir a ordem.");
    }
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

document.getElementById("cliente").addEventListener("change", function() {
    definirVeiculoDoCliente(this.value);
});

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

async function iniciarPagina() {
    await carregarDados();
    await carregarOrdens();
}

iniciarPagina();