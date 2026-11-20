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

async function carregarPainelMecanico() {
    const usuarioAba = obterUsuarioAba();
    const query = usuarioAba && usuarioAba.id ? `?mecanico_id=${encodeURIComponent(usuarioAba.id)}` : "";

    try {
        const resposta = await fetch(`php/ordens-mecanico.php${query}`);
        if (!resposta.ok) return;

        const ordens = await resposta.json();
        if (!Array.isArray(ordens)) return;

        document.getElementById("mecPendentes").textContent =
            ordens.filter(o => o.status === "Aberta" || o.status === "Aguardando peças").length;
        document.getElementById("mecAndamento").textContent =
            ordens.filter(o => o.status === "Em andamento").length;
        document.getElementById("mecConcluidas").textContent =
            ordens.filter(o => o.status === "Concluída").length;

        const ativas = ordens.filter(o => o.status !== "Concluída" && o.status !== "Cancelada");

        const elOrdens = document.getElementById("resumoOrdensMecanico");
        if (ativas.length === 0) {
            elOrdens.innerHTML = `<p class="vazio">Nenhuma ordem de serviço pendente no momento.</p>`;
        } else {
            elOrdens.innerHTML = ativas.slice(0, 4).map(o => `
                <div class="agenda-item">
                    <div>
                        <strong>#${o.id} - ${escaparHTML(o.veiculo)}</strong>
                        <p>${escaparHTML(o.cliente)} • ${escaparHTML(o.descricao)}</p>
                        <span class="status ${o.status === "Em andamento" ? "andamento" : "aberta"}">${escaparHTML(o.status)}</span>
                    </div>
                </div>
            `).join("");
        }

        const agendadas = ativas.filter(o => o.horario);
        const elAgenda = document.getElementById("resumoAgendaMecanico");
        if (agendadas.length === 0) {
            elAgenda.innerHTML = `<p class="vazio">Nenhum atendimento com horário agendado.</p>`;
        } else {
            elAgenda.innerHTML = agendadas.slice(0, 4).map(o => {
                const [ano, mes, dia] = (o.data || "").split("-");
                const dataBr = dia ? `${dia}/${mes}/${ano}` : "";
                return `
                    <div class="agenda-item">
                        <div class="horario">${escaparHTML(o.horario)}</div>
                        <div>
                            <strong>${dataBr} - ${escaparHTML(o.cliente)}</strong>
                            <p>${escaparHTML(o.veiculo)} • ${escaparHTML(o.descricao)}</p>
                        </div>
                    </div>
                `;
            }).join("");
        }
    } catch (erro) {
        console.error(erro);
    }
}

carregarPainelMecanico();