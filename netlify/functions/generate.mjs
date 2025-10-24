/**
 * Netlify Serverless Function: Proxy for AI APIs
 *
 * Endpoint: /.netlify/functions/generate
 * This function acts as a CORS-safe proxy between the frontend and AI APIs (Anthropic & OpenAI).
 */

export default async (req, context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    const { apiKey, prompt, provider = 'anthropic' } = body;

    // Validate inputs
    if (!apiKey || !apiKey.trim()) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate provider
    if (!['anthropic', 'openai'].includes(provider)) {
      return new Response(
        JSON.stringify({ error: 'Invalid provider. Must be "anthropic" or "openai"' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate API key format based on provider
    if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Anthropic API key format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      return new Response(
        JSON.stringify({ error: 'Invalid OpenAI API key format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!prompt || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let response, data;

    // Call appropriate API based on provider
    if (provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 8192,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: data.error?.message || 'Anthropic API error',
            details: data
          }),
          {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } else if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 8192,
          temperature: 0.7
        })
      });

      data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: data.error?.message || 'OpenAI API error',
            details: data
          }),
          {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Transform OpenAI response to match Anthropic format
      const transformedData = {
        content: [{
          type: 'text',
          text: data.choices[0].message.content
        }],
        model: data.model,
        usage: data.usage
      };

      return new Response(
        JSON.stringify(transformedData),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
