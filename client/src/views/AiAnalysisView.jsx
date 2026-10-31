import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  RefreshCw, 
  HelpCircle, 
  Layers, 
  Users, 
  Award,
  Lightbulb
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'حلل لي الأداء العام لجميع الحلقات وأبرز الإيجابيات والملاحظات',
  'من هم المعلمون الأكثر انضباطاً بناءً على تقارير المشرفين؟',
  'أعطني ملخصاً عن الطلاب وحجم الحفظ التراكمي ونسب الالتزام',
  'ما هي أبرز توصيات المشرفين الميدانيين التي تكررت في الزيارات؟'
];

export default function AiAnalysisView() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'مرحباً بك يا مدير النظام! أنا مستشارك الذكي المربوط بقاعدة بيانات نظام "حِفظ". يمكنك سؤالي عن أي طالب، حلقة، معلم، مقارنة بين المشرفين، أو طلب تحليل شامل ومخصص في أي وقت.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || loading) return;

    const userMsgObj = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsgObj]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build conversation history for API
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ sender: m.sender, text: m.text }));

      const res = await api.post('/ai/chat', {
        message: text.trim(),
        conversationHistory: history
      });

      const assistantMsgObj = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.reply || 'تم التحليل بنجاح.',
        modelUsed: res.modelUsed,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsgObj]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `عذراً، حدث خطأ أثناء معالجة الطلب: ${err.message}`,
          isError: true,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'تم بدء محادثة جديدة. كيف يمكنني خدمتك في إدارة حلقات القرآن الكريم اليوم؟',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="space-y-4 pb-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-emerald-950 p-5 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[10px] font-bold">
                Google Gemini Flash Live
              </span>
              <span className="text-amber-300 text-xs font-semibold">مربوط بقاعدة البيانات الحية</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white font-serif">
              المستشار والدردشة الذكية الحية لنظام حِفظ
            </h2>
            <p className="text-xs text-purple-200 mt-1 max-w-lg leading-relaxed">
              اطلب أي تحليل، مقارنة، استفسار عن طالب أو حلقة أو معلم مباشرة، وسيقوم الذكاء الاصطناعي باستخراج البيانات الدقيقة والإجابة فوراً.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-purple-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="بدء محادثة جديدة"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">محادثة جديدة</span>
            </button>
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Fast Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
          <span>مقترحات سريعة:</span>
        </span>
        {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-3 py-1.5 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 border border-slate-200 hover:border-purple-300 rounded-xl text-xs whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-emerald-700 text-white'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-emerald-800 text-white rounded-tr-none shadow-xs'
                      : msg.isError
                      ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div
                    className={`mt-1.5 pt-1 text-[9px] flex items-center justify-between ${
                      isUser ? 'text-emerald-200 border-t border-emerald-700/50' : 'text-slate-400 border-t border-slate-200/50'
                    }`}
                  >
                    <span>{new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.modelUsed && <span>نموذج: {msg.modelUsed}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-600 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">المساعد الذكي يفحص قاعدة البيانات ويقوم بالتحليل...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="اكتب طلبك أو سؤالك هنا (مثال: قارن بين أداء المعلمين هذا الشهر، أو حلل أداء حلقة معينة)..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
