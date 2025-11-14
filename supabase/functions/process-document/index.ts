import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { documentId, fileUrl, fileType, geminiApiKey } = await req.json();

    if (!documentId || !fileUrl || !fileType || !geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.arrayBuffer();

    let extractedText = '';

    if (fileType === 'application/pdf') {
      extractedText = await extractTextFromPDF(fileBuffer);
    } else if (fileType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Image OCR processing requires client-side processing with Tesseract.js. Please process images in the browser.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      throw new Error('Unsupported file type');
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    const summaries = await generateSummaries(extractedText, geminiApiKey);

    await supabase.from('summaries').insert({
      document_id: documentId,
      extracted_text: extractedText,
      summary_short: summaries.short,
      summary_medium: summaries.medium,
      summary_long: summaries.long,
      key_points: summaries.keyPoints,
    });

    await supabase
      .from('documents')
      .update({ status: 'completed' })
      .eq('id', documentId);

    return new Response(
      JSON.stringify({ success: true, summaries }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing document:', error);

    const { documentId } = await req.json().catch(() => ({}));
    if (documentId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId);

      await supabase.from('summaries').insert({
        document_id: documentId,
        error_message: error.message,
      });
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process document' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfData = new Uint8Array(buffer);
    const text = String.fromCharCode.apply(null, Array.from(pdfData));
    
    const textRegex = /\(([^)]+)\)\s*Tj/g;
    const matches = text.match(textRegex);
    
    if (matches && matches.length > 0) {
      return matches
        .map(match => match.replace(/\((.+)\)\s*Tj/, '$1'))
        .join(' ')
        .trim();
    }
    
    return 'PDF text extraction requires advanced parsing. Please use a simpler PDF or consider using the image upload option.';
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

async function generateSummaries(text: string, apiKey: string) {
  const summaryLengths = {
    short: '2-3 sentences',
    medium: '1 paragraph (4-6 sentences)',
    long: '2-3 paragraphs',
  };

  const summaries: any = {};

  for (const [length, description] of Object.entries(summaryLengths)) {
    const prompt = `Summarize the following text in ${description}. Focus on the main ideas and key information:\n\n${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    summaries[length] = data.candidates[0].content.parts[0].text;
  }

  const keyPointsPrompt = `Extract 5-7 key points from the following text as a JSON array of strings:\n\n${text}`;
  const keyPointsResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: keyPointsPrompt }] }],
      }),
    }
  );

  const keyPointsData = await keyPointsResponse.json();
  const keyPointsText = keyPointsData.candidates[0].content.parts[0].text;
  
  let keyPoints = [];
  try {
    const jsonMatch = keyPointsText.match(/\[.*\]/s);
    if (jsonMatch) {
      keyPoints = JSON.parse(jsonMatch[0]);
    } else {
      keyPoints = keyPointsText.split('\n').filter((line: string) => line.trim().length > 0).slice(0, 7);
    }
  } catch {
    keyPoints = keyPointsText.split('\n').filter((line: string) => line.trim().length > 0).slice(0, 7);
  }

  return {
    short: summaries.short,
    medium: summaries.medium,
    long: summaries.long,
    keyPoints,
  };
}
