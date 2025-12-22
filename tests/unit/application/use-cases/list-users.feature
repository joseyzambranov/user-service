Feature: List Users Use Case
  As a system
  I want to list users with pagination
  So that users can browse all registered users

  Scenario: Successfully list users with default pagination
    Given the repository has multiple users
    When I execute the ListUsers use case without options
    Then users should be returned
    And the default limit should be applied
    And the repository list method should be called

  Scenario: Successfully list users with custom limit
    Given the repository has multiple users
    When I execute the ListUsers use case with limit 10
    Then up to 10 users should be returned
    And the repository should be called with limit 10

  Scenario: Successfully list users with pagination token
    Given the repository has multiple users
    And there is a next page token
    When I execute the ListUsers use case with the next token
    Then the next page of users should be returned
    And the repository should be called with the token
