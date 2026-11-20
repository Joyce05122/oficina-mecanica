<?php
require_once "conexao.php";
require_once "permissao.php";
exigirLogin();

header("Content-Type: application/json; charset=UTF-8");

try {

    if ($_SERVER["REQUEST_METHOD"] === "GET") {

        $sql = "SELECT 
                    v.id,
                    v.cliente_id,
                    c.nome AS proprietario,
                    v.placa,
                    v.marca,
                    v.modelo,
                    v.ano,
                    v.cor,
                    v.status
                FROM veiculos v
                INNER JOIN clientes c ON v.cliente_id = c.id
                ORDER BY v.id DESC";

        $resultado = $conexao->query($sql);

        $veiculos = [];

        while ($linha = $resultado->fetch_assoc()) {
            $veiculos[] = $linha;
        }

        echo json_encode($veiculos);
        exit;
    }

    $dados = json_decode(file_get_contents("php://input"), true);

    if (!$dados) {
        throw new Exception("Dados inválidos.");
    }

    $acao = $dados["acao"] ?? "";

    if ($acao === "salvar") {

        $id = $dados["id"] ?? "";
        $proprietario = trim($dados["proprietario"] ?? "");
        $placa = strtoupper(trim($dados["placa"] ?? ""));
        $marca = trim($dados["marca"] ?? "");
        $modelo = trim($dados["modelo"] ?? "");
        $ano = (int) ($dados["ano"] ?? 0);
        $cor = trim($dados["cor"] ?? "");
        $status = $dados["status"] ?? "Disponível";

        if (
            $proprietario === "" ||
            $placa === "" ||
            $marca === "" ||
            $modelo === "" ||
            $ano === 0
        ) {
            throw new Exception("Preencha os campos obrigatórios.");
        }

        if (!in_array($status, ["Disponível", "Em atendimento"])) {
            throw new Exception("Status inválido.");
        }

        $sqlCliente = "SELECT id FROM clientes WHERE nome = ? LIMIT 1";

        $stmt = $conexao->prepare($sqlCliente);
        $stmt->bind_param("s", $proprietario);
        $stmt->execute();

        $resultado = $stmt->get_result();

        if ($resultado->num_rows === 0) {
            throw new Exception("Cliente não encontrado. Cadastre o cliente primeiro.");
        }

        $cliente = $resultado->fetch_assoc();
        $clienteId = (int) $cliente["id"];

        if ($id !== "") {

            $id = (int) $id;

            $sql = "UPDATE veiculos
                    SET cliente_id = ?,
                        placa = ?,
                        marca = ?,
                        modelo = ?,
                        ano = ?,
                        cor = ?,
                        status = ?
                    WHERE id = ?";

            $stmt = $conexao->prepare($sql);

            $stmt->bind_param(
                "isssissi",
                $clienteId,
                $placa,
                $marca,
                $modelo,
                $ano,
                $cor,
                $status,
                $id
            );

            $stmt->execute();

            echo json_encode([
                "sucesso" => true,
                "mensagem" => "Veículo atualizado com sucesso!"
            ]);

        } else {

            $sql = "INSERT INTO veiculos
                    (cliente_id, placa, marca, modelo, ano, cor, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)";

            $stmt = $conexao->prepare($sql);

            $stmt->bind_param(
                "isssiss",
                $clienteId,
                $placa,
                $marca,
                $modelo,
                $ano,
                $cor,
                $status
            );

            $stmt->execute();

            echo json_encode([
                "sucesso" => true,
                "mensagem" => "Veículo cadastrado com sucesso!"
            ]);
        }

        exit;
    }

    if ($acao === "excluir") {
        exigirAdmin();

        $id = (int) ($dados["id"] ?? 0);

        $sql = "DELETE FROM veiculos WHERE id = ?";

        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception("Veículo não encontrado.");
        }

        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Veículo excluído com sucesso!"
        ]);

        exit;
    }

    throw new Exception("Ação inválida.");

} catch (Throwable $erro) {

    http_response_code(400);

    echo json_encode([
        "sucesso" => false,
        "mensagem" => $erro->getMessage()
    ]);
}
?>