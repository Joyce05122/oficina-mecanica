const modal = document.getElementById("modal-cliente");
const formulario = document.getElementById("form-cliente");
const lista = document.getElementById("lista-clientes");
const pesquisa = document.getElementById("pesquisar-cliente");

const totalClientes = document.getElementById("total-clientes");
const clientesAtivos = document.getElementById("clientes-ativos");

let clientes = [];

const caminhoPHP = "php/";

document.getElementById("abrir-formulario").addEventListener("click", () => {
    formulario.reset();

    document.getElementById("indice-cliente").value = "";
    document.getElementById("titulo-formulario").textContent = "Cadastrar cliente";

    modal.hidden = false;
});

function fecharFormulario() {
    modal.hidden = true;
    formulario.reset();
}

document.getElementById("fechar-formulario").addEventListener("click", fecharFormulario);
document.getElementById("cancelar-formulario").addEventListener("click", fecharFormulario);

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        fecharFormulario();
    }
});

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

async function carregarClientes() {
    try {
        const resposta = await fetch(caminhoPHP + "listar-clientes.php");
        clientes = await resposta.json();

        atualizarTabela();

    } catch (erro) {
        alert("Erro ao carregar os clientes.");
    }
}

function atualizarTabela() {
    const termo = pesquisa.value.toLowerCase().trim();

    const filtrados = clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.cpf.includes(termo) ||
        cliente.telefone.includes(termo)
    );

    totalClientes.textContent = clientes.length;

    clientesAtivos.textContent = clientes.filter(
        cliente => cliente.status === "Ativo"
    ).length;

    if (filtrados.length === 0) {
        lista.innerHTML = `
            <tr>
                <td colspan="6" class="vazio">
                    Nenhum cliente encontrado.
                </td>
            </tr>
        `;
        return;
    }

    lista.innerHTML = filtrados.map(cliente => `
        <tr>
            <td>${escaparHTML(cliente.nome)}</td>
            <td>${escaparHTML(cliente.cpf)}</td>
            <td>${escaparHTML(cliente.telefone)}</td>
            <td>${escaparHTML(cliente.email || "-")}</td>
            <td>
                <span class="status ${escaparHTML(cliente.status.toLowerCase())}">
                    ${escaparHTML(cliente.status)}
                </span>
            </td>
            <td>
                <div class="acoes">
                    <button class="botao-acao botao-editar"
                        data-acao="editar" data-id="${cliente.id}">
                        Editar
                    </button>

                    <button class="botao-acao botao-excluir"
                        data-acao="excluir" data-id="${cliente.id}">
                        Excluir
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const indice = document.getElementById("indice-cliente").value;

    const dados = new FormData();

    dados.append("nome", document.getElementById("nome").value.trim());
    dados.append("cpf", document.getElementById("cpf").value.trim());
    dados.append("telefone", document.getElementById("telefone").value.trim());
    dados.append("email", document.getElementById("email").value.trim());
    dados.append("endereco", document.getElementById("endereco").value.trim());
    dados.append("status", document.getElementById("status-cliente").value);

    if (indice) {
        dados.append("id", indice);
    }

    const cpf = dados.get("cpf");

    const cpfDuplicado = clientes.some(cliente =>
        cliente.cpf === cpf && String(cliente.id) !== indice
    );

    if (cpfDuplicado) {
        alert("Já existe um cliente cadastrado com esse CPF.");
        return;
    }

    const arquivo = indice
        ? "editar-clientes.php"
        : "salvar-clientes.php";

    try {
        const resposta = await fetch(caminhoPHP + arquivo, {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            alert(indice
                ? "Cliente atualizado com sucesso!"
                : "Cliente cadastrado com sucesso!"
            );

            fecharFormulario();
            carregarClientes();

        } else {
            alert(resultado.mensagem || "Não foi possível salvar o cliente.");
        }

    } catch (erro) {
        alert("Erro ao salvar o cliente.");
    }
});

lista.addEventListener("click", async (event) => {
    const botao = event.target.closest("button[data-acao]");

    if (!botao) return;

    const id = botao.dataset.id;

    const cliente = clientes.find(
        item => String(item.id) === id
    );

    if (!cliente) return;

    if (botao.dataset.acao === "editar") {
        document.getElementById("indice-cliente").value = cliente.id;
        document.getElementById("nome").value = cliente.nome;
        document.getElementById("cpf").value = cliente.cpf;
        document.getElementById("telefone").value = cliente.telefone;
        document.getElementById("email").value = cliente.email;
        document.getElementById("endereco").value = cliente.endereco;
        document.getElementById("status-cliente").value = cliente.status;

        document.getElementById("titulo-formulario").textContent = "Editar cliente";

        modal.hidden = false;
    }

    if (botao.dataset.acao === "excluir") {
        const confirmar = confirm(
            `Deseja realmente excluir o cliente ${cliente.nome}?`
        );

        if (confirmar) {
            const dados = new FormData();
            dados.append("id", id);

            try {
                const resposta = await fetch(
                    caminhoPHP + "excluir-clientes.php",
                    {
                        method: "POST",
                        body: dados
                    }
                );

                const resultado = await resposta.json();

                if (resultado.sucesso) {
                    alert("Cliente excluído com sucesso!");
                    carregarClientes();
                } else {
                    alert(resultado.mensagem || "Erro ao excluir cliente.");
                }

            } catch (erro) {
                alert("Erro ao excluir cliente.");
            }
        }
    }
});

pesquisa.addEventListener("input", atualizarTabela);

carregarClientes();
