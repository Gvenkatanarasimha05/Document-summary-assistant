const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-lite"; 

export async function generateSummaries(text) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const summaryLengths = {
    short: '2-3 sentences',
    medium: '1 paragraph (4-6 sentences)',
    long: '2-3 paragraphs',
  };

  const summaries = {};

  for (const [length, description] of Object.entries(summaryLengths)) {
    const prompt = `Summarize the following text in ${description}. Focus on the main ideas and key information:\n\n${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      console.error("FULL GEMINI ERROR:", err || response);
      throw new Error("Gemini API failed");
    }

    const data = await response.json();
    summaries[length] = data.candidates[0].content.parts[0].text;
  }

  // KEY POINTS — use SAME MODEL (not 1.5)
  const keyPointsPrompt = `Extract 5-7 key points from the following text. Return them as a numbered list:\n\n${text}`;
  const keyPointsResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: keyPointsPrompt }] }],
      }),
    }
  );

  if (!keyPointsResponse.ok) {
    const err = await keyPointsResponse.json().catch(() => null);
    console.error("FULL GEMINI ERROR:", err || keyPointsResponse);
    throw new Error("Gemini API failed");
  }

  const keyPointsData = await keyPointsResponse.json();
  const keyPointsText = keyPointsData.candidates[0].content.parts[0].text;

  const keyPoints = keyPointsText
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter(point => point.length > 0);

  return {
    short: summaries.short,
    medium: summaries.medium,
    long: summaries.long,
    keyPoints,
  };
}
