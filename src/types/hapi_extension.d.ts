/**
 * Hapi 模块的类型扩展
 */
import { ServerOptionsApp, ServerApplicationState } from '@hapi/hapi';

declare module "@hapi/hapi" {
    interface ServerOptionsApp {
        hello: string;
    }

    interface ServerApplicationState {
        hello: string;
    }

    interface ServerMethods {
        hello: () => Promise<void>
    }

}

