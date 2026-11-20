let agendamentos = [];
let clientes = [];
let veiculos = [];
let mecanicos = [];

const formulario = document.getElementById("formAgendamento");
const modal = document.getElementById("modalAgendamento");
const urlOrdens = "php/ordens.php";

function obterDataHoje() {
    const hojeObj = new Date();
    return `${hojeObj.getFullYear()}-${String(hojeObj.getMonth() + 1).padStart(2, "0")}-${String(hojeObj.getDate()).padStart(2, "0")}`;
}

let dataAtual = obterDataHoje();

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

async function carregarCadastros() {
    try {
        const resposta = await fetch("php/buscar-dados.php");
        if (!resposta.ok) throw new Error("Erro ao buscar cadastros.");

        const dados = await resposta.json();
        clientes = dados.clientes || [];
        veiculos = dados.veiculos || [];
        mecanicos = dados.mecanicos || [];

        preencherSelect("cliente", clientes, "Selecione um cliente");
        atualizarVeiculosPorCliente("");
        preencherSelect("mecanico", mecanicos, "Selecione o mecânico");

        const filtroMec = document.getElementById("filtroMecanico");
        filtroMec.innerHTML = `<option value="">Todos os mecânicos</option>`;
        mecanicos.forEach(m => {
            filtroMec.innerHTML += `<option value="${m.id}">${escaparHTML(m.nome)}</option>`;
        });
    } catch (erro) {
        console.error(erro);
    }
}

function preencherSelect(id, lista, texto, mostrarNome = item => item.nome) {
    const campo = document.getElementById(id);
    if (!campo) return;

    campo.innerHTML = `<option value="">${texto}</option>`;
    lista.forEach(item => {
        campo.innerHTML += `<option value="${item.id}">${escaparHTML(mostrarNome(item))}</option>`;
    });
}

function atualizarVeiculosPorCliente(clienteId, veiculoSelecionadoId = "") {
    const campoVeiculo = document.getElementById("veiculo");
    if (!campoVeiculo) return;

    if (!clienteId) {
        campoVeiculo.innerHTML = `<option value="">Selecione primeiro um cliente</option>`;
        return;
    }

    const veiculosCliente = veiculos.filter(
        v => String(v.cliente_id) === String(clienteId)
    );

    if (veiculosCliente.length === 0) {
        campoVeiculo.innerHTML = `<option value="">Este cliente não possui veículos cadastrados</option>`;
        return;
    }

    preencherSelect(
        "veiculo",
        veiculosCliente,
        "Selecione um veículo",
        item => `${item.marca} ${item.modelo} - ${item.placa}`
    );

    if (veiculoSelecionadoId) {
        campoVeiculo.value = veiculoSelecionadoId;
    } else if (veiculosCliente.length === 1) {
        campoVeiculo.value = veiculosCliente[0].id;
    }
}

async function carregarAgenda() {
    try {
        const resposta = await fetch(`${urlOrdens}?acao=listar`);
        if (!resposta.ok) throw new Error("Erro ao carregar agenda.");

        const resultado = await resposta.json();
        const lista = Array.isArray(resultado) ? resultado : (resultado.dados || []);

        agendamentos = lista.map(os => ({
            ...os,
            horario: os.horario ? os.horario.slice(0, 5) : "08:00",
            statusAgenda: mapearStatusParaAgenda(os.status)
        }));

        renderizarAgenda();
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar os agendamentos do banco de dados.");
    }
}

function mapearStatusParaAgenda(statusOS) {
    if (statusOS === "Aberta" || statusOS === "Aguardando peças") return "Agendado";
    if (statusOS === "Concluída") return "Concluído";
    if (statusOS === "Cancelada") return "Cancelado";
    return statusOS || "Agendado";
}

function mapearStatusParaOS(statusAgenda) {
    if (statusAgenda === "Agendado") return "Aberta";
    if (statusAgenda === "Concluído") return "Concluída";
    if (statusAgenda === "Cancelado") return "Cancelada";
    return statusAgenda || "Aberta";
}

function atualizarIndicadores() {
    document.getElementById("totalAgendamentos").textContent = agendamentos.length;
    document.getElementById("emAndamento").textContent =
        agendamentos.filter(item => item.statusAgenda === "Em andamento").length;
    document.getElementById("concluidos").textContent =
        agendamentos.filter(item => item.statusAgenda === "Concluído").length;
    document.getElementById("agendados").textContent =
        agendamentos.filter(item => item.statusAgenda === "Agendado").length;
}

function obterAgendamentosFiltrados() {
    const data = document.getElementById("filtroData").value || dataAtual;
    const mecanicoId = document.getElementById("filtroMecanico").value;

    return agendamentos
        .filter(item =>
            item.data === data &&
            (!mecanicoId || String(item.mecanico_id) === String(mecanicoId))
        )
        .sort((a, b) => a.horario.localeCompare(b.horario));
}

function classeStatus(statusAgenda) {
    const classes = {
        "Agendado": "agendado",
        "Em andamento": "andamento",
        "Concluído": "concluido",
        "Cancelado": "cancelado"
    };
    return classes[statusAgenda] || "agendado";
}

function renderizarAgenda() {
    const lista = document.getElementById("listaAgenda");
    const semAgendamentos = document.getElementById("semAgendamentos");
    const data = document.getElementById("filtroData").value || dataAtual;

    const elData = document.getElementById("dataSelecionada");
    if (elData) {
        elData.textContent = formatarData(data);
    }

    const filtrados = obterAgendamentosFiltrados();
    lista.innerHTML = "";
    semAgendamentos.hidden = filtrados.length > 0;

    filtrados.forEach(item => {
        const classe = classeStatus(item.statusAgenda);

        lista.innerHTML += `
            <article class="agenda-item">
                <div class="horario">${escaparHTML(item.horario)}</div>

                <div class="linha-status ${classe}"></div>

                <div class="detalhes-agenda">
                    <h3>${escaparHTML(item.cliente)} - ${escaparHTML(item.veiculo)}</h3>
                    <p>Serviço: ${escaparHTML(item.descricao)}</p>
                    <p>Mecânico: ${escaparHTML(item.mecanico || "Não atribuído")}</p>
                </div>

                <div class="acoes-agenda">
                    <span class="status-agenda status-${classe}">
                        ${escaparHTML(item.statusAgenda)}
                    </span>

                    <button class="botao-editar" onclick="editarAgendamento(${item.id})">
                        Editar
                    </button>

                    <button class="botao-excluir" onclick="excluirAgendamento(${item.id})">
                        Excluir
                    </button>
                </div>
            </article>
        `;
    });

    atualizarIndicadores();
}

function abrirModal() {
    formulario.reset();
    document.getElementById("idAgendamento").value = "";
    atualizarVeiculosPorCliente("");
    document.getElementById("data").value = document.getElementById("filtroData").value || dataAtual;
    document.getElementById("tituloModal").textContent = "Novo Agendamento";
    modal.classList.add("aberto");
}

function fecharModal() {
    modal.classList.remove("aberto");
}

function editarAgendamento(id) {
    const item = agendamentos.find(ag => Number(ag.id) === Number(id));
    if (!item) return;

    document.getElementById("idAgendamento").value = item.id;
    document.getElementById("cliente").value = item.cliente_id;
    atualizarVeiculosPorCliente(item.cliente_id, item.veiculo_id);
    document.getElementById("mecanico").value = item.mecanico_id || "";
    document.getElementById("data").value = item.data;
    document.getElementById("horario").value = item.horario;
    document.getElementById("descricao").value = item.descricao;
    document.getElementById("status").value = item.statusAgenda;

    document.getElementById("tituloModal").textContent = "Editar Agendamento";
    modal.classList.add("aberto");
}

document.getElementById("cliente").addEventListener("change", function() {
    atualizarVeiculosPorCliente(this.value);
});

formulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const id = document.getElementById("idAgendamento").value;
    const itemExistente = agendamentos.find(ag => Number(ag.id) === Number(id));

    const dados = new FormData();
    dados.append("id", id);
    dados.append("cliente_id", document.getElementById("cliente").value);
    dados.append("veiculo_id", document.getElementById("veiculo").value);
    dados.append("mecanico_id", document.getElementById("mecanico").value);
    dados.append("data", document.getElementById("data").value);
    dados.append("horario", document.getElementById("horario").value);
    dados.append("valor", itemExistente ? itemExistente.valor : "0");
    dados.append("descricao", document.getElementById("descricao").value.trim());
    dados.append("status", mapearStatusParaOS(document.getElementById("status").value));

    try {
        const resposta = await fetch(`${urlOrdens}?acao=salvar`, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.mensagem || "Não foi possível salvar o agendamento.");
            return;
        }

        alert(resultado.mensagem || "Agendamento salvo com sucesso!");
        dataAtual = document.getElementById("data").value;
        document.getElementById("filtroData").value = dataAtual;

        fecharModal();
        await carregarAgenda();
    } catch (erro) {
        console.error(erro);
        alert("Erro ao salvar o agendamento.");
    }
});

async function excluirAgendamento(id) {
    const confirmar = confirm("Deseja realmente excluir este agendamento?");
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
            alert(resultado.mensagem || "Não foi possível excluir o agendamento.");
            return;
        }

        alert("Agendamento excluído com sucesso!");
        await carregarAgenda();
    } catch (erro) {
        console.error(erro);
        alert("Erro ao excluir o agendamento.");
    }
}

function limparFiltros() {
    dataAtual = obterDataHoje();
    document.getElementById("filtroMecanico").value = "";
    document.getElementById("filtroData").value = dataAtual;
    renderizarAgenda();
}

document.getElementById("filtroData").addEventListener("change", function() {
    if (this.value) {
        dataAtual = this.value;
    }
    renderizarAgenda();
});

document.getElementById("filtroMecanico").addEventListener("change", renderizarAgenda);

async function iniciarAgenda() {
    document.getElementById("filtroData").value = dataAtual;
    await carregarCadastros();
    await carregarAgenda();
}

iniciarAgenda();