CREATE DATABASE IF NOT EXISTS oficina_mecanica;

USE oficina_mecanica;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('Administrador', 'Mecanico') NOT NULL
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    endereco VARCHAR(255),
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo'
);

CREATE TABLE veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    ano INT,
    cor VARCHAR(30),
    status ENUM('Disponível', 'Em atendimento') DEFAULT 'Disponível',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE ordens_servico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    veiculo_id INT NOT NULL,
    mecanico_id INT,
    usuario_id INT NULL,
    descricao TEXT NOT NULL,
    data_abertura DATE NOT NULL,
    data_agendamento DATETIME,
    status ENUM('Aberta', 'Em andamento', 'Aguardando peças', 'Concluída', 'Cancelada') DEFAULT 'Aberta',
    valor DECIMAL(10,2),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
    FOREIGN KEY (mecanico_id) REFERENCES usuarios(id)
);

CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ordem_servico_id INT NOT NULL UNIQUE,
    mecanico_id INT NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id),
    FOREIGN KEY (mecanico_id) REFERENCES usuarios(id)
);

CREATE TABLE historico_operacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ordem_servico_id INT NOT NULL,
    usuario_id INT NULL,
    acao VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);