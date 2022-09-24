import { Plugin } from '@hapi/hapi';

export function createPlugin<T>(plugin: Plugin<T>) {
    return plugin
}