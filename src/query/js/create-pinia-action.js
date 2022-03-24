const a = {
  appid: '',
  cc: '',
  token: '',
  tokenExpires: 0
}

const upperFirstletter = function (str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

const setTemplate = () => {
  const b = Object.entries(a)
    .map(([key, value]) => {
      return `
    set${upperFirstletter(key)}(${key}:${typeof value} ){
      this.${key}  = ${key}
    }
    `
    })
    .join(',')
}

setTemplate()
