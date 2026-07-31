@chat
Feature: Public chat messaging
  As a portfolio visitor
  I want to ask the AI assistant a question
  So that I can quickly learn more about the portfolio

  Scenario: Successful public chat message
    Given chat is enabled
    And chat completion succeeds
    When I submit a valid chat message
    Then the chat response status should be 201
    And the chat response body should be:
      """
      {"response":"Jasne, moge pomoc.","sessionId":"chat-session-1"}
      """

  Scenario: Chat unavailable returns a stable 503 payload
    Given chat is disabled
    When I submit a valid chat message
    Then the chat response status should be 503
    And the chat response body should be:
      """
      {"error":"Chat is unavailable because OPENAI_API_KEY is not configured.","code":"CHAT_UNAVAILABLE"}
      """

  Scenario: A client-chosen non-UUID chat session is rejected before application handling
    When I submit an invalid chat message
    Then the chat response status should be 400
    And no chat context or completion should run
