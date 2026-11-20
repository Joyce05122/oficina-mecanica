<?php
require_once "conexao.php";
require_once "permissao.php";
exigirLogin();

header('Content-Type: application/json; charset=UTF-8');

$acao = $_GET['acao'] ?? '';
$usuarioLogadoId = $_SESSION['id'] ?? null;

if ($acao == 'listar') {

    $sql = "SELECT 
                os.id,
                os.cliente_id,
                os.veiculo_id,
                os.mecanico_id,
                c.nome AS cliente,
                CONCAT(v.marca, ' ', v.modelo) AS veiculo,
                v.placa,
                u.nome AS mecanico,
                os.data_abertura,
                os.data_agendamento,
                os.descricao,
                os.status,
                os.valor
            FROM ordens_servico os
            INNER JOIN clientes c ON os.cliente_id = c.id
            INNER JOIN veiculos v ON os.veiculo_id = v.id
            LEFT JOIN usuarios u ON os.mecanico_id = u.id
            ORDER BY os.id DESC";

    $resultado = $conexao->query($sql);

    $ordens = [];

    while ($linha = $resultado->fetch_assoc()) {
        $linha['status'] = ($linha['status'] == 'Concluida' || $linha['status'] == 'Concluída')
            ? 'Concluída'
            : $linha['status'];

        $linha['data'] = $linha['data_abertura'];
        $linha['horario'] = !empty($linha['data_agendamento'])
            ? substr($linha['data_agendamento'], 11, 5)
            : '08:00';

        $ordens[] = $linha;
    }

    echo json_encode($ordens);
    exit;
}

if ($acao == 'salvar') {

    $id = trim($_POST['id'] ?? '');
    $cliente = intval($_POST['cliente_id'] ?? 0);
    $veiculo = intval($_POST['veiculo_id'] ?? 0);
    $mecanico = intval($_POST['mecanico_id'] ?? 0);
    $dataAbertura = trim($_POST['data'] ?? '');
    $horario = trim($_POST['horario'] ?? '08:00');
    $descricao = trim($_POST['descricao'] ?? '');
    $valor = floatval($_POST['valor'] ?? 0);
    $status = trim($_POST['status'] ?? 'Aberta');

    $horarioFormatado = strlen($horario) === 5 ? $horario . ':00' : $horario;
    $dataAgendamento = $dataAbertura . ' ' . $horarioFormatado;

    if ($mecanico > 0 && $status !== 'Cancelada' && $status !== 'Concluída' && $status !== 'Concluida') {
        if ($id !== '') {
            $sqlConflito = "SELECT id FROM ordens_servico
                            WHERE mecanico_id = ?
                              AND data_agendamento = ?
                              AND status NOT IN ('Cancelada', 'Concluída', 'Concluida')
                              AND id != ?
                            LIMIT 1";
            $stmtConflito = $conexao->prepare($sqlConflito);
            $stmtConflito->bind_param("isi", $mecanico, $dataAgendamento, $id);
        } else {
            $sqlConflito = "SELECT id FROM ordens_servico
                            WHERE mecanico_id = ?
                              AND data_agendamento = ?
                              AND status NOT IN ('Cancelada', 'Concluída', 'Concluida')
                            LIMIT 1";
            $stmtConflito = $conexao->prepare($sqlConflito);
            $stmtConflito->bind_param("is", $mecanico, $dataAgendamento);
        }

        $stmtConflito->execute();
        $stmtConflito->store_result();

        if ($stmtConflito->num_rows > 0) {
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Agendamento não permitido: o mecânico selecionado já possui uma ordem de serviço nesse horário. Selecione outro horário ou mecânico.'
            ]);
            exit;
        }
    }

    if ($id !== '') {

        $sql = "UPDATE ordens_servico SET
                    cliente_id = ?,
                    veiculo_id = ?,
                    mecanico_id = ?,
                    data_abertura = ?,
                    data_agendamento = ?,
                    descricao = ?,
                    valor = ?,
                    status = ?
                WHERE id = ?";

        $stmt = $conexao->prepare($sql);
        $stmt->bind_param(
            "iiisssdsi",
            $cliente,
            $veiculo,
            $mecanico,
            $dataAbertura,
            $dataAgendamento,
            $descricao,
            $valor,
            $status,
            $id
        );

    } else {

        $sql = "INSERT INTO ordens_servico
                    (cliente_id, veiculo_id, mecanico_id, data_abertura, data_agendamento, descricao, valor, status, usuario_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conexao->prepare($sql);
        $stmt->bind_param(
            "iiisssdsi",
            $cliente,
            $veiculo,
            $mecanico,
            $dataAbertura,
            $dataAgendamento,
            $descricao,
            $valor,
            $status,
            $usuarioLogadoId
        );
    }

    if ($stmt->execute()) {
        $osId = ($id !== '') ? intval($id) : $conexao->insert_id;
        $acaoLog = ($id !== '') ? 'ATUALIZACAO_OS' : 'CADASTRO_OS';
        $descLog = ($id !== '')
            ? "Ordem de serviço #$osId atualizada para o mecânico ID $mecanico em $dataAgendamento"
            : "Ordem de serviço #$osId cadastrada para o mecânico ID $mecanico em $dataAgendamento";

        $stmtLog = $conexao->prepare("INSERT INTO historico_operacoes (ordem_servico_id, usuario_id, acao, descricao) VALUES (?, ?, ?, ?)");
        if ($stmtLog) {
            $stmtLog->bind_param("iiss", $osId, $usuarioLogadoId, $acaoLog, $descLog);
            $stmtLog->execute();
        }

        echo json_encode([
            'sucesso' => true,
            'mensagem' => ($id !== '') ? 'Ordem de serviço atualizada com sucesso!' : 'Ordem de serviço cadastrada com sucesso!'
        ]);
    } else {
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao salvar ordem de serviço: ' . $stmt->error
        ]);
    }

    exit;
}

if ($acao == 'excluir') {
    exigirAdmin();

    $id = intval($_POST['id'] ?? 0);

    $sql = "DELETE FROM ordens_servico WHERE id = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(['sucesso' => true, 'mensagem' => 'Ordem de serviço excluída com sucesso!']);
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir ordem de serviço.']);
    }

    exit;
}

echo json_encode(['sucesso' => false, 'mensagem' => 'Ação inválida.']);
?>