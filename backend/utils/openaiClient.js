const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const askAI = async (systemPrompt, userPrompt, options = {}) => {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return options.json ? JSON.parse(content) : content;
};

module.exports = { askAI };