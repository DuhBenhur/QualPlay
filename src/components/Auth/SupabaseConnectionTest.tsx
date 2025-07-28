import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const SupabaseConnectionTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');

  const testConnection = async () => {
    setTestResult('Testando conexão...');
    
    try {
      // Teste 1: Verificar se o cliente existe
      if (!supabase) {
        setTestResult('❌ Supabase não inicializado');
        return;
      }

      // Teste 2: Verificar sessão
      const sessionResult = await supabase.auth.getSession();
      
      if ('error' in sessionResult && sessionResult.error) {
        setTestResult(`❌ Erro na sessão: ${sessionResult.error.message}`);
        return;
      }

      // Teste 3: Verificar se consegue fazer uma query simples
      try {
        await supabase.from('profiles').select('*');
        setTestResult('✅ Conexão com Supabase funcionando!');
      } catch (queryError) {
        setTestResult(`❌ Erro na query: ${queryError}`);
      }

      setTestResult('✅ Conexão com Supabase funcionando!');
      
    } catch (error) {
      setTestResult(`❌ Erro inesperado: ${error}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-blue-600 text-white p-3 rounded-lg max-w-xs">
      <button 
        onClick={testConnection}
        className="text-sm font-bold mb-2 block w-full"
      >
        TESTAR SUPABASE
      </button>
      {testResult && (
        <div className="text-xs">
          {testResult}
        </div>
      )}
    </div>
  );
};

export default SupabaseConnectionTest; 