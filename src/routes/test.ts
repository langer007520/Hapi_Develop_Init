import { server } from "../hapi_server";
import { redlock } from "../utils/redlock";
import { setTimeout } from 'timers/promises'
import { Lock } from "../utils/lock";
import { redis } from "../redis_server";

export const register = async () => {

    server.defineRoute({
        method: "GET",
        path: "/{test}",
        handler: async (req, h) => {
            // 获取锁
            // let lock = await redlock.acquire(["a"], 5000);
            console.log(req.params.test);
            console.log(req.payload.nihao);

            console.log(req.query.test1);



            try {
                let lock = await redlock.using(['a', 'b'], 3000, {
                    retryCount: 0,
                }, async (signal) => {
                    let result = await setTimeout(2000, '延迟任务')
                    return result;
                });
                return lock;
            } catch (err) {
                console.log('redlock error');
                return 'error';
            }
        },
        options: {
            description: "测试案例",
            validate: {
                query: {
                    test1: "test",
                },
                payload: {
                    nihao: 'lkjdsf'
                },

            }
        }
    })

}