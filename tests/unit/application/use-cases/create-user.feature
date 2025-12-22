Feature: Create User Use Case
  As a system
  I want to create new users
  So that users can register in the application

  Scenario: Successfully create a user with valid data
    Given valid user data with email "john@example.com", firstName "John", and lastName "Doe"
    And no user exists with that email
    When I execute the CreateUser use case
    Then a new user should be created
    And the user should have the correct email
    And the user should have the correct name
    And the repository save method should be called

  Scenario: Reject creation of user with duplicate email
    Given valid user data with email "existing@example.com"
    And a user already exists with that email
    When I try to execute the CreateUser use case
    Then it should throw a DuplicateUserError
    And the repository save method should not be called

  Scenario: Reject creation with invalid email format
    Given user data with invalid email "not-an-email"
    When I try to execute the CreateUser use case
    Then it should throw a validation error for email

  Scenario: Reject creation with empty first name
    Given user data with empty firstName
    When I try to execute the CreateUser use case
    Then it should throw a validation error for firstName

  Scenario: Reject creation with blacklisted email domain
    Given user data with email from blacklisted domain "user@tempmail.com"
    When I try to execute the CreateUser use case
    Then it should throw InvalidUserDataError for blacklisted domain
