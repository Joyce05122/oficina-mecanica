<?php
session_start();
require_once "conexao.php";
header("Content-Type: application/json; charset=UTF-8");

$email = trim($_POST['email'] ?? '');
$senha = $_POST['senha'] ?? '';
$perfil = trim($_POST['perfil'] ?? '');

if ($email === '' || $senha === '' || $perfil === '') {
    http_response_code(400);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Preencha e-mail, senha e perfil."
    ]);
    exit;
}

$sql = "SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = ? LIMIT 1";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 0) {
    http_response_code(401);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "E-mail ou senha inválidos."
    ]);
    exit;
}

$usuario = $resultado->fetch_assoc();

if (!password_verify($senha, $usuario['senha'])) {
    http_response_code(401);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "E-mail ou senha inválidos."
    ]);
    exit;
}

if ($usuario['tipo'] !== $perfil) {
    http_response_code(403);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "O perfil selecionado não corresponde a este usuário."
    ]);
    exit;
}

$_SESSION['id'] = $usuario['id'];
$_SESSION['nome'] = $usuario['nome'];
$_SESSION['tipo'] = $usuario['tipo'];

echo json_encode([
    "sucesso" => true,
    "usuario" => [
        "id" => $usuario['id'],
        "nome" => $usuario['nome'],
        "tipo" => $usuario['tipo']
    ],
    "destino" => $usuario['tipo'] === "Administrador"
        ? "inicial-adm.html"
        : "inicial-mecanico.html"
]);
?>