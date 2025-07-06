import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle, Github, Linkedin, Globe } from 'lucide-react';
import emailjs from '@emailjs/browser';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Configurações do EmailJS - SUBSTITUA pelos seus dados
      const serviceId = 'service_t3q4gv5';
      const templateId = 'template_ogv8w68'; 
      const publicKey = 'EgOqKpjeVkIeF1NFW';

      // Dados que serão enviados para o template
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_email: 'contato.qualplay@gmail.com', // SEU EMAIL AQUI
      };

      // Enviar email via EmailJS
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      setError('Erro ao enviar mensagem. Tente novamente ou use o contato direto.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="text-green-400 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-2">Mensagem Enviada!</h2>
          <p className="text-slate-300">
            Obrigado pelo seu contato. Retornarei em breve!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
           <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/seu_logo.png" 
              alt="Eduardo Ben-Hur Logo" 
              className="w-16 h-16 rounded-full object-cover shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex items-center">
              <MessageSquare className="text-blue-400" size={48} />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Entre em Contato
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Tem alguma dúvida, sugestão ou feedback sobre o Busca Filmes Pro? Adoraria ouvir de você!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-slate-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-400 flex items-center gap-2">
              <Mail size={24} />
              Envie uma Mensagem
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-md">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu.email@exemplo.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                  Assunto
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Assunto da sua mensagem"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Escreva sua mensagem aqui..."
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Enviar Mensagem
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info & Social Links */}
          <div className="space-y-8">
            {/* Developer Info */}
            <div className="bg-slate-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-blue-400">Sobre o Desenvolvedor</h2>
              
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="/seu_logo.png" 
                  alt="Eduardo Ben-Hur" 
                  className="w-20 h-20 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <h3 className="text-xl font-semibold text-white">Eduardo Ben-Hur</h3>
                  <p className="text-blue-400">Especialista em Data Science e Digital Business</p>
                  <p className="text-slate-400 text-sm">R • SQL • Python • Analytics • Gen IA • Brincando com desenvolvimento Web</p>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed mb-6">
                Sou um Analista de Dados que acredita que ideias só valem a pena quando saem do papel. 
                O 'Brincando com desenvolvimento Web' na minha descrição não é piada: este projeto é meu laboratório
                para dar vida a pequenas ideias que vão contribuir para o desenvolvimento de habilidades para coisas
                maiores e mais interessantes, transformando códigos complexos em algo útil e interativo. 
                Meu objetivo é construir ferramentas que eu mesmo gostaria de usar.
              </p>

              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-white mb-2">📧 Contato Direto:</h4>
                <p className="text-slate-300 text-sm">
                  <strong>Email:</strong> contato.qualplay@gmail.com
                </p>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Conecte-se comigo:</h3>
                <div className="flex flex-col space-y-3">
                  <a
                    href="https://github.com/DuhBenhur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <Github size={20} />
                    <span>GitHub</span>
                  </a>
                  <a
                    href="https://linkedin.com/in/eduardobenhur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <Linkedin size={20} />
                    <span>LinkedIn</span>
                  </a>
                  <a
                    href="https://github.com/DuhBenhur?tab=repositories"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <Globe size={20} />
                    <span>Portfolio</span>
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-slate-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-blue-400">Perguntas Frequentes</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Como posso sugerir novas funcionalidades?</h3>
                  <p className="text-slate-300 text-sm">
                    Use o formulário de contato ou abra uma issue no GitHub do projeto. 
                    Todas as sugestões são bem-vindas!
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Encontrei um bug, como reportar?</h3>
                  <p className="text-slate-300 text-sm">
                    Descreva o problema detalhadamente no formulário, incluindo os passos 
                    para reproduzir o erro.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">O projeto é open source?</h3>
                  <p className="text-slate-300 text-sm">
                    Sim! O código está disponível no GitHub para contribuições e melhorias.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-12 mt-12 border-t border-slate-700">
          <p className="text-slate-400">
            Respondo todas as mensagens em até 48 horas 📱
          </p>
          <p className="text-slate-500 text-sm mt-2">
            © 2025 Eduardo Ben-Hur - QualPlay?
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;