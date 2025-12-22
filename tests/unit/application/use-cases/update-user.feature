Feature: Update User Use Case
  As a system
  I want to update existing users
  So that user information can be modified

  Scenario: Successfully update a user with valid data
    Given a user exists with id "user-123"
    When I execute the UpdateUser use case with new data
    Then the user should be updated
    And the repository update method should be called

  Scenario: Reject updating a non-existent user
    Given no user exists with id "non-existent-id"
    When I try to execute the UpdateUser use case
    Then it should throw a UserNotFoundError

  Scenario: Reject updating with duplicate email
    Given a user exists with id "user-123" and email "old@example.com"
    And another user exists with email "taken@example.com"
    When I try to update the user email to "taken@example.com"
    Then it should throw a DuplicateUserError

  Scenario: Successfully update user email
    Given a user exists with id "user-123" and email "old@example.com"
    And no other user has email "new@example.com"
    When I update the user email to "new@example.com"
    Then the user email should be updated to "new@example.com"
    And email uniqueness should be validated
