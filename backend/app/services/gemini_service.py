import os
from google import genai
from google.genai import types


def generate_gemini_advice(prompt: str, api_key: str = None) -> str:
    """
    Calls the Gemini API using the google-genai SDK with the server's
    GEMINI_API_KEY environment variable.
    """
    key_to_use = api_key or os.environ.get("GEMINI_API_KEY")
    if not key_to_use:
        raise ValueError("No Gemini API key available on server")

    client = genai.Client(api_key=key_to_use)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(max_output_tokens=400, temperature=0.7),
    )

    if not response or not response.text:
        raise ValueError("Failed to retrieve valid content from Gemini API")

    return response.text.strip()
