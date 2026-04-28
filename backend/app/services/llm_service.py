import json
from collections.abc import AsyncIterator

import httpx

from app.core.config import settings


class LLMProviderError(Exception):
    def __init__(self, message: str, provider_status_code: int | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.provider_status_code = provider_status_code


class LLMService:
    def __init__(self) -> None:
        self.provider = settings.LLM_PROVIDER.lower()
        self.model = settings.LLM_MODEL

    async def generate(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        if self.provider == "openai":
            return await self._generate_openai(system_prompt, messages)
        if self.provider == "anthropic":
            return await self._generate_anthropic(system_prompt, messages)
        return self._fallback_response(messages)

    async def generate_stream(self, system_prompt: str, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        if self.provider == "openai":
            async for chunk in self._stream_openai(system_prompt, messages):
                yield chunk
            return

        if self.provider == "anthropic":
            async for chunk in self._stream_anthropic(system_prompt, messages):
                yield chunk
            return

        async for chunk in self._stream_fallback(messages):
            yield chunk

    async def _generate_openai(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        if not settings.OPENAI_API_KEY:
            return self._fallback_response(messages)

        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system_prompt}, *messages],
            "temperature": 0.4,
        }
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise LLMProviderError(
                    self._extract_provider_error_message(exc.response),
                    provider_status_code=exc.response.status_code,
                ) from exc
            except httpx.HTTPError as exc:
                raise LLMProviderError(f"OpenAI request failed: {exc}") from exc

            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    async def _generate_anthropic(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        if not settings.ANTHROPIC_API_KEY:
            return self._fallback_response(messages)

        payload = {
            "model": self.model,
            "max_tokens": 900,
            "system": system_prompt,
            "messages": messages,
        }
        headers = {
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise LLMProviderError(
                    self._extract_provider_error_message(exc.response),
                    provider_status_code=exc.response.status_code,
                ) from exc
            except httpx.HTTPError as exc:
                raise LLMProviderError(f"Anthropic request failed: {exc}") from exc

            data = response.json()
            return "".join(block.get("text", "") for block in data.get("content", [])).strip()

    async def _stream_openai(self, system_prompt: str, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        if not settings.OPENAI_API_KEY:
            async for chunk in self._stream_fallback(messages):
                yield chunk
            return

        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system_prompt}, *messages],
            "temperature": 0.4,
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=60) as client:
            try:
                async with client.stream(
                    "POST",
                    "https://api.openai.com/v1/chat/completions",
                    json=payload,
                    headers=headers,
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        chunk = line.removeprefix("data: ").strip()
                        if chunk == "[DONE]":
                            break
                        try:
                            data = json.loads(chunk)
                        except json.JSONDecodeError:
                            continue
                        delta = data.get("choices", [{}])[0].get("delta", {}).get("content")
                        if delta:
                            yield delta
            except httpx.HTTPStatusError as exc:
                raise LLMProviderError(
                    self._extract_provider_error_message(exc.response),
                    provider_status_code=exc.response.status_code,
                ) from exc
            except httpx.HTTPError as exc:
                raise LLMProviderError(f"OpenAI stream request failed: {exc}") from exc

    async def _stream_anthropic(self, system_prompt: str, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        if not settings.ANTHROPIC_API_KEY:
            async for chunk in self._stream_fallback(messages):
                yield chunk
            return

        payload = {
            "model": self.model,
            "max_tokens": 900,
            "system": system_prompt,
            "messages": messages,
            "stream": True,
        }
        headers = {
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=60) as client:
            try:
                async with client.stream(
                    "POST",
                    "https://api.anthropic.com/v1/messages",
                    json=payload,
                    headers=headers,
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        chunk = line.removeprefix("data: ").strip()
                        try:
                            data = json.loads(chunk)
                        except json.JSONDecodeError:
                            continue
                        if data.get("type") == "content_block_delta":
                            text = data.get("delta", {}).get("text")
                            if text:
                                yield text
            except httpx.HTTPStatusError as exc:
                raise LLMProviderError(
                    self._extract_provider_error_message(exc.response),
                    provider_status_code=exc.response.status_code,
                ) from exc
            except httpx.HTTPError as exc:
                raise LLMProviderError(f"Anthropic stream request failed: {exc}") from exc

    async def _stream_fallback(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        response = self._fallback_response(messages)
        for token in response.split(" "):
            yield f"{token} "

    @staticmethod
    def _fallback_response(messages: list[dict[str, str]]) -> str:
        latest_user_message = next(
            (msg.get("content", "") for msg in reversed(messages) if msg.get("role") == "user"),
            "",
        )
        return (
            "LLM provider is not configured yet. "
            f"Received your message: {latest_user_message}"
        )

    @staticmethod
    def _extract_provider_error_message(response: httpx.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            return f"LLM provider request failed with status {response.status_code}."

        if isinstance(payload, dict):
            error = payload.get("error")
            if isinstance(error, dict):
                message = error.get("message")
                if message:
                    return str(message)
            message = payload.get("message")
            if message:
                return str(message)

        return f"LLM provider request failed with status {response.status_code}."


llm_service = LLMService()
