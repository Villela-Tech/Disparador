# 🔑 **GUIA DE TESTE - SISTEMA DE CHAVES**

## **📋 CHAVES DISPONÍVEIS PARA TESTE**

### **Chaves de Teste Rápido:**
- `TESTE1234567DIAS` - 7 dias
- `TESTE7654321DIAS` - 1 dia  
- `TESTE9999999DIAS` - 9 dias

### **Chaves de Produção:**
- `SENDER2024PRO30DIAS` - 30 dias
- `SENDER2024TRIAL7DIAS` - 7 dias
- `SENDER2024LIFETIME` - Vitalício
- `SENDER2024FREE5DIAS` - 5 dias
- `SENDER2024DEMO3DIAS` - 3 dias

## **🧪 COMO TESTAR**

### **1. Instalação da Extensão**
1. Abra `chrome://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta do projeto

### **2. Primeira Ativação**
1. A extensão será instalada
2. Aguarde 3 segundos
3. Aparecerá um popup de ativação
4. Clique em "OK" para ativar
5. Digite uma das chaves de teste
6. Confirme a ativação

### **3. Teste de Funcionalidades**
1. Abra o popup da extensão
2. Verifique se os botões estão habilitados
3. Teste o envio de mensagens
4. Verifique o status "✅ Extensão Ativada"

### **4. Teste do Sistema de Ativação Moderno**
1. **Botão "Ativar Agora"**: Deve abrir modal moderno para digitar chave
2. **Modal de chave**: Design elegante com validação em tempo real
3. **Validação automática**: Detecta chaves válidas e inválidas
4. **Feedback visual**: Status colorido (verde/vermelho/azul)
5. **Chaves de teste**: Mostradas no próprio modal
6. **Ativação com Enter**: Pressione Enter para validar
7. **Modal de detalhes**: Aparece após ativação com informações completas
8. **Banner de status integrado**: Mostra informações da licença no próprio banner (design ultra compacto)
9. **Clique no banner**: Abre modal com detalhes completos da licença
10. **Teste de expiração**: Botão para simular expiração da licença

### **5. Teste do Sistema de Contato**
1. **Botão "Entrar em Contato"**: Deve abrir modal com WhatsApp
2. **Botão flutuante**: Aparece no canto inferior direito quando não ativado
3. **Link WhatsApp**: Deve abrir WhatsApp com número (51) 9498-1842

### **6. Teste de Expiração**
1. Use uma chave de 1 dia: `TESTE1DIA123456789`
2. Aguarde a expiração (ou mude a data do sistema)
3. Verifique se os botões ficam desabilitados
4. **Modal de expiração** deve mostrar:
   - Botão "🔑 Reativar Agora"
   - Botão "📱 Entrar em Contato"
   - Botão "❌ Fechar"
5. Teste a reativação com nova chave
6. Teste o botão de contato (deve abrir WhatsApp)

### **7. Teste de Chave Inválida**
1. Tente ativar com chave inexistente: `CHAVEINVALIDA123`
2. Verifique se aparece erro
3. Tente reutilizar chave já usada
4. Verifique se é rejeitada

### **8. Como Verificar os 7 Dias de TESTE1234567DIAS**
1. **Ative com a chave**: `TESTE1234567DIAS`

### **9. Como Testar Expiração Rápida (1 Dia)**
1. **Ative com a chave**: `TESTE1DIA123456789`
2. **Após ativação**: Aparece modal com detalhes completos
3. **Verifique o banner**: No canto superior direito mostra (banner ultra compacto):
   - ✅ Ativada
   - 1 dia restante
4. **Clique no banner**: Abre modal com detalhes completos
5. **Verifique as informações**:
   - Data de Ativação: Hoje
   - Data de Expiração: 1 dia a partir de hoje
   - Duração Total: 1 dia
   - Dias Restantes: 1 dia
6. **Teste de expiração**: 
   - **"Testar Expiração"**: Simulação instantânea
   - **"Teste Real"**: Testa o sistema real de verificação
7. **Modal de expiração** mostra 3 opções:
   - 🔑 Reativar Agora
   - 📱 Entrar em Contato
   - ❌ Fechar

## **🔧 CONFIGURAÇÕES DE TESTE**

### **Para Testar Expiração Rápida:**
1. Use chave de 1 dia: `TESTE1DIA123456789`
2. Mude a data do sistema para o dia seguinte
3. Recarregue a extensão
4. Verifique se detecta expiração

### **Para Resetar Chaves Usadas:**
1. Abra `chrome://extensions/`
2. Clique em "Detalhes" na extensão
3. Clique em "Dados do site"
4. Clique em "Limpar dados"
5. Recarregue a extensão

## **📊 LOGS DE DEBUG**

### **Console do Background:**
1. Abra `chrome://extensions/`
2. Clique em "Detalhes" na extensão
3. Clique em "Inspecionar visualizações: service worker"
4. Veja os logs no console

### **Console do Popup:**
1. Abra o popup da extensão
2. Clique com botão direito
3. Selecione "Inspecionar"
4. Veja os logs no console

## **✅ CHECKLIST DE TESTES**

### **Sistema de Ativação Moderno:**
- [ ] Modal de ativação abre ao clicar "Ativar Agora"
- [ ] Design moderno e elegante
- [ ] Campo de entrada com placeholder
- [ ] Validação com Enter funciona
- [ ] Feedback visual colorido (verde/vermelho/azul)
- [ ] Chaves de teste mostradas no modal
- [ ] Chave válida ativa a extensão
- [ ] Chave inválida mostra erro
- [ ] Botões de hover funcionam
- [ ] Modal fecha após ativação

### **Sistema de Detalhes da Licença:**
- [ ] Modal de detalhes aparece após ativação
- [ ] Mostra data de ativação correta
- [ ] Mostra data de expiração correta
- [ ] Calcula dias restantes corretamente
- [ ] Banner integrado mostra informações da licença
- [ ] Clique no banner abre modal de detalhes
- [ ] Botão "Testar Expiração" funciona
- [ ] Simulação de expiração bloqueia funcionalidades
- [ ] Modal de expiração mostra 3 opções
- [ ] Botão "Reativar Agora" funciona
- [ ] Botão "Entrar em Contato" funciona
- [ ] Reativação após expiração funciona

### **Sistema Geral:**
- [ ] Instalação solicita ativação
- [ ] Botões ficam habilitados após ativação
- [ ] Status visual mostra "Ativado"
- [ ] Expiração bloqueia funcionalidades
- [ ] Reativação funciona após expiração
- [ ] Logs aparecem no console

## **🚨 PROBLEMAS COMUNS**

### **Chave não é aceita:**
- Verifique se está no formato correto
- Confirme se a chave existe no Keys.json
- Verifique se não foi usada anteriormente

### **Extensão não ativa:**
- Verifique os logs no console
- Confirme se o Keys.json está acessível
- Teste com chave de teste simples

### **Botões não habilitam:**
- Verifique se a ativação foi bem-sucedida
- Confirme se não há erros no popup.js
- Teste recarregar a extensão

## **📝 NOTAS IMPORTANTES**

- **Para Produção**: Substitua as URLs no background.js
- **Chaves de Teste**: Use apenas para desenvolvimento
- **Storage Local**: Chaves usadas ficam salvas localmente
- **Reset Completo**: Limpe dados da extensão para resetar

---

**🎯 Objetivo**: Verificar se o sistema de chaves funciona corretamente antes de implementar em produção.
