Feature: Get User Use Case
  As a system
  I want to retrieve user information by ID
  So that users can view their profiles

  Scenario: Successfully get an existing user
    Given a user exists with id "user-123"
    When I execute the GetUser use case with that id
    Then the user should be returned
    And the user should have the correct id
    And the repository findById method should be called

  Scenario: Reject getting a non-existent user
    Given no user exists with id "non-existent-id"
    When I try to execute the GetUser use case with that id
    Then it should throw a UserNotFoundError
    And the error should contain the user id

  Scenario: Reject getting user with invalid id format
    Given an invalid id ""
    When I try to execute the GetUser use case
    Then it should throw a validation error
