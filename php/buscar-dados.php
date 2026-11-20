<?php

require_once "conexao.php";
require_once "permissao.php";
exigirLogin();

$sqlClientes = "SELECT id, nome FROM clientes WHERE status = 'Ativo' ORDER BY nome";
$resultadoClientes = $conexao->query($sqlClientes);

$clientes = [];

while ($linha = $resultadoClientes->fetch_assoc()) {
    $clientes[] = $linha;
}

$sqlVeiculos = "SELECT id, cliente_id, marca, modelo, placa FROM veiculos ORDER BY modelo";
$resultadoVeiculos = $conexao->query($sqlVeiculos);

$veiculos = [];

while ($linha = $resultadoVeiculos->fetch_assoc()) {
    $veiculos[] = $linha;
}

$sqlMecanicos = "SELECT id, nome FROM usuarios WHERE tipo = 'Mecanico' ORDER BY nome";
$resultadoMecanicos = $conexao->query($sqlMecanicos);

$mecanicos = [];

while ($linha = $resultadoMecanicos->fetch_assoc()) {
    $mecanicos[] = $linha;
}

header('Content-Type: application/json; charset=UTF-8');

echo json_encode([
    'clientes' => $clientes,
    'veiculos' => $veiculos,
    'mecanicos' => $mecanicos
]);

?>