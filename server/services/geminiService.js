/**
 * Gemini AI Integration Service (On-Demand only)
 * Provides analysis for Halaqat, Teachers, Supervisors, and Executive Summaries
 */

const analyzeWithGemini = async (promptData) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('مفتاح Gemini API غير معرف في متغيرات البيئة');
  }

  const systemInstruction = `أنت مستشار وخبير تربوي وإداري متخصص في تقييم وتطوير مشاريع ومراكز تحفيظ القرآن الكريم. 
قم بتحليل البيانات المرفقة بموضوعية ومهنية عالية باللغة العربية الفصحى. 
قدم نتائجك مقسمة بوضوح إلى:
1. ملخص تنفيذي للأداء
2. أبرز نقاط القوة والإنجازات
3. المشكلات والملاحظات المتكررة ونقاط الضعف
4. توصيات عملية ومحددة للإدارة والمشرفين والمعلمين
5. مؤشر الأداء العام (من 100%)`;

  const fullPrompt = `${systemInstruction}\n\nبيانات التقرير المطلوب تحليله:\n${JSON.stringify(promptData, null, 2)}`;

  // Try modern models with fallback
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (outputText) {
          return {
            success: true,
            modelUsed: model,
            analysis: outputText,
            timestamp: new Date()
          };
        }
      } else {
        const errorData = await response.text();
        lastError = new Error(`Model ${model} returned ${response.status}: ${errorData}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('فشل الاتصال بخدمة الذكاء الاصطناعي');
};

/**
 * Chat with Gemini with live database context
 */
const chatWithGemini = async (userMessage, conversationHistory = [], dbContext = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('مفتاح Gemini API غير معرف في متغيرات البيئة');
  }

  const targetedInfo = dbContext.targetedContext 
    ? `\n=== [بيانات حية مستهدفة تم استخراجها فوراً من قاعدة البيانات لهذا السؤال] ===\n${JSON.stringify(dbContext.targetedContext, null, 2)}\n`
    : '';

  const systemInstruction = `أنت المساعد الذكي والمستشار الاستراتيجي لنظام "حِفظ" لإدارة ومتابعة حلقات تحفيظ القرآن الكريم.
لديك وصول كامل ومباشر إلى قاعدة البيانات الحية الحقيقية (MongoDB Atlas).
البيانات الحقيقية المحدثة متوفرة أمامك بالكامل أدناه.

قواعد صارمة للإجابة:
1. إياك ثم إياك أن تطلب من المستخدم تزويدك بالبيانات أو المعلومات؛ كل البيانات موجودة بين يديك في هذا السياق أدناه.
2. أجب فوراً بدقة عالية، واذكر الأرقام والإحصائيات وأسماء الطلاب والمعلمين والحلقات الحقيقية الموجودة في البيانات أدناه.
3. تحدث بأسلوب إداري وتربوي رفيع وفصيح، وقدم تحليلات ذكية ومقارنات وتوصيات عملية.

=== بيانات قاعدة البيانات الحية الحالية ===
- إجمالي عدد الحلقات: ${dbContext.totalHalaqat || 31} حلقة
- إجمالي عدد الطلاب النشطين: ${dbContext.totalStudents || 400} طالب
- إجمالي المشرفين الميدانيين: ${dbContext.totalSupervisors || 2}

- قائمة الحلقات الـ 31 مع المعلمين والمساجد وأعداد الطلاب:
${JSON.stringify(dbContext.halaqatSummary || [], null, 1)}

- قائمة بأبرز الطلاب الحفّاظ (أعلى أجزاء حفظاً في النظام):
${JSON.stringify(dbContext.topMemorizersList || [], null, 1)}

- توزيع مستويات حفظ الطلاب:
${JSON.stringify(dbContext.partsDistribution || [], null, 1)}

- إحصائيات وعينات التقارير الشهرية وتقييمات المشرفين:
${JSON.stringify(dbContext.recentStats || {}, null, 1)}
${targetedInfo}
`;

  // Format clean conversation history for Gemini API
  const contents = [];

  if (conversationHistory && conversationHistory.length > 0) {
    // Keep last 8 turns of conversation
    const recentHist = conversationHistory.slice(-8);
    recentHist.forEach(msg => {
      if (msg.text && msg.text.trim()) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text.trim() }]
        });
      }
    });
  }

  // Ensure current user message is appended
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return {
            reply: replyText,
            modelUsed: model,
            timestamp: new Date()
          };
        }
      } else {
        const errTxt = await response.text();
        lastError = new Error(`Gemini ${model} status ${response.status}: ${errTxt}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('تعذر إتمام المحادثة مع الذكاء الاصطناعي');
};

module.exports = {
  analyzeWithGemini,
  chatWithGemini
};
