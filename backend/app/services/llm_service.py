import httpx

from app.core.config import settings


class LLMService:
    def __init__(self) -> None:
        self.provider = settings.LLM_PROVIDER.lower()
        self.model = settings.LLM_MODEL

    async def generate(self, system_prompt: str, user_message: str) -> str:
        if self.provider == "openai":
            return await self._generate_openai(system_prompt, user_message)
        if self.provider == "anthropic":
            return await self._generate_anthropic(system_prompt, user_message)
        return self._fallback_response(user_message)

    async def _generate_openai(self, system_prompt: str, user_message: str) -> str:
        if not settings.OPENAI_API_KEY:
            return self._fallback_response(user_message)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "temperature": 0.4,
        }
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    async def _generate_anthropic(self, system_prompt: str, user_message: str) -> str:
        if not settings.ANTHROPIC_API_KEY:
            return self._fallback_response(user_message)

        payload = {
            "model": self.model,
            "max_tokens": 700,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}],
        }
        headers = {
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"].strip()

    @staticmethod
    def _fallback_response(user_message: str) -> str:
        return (
            "LLM provider is not configured yet. "
            f"Received your message: {user_message}"
        )


llm_service = LLMService()
