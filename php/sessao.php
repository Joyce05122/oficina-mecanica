<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION['id'])) {
    echo json_encode([
        "autenticado" => false
    ]);
    exit;
}

echo json_encode([
    "autenticado" => true,
    "id" => $_SESSION['id'],
    "nome" => $_SESSION['nome'],
    "tipo" => $_SESSION['tipo']
]);
?>