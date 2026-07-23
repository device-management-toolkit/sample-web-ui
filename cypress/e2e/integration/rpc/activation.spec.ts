import { isCloud } from './rpc.helpers'

declare const require: (id: string) => unknown

if (isCloud) {
  require('./cloud.activation.spec')
} else {
  require('./console.activation.spec')
}
