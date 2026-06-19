const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_KEY';

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

export async function callGemini<T>(prompt: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}
