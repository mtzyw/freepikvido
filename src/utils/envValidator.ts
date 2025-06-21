/**
 * 环境变量验证工具
 * 确保关键配置项已正确设置
 */

interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    description: string;
    sensitive?: boolean; // 是否为敏感信息
  };
}

const requiredEnvVars: RequiredEnvVars = {
  DATABASE_URL: {
    required: true,
    description: '数据库连接字符串',
    sensitive: true,
  },
  JWT_ACCESS_SECRET: {
    required: true,
    description: 'JWT访问令牌密钥',
    sensitive: true,
  },
  JWT_REFRESH_SECRET: {
    required: true,
    description: 'JWT刷新令牌密钥',
    sensitive: true,
  },
  FREEPIK_API_KEY: {
    required: true,
    description: 'Freepik API密钥',
    sensitive: true,
  },
  R2_ACCESS_KEY_ID: {
    required: true,
    description: 'Cloudflare R2访问密钥ID',
    sensitive: true,
  },
  R2_SECRET_ACCESS_KEY: {
    required: true,
    description: 'Cloudflare R2秘密访问密钥',
    sensitive: true,
  },
};

const dangerousDefaultValues = [
  'your_',
  'changeme',
  'secret',
  'password',
  'username',
  'localhost',
  'example',
  'test',
  'default',
];

/**
 * 检查环境变量是否使用了危险的默认值
 */
function isDangerousValue(value: string, varName: string): boolean {
  const lowerValue = value.toLowerCase();
  const lowerVarName = varName.toLowerCase();
  
  // 检查是否包含危险的默认值关键词
  for (const dangerous of dangerousDefaultValues) {
    if (lowerValue.includes(dangerous)) {
      return true;
    }
  }
  
  // 检查是否是变量名的变体
  if (lowerValue.includes(lowerVarName.replace('_', ''))) {
    return true;
  }
  
  return false;
}

/**
 * 验证环境变量配置
 */
export function validateEnvironmentVariables(): void {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log('🔍 开始验证环境变量配置...');
  
  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];
    
    if (config.required && !value) {
      errors.push(`❌ 缺少必需的环境变量: ${varName} (${config.description})`);
      continue;
    }
    
    if (value && config.sensitive) {
      // 检查生产环境中的敏感信息
      if (process.env.NODE_ENV === 'production') {
        if (isDangerousValue(value, varName)) {
          errors.push(`🚨 生产环境检测到不安全的${varName}值，请使用安全的密钥`);
        }
        
        // 检查密钥长度
        if (varName.includes('SECRET') && value.length < 32) {
          warnings.push(`⚠️  ${varName}长度过短，建议至少32个字符`);
        }
      }
      
      // 开发环境警告
      if (process.env.NODE_ENV !== 'production' && isDangerousValue(value, varName)) {
        warnings.push(`⚠️  ${varName}使用了示例值，生产环境请更换`);
      }
    }
  }
  
  // 输出验证结果
  if (errors.length > 0) {
    console.error('\n🚨 环境变量验证失败:');
    errors.forEach(error => console.error(error));
    console.error('\n请检查.env文件并设置正确的环境变量\n');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  环境变量警告:');
    warnings.forEach(warning => console.warn(warning));
    console.warn('');
  }
  
  console.log('✅ 环境变量验证通过\n');
}

/**
 * 检查.env文件是否在git中
 */
export function checkEnvFileSecurity(): void {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('.env')) {
        console.warn('⚠️  .gitignore中未找到.env规则，请添加以防止密钥泄露');
      }
    }
  } catch (error) {
    // 忽略文件系统错误
  }
}