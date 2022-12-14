import { observe } from './observe/index'
import Watcher, { nextTick } from './observe/watcher'
import Dep from './observe/dep'

export function initState(vm) {
  const opts = vm.$options

  if (opts.data) {
    initData(vm)
  }

  if (opts.computed) {
    initComputed(vm)
  }

  if (opts.watch) {
    initWatch(vm)
  }
}

function proxy(vm, target, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[target][key]
    },
    set(newValue) {
      vm[target][key] = newValue
    }
  })
}

function initData(vm) {
  let data = vm.$options.data // 根对象data可能是函数或者对象

  data = typeof data === 'function' ? data.call(vm) : data
  vm._data = data // 挂载到_data上

  // 对数据进行劫持
  observe(data)

  // 将vm._data用vm来代理
  for (let key in data) {
    proxy(vm, '_data', key)
  }
}

function initComputed(vm) {
  const computed = vm.$options.computed
  // 保存vm下所有computed的watcher实例
  const watchers = (vm._computedWatchers = {})

  for (const key in computed) {
    if (computed.hasOwnProperty(key)) {
      const usrDef = computed[key]
      // 监控计算属性中getter的变化
      const getter = typeof usrDef === 'function' ? usrDef : usrDef.get

      // 如果直接new Watcher就会直接指向getter， 将属性与watcher对应起来
      watchers[key] = new Watcher(vm, getter, {
        lazy: true
      })

      defineComputed(vm, key, usrDef)
    }
  }
}

function initWatch(vm) {
  const watch = vm.$options.watch

  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      createWatcher(vm, key, handler)
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher(vm, key, handler) {
  let _handler
  let opts = {}
  // handler 类型 string、string、对象
  if (typeof handler === 'function') {
    _handler = handler
  } else if (typeof handler === 'string') {
    _handler = vm[handler]
  } else {
    _handler = handler.handler
    delete handler.handler
    opts = handler
  }

  return vm.$watch(key, _handler, opts)
}

function defineComputed(vm, key, usrDef) {
  const setter = usrDef.set || (() => {})

  Object.defineProperty(vm, key, {
    get: createComputedGetter(key),
    set: setter // set不会影响计算属性本身
  })
}

// 计算属性不会收集依赖，只会让自己依赖的属性收集依赖
function createComputedGetter(key) {
  return function() {
    // 当前属性的watcher
    const watcher = this._computedWatchers[key]

    if (watcher.dirty) {
      watcher.evaluate() // 求值后dirty为false
    }

    // 计算属性出栈后，还要收集渲染watcher，要让计算属性里dep记录的属性，收集上层watcher
    if (Dep.target) {
      watcher.depend()
    }

    return watcher.value
  }
}

export function initStateMixin(Vue) {
  Vue.prototype.$nextTick = nextTick

  // $watch的监听不会立即执行，多次修改值只会执行一次（watcher中的异步队列）
  Vue.prototype.$watch = function(exprOrFn, cb, options = {}) {
    new Watcher(
      this,
      exprOrFn,
      {
        usr: true,
        ...options
      },
      cb
    )
  }
}
