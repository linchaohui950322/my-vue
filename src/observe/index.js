import { newArrayProto } from './array'
import Dep from './dep'

class Observe {
  constructor(data) {
    // Object.defineProperty只能劫持已经存在的属性（$set,$delete...）

    // 每个对象、数组自身都创建一个dep（ ）
    this.dep = new Dep()

    // 作用：
    // 1.将this挂载到需要被监听data上，方便调用Observe提供的方法
    // 2.给被观测过的数据加上表示
    // 3.将当前Observe实例放到data的__ob__上
    Object.defineProperty(data, '__ob__', {
      value: this,
      enumerable: false // 不可枚举，walk循环时无法获取
    })

    // 数组的情况单独处理，提升性能
    if (Array.isArray(data)) {
      // 保留数组原特性，重写数组变异方法
      data.__proto__ = newArrayProto

      // 数组内的引用类型也要劫持
      this.observeArray(data)
    } else {
      this.walk(data)
    }
  }

  // 循环对象，对属性依次劫持
  walk(data) {
    // 重新定义属性
    Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
  }

  // 观测数组
  observeArray(data) {
    data.forEach(item => observe(item))
  }
}

// 递归 子数组的依赖收集
function dependArray(value) {
  for (let i = 0; i < value.length; i++) {
    const current = value[i]

    // 如果current是对象/数组需要进行依赖收集
    if (current.__ob__) {
      current.__ob__.dep.depend()
    }

    // 递归处理
    if (Array.isArray(current)) {
      dependArray(current)
    }
  }
}

// 属性劫持 闭包
export function defineReactive(target, key, value) {
  // 递归 深度属性劫持 对所有的对象属性都进行劫持
  const childOb = observe(value)

  const dep = new Dep() // 每个属性都有一个dep

  Object.defineProperty(target, key, {
    get() {
      if (Dep.target) {
        // 给当前属性的dep记录watcher
        // 只会对被获取的属性进行收集
        dep.depend()

        // 如果是个对象/数组，需要给这个对象/数组的dep也进行依赖收集
        if (childOb) {
          childOb.dep.depend()

          // 如果value是数组，且数组内如果有数组也得进行依赖收集
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }

      // console.log(`取值————${value}`)
      return value
    },
    set(newValue) {
      if (value === newValue) {
        return
      }

      // 设置值如果是个对象需要再次代理
      observe(value)

      // console.log(`赋值————${newValue}，原值————${value}`)
      value = newValue

      // 更新
      dep.notify()
    }
  })
}

export function observe(data) {
  // 只对象进行劫持
  if (typeof data !== 'object' || data === null) {
    return
  }

  // 如果被劫持过，就不需要劫持了
  if (data.__ob__ instanceof Observe) {
    return data.__ob__
  }

  return new Observe(data)
}
