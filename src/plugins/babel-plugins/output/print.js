let printR = ''
for (const [a1, a2] of Object.entries(a)) {
  for (const [b1, b2] of Object.entries(a2)) {
    const printA = `-----------------${a1}--${b1}-----------------------`
    console.log(print)
    printR += printA + '\r\n'
    for (const [c1, c2] of Object.entries(b2)) {
      console.log(c2)
      printR += c2 + '\r\n'
    }
  }
}
console.log(printR)
