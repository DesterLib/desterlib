import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Get the installation directory where DesterLib will be installed
 * Defaults to ~/.desterlib
 */
export function getInstallationDir(): string {
  return path.join(os.homedir(), '.desterlib');
}

/**
 * Check if DesterLib configuration exists
 */
export function isInstalled(): boolean {
  const installDir = getInstallationDir();
  const dockerComposePath = path.join(installDir, 'docker-compose.yml');
  const envPath = path.join(installDir, '.env');
  return fs.existsSync(dockerComposePath) && fs.existsSync(envPath);
}

/**
 * Validate if a path exists and is accessible
 */
export function validatePath(inputPath: string): { valid: boolean; message?: string } {
  if (!inputPath || inputPath.trim() === '') {
    return { valid: false, message: 'Path cannot be empty' };
  }

  const expandedPath = inputPath.replace(/^~/, process.env.HOME || '');
  
  try {
    if (!fs.existsSync(expandedPath)) {
      return { 
        valid: false, 
        message: `Path does not exist: ${expandedPath}. Please create it first or choose an existing directory.` 
      };
    }

    const stats = fs.statSync(expandedPath);
    if (!stats.isDirectory()) {
      return { valid: false, message: 'Path must be a directory, not a file' };
    }

    // Check if readable
    fs.accessSync(expandedPath, fs.constants.R_OK);
    
    return { valid: true };
  } catch (error: any) {
    return { 
      valid: false, 
      message: `Cannot access path: ${error.message}` 
    };
  }
}

/**
 * Ensure directory exists, create if it doesn't
 */
export async function ensureDirectory(dirPath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Remove directory and all its contents
 */
export async function removeDirectory(dirPath: string): Promise<boolean> {
  try {
    if (fs.existsSync(dirPath)) {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
    }
    return true;
  } catch (error) {
    return false;
  }
}

