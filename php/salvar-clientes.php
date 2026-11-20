<?php

require_once "conexao.php";
require_once "permissao.php";
exigirAdmin();

$nome = $_POST['nome'];
$cpf = $_POST['cpf'];
$telefone = $_POST['telefone'];
$email = $_POST['email'];
$endereco = $_POST['endereco'];
$status = $_POST['status'];

$sql = "INSERT INTO clientes (nome, cpf, telefone, email, endereco, status)
        VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $conexao->prepare($sql);

$stmt->bind_param(
    "ssssss",
    $nome,
    $cpf,
    $telefone,
    $email,
    $endereco,
    $status
);

if ($stmt->execute()) {
    echo json_encode(["sucesso" => true]);
} else {
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Erro ao cadastrar cliente."
    ]);
}

?>