import { server } from "../service/hapi_server";
import { redlock } from "../utils/redlock";
import { setTimeout } from 'timers/promises'
import { redis } from "../service/redis_server";

export const register = async () => {

    server.defineRoute({
        method: "GET",
        path: "/{test}",
        handler: async (req, h) => {

            console.log(req.params.test);
            console.log(req.payload.nihao);

            console.log(req.query.test1);

            return 'ok';
        },
        options: {
            description: "测试案例",
            validate: {
                query: {
                    test1: "test",
                },
                payload: {
                    nihao: 'lkjdsf'
                }
            }
        }
    })

}