<?php
require_once "conexao.php";
header("Content-Type: application/json; charset=UTF-8");

$nome = trim($_POST['nome'] ?? '');
$email = trim($_POST['email'] ?? '');
$senha = $_POST['senha'] ?? '';
$tipo = trim($_POST['perfil'] ?? '');

if ($nome === '' || $email === '' || $senha === '' || !in_array($tipo, ['Administrador', 'Mecanico'])) {
    http_response_code(400);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Preencha todos os campos corretamente."
    ]);
    exit;
}

$verifica = $conexao->prepare("SELECT id FROM usuarios WHERE email = ? LIMIT 1");
$verifica->bind_param("s", $email);
$verifica->execute();
$verifica->store_result();

if ($verifica->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Este e-mail já está cadastrado."
    ]);
    exit;
}

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

$sql = "INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("ssss", $nome, $email, $senhaHash, $tipo);

if ($stmt->execute()) {
    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Usuário cadastrado com sucesso!"
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Erro ao cadastrar usuário."
    ]);
}
?>