const strats = {} // 策略集

const LIFECYCLE = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestory',
  'destoryed'
]

// 生命周期的合并
LIFECYCLE.forEach(hook => {
  strats[hook] = function(p, c) {
    if (c) {
      if (p) {
        return Array.isArray(c) ? p.concat(...c) : p.concat(c)
      } else {
        return Array.isArray(c) ? c : [c]
      }
    } else {
      return p
    }
  }
})

// 先找自己的组件，找不到再从原型上找父组件的
strats.components = function(p, c) {
  const res = Object.create(p)

  if (c) {
    for (const key in c) {
      res[key] = c[key]
    }
  }

  return res
}

export function mergeOptions(parent, child) {
  const options = {}

  for (const key in parent) {
    // 先处理原来的
    mergeField(key)
  }

  for (const key in child) {
    // 添加新的
    if (!parent.hasOwnProperty(key)) {
      mergeField(key)
    }
  }

  function mergeField(key) {
    // 策略模式
    if (strats[key]) {
      options[key] = strats[key](parent[key], child[key])
    } else {
      options[key] = child[key] || parent[key]
    }
  }

  return options
}
