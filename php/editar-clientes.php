<?php

require_once "conexao.php";
require_once "permissao.php";
exigirAdmin();

$id = $_POST['id'];
$nome = $_POST['nome'];
$cpf = $_POST['cpf'];
$telefone = $_POST['telefone'];
$email = $_POST['email'];
$endereco = $_POST['endereco'];
$status = $_POST['status'];

$sql = "UPDATE clientes SET
        nome = ?,
        cpf = ?,
        telefone = ?,
        email = ?,
        endereco = ?,
        status = ?
        WHERE id = ?";

$stmt = $conexao->prepare($sql);

$stmt->bind_param(
    "ssssssi",
    $nome,
    $cpf,
    $telefone,
    $email,
    $endereco,
    $status,
    $id
);

if ($stmt->execute()) {
    echo json_encode(["sucesso" => true]);
} else {
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Erro ao atualizar cliente."
    ]);
}

?>