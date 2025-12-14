Feature: User Domain Service
  As a system
  I want to enforce business rules for user management
  So that data integrity and business logic are maintained

  Scenario: Ensure email is unique when no existing user
    Given no user exists with email "new@example.com"
    When I check if the email is unique
    Then the validation should pass without errors

  Scenario: Prevent duplicate email registration
    Given a user already exists with email "existing@example.com"
    When I check if the email is unique
    Then it should throw a DuplicateUserError with the email

  Scenario: Validate user data with valid full name
    Given a user with fullName length of 50 characters
    When I validate the user data
    Then the validation should pass without errors

  Scenario: Reject user with full name too long
    Given a user with fullName length of 101 characters
    When I validate the user data
    Then it should throw InvalidUserDataError for field "fullName"

  Scenario: Accept user with allowed email domain
    Given a user with email "user@example.com"
    When I validate the user data
    Then the validation should pass without errors

  Scenario: Reject user with blacklisted email domain - tempmail
    Given a user with email "user@tempmail.com"
    When I validate the user data
    Then it should throw InvalidUserDataError with message containing "tempmail.com"

  Scenario: Reject user with blacklisted email domain - throwaway
    Given a user with email "user@throwaway.email"
    When I validate the user data
    Then it should throw InvalidUserDataError with message containing "throwaway.email"

  Scenario: Reject user with blacklisted email domain - guerrillamail
    Given a user with email "user@guerrillamail.com"
    When I validate the user data
    Then it should throw InvalidUserDataError with message containing "guerrillamail.com"

  Scenario: Check if user can be deleted
    Given a user with id "user-123"
    When I check if the user can be deleted
    Then it should return true

  Scenario: Transfer data between active users
    Given an active user with id "user-source"
    And an active user with id "user-target"
    When I transfer data from source to target
    Then the operation should complete successfully

  Scenario: Cannot transfer data from inactive source user
    Given an inactive user with id "user-source"
    And an active user with id "user-target"
    When I try to transfer data from source to target
    Then it should throw InvalidUserDataError with message "Source user must be active"

  Scenario: Cannot transfer data to inactive target user
    Given an active user with id "user-source"
    And an inactive user with id "user-target"
    When I try to transfer data from source to target
    Then it should throw InvalidUserDataError with message "Target user must be active"

  Scenario: Cannot transfer data when source user not found
    Given no user exists with id "non-existent-source"
    And an active user with id "user-target"
    When I try to transfer data from non-existent source to target
    Then it should throw InvalidUserDataError with message "One or both users not found"

  Scenario: Cannot transfer data when target user not found
    Given an active user with id "user-source"
    And no user exists with id "non-existent-target"
    When I try to transfer data from source to non-existent target
    Then it should throw InvalidUserDataError with message "One or both users not found"
