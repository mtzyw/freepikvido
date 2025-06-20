import { PrismaClient, User, Provider } from '@prisma/client';

const prisma = new PrismaClient();

export class UserRepository {
  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    provider?: Provider;
    providerUserId?: string;
  }): Promise<User> {
    return await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        provider: data.provider || 'local',
        providerUserId: data.providerUserId,
      },
    });
  }

  async findUserByEmail(email: string, provider: Provider = 'local'): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        email,
        provider,
      },
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async findUserByProviderUserId(providerUserId: string, provider: Provider): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        providerUserId,
        provider,
      },
    });
  }

  async updateUser(id: number, data: {
    email?: string;
    name?: string;
    passwordHash?: string;
  }): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: number): Promise<User> {
    return await prisma.user.delete({
      where: { id },
    });
  }
}