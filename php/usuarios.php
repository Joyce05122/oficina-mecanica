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

$adminSolicitado = intval($_REQUEST['admin_id'] ?? 0);
$idAdmin = $adminSolicitado > 0 ? $adminSolicitado : intval($_SESSION['id']);

$verificaAdmin = $conexao->prepare("SELECT id FROM usuarios WHERE id = ? AND tipo = 'Administrador' LIMIT 1");
$verificaAdmin->bind_param("i", $idAdmin);
$verificaAdmin->execute();
$verificaAdmin->store_result();

if ($verificaAdmin->num_rows === 0) {
    http_response_code(403);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Acesso restrito ao administrador."
    ]);
    exit;
}
$verificaAdmin->close();

$acao = $_GET['acao'] ?? 'listar';

if ($acao === 'listar') {
    $sql = "SELECT id, nome, email, tipo FROM usuarios ORDER BY id DESC";
    $resultado = $conexao->query($sql);

    $usuarios = [];
    while ($linha = $resultado->fetch_assoc()) {
        $usuarios[] = $linha;
    }

    echo json_encode([
        "sucesso" => true,
        "dados" => $usuarios
    ]);
    exit;
}

if ($acao === 'salvar') {
    $id = trim($_POST['id'] ?? '');
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';
    $tipo = trim($_POST['perfil'] ?? '');

    if ($nome === '' || $email === '' || !in_array($tipo, ['Administrador', 'Mecanico'])) {
        http_response_code(400);
        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Preencha nome, e-mail e perfil corretamente."
        ]);
        exit;
    }

    if ($id !== '') {
        $idInt = intval($id);

        $verifica = $conexao->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ? LIMIT 1");
        $verifica->bind_param("si", $email, $idInt);
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

        if ($senha !== '') {
            $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
            $sql = "UPDATE usuarios SET nome = ?, email = ?, senha = ?, tipo = ? WHERE id = ?";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("ssssi", $nome, $email, $senhaHash, $tipo, $idInt);
        } else {
            $sql = "UPDATE usuarios SET nome = ?, email = ?, tipo = ? WHERE id = ?";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("sssi", $nome, $email, $tipo, $idInt);
        }

        if ($stmt->execute()) {
            echo json_encode([
                "sucesso" => true,
                "mensagem" => "Usuário atualizado com sucesso!"
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "sucesso" => false,
                "mensagem" => "Erro ao atualizar usuário."
            ]);
        }
        exit;
    }

    if ($senha === '') {
        http_response_code(400);
        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Informe uma senha para o novo usuário."
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
    exit;
}

if ($acao === 'excluir') {
    $idExcluir = intval($_POST['id'] ?? 0);

    if ($idExcluir === $idAdmin) {
        http_response_code(400);
        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Você não pode excluir o próprio usuário logado."
        ]);
        exit;
    }

    $stmt = $conexao->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $idExcluir);

    if ($stmt->execute()) {
        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Usuário excluído com sucesso!"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Não foi possível excluir este usuário (ele pode estar vinculado a ordens de serviço)."
        ]);
    }
    exit;
}

echo json_encode([
    "sucesso" => false,
    "mensagem" => "Ação inválida."
]);
?>