require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Call Gemini API using native fetch
 */
async function callGemini(prompt, systemInstruction = '') {
  if (!GEMINI_API_KEY) {
    return null; // Will trigger intelligent fallback
  }

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const contents = [];
  if (systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: `[System Instructions]: ${systemInstruction}` }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Đã hiểu và tuân thủ tuyệt đối chỉ thị.' }]
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      console.warn(`[Gemini API] Error status ${response.status}:`, errData);
      return null;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate || null;
  } catch (error) {
    console.error('[Gemini API] Request failed:', error.message);
    return null;
  }
}

/**
 * Summarize a single note
 */
async function generateSummary(title, content) {
  const systemInstruction = 
    'Bạn là trợ lý AI chuyên nghiệp phân tích và tóm tắt ghi chú cá nhân của Đại học Tôn Đức Thắng. ' +
    'Nhiệm vụ của bạn là đọc tiêu đề và nội dung ghi chú, tóm tắt lại các ý chính, hành động cần làm một cách ngắn gọn, súc tích bằng tiếng Việt.';

  const prompt = `Hãy tóm tắt ngắn gọn ghi chú sau:\n\nTiêu đề: ${title}\nNội dung: ${content}`;

  const aiResult = await callGemini(prompt, systemInstruction);
  if (aiResult) {
    return aiResult.trim();
  }

  // Smart fallback when no API key is provided
  return fallbackSummarizer(title, content);
}

/**
 * Question and Answer based on all notes of the user
 * Returns { answer, references: [{ id, title }] }
 */
async function answerQuestionWithNotes(question, notes) {
  if (!notes || notes.length === 0) {
    return {
      answer: 'Bạn chưa có ghi chú nào trong hệ thống để tìm kiếm thông tin.',
      references: []
    };
  }

  // Format context of all notes
  const notesContext = notes.map((n, idx) => {
    return `[Note #${n.id}] Tiêu đề: "${n.title}"\nNội dung: "${n.content}"`;
  }).join('\n\n---\n\n');

  const systemInstruction = 
    'Bạn là trợ lý thông minh cho ứng dụng Quản lý Ghi chú (Note App). ' +
    'Dựa duy nhất vào danh sách các ghi chú được cung cấp, hãy trả lời câu hỏi của người dùng. ' +
    'BẮT BUỘC: Cuối câu trả lời, bạn phải có mục "THAM KHẢO:" và liệt kê chính xác ID của các ghi chú đã sử dụng theo cú pháp: [REF: <note_id>]. ' +
    'Ví dụ: [REF: 1], [REF: 3]. ' +
    'Nếu thông tin không có trong ghi chú, hãy nói rõ là trong các ghi chú hiện tại chưa có thông tin này.';

  const prompt = `Danh sách các ghi chú của tôi:\n\n${notesContext}\n\nCâu hỏi: ${question}\n\nHãy trả lời một cách tự nhiên và chính xác:`;

  const aiResult = await callGemini(prompt, systemInstruction);

  if (aiResult) {
    // Extract [REF: <id>]
    const refRegex = /\[REF:\s*(\d+)\]/gi;
    const matchedIds = new Set();
    let match;
    while ((match = refRegex.exec(aiResult)) !== null) {
      matchedIds.add(parseInt(match[1], 10));
    }

    // Clean up text if needed or keep it formatted
    const cleanAnswer = aiResult.replace(/\[REF:\s*(\d+)\]/gi, '').trim();

    const references = [];
    for (const noteId of matchedIds) {
      const foundNote = notes.find(n => n.id === noteId);
      if (foundNote) {
        references.push({
          id: foundNote.id,
          title: foundNote.title
        });
      }
    }

    return {
      answer: cleanAnswer || aiResult,
      references
    };
  }

  // Fallback heuristic search if Gemini API is offline/unavailable
  return fallbackQA(question, notes);
}

/**
 * Intelligent Fallback Summarizer
 */
function fallbackSummarizer(title, content) {
  const cleanContent = (content || '').trim();
  if (!cleanContent) {
    return `Ghi chú "${title}" chưa có nội dung để tóm tắt.`;
  }

  const sentences = cleanContent.split(/[.\n!?]+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length <= 2) {
    return `📌 Tóm tắt ghi chú "${title}":\n${cleanContent}`;
  }

  const topPoints = sentences.slice(0, 3).map(s => `• ${s}`).join('\n');
  return `📌 Tóm tắt các ý chính trong ghi chú "${title}":\n${topPoints}\n(Gợi ý: Cung cấp GEMINI_API_KEY trong file .env để trải nghiệm AI đầy đủ).`;
}

/**
 * Intelligent Fallback Q&A
 */
function fallbackQA(question, notes) {
  const qTerms = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const matchedNotes = [];

  for (const note of notes) {
    const textToSearch = `${note.title} ${note.content}`.toLowerCase();
    let score = 0;
    for (const term of qTerms) {
      if (textToSearch.includes(term)) {
        score++;
      }
    }
    if (score > 0) {
      matchedNotes.push({ note, score });
    }
  }

  matchedNotes.sort((a, b) => b.score - a.score);

  if (matchedNotes.length === 0) {
    return {
      answer: `Không tìm thấy thông tin phù hợp trong các ghi chú của bạn cho câu hỏi: "${question}".`,
      references: []
    };
  }

  const topNotes = matchedNotes.slice(0, 3).map(m => m.note);
  const references = topNotes.map(n => ({ id: n.id, title: n.title }));

  const answer = `Dựa trên các ghi chú của bạn, câu hỏi "${question}" có liên quan đến các nội dung sau:\n\n` +
    topNotes.map(n => `• **${n.title}**: ${n.content.substring(0, 150)}${n.content.length > 150 ? '...' : ''}`).join('\n\n') +
    `\n\nBạn có thể nhấn vào các liên kết tham chiếu bên dưới để mở trực tiếp từng ghi chú.`;

  return {
    answer,
    references
  };
}

module.exports = {
  generateSummary,
  answerQuestionWithNotes
};
