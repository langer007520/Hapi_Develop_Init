/**
 * 种子文件
 */
import Faker from '@faker-js/faker'
import { prisma } from '../service/prisma_client'

async function main() {
    // 创建用户
    // await prisma.user.create({
    //     data: {
    //         email: "haha@123.com",
    //         name: "haha",
    //         age: 19
    //     }
    // })
}

main()