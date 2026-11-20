function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

function classeStatusDashboard(status) {
    if (status === "Concluída") return "concluida";
    if (status === "Em andamento") return "andamento";
    return "pendente";
}

function obterDataHojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

async function carregarPainelInicial() {
    try {
        const [respDados, respOrdens] = await Promise.all([
            fetch("php/buscar-dados.php"),
            fetch("php/ordens.php?acao=listar")
        ]);

        const dados = respDados.ok ? await respDados.json() : {};
        const resultadoOrdens = respOrdens.ok ? await respOrdens.json() : [];
        const ordens = Array.isArray(resultadoOrdens) ? resultadoOrdens : (resultadoOrdens.dados || []);

        const clientes = dados.clientes || [];
        const veiculos = dados.veiculos || [];

        document.getElementById("totalClientesDashboard").textContent = clientes.length;
        document.getElementById("totalVeiculosDashboard").textContent = veiculos.length;
        document.getElementById("totalAndamentoDashboard").textContent =
            ordens.filter(os => os.status === "Em andamento").length;
        document.getElementById("totalConcluidasDashboard").textContent =
            ordens.filter(os => os.status === "Concluída").length;

        const tbody = document.getElementById("tabelaRecentesDashboard");
        tbody.innerHTML = "";

        const recentes = ordens.slice(0, 5);
        if (recentes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="vazio">
                        Nenhuma ordem de serviço cadastrada ainda.
                    </td>
                </tr>
            `;
        } else {
            recentes.forEach(os => {
                const numeroOS = `#${String(os.id).padStart(3, "0")}`;
                const classe = classeStatusDashboard(os.status);

                tbody.innerHTML += `
                    <tr>
                        <td>${numeroOS}</td>
                        <td>${escaparHTML(os.cliente)}</td>
                        <td>${escaparHTML(os.veiculo)}</td>
                        <td>
                            <span class="status ${classe}">${escaparHTML(os.status)}</span>
                        </td>
                    </tr>
                `;
            });
        }

        const containerAgenda = document.getElementById("listaAgendaHojeDashboard");
        containerAgenda.innerHTML = "";

        const hoje = obterDataHojeISO();
        let agendamentosDia = ordens
            .filter(os => os.data === hoje && os.status !== "Cancelada")
            .sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));

        if (agendamentosDia.length === 0) {
            containerAgenda.innerHTML = `
                <p class="vazio">
                    Nenhum atendimento agendado para hoje.
                </p>
            `;
        } else {
            agendamentosDia.slice(0, 4).forEach(os => {
                const hora = os.horario ? os.horario.slice(0, 5) : "--:--";
                containerAgenda.innerHTML += `
                    <div class="agenda-item">
                        <div class="horario">${escaparHTML(hora)}</div>
                        <div>
                            <strong>${escaparHTML(os.cliente)}</strong>
                            <p>${escaparHTML(os.descricao)}</p>
                            <span>Mecânico ${escaparHTML(os.mecanico || "Não atribuído")}</span>
                        </div>
                    </div>
                `;
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar painel inicial:", erro);
    }
}

carregarPainelInicial();