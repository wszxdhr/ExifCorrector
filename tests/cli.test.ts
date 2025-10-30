import { spawn } from 'child_process';
import * as path from 'path';

describe('ExifDog CLI', () => {
  const cliPath = path.join(__dirname, '..', 'dist', 'index.js');
  const timeout = 10000;

  it('should display help when --help flag is used', (done) => {
    const child = spawn('node', [cliPath, '--help']);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      try {
        expect(code).toBe(0);
        expect(stdout).toContain('Usage:');
        expect(stdout).toContain('exif-dog');
        expect(stdout).toContain('Options:');
        expect(stderr).toBe('');
        done();
      } catch (error) {
        done(error);
      }
    });

    child.on('error', (error) => {
      done(error);
    });
  }, timeout);

  it('should display version when --version flag is used', (done) => {
    const child = spawn('node', [cliPath, '--version']);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      try {
        expect(code).toBe(0);
        expect(stdout).toMatch(/\d+\.\d+\.\d+/);
        expect(stderr).toBe('');
        done();
      } catch (error) {
        done(error);
      }
    });

    child.on('error', (error) => {
      done(error);
    });
  }, timeout);
});
