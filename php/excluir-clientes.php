<?php

require_once "conexao.php";
require_once "permissao.php";
exigirAdmin();

$id = $_POST['id'];

$sql = "DELETE FROM clientes WHERE id = ?";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["sucesso" => true]);
} else {
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Não foi possível excluir o cliente. Verifique se ele possui veículos ou ordens de serviço cadastrados."
    ]);
}

?>