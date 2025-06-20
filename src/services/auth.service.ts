import { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/hasher';
import { generateTokens } from '../utils/jwt';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<{
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
  }> {
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    // 哈希密码
    const passwordHash = await hashPassword(data.password);

    // 创建用户
    const user = await this.userRepository.createUser({
      email: data.email,
      passwordHash,
      name: data.name,
    });

    // 生成JWT tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email || '',
      provider: user.provider,
    });

    // 返回用户信息（不包含密码）
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<{
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
  }> {
    // 查找用户
    const user = await this.userRepository.findUserByEmail(data.email);
    if (!user || !user.passwordHash) {
      throw new Error('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(user.passwordHash, data.password);
    if (!isPasswordValid) {
      throw new Error('邮箱或密码错误');
    }

    // 生成JWT tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email || '',
      provider: user.provider,
    });

    // 返回用户信息（不包含密码）
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const { verifyRefreshToken, generateTokens } = await import('../utils/jwt');
      const payload = verifyRefreshToken(refreshToken);

      // 验证用户是否仍然存在
      const user = await this.userRepository.findUserById(payload.userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 生成新的 access token
      const { accessToken } = generateTokens({
        userId: user.id,
        email: user.email || '',
        provider: user.provider,
      });

      return { accessToken };
    } catch (error) {
      throw new Error('刷新令牌无效或已过期');
    }
  }

  async updateProfile(userId: number, data: {
    name?: string;
    email?: string;
  }): Promise<Omit<User, 'passwordHash'>> {
    // 如果要更新邮箱，检查是否已存在
    if (data.email) {
      const existingUser = await this.userRepository.findUserByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('邮箱已被使用');
      }
    }

    const updatedUser = await this.userRepository.updateUser(userId, data);
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  }
}