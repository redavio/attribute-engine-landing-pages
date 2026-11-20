"""AI_PROVIDER=openai runs every AI step on OpenAI: copy labels (the engine's openai tagger) and the
screenshot labels (vision), with cost from tokens. Nothing goes to OpenRouter or the Vercel gateway."""
import os

from website_attribute_finder import tagging, vision


def test_settings_switch_to_openai(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_MODEL", "gpt-4.1-mini")
    monkeypatch.setenv("OPENAI_PRICES", "0.4,1.6")
    s = tagging.provider_settings({"jev_provider": "openrouter", "vision_model": "anthropic/claude-sonnet-5"})
    assert s["jev_provider"] == "openai" and s["openai_model"] == "gpt-4.1-mini"
    assert s["openai_prices"] == [0.4, 1.6] and s["vision_model"] == "gpt-4.1-mini"


def test_settings_unchanged_without_the_switch(monkeypatch):
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    s = {"jev_provider": "openrouter", "vision_model": "x"}
    assert tagging.provider_settings(s) == s


def test_vision_route(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "k")
    url, key = vision.route()
    assert url == "https://api.openai.com/v1/chat/completions" and key == "k"
    monkeypatch.delenv("AI_PROVIDER")
    monkeypatch.setenv("AI_GATEWAY_API_KEY", "g")
    assert vision.route() == (vision.CHAT_URL, "g")


def test_vision_cost_from_tokens(monkeypatch):
    monkeypatch.setenv("OPENAI_PRICES", "0.4,1.6")
    assert vision.token_cost({"prompt_tokens": 1000, "completion_tokens": 100}) == (1000 * 0.4 + 100 * 1.6) / 1e6
