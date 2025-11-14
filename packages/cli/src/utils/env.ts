import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { generateDockerCompose, generateEnvFile, generateReadme } from './templates.js';

export interface EnvConfig {
  mediaPath: string;
  port: number;
  databaseUrl: string;
  postgresUser: string;
  postgresPassword: string;
  postgresDb: string;
}


/**
 * Create configuration files in the installation directory
 */
export async function createConfigFiles(config: EnvConfig, installDir: string): Promise<boolean> {
  const spinner = ora('Creating configuration files...').start();
  
  try {
    // Create docker-compose.yml
    const composeContent = generateDockerCompose(config);
    const composePath = path.join(installDir, 'docker-compose.yml');
    await fs.promises.writeFile(composePath, composeContent, 'utf-8');
    
    // Create .env file
    const envContent = generateEnvFile(config);
    const envPath = path.join(installDir, '.env');
    await fs.promises.writeFile(envPath, envContent, 'utf-8');
    
    // Create README
    const readmeContent = generateReadme(config.port, installDir);
    const readmePath = path.join(installDir, 'README.md');
    await fs.promises.writeFile(readmePath, readmeContent, 'utf-8');
    
    spinner.succeed(chalk.green('Configuration files created successfully'));
    return true;
  } catch (error: any) {
    spinner.fail(chalk.red('Failed to create configuration files'));
    console.error(chalk.red('\nError details:'), error.message);
    return false;
  }
}
