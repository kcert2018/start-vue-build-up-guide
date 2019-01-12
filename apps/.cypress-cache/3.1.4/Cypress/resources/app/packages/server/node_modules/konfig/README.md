KONFIG
======
Konfig is a **config loader** module which allows you to load **json**, **cson** and **yaml** files automatically **by environment** in node.js applications. You can also define **dynamic values** which can be used especially for dynamic environment variables on Heroku like services.

## Installation
First intall module from npm :
```bash
$ npm install konfig
```
Create a folder named ```config``` under the root directory of the project. Then load Konfig in your application file :
```javascript
var config = require('konfig')()

// Don't forget parentheses to call the function
```

We recommend you to define config variable as global :
```javascript
global.config = require('konfig')()
```

You can also use different folder name except ```config``` by passing path variable while loading Konfig :
```javascript
global.config = require('konfig')({ path: './another_directory' })
```

## Usage

Let's create an example config file under ```config``` folder named ```app.json``` or ```app.yml```

```json
{
    "default": {
        "port": 3000,
        "cache_assets": true,
        "secret_key": "7EHDWHD9W9UW9FBFB949394BWYFG8WE78F"
    },

    "development": {
        "cache_assets": false
    },

    "test": {
        "port": 3001
    },

    "staging": {
        "port": #{process.env.PORT},
        "secret_key": "3F8RRJR30UHERGUH8UERHGIUERHG3987GH8"
    },

    "production": {
        "port": #{process.env.PORT},
        "secret_key": "3F8RRJR30UHERGUH8UERHGIUERHG3987GH8"
    }
}
```

If you use yaml format the config file will be like this :

```yaml
default:
    port: 3000
    cache_assets: true
    secret_key: 7EHDWHD9W9UW9FBFB949394BWYFG8WE78F

development:
    cache_assets: false

test:
    port: 3001

production: &production
    port: #{process.env.PORT}
    secret_key: 3F8RRJR30UHERGUH8UERHGIUERHG3987GH8

# aliases must be defined before you include!
staging:
    <<: *production
```

After creating config files, let's try it by using node interpreter. But first ensure that the module is installed ```npm install konfig``` and open node interpreter in the root directory of the project :

```bash
$ node
```
Then load the module
```javascript
> var config = require('konfig')()
```
Let's try to get port and secret key values, remember that the **default environment** will be **development** and the config object structure will be ```config.[filename].[config_key]...```
```javascript
> config.app.port
3000
> config.app.secret_key
'7EHDWHD9W9UW9FBFB949394BWYFG8WE78F'
```
Quit interpreter, and let's open the interpreter with ```staging``` environment with port 4567. If you look at the config file you will see the staging port is **dynamic value**. Konfig enables you to use node variables in your config file by using **#{}** signs.
```bash
$ NODE_ENV=staging PORT=4567 node
> var config = require('konfig')()
```
Now, we will get some config values:
```javascript
> config.app.port
4567
> config.app.secret_key
'3F8RRJR30UHERGUH8UERHGIUERHG3987GH8'
```

Notice that **default values** copies itself to the config if there is no key in the environment config with the same name.

## License
Konfig is released under GNU Lesser General Public License v3 (or higher) published by Free Software Foundation. See http://www.gnu.org/licenses/lgpl-3.0.html for more details.
