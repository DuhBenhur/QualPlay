# 📧 Como Configurar o Envio de Emails
npm add @emailjs/browser@latest


Para que o formulário de contato funcione e envie emails reais para você, siga estes passos:

## 1. 🔧 Criar Conta no EmailJS (Gratuito)

1. Acesse: https://www.emailjs.com/
2. Clique em "Sign Up" e crie uma conta gratuita
3. Confirme seu email

## 2. 📝 Configurar Serviço de Email

1. No painel do EmailJS, vá em **"Email Services"**
2. Clique em **"Add New Service"**
3. Escolha seu provedor (Gmail, Outlook, etc.)
4. Siga as instruções para conectar sua conta
5. **Anote o Service ID** que aparecerá

## 3. 📋 Criar Template de Email

1. Vá em **"Email Templates"**
2. Clique em **"Create New Template"**
3. Configure assim:

**Subject:** `{{subject}} - Contato do Site`

**Content:**
```
Nova mensagem do site QualPlay:

Nome: {{from_name}}
Email: {{from_email}}
Assunto: {{subject}}

Mensagem:
{{message}}

---
Enviado automaticamente do formulário de contato
```

4. **Anote o Template ID**

## 4. 🔑 Obter Public Key

1. Vá em **"Account"** → **"General"**
2. Copie sua **Public Key**

## 5. ⚙️ Configurar no Código

Abra o arquivo `src/components/ContactPage.tsx` e substitua:

```typescript
const serviceId = 'YOUR_SERVICE_ID'; // Cole seu Service ID aqui
const templateId = 'YOUR_TEMPLATE_ID'; // Cole seu Template ID aqui  
const publicKey = 'YOUR_PUBLIC_KEY'; // Cole sua Public Key aqui
```

E também substitua:
```typescript
to_email: 'seu.email@gmail.com', // Coloque SEU email aqui
```

## 6. 🎯 Exemplo de Configuração

```typescript
const serviceId = 'service_abc123';
const templateId = 'template_xyz789'; 
const publicKey = 'user_def456';

// ...

to_email: 'eduardo@exemplo.com',
```

## 7. ✅ Testar

1. Salve as alterações
2. Acesse a página de contato
3. Envie uma mensagem de teste
4. Verifique se chegou no seu email!

## 🆓 Limites Gratuitos

- **200 emails/mês** na conta gratuita
- Perfeito para um site pessoal
- Sem necessidade de servidor próprio

## 🔧 Alternativas Simples

Se preferir algo mais simples, você pode:

1. **Usar mailto:** Abre o cliente de email do usuário
2. **WhatsApp:** Redireciona para WhatsApp Web
3. **Telegram:** Link direto para conversa

Quer que eu implemente alguma dessas alternativas também?