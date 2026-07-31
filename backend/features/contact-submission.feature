@contact
Feature: Public contact submission
  As a portfolio visitor
  I want to send a contact message
  So that the site owner can respond

  Scenario: Successful public contact submission
    Given contact persistence succeeds
    When I submit a valid public contact message
    Then the contact response status should be 200
    And the contact response body should be:
      """
      {"ok":true}
      """
    And no contact notification should run during the request

  Scenario: Persistence failure returns a polite error
    Given contact persistence fails
    When I submit a valid public contact message
    Then the contact response status should be 200
    And the contact response body should be:
      """
      {"ok":false,"error":"Nie udalo sie zapisac wiadomosci. Sprobuj ponownie pozniej."}
      """

  Scenario: Invalid contact payload is rejected before application handling
    When I submit an invalid public contact message
    Then the contact response status should be 400
    And no contact persistence or notification should run

  Scenario: Expired contact data is removed after the retention window
    Given contact data is retained for 90 days
    When the contact retention sweep runs on 23 March 2026
    Then contact data older than 23 December 2025 should be removed
