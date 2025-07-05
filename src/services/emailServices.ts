// Configuração do EmailJS para envio de emails
// Este arquivo contém as configurações necessárias para o EmailJS

export const emailConfig = {
  // Substitua pelos seus dados do EmailJS
  serviceId: 'YOUR_SERVICE_ID',
  templateId: 'YOUR_TEMPLATE_ID', 
  publicKey: 'YOUR_PUBLIC_KEY',
  
  // Seu email para receber as mensagens
  toEmail: 'eduardo.benhur@gmail.com'
};

// Template de email que será enviado
export const emailTemplate = {
  subject: '{{subject}} - Contato do Site',
  body: `
    Nova mensagem do site QualPlay:
    
    Nome: {{from_name}}
    Email: {{from_email}}
    Assunto: {{subject}}
    
    Mensagem:
    {{message}}
    
    ---
    Enviado automaticamente do formulário de contato
  `
};