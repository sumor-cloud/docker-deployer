import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import fse from 'fs-extra'
import YAML from 'yaml'

import convert from '../src/config/convert.js'
import load from '../src/config/load.js'
import entry from '../src/config/index.js'
import os from 'os'
import configFormatter from '../src/config/formatter/index.js'
import testConfig from './assets/config.js'

describe('Config', () => {
  const root = `${os.tmpdir()}/sumor-deployer-test/config`
  beforeEach(async () => {
    await fse.remove(root)
    await fse.ensureDir(root)
  })
  afterEach(async () => {
    await fse.remove(root)
  })
  it('load config files', async () => {
    // The loading order should be: yml > yaml > json
    await fse.writeFile(
      `${root}/config.json`,
      JSON.stringify({
        type: 'json'
      })
    )
    const config1 = await load(root, 'config')
    expect(config1.type).toBe('json')

    await fse.writeFile(
      `${root}/config.yaml`,
      YAML.stringify({
        type: 'yaml'
      })
    )
    const config2 = await load(root, 'config')
    expect(config2.type).toBe('yaml')

    await fse.writeFile(
      `${root}/config.yml`,
      YAML.stringify({
        type: 'yml'
      })
    )
    const config3 = await load(root, 'config')
    expect(config3.type).toBe('yml')
  })
  it('加载配置文件', async () => {
    await fse.writeFile(
      `${root}/config.json`,
      JSON.stringify({
        type: 'json'
      })
    )
    await fse.writeFile(
      `${root}/config.yaml`,
      JSON.stringify({
        type: 'yaml'
      })
    )
    await convert(root, 'config', 'json')
    const config1 = await load(root, 'config')
    expect(config1.type).toBe('yaml')
    await convert(root, 'config', 'yml')
    const config2 = await load(root, 'config')
    expect(config2.type).toBe('yaml')
  })
  it('加载配置文件失败', async () => {
    await fse.writeFile(`${root}/dummy.yaml`, '{"type":!@123}')
    const config = await load(root, 'dummy')
    expect(config).toBe(undefined)
  })
  it('Load scope config', async () => {
    await fse.writeFile(
      `${root}/scope.json`,
      JSON.stringify({
        env: {},
        server: {
          main: {}
        }
      })
    )
    await fse.writeFile(`${root}/scale.json`, JSON.stringify({}))
    const config = await entry({
      root,
      type: 'yaml'
    })
    expect(config).toEqual({
      env: {},
      server: {
        main: {
          name: 'main'
        }
      },
      scale: {},
      live: []
    })
  })
  it('获取实例配置', async () => {
    const config = {
      ...testConfig,
      source: {
        demo: {
          url: 'https://github.com/demo/demo.git'
        }
      },
      server: {
        main: {
          host: '1.2.3.4',
          port: 22,
          username: 'root',
          password: 'Abcd1234'
        }
      },
      env: {
        production: {
          demo: {
            domain: 'www.demo.com',
            entry: 'main'
          }
        }
      },
      scale: {
        production: {
          demo: {
            '1.0.0': {
              instance: {
                main: 2
              }
            },
            '1.0.1': {
              live: true,
              instance: {
                main: 4
              }
            }
          }
        }
      }
    }
    config.server.main = {
      host: '1.2.3.4',
      port: 22,
      username: 'root',
      password: 'Abcd1234'
    }
    config.source.demo = {
      url: 'https://github.com/demo/demo.git'
    }
    const scopeConfig = configFormatter(config)
    const expectFilePath = `${process.cwd()}/test/assets/expect/configFormatter.json`
    // await fse.writeFile(expectFilePath, JSON.stringify(scopeConfig, null, 4))
    const expectResult = await fse.readJson(expectFilePath)
    expect(scopeConfig).toEqual(expectResult)
  })
  it('Empty config', async () => {
    const scopeConfig = configFormatter({
      env: {
        production: {}
      },
      scale: {
        production: {}
      }
    })
    expect(scopeConfig).toEqual({
      env: {
        production: {}
      },
      scale: {
        production: {}
      },
      live: []
    })
  })
})
