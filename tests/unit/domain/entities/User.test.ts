/**
 * User Entity - BDD Tests with Cucumber
 *
 * 📚 EXAMEN AWS: Dominio 1.1 - Testing
 * - BDD (Behavior-Driven Development) con Gherkin
 * - Tests legibles enfocados en comportamiento de negocio
 * - Validaciones de dominio y reglas de negocio
 * - Test fixtures para DRY (Don't Repeat Yourself)
 */

import { defineFeature, loadFeature } from 'jest-cucumber';
import { User } from '@domain/entities/User';
import path from 'path';
import {
  TEST_USER_DATA,
  UPDATED_USER_DATA,
  VALID_SPECIAL_NAMES,
  UserFixtures
} from '../../../fixtures/userFixtures';

const feature = loadFeature(path.join(__dirname, './user.feature'));

defineFeature(feature, (test) => {
  // ============================================
  // Scenario: Create a new user with valid data
  // ============================================
  test('Create a new user with valid data', ({ given, when, then, and }) => {
    let userData: any;
    let user: User;

    given(/^valid user data with email "(.*)", firstName "(.*)", and lastName "(.*)"$/, (email, firstName, lastName) => {
      userData = { email, firstName, lastName };
    });

    when('I create a new user', () => {
      user = User.create(userData);
    });

    then('the user should have the correct email', () => {
      expect(user.email).toBe(userData.email);
    });

    and('the user should have the correct first name', () => {
      expect(user.firstName).toBe(userData.firstName);
    });

    and('the user should have the correct last name', () => {
      expect(user.lastName).toBe(userData.lastName);
    });

    and('the user should be active by default', () => {
      expect(user.isActive).toBe(true);
    });

    and('the user should have creation timestamps', () => {
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ============================================
  // Scenario: Create a new user with explicit inactive status
  // ============================================
  test('Create a new user with explicit inactive status', ({ given, when, then }) => {
    let userData: any;
    let user: User;

    given('valid user data with isActive set to false', () => {
      userData = {
        ...TEST_USER_DATA,
        isActive: false,
      };
    });

    when('I create a new user', () => {
      user = User.create(userData);
    });

    then('the user should be inactive', () => {
      expect(user.isActive).toBe(false);
    });
  });

  // ============================================
  // Scenario: Reconstitute a user from database
  // ============================================
  test('Reconstitute a user from database', ({ given, when, then, and }) => {
    let dbData: any;
    let user: User;

    given(/^user data from database with id "(.*)"$/, (id) => {
      dbData = UserFixtures.withId(id);
    });

    when('I reconstitute the user', () => {
      user = User.reconstitute(dbData);
    });

    then('the user should have the same id from database', () => {
      expect(user.id).toBe(dbData.id);
    });

    and('the user should have all the original properties', () => {
      expect(user.email).toBe(dbData.email);
      expect(user.firstName).toBe(dbData.firstName);
      expect(user.lastName).toBe(dbData.lastName);
      expect(user.isActive).toBe(dbData.isActive);
      expect(user.createdAt).toEqual(dbData.createdAt);
      expect(user.updatedAt).toEqual(dbData.updatedAt);
    });
  });

  // ============================================
  // Scenario: Get user full name
  // ============================================
  test('Get user full name', ({ given, when, then }) => {
    let user: User;
    let fullName: string;

    given(/^a user with firstName "(.*)" and lastName "(.*)"$/, (firstName, lastName) => {
      user = User.create({
        ...TEST_USER_DATA,
        firstName,
        lastName,
      });
    });

    when('I get the full name', () => {
      fullName = user.fullName;
    });

    then(/^the full name should be "(.*)"$/, (expectedFullName) => {
      expect(fullName).toBe(expectedFullName);
    });
  });

  // ============================================
  // Scenario: Update user email
  // ============================================
  test('Update user email', ({ given, when, then, and }) => {
    let user: User;
    let oldUpdatedAt: Date;

    given(/^an existing user with email "(.*)"$/, (email) => {
      user = User.create({
        ...TEST_USER_DATA,
        email,
      });
      oldUpdatedAt = user.updatedAt;
    });

    when(/^I update the email to "(.*)"$/, (newEmail) => {
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);
      user.update({ email: newEmail });
    });

    then(/^the user email should be "(.*)"$/, (expectedEmail) => {
      expect(user.email).toBe(expectedEmail);
    });

    and('the updatedAt timestamp should be updated', () => {
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
      jest.useRealTimers();
    });
  });

  // ============================================
  // Scenario: Update user first name
  // ============================================
  test('Update user first name', ({ given, when, then, and }) => {
    let user: User;

    given(/^an existing user with firstName "(.*)"$/, (firstName) => {
      user = User.create({
        ...TEST_USER_DATA,
        firstName,
      });
    });

    when(/^I update the firstName to "(.*)"$/, (newFirstName) => {
      user.update({ firstName: newFirstName });
    });

    then(/^the user firstName should be "(.*)"$/, (expectedFirstName) => {
      expect(user.firstName).toBe(expectedFirstName);
    });

    and('the full name should reflect the change', () => {
      expect(user.fullName).toBe(`${UPDATED_USER_DATA.firstName} ${TEST_USER_DATA.lastName}`);
    });
  });

  // ============================================
  // Scenario: Update multiple user fields
  // ============================================
  test('Update multiple user fields', ({ given, when, then, and }) => {
    let user: User;

    given('an existing user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when(/^I update email to "(.*)", firstName to "(.*)", and lastName to "(.*)"$/, (email, firstName, lastName) => {
      user.update({ email, firstName, lastName });
    });

    then('all fields should be updated correctly', () => {
      expect(user.email).toBe(UPDATED_USER_DATA.email);
      expect(user.firstName).toBe(UPDATED_USER_DATA.firstName);
      expect(user.lastName).toBe(UPDATED_USER_DATA.lastName);
    });

    and(/^the full name should be "(.*)"$/, (expectedFullName) => {
      expect(user.fullName).toBe(expectedFullName);
    });
  });

  // ============================================
  // Scenario: Reject invalid email format
  // ============================================
  test('Reject invalid email format', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('an existing user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when(/^I try to update email to "(.*)"$/, (invalidEmail) => {
      try {
        user.update({ email: invalidEmail });
      } catch (e) {
        error = e as Error;
      }
    });

    then(/^it should throw an error "(.*)"$/, (expectedMessage) => {
      expect(error).not.toBeNull();
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Reject empty email
  // ============================================
  test('Reject empty email', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('an existing user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when('I try to update email to an empty string', () => {
      try {
        user.update({ email: '' });
      } catch (e) {
        error = e as Error;
      }
    });

    then(/^it should throw an error "(.*)"$/, (expectedMessage) => {
      expect(error).not.toBeNull();
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Reject email that is too long
  // ============================================
  test('Reject email that is too long', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('an existing user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when('I try to update email to a string longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      try {
        user.update({ email: longEmail });
      } catch (e) {
        error = e as Error;
      }
    });

    then(/^it should throw an error "(.*)"$/, (expectedMessage) => {
      expect(error).not.toBeNull();
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Reject empty first name
  // ============================================
  test('Reject empty first name', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('an existing user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when('I try to update firstName to an empty string', () => {
      try {
        user.update({ firstName: '' });
      } catch (e) {
        error = e as Error;
      }
    });

    then(/^it should throw an error "(.*)"$/, (expectedMessage) => {
      expect(error).not.toBeNull();
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Reject first name that is too short
  // ============================================
  test('Reject first name that is too short', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('an existing user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when(/^I try to update firstName to "(.*)"$/, (shortName) => {
      try {
        user.update({ firstName: shortName });
      } catch (e) {
        error = e as Error;
      }
    });

    then(/^it should throw an error "(.*)"$/, (expectedMessage) => {
      expect(error).not.toBeNull();
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Reject first name that is too long
  // ============================================
  test('Reject first name that is too long', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('an existing user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when('I try to update firstName to a string longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      try {
        user.update({ firstName: longName });
      } catch (e) {
        error = e as Error;
      }
    });

    then(/^it should throw an error "(.*)"$/, (expectedMessage) => {
      expect(error).not.toBeNull();
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Reject first name with invalid characters
  // ============================================
  test('Reject first name with invalid characters', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('an existing user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when(/^I try to update firstName to "(.*)"$/, (invalidName) => {
      try {
        user.update({ firstName: invalidName });
      } catch (e) {
        error = e as Error;
      }
    });

    then(/^it should throw an error "(.*)"$/, (expectedMessage) => {
      expect(error).not.toBeNull();
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Accept first name with accents and special characters
  // ============================================
  test('Accept first name with accents and special characters', ({ given, when, then }) => {
    let user: User;

    given('an existing user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when(/^I update firstName to "(.*)"$/, (newName) => {
      user.update({ firstName: newName });
    });

    then('the firstName should be updated successfully', () => {
      expect(user.firstName).toBe(VALID_SPECIAL_NAMES.withAccentsAndHyphen);
    });
  });

  // ============================================
  // Scenario: Activate an inactive user
  // ============================================
  test('Activate an inactive user', ({ given, when, then, and }) => {
    let user: User;
    let oldUpdatedAt: Date;

    given('an inactive user', () => {
      user = User.create({
        ...TEST_USER_DATA,
        isActive: false,
      });
      oldUpdatedAt = user.updatedAt;
    });

    when('I activate the user', () => {
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);
      user.activate();
    });

    then('the user should be active', () => {
      expect(user.isActive).toBe(true);
    });

    and('the updatedAt timestamp should be updated', () => {
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
      jest.useRealTimers();
    });
  });

  // ============================================
  // Scenario: Cannot activate an already active user
  // ============================================
  test('Cannot activate an already active user', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('an active user', () => {
      user = User.create(TEST_USER_DATA);
    });

    when('I try to activate the user', () => {
      try {
        user.activate();
      } catch (e) {
        error = e as Error;
      }
    });

    then(/^it should throw an error "(.*)"$/, (expectedMessage) => {
      expect(error).not.toBeNull();
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Deactivate an active user
  // ============================================
  test('Deactivate an active user', ({ given, when, then, and }) => {
    let user: User;
    let oldUpdatedAt: Date;

    given('an active user', () => {
      user = User.create(TEST_USER_DATA);
      oldUpdatedAt = user.updatedAt;
    });

    when('I deactivate the user', () => {
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);
      user.deactivate();
    });

    then('the user should be inactive', () => {
      expect(user.isActive).toBe(false);
    });

    and('the updatedAt timestamp should be updated', () => {
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
      jest.useRealTimers();
    });
  });

  // ============================================
  // Scenario: Cannot deactivate an already inactive user
  // ============================================
  test('Cannot deactivate an already inactive user', ({ given, when, then }) => {
    let user: User;
    let error: Error | null = null;

    given('an inactive user', () => {
      user = User.create({
        ...TEST_USER_DATA,
        isActive: false,
      });
    });

    when('I try to deactivate the user', () => {
      try {
        user.deactivate();
      } catch (e) {
        error = e as Error;
      }
    });

    then(/^it should throw an error "(.*)"$/, (expectedMessage) => {
      expect(error).not.toBeNull();
      expect(error?.message).toBe(expectedMessage);
    });
  });

  // ============================================
  // Scenario: Convert user to plain object
  // ============================================
  test('Convert user to plain object', ({ given, when, then }) => {
    let user: User;
    let userData: any;
    let plainObject: any;

    given('a reconstituted user from database', () => {
      userData = UserFixtures.activeUser();
      user = User.reconstitute(userData);
    });

    when('I convert the user to a plain object', () => {
      plainObject = user.toObject();
    });

    then('the object should have all user properties', () => {
      expect(plainObject).toEqual(userData);
    });
  });

  // ============================================
  // Scenario: Compare users by ID for equality
  // ============================================
  test('Compare users by ID for equality', ({ given, when, then }) => {
    let user1: User;
    let user2: User;
    let areEqual: boolean;

    given(/^two users with the same ID "(.*)"$/, (id) => {
      const userData = UserFixtures.withId(id);
      user1 = User.reconstitute(userData);
      user2 = User.reconstitute(userData);
    });

    when('I compare them for equality', () => {
      areEqual = user1.equals(user2);
    });

    then('they should be equal', () => {
      expect(areEqual).toBe(true);
    });
  });

  // ============================================
  // Scenario: Compare users with different IDs
  // ============================================
  test('Compare users with different IDs', ({ given, when, then }) => {
    let user1: User;
    let user2: User;
    let areEqual: boolean;

    given('two users with different IDs', () => {
      user1 = User.reconstitute(UserFixtures.withId('user-123'));
      user2 = User.reconstitute(UserFixtures.withId('user-456'));
    });

    when('I compare them for equality', () => {
      areEqual = user1.equals(user2);
    });

    then('they should not be equal', () => {
      expect(areEqual).toBe(false);
    });
  });

  // ============================================
  // Scenario: Compare user with null
  // ============================================
  test('Compare user with null', ({ given, when, then }) => {
    let user: User;
    let areEqual: boolean;

    given('a valid user', () => {
      user = User.reconstitute(UserFixtures.activeUser());
    });

    when('I compare it with null', () => {
      areEqual = user.equals(null as any);
    });

    then('they should not be equal', () => {
      expect(areEqual).toBe(false);
    });
  });
});
