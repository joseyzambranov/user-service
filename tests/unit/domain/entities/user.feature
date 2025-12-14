Feature: User Entity Management
  As a system administrator
  I want to manage user entities
  So that I can maintain user data with business rules

  Scenario: Create a new user with valid data
    Given valid user data with email "test@example.com", firstName "John", and lastName "Doe"
    When I create a new user
    Then the user should have the correct email
    And the user should have the correct first name
    And the user should have the correct last name
    And the user should be active by default
    And the user should have creation timestamps

  Scenario: Create a new user with explicit inactive status
    Given valid user data with isActive set to false
    When I create a new user
    Then the user should be inactive

  Scenario: Reconstitute a user from database
    Given user data from database with id "user-123"
    When I reconstitute the user
    Then the user should have the same id from database
    And the user should have all the original properties

  Scenario: Get user full name
    Given a user with firstName "José" and lastName "O'Brien"
    When I get the full name
    Then the full name should be "José O'Brien"

  Scenario: Update user email
    Given an existing user with email "old@example.com"
    When I update the email to "new@example.com"
    Then the user email should be "new@example.com"
    And the updatedAt timestamp should be updated

  Scenario: Update user first name
    Given an existing user with firstName "John"
    When I update the firstName to "Jane"
    Then the user firstName should be "Jane"
    And the full name should reflect the change

  Scenario: Update multiple user fields
    Given an existing user
    When I update email to "new@example.com", firstName to "Jane", and lastName to "Smith"
    Then all fields should be updated correctly
    And the full name should be "Jane Smith"

  Scenario: Reject invalid email format
    Given an existing user
    When I try to update email to "invalid-email"
    Then it should throw an error "Invalid email format"

  Scenario: Reject empty email
    Given an existing user
    When I try to update email to an empty string
    Then it should throw an error "Email is required"

  Scenario: Reject email that is too long
    Given an existing user
    When I try to update email to a string longer than 255 characters
    Then it should throw an error "Email is too long (max 255 characters)"

  Scenario: Reject empty first name
    Given an existing user
    When I try to update firstName to an empty string
    Then it should throw an error "First name is required"

  Scenario: Reject first name that is too short
    Given an existing user
    When I try to update firstName to "J"
    Then it should throw an error "First name must be at least 2 characters"

  Scenario: Reject first name that is too long
    Given an existing user
    When I try to update firstName to a string longer than 50 characters
    Then it should throw an error "First name is too long (max 50 characters)"

  Scenario: Reject first name with invalid characters
    Given an existing user
    When I try to update firstName to "John123"
    Then it should throw an error "First name contains invalid characters"

  Scenario: Accept first name with accents and special characters
    Given an existing user
    When I update firstName to "José-María"
    Then the firstName should be updated successfully

  Scenario: Activate an inactive user
    Given an inactive user
    When I activate the user
    Then the user should be active
    And the updatedAt timestamp should be updated

  Scenario: Cannot activate an already active user
    Given an active user
    When I try to activate the user
    Then it should throw an error "User is already active"

  Scenario: Deactivate an active user
    Given an active user
    When I deactivate the user
    Then the user should be inactive
    And the updatedAt timestamp should be updated

  Scenario: Cannot deactivate an already inactive user
    Given an inactive user
    When I try to deactivate the user
    Then it should throw an error "User is already inactive"

  Scenario: Convert user to plain object
    Given a reconstituted user from database
    When I convert the user to a plain object
    Then the object should have all user properties

  Scenario: Compare users by ID for equality
    Given two users with the same ID "user-123"
    When I compare them for equality
    Then they should be equal

  Scenario: Compare users with different IDs
    Given two users with different IDs
    When I compare them for equality
    Then they should not be equal

  Scenario: Compare user with null
    Given a valid user
    When I compare it with null
    Then they should not be equal
