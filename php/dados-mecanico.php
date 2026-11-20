<?php
session_start();
require_once "conexao.php";
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Usuário não autenticado."
    ]);
    exit;
}

$acao = $_GET['acao'] ?? 'buscar';
$idSolicitado = intval($_REQUEST['usuario_id'] ?? 0);
$idMecanico = $idSolicitado > 0 ? $idSolicitado : intval($_SESSION['id']);

if ($acao === 'buscar') {
    $sql = "SELECT id, nome, email, tipo FROM usuarios WHERE id = ? AND tipo = 'Mecanico' LIMIT 1";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $idMecanico);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Mecânico não encontrado."
        ]);
        exit;
    }

    $usuario = $resultado->fetch_assoc();

    echo json_encode([
        "sucesso" => true,
        "usuario" => [
            "id" => $usuario['id'],
            "nome" => $usuario['nome'],
            "email" => $usuario['email']
        ]
    ]);
    exit;
}

if ($acao === 'salvar') {
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $novaSenha = $_POST['nova_senha'] ?? '';

    if ($nome === '' || $email === '') {
        http_response_code(400);
        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Nome e e-mail são obrigatórios."
        ]);
        exit;
    }

    $verifica = $conexao->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ? LIMIT 1");
    $verifica->bind_param("si", $email, $idMecanico);
    $verifica->execute();
    $verifica->store_result();

    if ($verifica->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Este e-mail já está em uso por outro usuário."
        ]);
        exit;
    }

    if ($novaSenha !== '') {
        $senhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $sql = "UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ? AND tipo = 'Mecanico'";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("sssi", $nome, $email, $senhaHash, $idMecanico);
    } else {
        $sql = "UPDATE usuarios SET nome = ?, email = ? WHERE id = ? AND tipo = 'Mecanico'";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("ssi", $nome, $email, $idMecanico);
    }

    if ($stmt->execute()) {
        if (intval($_SESSION['id']) === $idMecanico) {
            $_SESSION['nome'] = $nome;
        }

        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Dados atualizados com sucesso!",
            "usuario" => [
                "id" => $idMecanico,
                "nome" => $nome,
                "email" => $email
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Erro ao atualizar os dados."
        ]);
    }
    exit;
}

echo json_encode([
    "sucesso" => false,
    "mensagem" => "Ação inválida."
]);
?>