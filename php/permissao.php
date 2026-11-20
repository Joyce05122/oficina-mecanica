<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function exigirLogin() {
    if (!isset($_SESSION['id']) || !isset($_SESSION['tipo'])) {
        http_response_code(401);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode([
            "sucesso" => false,
            "erro" => "Você precisa fazer login para acessar.",
            "mensagem" => "Você precisa fazer login para acessar."
        ]);
        exit;
    }
}

function exigirAdmin() {
    exigirLogin();
    if ($_SESSION['tipo'] !== "Administrador") {
        http_response_code(403);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode([
            "sucesso" => false,
            "erro" => "Acesso negado: apenas Administradores podem fazer isso.",
            "mensagem" => "Acesso negado: apenas Administradores podem fazer isso."
        ]);
        exit;
    }
}
?>