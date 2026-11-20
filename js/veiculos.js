
let veiculos = [];

const tabela = document.getElementById("lista-veiculos");
const formulario = document.getElementById("form-veiculo");
const modal = document.getElementById("modal-veiculo");
const campoPesquisa = document.getElementById("pesquisar-veiculo");

const caminhoPHP = "php/veiculos.php";

async function enviarDados(dados) {
    const resposta = await fetch(caminhoPHP, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok || !resultado.sucesso) {
        throw new Error(resultado.mensagem || "Erro ao realizar operação.");
    }

    return resultado;
}

async function carregarVeiculos() {
    try {
        const resposta = await fetch(caminhoPHP);
        const resultado = await resposta.json();

        if (!resposta.ok || !Array.isArray(resultado)) {
            throw new Error("Não foi possível carregar os veículos.");
        }

        veiculos = resultado;

        renderizarVeiculos();

    } catch (erro) {
        alert(erro.message);
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

function atualizarIndicadores() {
    document.getElementById("total-veiculos").textContent =
        veiculos.length;

    document.getElementById("veiculos-atendimento").textContent =
        veiculos.filter(veiculo =>
            veiculo.status === "Em atendimento"
        ).length;
}

function renderizarVeiculos() {
    const busca = campoPesquisa.value.trim().toLowerCase();

    const filtrados = veiculos.filter(veiculo =>
        veiculo.placa.toLowerCase().includes(busca) ||
        veiculo.modelo.toLowerCase().includes(busca) ||
        veiculo.marca.toLowerCase().includes(busca) ||
        veiculo.proprietario.toLowerCase().includes(busca)
    );

    tabela.innerHTML = "";

    if (filtrados.length === 0) {

        tabela.innerHTML = `
            <tr>
                <td colspan="7" class="vazio">
                    Nenhum veículo cadastrado.
                </td>
            </tr>
        `;

    } else {

        filtrados.forEach(veiculo => {

            const classeStatus =
                veiculo.status === "Disponível"
                    ? "disponivel"
                    : "atendimento";

            tabela.innerHTML += `
                <tr>
                    <td>${escaparHTML(veiculo.placa)}</td>
                    <td>${escaparHTML(veiculo.marca)}</td>
                    <td>${escaparHTML(veiculo.modelo)}</td>
                    <td>${escaparHTML(veiculo.ano)}</td>
                    <td>${escaparHTML(veiculo.proprietario)}</td>

                    <td>
                        <span class="status ${classeStatus}">
                            ${escaparHTML(veiculo.status)}
                        </span>
                    </td>

                    <td>
                        <div class="acoes">

                            <button
                                class="botao-acao botao-editar"
                                data-acao="editar"
                                data-id="${veiculo.id}">
                                Editar
                            </button>

                            <button
                                class="botao-acao botao-excluir"
                                data-acao="excluir"
                                data-id="${veiculo.id}">
                                Excluir
                            </button>

                        </div>
                    </td>
                </tr>
            `;
        });
    }

    atualizarIndicadores();
}

function abrirFormulario() {
    formulario.reset();

    document.getElementById("indice-veiculo").value = "";

    document.getElementById("titulo-formulario").textContent =
        "Cadastrar veículo";

    modal.hidden = false;
}

function fecharFormulario() {
    modal.hidden = true;
    formulario.reset();
}

function editarVeiculo(id) {
    const veiculo = veiculos.find(item =>
        Number(item.id) === id
    );

    if (!veiculo) return;

    document.getElementById("indice-veiculo").value = veiculo.id;
    document.getElementById("proprietario").value = veiculo.proprietario;
    document.getElementById("placa").value = veiculo.placa;
    document.getElementById("marca").value = veiculo.marca;
    document.getElementById("modelo").value = veiculo.modelo;
    document.getElementById("ano").value = veiculo.ano;
    document.getElementById("cor").value = veiculo.cor;
    document.getElementById("status-veiculo").value = veiculo.status;

    document.getElementById("titulo-formulario").textContent =
        "Editar veículo";

    modal.hidden = false;
}

async function excluirVeiculo(id) {
    const confirmar = confirm(
        "Tem certeza de que deseja excluir este veículo?"
    );

    if (!confirmar) return;

    try {
        const resultado = await enviarDados({
            acao: "excluir",
            id: id
        });

        alert(resultado.mensagem);

        await carregarVeiculos();

    } catch (erro) {
        alert(erro.message);
    }
}

formulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const id = document.getElementById("indice-veiculo").value;

    const dados = {
        acao: "salvar",
        id: id,
        proprietario: document.getElementById("proprietario").value.trim(),
        placa: document.getElementById("placa").value.trim().toUpperCase(),
        marca: document.getElementById("marca").value.trim(),
        modelo: document.getElementById("modelo").value.trim(),
        ano: document.getElementById("ano").value,
        cor: document.getElementById("cor").value.trim(),
        status: document.getElementById("status-veiculo").value
    };

    try {
        const resultado = await enviarDados(dados);

        alert(resultado.mensagem);

        fecharFormulario();

        await carregarVeiculos();

    } catch (erro) {
        alert(erro.message);
    }
});

document.getElementById("abrir-formulario")
    .addEventListener("click", abrirFormulario);

document.getElementById("fechar-formulario")
    .addEventListener("click", fecharFormulario);

document.getElementById("cancelar-formulario")
    .addEventListener("click", fecharFormulario);

campoPesquisa.addEventListener("input", renderizarVeiculos);

tabela.addEventListener("click", function(evento) {
    const botao = evento.target.closest("button[data-acao]");

    if (!botao) return;

    const id = Number(botao.dataset.id);

    if (botao.dataset.acao === "editar") {
        editarVeiculo(id);
    }

    if (botao.dataset.acao === "excluir") {
        excluirVeiculo(id);
    }
});

carregarVeiculos();
