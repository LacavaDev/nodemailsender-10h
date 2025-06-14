const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')
const {Sequelize, DataTypes} = require('sequelize')

//CONFIGURAÇÃO EXPRESS
const portaServidorBackendHTTP = 8082

const servidorHTTP = express() // <- Criação do "backend"

servidorHTTP.use(express.json()) // <- backend usa JSON como formato de dados

servidorHTTP.use(cors({ //<- backend permite ser chamado por qualquer origem
    origin: '*'
}))

//Configuração Sequelize

const conexaoBancoDeDados = new Sequelize({ // <- Conexão com SQLITE
    dialect: 'sqlite',
    storage: './conexaoBancoDeDados.sqlite'
})

// TABELA DE HISTÓRICO DE E-MAILS
const TabelaDeHistoricoDeEmails = conexaoBancoDeDados.define('historicoDeEmails', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    remetente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    destinatario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    corpo: {
        type: DataTypes.TEXT,
        allowNull: false
    }
})

// CONFIGURAÇÃO NODEMAILER
const meuEmail = 'deitylink38@gmail.com'
const transportadorDeEmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: meuEmail,
        pass: 'noph aetp iwvx czmo'
    }
})

servidorHTTP.get('/emails', async (req, resp) => resp.status(200).json(await TabelaDeHistoricoDeEmails.findAll()))

servidorHTTP.post('/enviar-email', async (requisicao, resposta) => {
    const {titulo, destinatario, conteudo} = requisicao.body

    if (!titulo) {
        return resposta.status(400).json('E-MAIL INCOMPLETO, FALTA TÍTULO')
    }
    if (!destinatario) {
        return resposta.status(400).json('E-MAIL INCOMPLETO, FALTA DESTINATÁRIO')
    }
    if (!conteudo) {
        return resposta.status(400).json('E-MAIL INCOMPLETO, FALTA CONTEÚDO')
    }

    try {
        await TabelaDeHistoricoDeEmails.create({
            destinatario,
            titulo,
            remetente: meuEmail,
            corpo: conteudo
        })
    } catch (error) {
        console.log('Erro ao registrar e-mail na base de histórico')
        return resposta.status(500).json('Erro Interno no Servidor')
    }

    transportadorDeEmail.sendMail({
        from: meuEmail,
        to: destinatario,
        subject: titulo,
        text: conteudo
    }, 
        (error, info) => {
            if (error) {
                console.log('Erro ao enviar e-mail')
                resposta.status(500).send('Erro ao enviar e-mail')
            }
            console.log('Sucesso ao enviar e-mail ' + info.response)
            resposta.status(201).send('OK')
        }
    )
})

// INICIALIZAÇÃO DA APLICAÇÃO

servidorHTTP.listen(portaServidorBackendHTTP, async () => {
    console.log('SERVIDOR HTTP INICIADO')    
    await conexaoBancoDeDados.sync()
    console.log('BANCO DE DADOS SINCRONIZADO')
})