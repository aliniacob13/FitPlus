from app.api.v1.ai import _build_conversation_title, _build_llm_messages


class DummyMessage:
    def __init__(self, role: str, content: str) -> None:
        self.role = role
        self.content = content


def test_build_conversation_title_trims_and_limits_length() -> None:
    raw = "   Vreau      un plan foarte lung pentru antrenament care depaseste limita standard   "
    title = _build_conversation_title(raw)

    assert "  " not in title
    assert len(title) <= 80


def test_build_llm_messages_keeps_user_and_assistant_and_appends_latest() -> None:
    history = [
        DummyMessage("user", "Salut"),
        DummyMessage("assistant", "Buna"),
        DummyMessage("system", "ignore"),
    ]
    output = _build_llm_messages(history, "Mesaj nou")

    assert output == [
        {"role": "user", "content": "Salut"},
        {"role": "assistant", "content": "Buna"},
        {"role": "user", "content": "Mesaj nou"},
    ]
