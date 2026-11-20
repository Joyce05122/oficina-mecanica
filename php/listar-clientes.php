<?php

require_once "conexao.php";
require_once "permissao.php";
exigirLogin();

$sql = "SELECT * FROM clientes ORDER BY id DESC";

$resultado = $conexao->query($sql);

$clientes = [];

while ($cliente = $resultado->fetch_assoc()) {
    $clientes[] = $cliente;
}

header("Content-Type: application/json; charset=UTF-8");

echo json_encode($clientes, JSON_UNESCAPED_UNICODE);

?>