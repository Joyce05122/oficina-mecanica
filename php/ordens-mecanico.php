<?php
session_start();
require_once "conexao.php";
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode([
        "erro" => "Usuário não autenticado."
    ]);
    exit;
}

$idSolicitado = intval($_GET['mecanico_id'] ?? 0);
$mecanicoId = $idSolicitado > 0 ? $idSolicitado : intval($_SESSION['id']);

$sql = "SELECT 
            os.id,
            os.data_abertura AS data,
            IF(os.data_agendamento IS NOT NULL, DATE_FORMAT(os.data_agendamento, '%H:%i'), '08:00') AS horario,
            os.descricao,
            os.status,
            os.valor,
            c.nome AS cliente,
            CONCAT(v.marca, ' ', v.modelo, ' - ', v.placa) AS veiculo
        FROM ordens_servico os
        INNER JOIN clientes c ON os.cliente_id = c.id
        INNER JOIN veiculos v ON os.veiculo_id = v.id
        WHERE os.mecanico_id = ?
        ORDER BY os.data_abertura ASC, os.data_agendamento ASC, os.id DESC";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $mecanicoId);
$stmt->execute();
$resultado = $stmt->get_result();

$ordens = [];
while ($linha = $resultado->fetch_assoc()) {
    $linha['status'] = ($linha['status'] === 'Concluida' || $linha['status'] === 'Concluída')
        ? 'Concluída'
        : $linha['status'];
    $ordens[] = $linha;
}

echo json_encode($ordens);
?>