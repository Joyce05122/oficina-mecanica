<?php
session_start();
require_once "conexao.php";
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(["erro" => "Usuário não autenticado"]);
    exit;
}

$dados = json_decode(file_get_contents("php://input"), true);

$id = (int) ($dados['id'] ?? 0);
$status = $dados['status'] ?? '';
$idSolicitado = (int) ($dados['mecanico_id'] ?? 0);
$idMecanico = $idSolicitado > 0 ? $idSolicitado : (int) $_SESSION['id'];

$statusPermitidos = [
    "Aberta",
    "Em andamento",
    "Aguardando peças",
    "Concluída"
];

if (!$id || !in_array($status, $statusPermitidos)) {
    http_response_code(400);
    echo json_encode(["erro" => "Status inválido para o banco de dados."]);
    exit;
}

$verificaMec = $conexao->prepare("SELECT id FROM usuarios WHERE id = ? AND tipo = 'Mecanico' LIMIT 1");
$verificaMec->bind_param("i", $idMecanico);
$verificaMec->execute();
$verificaMec->store_result();

if ($verificaMec->num_rows === 0) {
    http_response_code(403);
    echo json_encode(["erro" => "Acesso não autorizado."]);
    exit;
}
$verificaMec->close();

$sql = "UPDATE ordens_servico
        SET status = ?
        WHERE id = ? AND mecanico_id = ?";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("sii", $status, $id, $idMecanico);

if ($stmt->execute()) {
    $acaoLog = "Atualização de status";
    $descLog = "Status alterado para: " . $status;
    $log = $conexao->prepare("INSERT INTO historico_operacoes (ordem_servico_id, usuario_id, acao, descricao) VALUES (?, ?, ?, ?)");
    if ($log) {
        $log->bind_param("iiss", $id, $idMecanico, $acaoLog, $descLog);
        $log->execute();
        $log->close();
    }

    echo json_encode(["sucesso" => true]);
} else {
    http_response_code(500);
    echo json_encode(["erro" => "Não foi possível atualizar o status"]);
}

$stmt->close();
$conexao->close();
?>