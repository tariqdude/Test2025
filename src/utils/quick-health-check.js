#!/usr/bin/env node

// Simple Error Reviewer Test
// Basic test to verify the error analysis system works

import { promises as fs } from 'fs';
import path from 'path';

console.log('🔍 Elite Error Reviewer - Quick Test\n');

const projectRoot = process.cwd();

async function quickHealthCheck() {
  console.log('📊 Running Quick Health Check...\n');
  
  const issues = [];
  let score = 100;
  
  try {
    // Check for TypeScript files
    const tsFiles = await findFiles('**/*.ts', projectRoot);
    console.log(`📁 Found ${tsFiles.length} TypeScript files`);
    
    // Check for package.json
    const packageJsonPath = path.join(projectRoot, 'package.json');
    try {
      await fs.access(packageJsonPath);
      console.log('✅ package.json found');
    } catch (e) { /* Ignore error, file/directory might not exist */ 
      console.log('❌ package.json missing');
      issues.push('Missing package.json');
      score -= 20;
    }
    
    // Check for .gitignore
    const gitignorePath = path.join(projectRoot, '.gitignore');
    try {
      await fs.access(gitignorePath);
      console.log('✅ .gitignore found');
    } catch (e) { /* Ignore error, file/directory might not exist */ 
      console.log('⚠️  .gitignore missing');
      issues.push('Missing .gitignore');
      score -= 5;
    }
    
    // Check for environment files in git
    try {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      const envFiles = ['.env', '.env.local'];
      for (const envFile of envFiles) {
        if (!gitignoreContent.includes(envFile)) {
          console.log(`⚠️  ${envFile} not in .gitignore`);
          issues.push(`${envFile} should be in .gitignore`);
          score -= 10;
        }
      }
    } catch (e) { /* Ignore error, file/directory might not exist */ }
    
    // Check for large files
    try {
      const files = await findFiles('**/*', projectRoot);
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          const sizeInMB = stats.size / (1024 * 1024);
          if (sizeInMB > 5) {
            console.log(`⚠️  Large file detected: ${path.relative(projectRoot, file)} (${sizeInMB.toFixed(2)}MB)`);
            issues.push(`Large file: ${path.basename(file)}`);
            score -= 2;
          }
        } catch (e) { /* Ignore error, file/directory might not exist */ }
      }
    } catch (e) { /* Ignore error, file/directory might not exist */ }
    
    // Check for common security patterns
    const sourceFiles = await findFiles('**/*.{ts,tsx,js,jsx,astro}', projectRoot);
    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        if (content.includes('eval(')) {
          console.log(`🔒 Security issue in ${path.relative(projectRoot, file)}: eval() usage`);
          issues.push('Security: eval() usage detected');
          score -= 15;
        }
        
        if (content.includes('innerHTML =') && !content.includes('sanitize')) {
          console.log(`🔒 Security issue in ${path.relative(projectRoot, file)}: innerHTML without sanitization`);
          issues.push('Security: unsafe innerHTML usage');
          score -= 10;
        }
      } catch (e) { /* Ignore error, file/directory might not exist */ }
    }
    
  } catch (error) {
    console.log('❌ Health check failed:', error);
    score = 0;
  }
  
  // Calculate final score
  score = Math.max(0, score);
  
  console.log('\n📊 === HEALTH CHECK RESULTS ===');
  console.log(`Overall Score: ${score}/100`);
  
  if (score >= 90) {
    console.log('🟢 Excellent - Your project is in great shape!');
  } else if (score >= 70) {
    console.log('🟡 Good - Some minor issues to address');
  } else if (score >= 50) {
    console.log('🟠 Needs Attention - Several issues found');
  } else {
    console.log('🔴 Critical - Immediate attention required!');
  }
  
  console.log(`\nIssues Found: ${issues.length}`);
  issues.forEach(issue => console.log(`  • ${issue}`));
  
  console.log('\n🔍 For comprehensive analysis, use: npm run error-review');
  
  return { score, issues };
}

async function findFiles(pattern, dir) {
  const files = [];
  
  async function walk(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && 
              entry.name !== 'node_modules' && 
              entry.name !== 'dist' && 
              entry.name !== 'build') {
            await walk(fullPath);
          }
        }
        else if (entry.isFile()) {
          if (pattern === '**/*' || 
              pattern.includes(path.extname(entry.name)) ||
              (pattern.includes('*.ts') && entry.name.endsWith('.ts'))) {
            files.push(fullPath);
          }
        }
      }
    } catch (e) { /* Ignore error, file/directory might not exist */ }
  }
  
  await walk(dir);
  return files;
}

// Run the health check
quickHealthCheck().catch(console.error);
