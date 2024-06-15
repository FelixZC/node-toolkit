/**
 * 获取数据类型
 * @param {any} obj - 任意待检测的数据
 * @returns {String} 数据构造器对应字符串
 * | 'Undefined'
   | 'Null'
   | 'Date'
   | 'String'
   | 'Math'
   | 'Number'
   | 'Boolean'
   | 'Object'
   | 'Array'
   | 'Function'
 */
export const getDataType = (obj: any) => {
  return Object.prototype.toString.call(obj).slice(8, -1)
}

/**
 * 对对象内部属性排序
 * @param {Object} target - 待排序的对象
 * @returns {Object} 属性排序后的新对象
 */
export function sortObjAttr(target: Record<string, any>) {
  const dataType = getDataType(target)
  if (dataType !== 'Object') {
    throw new Error('sortObjAttr数据类型错误')
  }
  const newObj = {} as Record<string, any>
  const keys = Object.keys(target).sort((a, b) => {
    return a.localeCompare(b)
  })
  keys.forEach((key) => {
    newObj[key] = target[key]
  })
  return newObj
}

/**
 * 数组排序
 * @param {Array} arr - 原数组
 * @param {Function|string} customSort - 自定义排序规则，可以是比较函数或基于对象属性的字符串键名
 * @returns {Array} 排序后的新数组
 */
export function sortArray(arr: Array<Record<string, any>>, customSort: Function | string) {
  const dataType = getDataType(arr)
  if (dataType !== 'Array') {
    throw new Error('sortArray数据类型错误')
  }
  return arr.sort((a, b) => {
    if (typeof customSort === 'function') {
      return customSort(a, b)
    }
    if (typeof customSort === 'string') {
      return a[customSort].localeCompare(b[customSort])
    }
  })
}

// 定义GroupCache接口
interface GroupCache<T> {
  [key: string]: {
    count: number
    group: T[]
    groupKey: string
  }
}

// 改进后的groupBy函数
export function groupBy<T extends Record<string, any>>(arr: T[], groupKey: string): GroupCache<T> {
  if (!Array.isArray(arr)) {
    throw new Error('非数组类型，无法分类')
  }
  const cache = {} as GroupCache<T>
  arr.forEach((element) => {
    if (!element.hasOwnProperty(groupKey)) {
      throw new Error(`元素缺少分组键：${groupKey}`)
    }
    const cacheKey = element[groupKey]
    if (cache[cacheKey]) {
      cache[cacheKey].group.push(element)
      cache[cacheKey].count++
    } else {
      cache[cacheKey] = {
        count: 1,
        group: [element],
        groupKey
      }
    }
  })
  return cache
}

/**
 * 驼峰式字符串转短横线分隔
 * @param {string} str - 驼峰式字符串
 * @returns {string} 短横线分隔的字符串
 */
export const kebabCase = function (str: string) {
  const hyphenateRE = /([^-])([A-Z])/g
  return str.replace(hyphenateRE, '$1-$2').replace(hyphenateRE, '$1-$2').toLowerCase()
}

/**
 * 移除字符串开头的下划线和连字符
 * @param {string} str - 输入字符串
 * @returns {string} 处理后的字符串
 */
export const easeUnline = function (str: string) {
  const easeReg2 = /^[_-]/g
  return str.replace(easeReg2, '')
}

/**
 * 首字母大写
 * @param {string} str - 输入字符串
 * @returns {string} 首字母大写的字符串
 */
export const capitalize = function (str: string) {
  if (typeof str !== 'string') return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 判断给定的字符串是否为引用路径。
 * 引用路径是那些以特定前缀（如 '@', 'src', 'images', 'img', 'styles', '~', '../', './', 'dist' 等）开头的字符串。
 * @param {string} str - 待判断的字符串
 * @returns {boolean} 是否为引用路径
 */
export const isPath = (str: string): boolean => {
  const startsWithList: string[] = [
    '@',
    'src',
    'images',
    'img',
    'styles',
    '~',
    '../',
    './',
    'dist',
    'node_modules',
    'assets',
    'components',
    'utils',
    'scripts',
    'lib',
    'public'
    // 其他可能的引用路径前缀...
  ]

  // 检查 str 是否以 startsWithList 中的任何一个字符串开头
  return startsWithList.some((prefix) => str.startsWith(prefix))
}

/**
 * 转化导入路径引用为驼峰规则，使用指定分隔符
 * @param {string} str - 输入字符串
 * @param {string} seperator - 分隔符，默认为 '/'
 * @returns {string} 转化后的字符串
 */
export const transferRef = (str: string, seperator = '/') => {
  if (!str) {
    return str
  }
  return str
    .split(seperator)
    .map((item) => {
      let result = kebabCase(item)
        .replace(/[_-]{2}/g, '-')
        .replace(/(['"`/\\])-/g, '$1')
        .replace(/(\b\w\b)-(?=\b\w\b)/g, '$1')

      /** 当代码管理工具和window组合使用，会出现文件大小写同源问题 */
      /** to stupid to continue  */
      /** this is situation one  */
      // if (!result.includes('-') && item !== result) {
      //   result = '_' + result
      // }
      /** this is situation two,exec after one ，also you can skip them */
      // result = easeUnline(result);

      return result
    })
    .join(seperator)
}

/**
 * 执行字符串形式的 JavaScript 代码，存在无效引用时会报错
 * @param {string} str - 要执行的 JavaScript 代码字符串
 * @returns {any} 代码执行结果
 */
export function strToJson(str: string) {
  const json = eval('(' + str + ')')
  return json
}

/**
 * 设置嵌套对象属性值
 * @param {Record<string, any>} target - 目标对象
 * @param {string[] | string} keys - 属性路径，可以是逗号分隔的字符串或键名数组
 * @param {any} value - 要设置的属性值
 */
export const setValueByKeys = (
  target: Record<string, any> = {},
  keys: string[] | string,
  value: any
) => {
  let localKeys = keys
  if (typeof localKeys === 'string') {
    localKeys = localKeys.split(',')
  }
  localKeys.reduce((previousValue, currentKey, currentIndex) => {
    if (currentIndex === localKeys.length - 1) {
      previousValue[currentKey] = value
    } else {
      return (
        previousValue?.[currentKey] ||
        Object.defineProperty({}, currentKey, {
          value: {}
        })
      )
    }
  }, target)
}

/**
 * 获取嵌套对象属性值
 * @param {Record<string, any>} target - 目标对象
 * @param {string[] | string} keys - 属性路径，可以是逗号分隔的字符串或键名数组
 * @returns {any} 指定路径的属性值，若不存在则返回 undefined
 */
export const getValueByKeys = (target: Record<string, any> = {}, keys: string[] | string): any => {
  let localKeys = keys
  if (typeof localKeys === 'string') {
    localKeys = localKeys.split(',')
  }
  return localKeys.reduce((previousValue, currentKey) => {
    return previousValue?.[currentKey]
  }, target)
}

// 定义一个具体的节点接口，包含 id, parentId 和可选的 children 属性
interface NodeWithId {
  id?: string | number
  parentId?: string | number | null
  children?: NodeWithId[]
}
export function buildTree<T extends NodeWithId>(
  nodes: T[],
  idProp: keyof T,
  parentProp: keyof T
): T[] {
  const nodeMap: {
    [key: string]: T
  } = {}
  const rootNodes: T[] = []

  // 初始化节点映射
  nodes.forEach((node) => {
    const nodeId = String(node[idProp]) // 确保 id 是字符串
    nodeMap[nodeId] = {
      ...node,
      children: node.children || [] // 初始化子节点数组
    }
  })

  // 构建树结构
  nodes.forEach((node) => {
    const parentId = String(node[parentProp]) // 确保 parentId 是字符串
    if (parentId && nodeMap[parentId]) {
      // 如果存在父节点，则将当前节点添加到父节点的子节点中
      nodeMap[parentId].children?.push(nodeMap[String(node[idProp])])
    } else {
      // 如果没有父节点，则认为是根节点
      rootNodes.push(nodeMap[String(node[idProp])])
    }
  })
  return rootNodes // 返回根节点数组
}

// 使用 Pick 来提取指定的属性
export function pickProperties<T extends object, K extends keyof T>(
  objects: T[],
  propertiesToKeep: K[]
): Pick<T, K>[] {
  return (Array.isArray(objects) ? objects : [objects]).map((obj) => {
    const picked: any = {}
    for (const propertyKey of propertiesToKeep) {
      const value = obj[propertyKey]
      // 如果属性是对象且存在，则递归调用pickProperties
      if (value && typeof value === 'object') {
        // 这里假设嵌套对象的键也在 propertiesToKeep 中
        picked[propertyKey] = pickProperties(value as T[], propertiesToKeep)
      } else {
        // 否则，直接复制属性值
        picked[propertyKey] = value
      }
    }
    // 确保返回的对象类型是 Pick<T, K>
    return picked as Pick<T, K>
  })
}
export const getIgnorePatterns = (str: string): RegExp[] => {
  // 将排除文件列表转换为正则表达式数组
  const ignoreFilesPatterns = str
    .split(',')
    .map((pattern) => pattern.trim())
    .filter((pattern) => pattern.length)
    .map((pattern) => {
      // 转义正则表达式中的特殊字符，除了星号（*）之外
      let escapedPattern = escapeReg(pattern)
      // 替换星号（*）为正则表达式中的量词 .*，表示匹配任意字符任意次
      escapedPattern = escapedPattern.replace(/\*/g, '.*')
      // 创建正则表达式对象
      return new RegExp(escapedPattern)
    })
  return ignoreFilesPatterns
}

// 辅助函数，用于转义正则表达式中的特殊字符
export const escapeReg = (string: string) => {
  // 转义正则表达式中的特殊字符，包括 -
  return string.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
}

// 将用户输入的字符串转换为正则表达式，考虑全词匹配和大小写匹配
export const convertToReg = (
  query: string,
  matchReg: boolean,
  matchCase: boolean,
  matchWholeWord: boolean,
  matchGlobal?: boolean
) => {
  if (!query.length) {
    return null
  }
  // 如果是使用正则表达式，直接创建，否则需要转义查询字符串以避免特殊字符
  const pattern = matchReg ? query : escapeReg(query)

  // 构建正则表达式字符串
  let regExpString = matchWholeWord ? `\\b${pattern}\\b` : pattern

  // 默认全局搜索
  let flags = ''
  if (matchGlobal) {
    flags += 'g'
  }
  // 如果不区分大小写，则添加 'i' 标志
  if (!matchCase) {
    flags += 'i'
  }
  try {
    // 创建正则表达式对象，需要将模式和标志作为两个参数传递
    return new RegExp(regExpString, flags)
  } catch (error) {
    console.error('Invalid regular expression:', regExpString, flags)
    return null
  }
}
export type FileType =
  | 'Folder'
  | 'Audio'
  | 'Compressed File'
  | 'Document'
  | 'Executable'
  | 'Image'
  | 'Video'
  | 'Source Code'
  | 'Font'
  | 'Other'
  | 'Unknown'
export function classifyFileTypeByExt(ext: string): FileType {
  let fileType: FileType
  switch (ext) {
    // 音频文件
    case '.mp3':
    case '.wav':
    case '.flac':
    case '.aac':
    case '.ogg':
    case '.m4a': // MPEG-4 Audio
    case '.amr': // Adaptive Multi-Rate Audio
    case '.wma': // Windows Media Audio
    case '.alac': // Apple Lossless Audio Codec
    case '.ape': // Monkey's Audio
    case '.opus': // Opus Audio
    case '.ra': // Real Audio
    case '.ram': // Real Media
    case '.mid':
    case '.mp2': // MPEG-1 Audio Layer II
    case '.mpa': // MPEG Audio
    case '.spx':
      // Speex Audio
      fileType = 'Audio'
      break
    // 压缩文件
    case '.zip':
    case '.rar':
    case '.tar':
    case '.gz':
    case '.7z':
    case '.bz2':
    case '.apk': // Android Package
    case '.arj': // ARJ压缩文件
    case '.cab': // Microsoft Cabinet文件
    case '.deb': // Debian软件包
    case '.rpm': // Red Hat软件包
    case '.z': // 压缩的Unix文件
    case '.lz':
    case '.lzh': // LZip压缩文件
    case '.xz': // LZMA2压缩文件
    case '.dmg': // Apple磁盘映像，可能包含压缩内容
    case '.iso':
      // ISO9660磁盘映像，可能包含压缩内容
      fileType = 'Compressed File'
      break
    case '.txt':
    case '.md':
    case '.mkd': // Markdown文件的另一种扩展名
    case '.rtf':
    case '.pdf':
    case '.doc':
    case '.docx':
    case '.xlsx':
    case '.xls':
    case '.ppt':
    case '.pptx': // PowerPoint演示文稿
    case '.odt': // OpenDocument文本
    case '.ods': // OpenDocument电子表格
    case '.odp': // OpenDocument演示文稿
    case '.pages': // Apple Pages文档
    case '.key': // Apple Keynote演示文稿
    case '.csv': // 逗号分隔值
    case '.tsv': // 制表符分隔值
    case '.wpd': // WordPerfect文档
    case '.wps': // WPS Office文档
    case '.xsl': // XSL样式表
    case '.xslt': // XSLT转换
    case '.log': // 日志文件
    case '.msg': // 电子邮件消息
    case '.eml':
      // 电子邮件文件
      fileType = 'Document' // 文档
      break
    case '.exe':
    case '.bat':
    case '.sh':
    case '.com': // DOS/Windows 可执行命令文件
    case '.msi': // Windows Installer 软件包
    case '.app': // macOS 应用程序包（注意：这也可能表示一个字体文件）
    case '.gadget': // Windows Gadget
    case '.cmd': // Windows 批处理文件
    case '.vbscript': // Visual Basic Script 文件
    case '.wsf': // Windows Script 文件
    case '.ps1':
      // PowerShell 脚本
      fileType = 'Executable' // 可执行文件
      break
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.bmp':
    case '.svg':
    case '.tiff':
    case '.tif': // TIFF 图像的另一种扩展名
    case '.webp': // WebP 图像格式，现代浏览器支持
    case '.ico': // ICO 图像，常用于图标文件
    case '.raw': // RAW 图像，由许多数码相机生成
    case '.cr2': // Canon RAW 图像
    case '.nef': // Nikon RAW 图像
    case '.orf': // Olympus RAW 图像
    case '.arw': // Sony RAW 图像
    case '.dng': // Adobe Digital Negative，RAW 图像的数字底片格式
    case '.psd': // Adobe Photoshop 文档，有时也用于图像存储
    case '.indd': // Adobe InDesign 文档，有时也包含图像数据
    case '.ai': // Adobe Illustrator，矢量图形，有时也用于图像存储
    case '.eps': // EPS（Encapsulated PostScript），矢量图像格式
    case '.aff': // Adobe Affinity Photo 的图像格式
    case '.pspimage': // PaintShop Pro 图像文件
    case '.kdc': // Kodak Digital Science 相机的 RAW 图像
    case '.thm':
      // 缩略图，常用于视频和图像预览
      fileType = 'Image' // 图像文件
      break
    case '.mp4':
    case '.avi':
    case '.mov':
    case '.mkv':
    case '.wmv':
    case '.flv':
    case '.m4v':
    case '.mpg':
    case '.mpeg':
    case '.3gp':
    case '.3g2':
    case '.webm':
    case '.ogg':
    case '.ogv':
    case '.divx':
    case '.xvid':
      fileType = 'Video' // 视频文件
      break
    case '.html':
    case '.htm':
    case '.xml':
    case '.css':
    case '.js':
    case '.py': // Python
    case '.pl': // Perl
    case '.swift': // Swift
    case '.ts': // TypeScript?
    case '.dart': // Dart
    case '.scala': // Scala
    case '.h':
    case '.hpp':
    case '.c':
    case '.hx': // Haxe
    case '.lua': // Lua
    case '.m': // Objective-C
    case '.f': // Fortran
    case '.asm': // 汇编语言
    case '.r': // R语言
    case '.gradle': // Gradle脚本
    case '.kotlin': // Kotlin
    case '.clj': // Clojure
    case '.cljs': // ClojureScript
    case '.lisp': // Lisp
    case '.tex': // LaTeX
    case '.sass': // SASS
    case '.scss': // SCSS
    case '.less': // LESS
    case '.json': // JSON配置文件，也可以是前端模块
    case '.yaml':
    case '.yml':
    case '.txtxml': // XML文本
    case '.ini': // 配置文件
    case '.conf': // 配置文件
    case '.cfg': // 配置文件
    case '.properties': // Java属性文件
    case '.vb': // Visual Basic脚本
    case '.wsdl': // Web服务描述语言
    case '.dtd':
      // 文档类型定义
      fileType = 'Source Code'
      break

    // 字体文件
    case '.ttf':
    case '.otf':
    case '.woff':
    case '.woff2':
    case '.eot':
    case '.fnt': // 旧的字体格式，可能与某些游戏或应用相关
    case '.bdf': // Bitmap Distribution Format，位图字体
    case '.pfb': // Type 1字体，PostScript字体格式
    case '.pfa': // Type 1字体，PostScript字体格式
    case '.mf': // Metafont，TeX排版系统中使用的字体
    case '.gsf': // Ghostscript字体
    case '.psfu': // PSF Unicode，Unix系统中的字体
    case '.bmap': // 位图字体映射
    case '.cff': // Compact Font Format，用于OpenType字体
    case '.cce': // 用于Adobe CEF Simple字体
    case '.inf': // 字体信息文件
    case '.cid': // CID-keyed OpenType字体
    case '.otc': // OpenType收集器，包含多个字体
    case '.otb': // OpenType/CFF字体的二进制版本
    case '.pfr': // PFR字体，也称为TrueDoc
    case '.mac': // Macintosh字体套件
    case '.dfont':
      // macOS上的字体文件
      fileType = 'Font'
      break
    default:
      fileType = 'Unknown'
    // 未知类型
  }
  return fileType
}
