#!/usr/bin/env node
/**
 * CDK App Entry Point
 *
 * 📚 EXAMEN AWS: Infrastructure as Code with CDK
 * - Define AWS resources usando TypeScript
 * - Genera CloudFormation templates con `cdk synth`
 * - Deploy con `cdk deploy`
 */

import * as cdk from 'aws-cdk-lib';
import { UserServiceStack } from '../lib/user-service-stack';

const app = new cdk.App();

new UserServiceStack(app, 'UserServiceStack', {
  /**
   * 📚 EXAMEN AWS: Environment Configuration
   *
   * Opciones:
   * 1. Environment-agnostic (no especificar env):
   *    - Funciona en cualquier account/region
   *    - NO puede usar lookups (VPCs existentes, hosted zones, etc.)
   *    - Single template deployable anywhere
   *
   * 2. CLI-based (usar variables de CLI):
   *    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
   *    - Usa credenciales del AWS CLI actual
   *    - Permite lookups
   *
   * 3. Hard-coded (especificar explícitamente):
   *    env: { account: '123456789012', region: 'us-east-1' }
   *    - Para production environments específicos
   *    - Más seguro (no accidental deployments)
   */

  // Opción 2: Usar credenciales del CLI (mejor para desarrollo/estudio)
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2', // Oregon - donde hicimos bootstrap
  },

  /**
   * Tags aplicados a todos los recursos del stack
   * 📚 EXAMEN AWS: Tagging Best Practices
   * - Organización de recursos
   * - Cost allocation
   * - Compliance y governance
   */
  tags: {
    Project: 'UserService',
    Environment: process.env.ENVIRONMENT || 'dev',
    ManagedBy: 'CDK',
    Owner: 'DevTeam',
  },

  /**
   * Stack description visible en CloudFormation console
   */
  description:
    'User Service - DynamoDB + Lambda + API Gateway for AWS Certified Developer exam study',
});
