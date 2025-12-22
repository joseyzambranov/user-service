Feature: Delete User Use Case
  As a system
  I want to delete users
  So that inactive users can be removed from the system

  Scenario: Successfully delete an existing user
    Given a user exists with id "user-123"
    When I execute the DeleteUser use case
    Then the user should be deleted
    And the repository delete method should be called

  Scenario: Reject deleting a non-existent user
    Given no user exists with id "non-existent-id"
    When I try to execute the DeleteUser use case
    Then it should throw a UserNotFoundError
    And the repository delete method should not be called
