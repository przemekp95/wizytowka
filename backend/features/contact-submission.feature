@contact
Feature: Public contact submission
  As a portfolio visitor
  I want to send a contact message
  So that the site owner can respond

  Scenario: Successful public contact submission
    Given contact persistence succeeds
    And contact notification succeeds
    When I submit a valid public contact message
    Then the contact response status should be 200
    And the contact response body should be:
      """
      {"ok":true}
      """

  Scenario: Delivery failure after persistence returns a polite error
    Given contact persistence succeeds
    And contact notification fails
    When I submit a valid public contact message
    Then the contact response status should be 200
    And the contact response body should be:
      """
      {"ok":false,"error":"Nie udalo sie dostarczyc wiadomosci. Sprobuj ponownie pozniej."}
      """

  Scenario: Invalid contact payload is rejected before application handling
    When I submit an invalid public contact message
    Then the contact response status should be 400
    And no contact persistence or notification should run
