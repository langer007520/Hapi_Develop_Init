import { prisma } from "../service/prisma_client";

/**
 * 模型
 */
export class User {
    /**
     * 通过用户ID获取用户数据结构
     * @param id 用户ID
     * @returns 
     */
    static findById(id: number) {
        return prisma.user.findUnique({
            where: {
                id
            }
        })
    }

    static isExistOrThrowByUsernamePassword(username: string, password: string) {
        return prisma.user.findFirstOrThrow({
            where: {
                username,
                password
            }
        })
    }
}