const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const EslintWebpackPlugin = require('eslint-webpack-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WebpackBar = require('webpackbar')
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')

const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  // 设置Webpack配置模式，根据是否为生产环境选择不同的模式
  mode: isProduction ? 'production' : 'development',
  // 禁用缓存以确保在每次构建时都重新生成文件
  cache: false,
  // 配置模块解析规则
  resolve: {
    //仅在eletron中使用
    fallback: {
      path: false,
      fs: false
    },
    // 指定模块解析时应尝试的文件扩展名
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    // 设置模块别名，简化路径引用
    alias: {
      '@src': path.resolve(__dirname, '../src'), // 源代码根目录
      '@app': path.resolve(__dirname, '../src/app'), // 应用主体目录
      '@assets': path.resolve(__dirname, '../src/assets'), // 资产目录
      '@common': path.resolve(__dirname, '../src/common'), // 公共代码目录
      '@components': path.resolve(__dirname, '../src/components'), // 组件目录
      '@pages': path.resolve(__dirname, '../src/pages'), // 页面目录
      '@language': path.resolve(__dirname, '../src/language'), // 语言包目录
      '@redux': path.resolve(__dirname, '../src/redux'), // Redux相关代码目录
      '@router': path.resolve(__dirname, '../src/router') // 路由目录
    }
  },
  // 定义入口文件
  entry: './src/web/index.tsx',
  // 配置输出选项
  output: {
    // 根据是否为生产环境设置输出路径
    path: isProduction ? path.resolve(__dirname, '../desktop/build') : undefined,
    // 输出文件命名规则
    filename: 'js/[name].[contenthash:8].js',
    // 异步加载模块的命名规则
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
    // 开发环境下自动清理输出目录
    clean: true,
    // 设置资源的公共路径
    publicPath: isProduction ? './' : '/'
  },
  /**
   * 配置模块的加载规则
   *
   * 该模块配置用于Webpack在处理不同类型的文件时应用特定的加载器（loader）和转换器（transpiler）。
   * 它定义了多个规则，每个规则针对一种特定的文件类型（如CSS、图片、字体、JavaScript等）并指定如何处理这些文件。
   *
   * 规则按顺序应用，第一个匹配的规则将被应用。
   *
   * 其中一些重要的规则包括：
   * - CSS 和 LESS 文件的处理，支持CSS提取、CSS预处理器（如Less）以及CSS模块化。
   * - 图片文件的处理，支持多种图片格式，并且可以对大图片进行懒加载。
   * - 字体和媒体文件的处理，将这些静态资源作为静态文件包含在生成的静态资源中。
   * - SVG 文件的特殊处理，用于图标集成和单个SVG图标文件的使用。
   * - JavaScript 和 TypeScript 文件的处理，支持ES6+语法、React组件以及按需加载Ant Design库的CSS样式。
   */
  module: {
    rules: [
      {
        oneOf: [
          {
            // 处理CSS和LESS文件，应用CSS加载器链，包括CSS提取、CSS模块化、PostCSS插件和Less编译。
            test: /\.(css|less)$/,

            use: [
              isProduction ? MiniCssExtractPlugin.loader : 'style-loader', // 根据生产环境选择CSS提取方式
              'css-loader', // 应用CSS标准加载器
              {
                loader: 'postcss-loader', // 应用PostCSS插件，支持CSS预处理器
                options: {
                  postcssOptions: {
                    plugins: ['postcss-preset-env'] // 使用postcss-preset-env插件
                  }
                }
              },
              {
                loader: 'less-loader', // 使用Less加载器进行编译
                options: {
                  lessOptions: {
                    javascriptEnabled: true // 启用JavaScript支持
                  }
                }
              },
              {
                loader: 'style-resources-loader', // 加载自定义样式资源，如变量文件
                options: {
                  patterns: path.resolve(__dirname, '../src/style/less/variables.less') // 指定变量文件路径
                }
              }
            ]
          },
          {
            // 处理图片文件，支持多种图片格式，大图片将作为独立文件，小图片将内联到CSS中。
            test: /\.(png|jpe?g|gif|webp|svg|ico)$/,

            type: 'asset',
            exclude: [path.resolve(__dirname, '../src/assets/icons')], // 排除特定目录下的SVG文件

            parser: {
              dataUrlCondition: {
                maxSize: 8 * 1024 // 设置内联图片的最大大小
              }
            },

            generator: {
              filename: 'image/[name].[hash:8][ext]' // 输出文件命名规则
            }
          },
          {
            // 处理字体和媒体文件，作为静态资源包含。
            test: /\.(woff2?|eot|ttf|otf|mp3|mp4|avi|mkv)$/,

            type: 'assets/resource',

            generator: {
              filename: 'media/[name].[hash:8][ext]' // 输出文件命名规则
            }
          },
          {
            // 特殊处理SVG图标文件，使用svg-sprite-loader将它们集成到单个SVG sprite中。
            test: /\.svg$/,

            include: [path.resolve(__dirname, '../src/assets/icons')],

            use: {
              loader: 'svg-sprite-loader',
              options: {
                symbolId: 'svg-[name]' // 图标ID生成规则
              }
            }
          },
          {
            // 处理JavaScript和TypeScript文件，支持ES6+语法、React和按需加载Ant Design。
            test: /\.(js|ts)x?$/,

            exclude: /node_modules/, // 排除node_modules目录下的文件

            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: [
                    // 使用按需导入的core-js
                    [
                      '@babel/preset-env',
                      {
                        useBuiltIns: 'usage',
                        corejs: 3
                      }
                    ],
                    '@babel/preset-react', // 支持React语法
                    '@babel/preset-typescript' // 支持TypeScript语法
                  ],
                  cacheDirectory: true, // 使用缓存提升性能
                  cacheCompression: false, // 不压缩缓存
                  plugins: [
                    !isProduction && 'react-refresh/babel', // 开发环境下使用React Refresh
                    '@babel/plugin-transform-runtime' // 支持运行时转换
                  ].filter(Boolean) // 过滤掉未启用的插件
                }
              }
            ]
          }
        ]
      }
    ]
  },
  // 插件配置数组，用于 webpack 构建过程中的各种插件应用
  plugins: [
    // ESLint 插件，用于在开发过程中对 JavaScript 代码进行实时 linting
    new EslintWebpackPlugin({
      context: path.resolve(__dirname, '../src'), // 指定 ESLint 检查的文件夹路径
      cache: true // 启用缓存，加快 linting 速度
    }),

    // HtmlWebpackPlugin，用于根据模板生成 HTML 文件，并注入对应的 js/css 资源
    new HtmlWebpackPlugin({
      template: './public/index.html', // 指定 HTML 模板文件路径
      filename: 'index.html' // 生成的 HTML 文件名
    }),

    // WebpackBar，用于在构建过程中提供进度条显示
    new WebpackBar(),

    // CopyWebpackPlugin，用于复制指定文件或文件夹到输出目录
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../public'), // 指定要复制的源文件或文件夹路径
          to: path.resolve(__dirname, '../desktop/build'), // 指定复制到的目标路径
          globOptions: {
            ignore: ['**/index.html'] // 忽略指定的文件或文件夹
          }
        }
      ]
    }),

    // SpriteLoaderPlugin，用于自动合并和优化图标精灵
    new SpriteLoaderPlugin({
      plainSprite: true // 使用纯色背景的精灵图
    }),

    // MiniCssExtractPlugin，用于从 CSS 中提取出独立的文件，在生产环境中使用
    // 该插件仅在 isProduction 为 true 时启用
    isProduction &&
      new MiniCssExtractPlugin({
        filename: 'style/[name].[contenthash:8].css', // 指定 CSS 输出文件名格式
        chunkFilename: 'style/[name].[contenthash:8].chunk.css' // 指定 CSS 引用的 chunk 文件名格式
      }),

    // ReactRefreshWebpackPlugin，用于支持 React 的热更新
    // 该插件仅在 isProduction 为 false 时启用
    !isProduction && new ReactRefreshWebpackPlugin()
  ].filter(Boolean), // 过滤掉未启用的插件

  // 优化配置，包括代码的最小化、资源的合并等
  optimization: {
    minimize: isProduction, // 是否对 JavaScript 代码进行最小化，只在生产环境中启用
    minimizer: [
      new CssMinimizerWebpackPlugin(), // CSS 最小化插件
      new TerserWebpackPlugin() // JavaScript 最小化插件
    ],
    splitChunks: {
      chunks: 'all', // 合并所有类型的 chunks
      name: false, // 不为合并后的 chunks 指定名字
      cacheGroups: {
        // 定义自定义的缓存分组
        reactBase: {
          // React 相关库的缓存分组
          name: 'reactBase',
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/, // 匹配 react 相关的模块
          priority: 10, // 设置优先级
          chunks: 'all' // 合并所有类型的 chunks
        },
        antdBase: {
          // Ant Design 相关库的缓存分组
          name: 'antdBase',
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/, // 匹配 Ant Design 相关的模块
          priority: 9, // 设置优先级
          chunks: 'all' // 合并所有类型的 chunks
        },
        common: {
          // 其他通用模块的缓存分组
          name: 'common',
          minChunks: 2, // 被至少两个 chunks 引用的模块才会被合并
          priority: 5, // 设置优先级
          chunks: 'all' // 合并所有类型的 chunks
        }
      }
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime-${entrypoint.name}` // 为 runtime chunk 指定名字
    }
  },

  // DevServer 配置，用于本地开发时的服务器设置
  devServer: {
    historyApiFallback: true, // 支持 HTML5 的历史模式路由
    compress: true, // 启用 gzip 压缩
    host: '0.0.0.0', // 监听的主机地址
    port: 8888, // 监听的端口号
    hot: true // 启用热更新
  },

  // 开发工具相关的配置，用于控制 source map 的生成
  devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map', // 根据是否是生产环境选择 source map 类型

  // 性能相关的配置，包括对入口点大小和资产大小的提示
  performance: {
    hints: false, // 不给出性能提示
    maxEntrypointSize: 512000, // 入口点的最大大小
    maxAssetSize: 512000 // 资产的最大大小
  }
}
