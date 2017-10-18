# Jam

[![Build Status](https://travis-ci.org/camdagr8/jam.svg?branch=master)](https://travis-ci.org/camdagr8/jam)


## Quick Start

If you haven't already, install MongoDB.
You can install MongoDB however you wish, but I find [Homebrew](https://brew.sh/) the easiest way.
```
$ brew install mongodb
```

Start MongoDB as a service:
```
$ brew services start mongodb
```

### Create the admin db user

In terminal input the following MongoDB commands:
```
> $ mongo
> $ use admin
> $ db.createUser({user:"dbadmin", pwd:"PASSWORD", roles:[{role:"root", db:"admin"}]})

> $ use jam-dev
> $ db.createUser({user:"dbadmin", pwd:"PASSWORD", roles:["readWrite"]})
> $ exit
```

Jam is super easy to install. Simply install the [Jam CLI:](https://www.npmjs.com/package/brkfst-jam-cli)
```
npm install -g brkfst-jam-cli
```

Change directory to where you want to install jam
```
$ cd /User/yourname/jam
```

Run the jam install command.
```
$ jam install
```

You will be prompted to enter the database connection string, an admin username & password, and a port to run the local server on.

The db connection string is a combination of your MongoDB username, password, server, port, and database.
Using the above settings it should look like this: `mongodb://dbadmin:PASSWORD@localhost:27017/jam-dev`

>_**Pro Tip:** You can skip the prompts by specifying flags in the jam install command:_

```
$ jam install --db mongodb://dbadmin:PASSWORD@localhost:27017/jam-dev --username your@email.com --password MYPASSWORD --port 9000
```


### Start the Local Server
```
$ npm run local
```

## Running Remotely

Open the `~/src/env.json` file and create environment variables for each entry.

Typically you will have an external MongoDB, so be sure to update your environment value for `DATABASE_URI` to the necessary connection string.


# Development Guide

## Architecture
Jam is a CMS built on [Node](https://nodejs.org/en/) + [Express](https://expressjs.com/) and uses [Parse Cloud Code](http://docs.parseplatform.org/cloudcode/guide/) to interact with the [MongoDB](https://www.mongodb.com/). Jam also uses [EJS](https://github.com/tj/ejs), a simple templating language as the server side rendering engine.

### 1. The Core Object
The `global.core` object is created before any script execution starts

| Property | Type | Description |
|:---------|:-----|:------------|
| core.hbsParse | Function | Parses content for Helper wysiwyg text. Returns: String |
| core.is_role | Function | Checks whether the specified `permission` is applied to the specified `user`. Returns: Boolean |

### 2. The jam Object
The `req.jam` object is created before any routes are handled. Once execution is under way the following properties are attached:

| Property | Type | Description |
|:---------|:-----|:------------|
| jam.baseurl | String | The base url of the site |
| jam.theme | String | Default theme setting will be over written when config is pulled |
| jam.blocks | Array | Admin content section widgets |
| jam.currentuser | Object | The currently logged in user object |
| jam.helpers | Array | The list of registered helpers |
| jam.is | Object | Stores boolean values of states (jam.is.admin would tell if the current page is an admin page) |
| jam.meta_types | Array | List of admin metabox types |
| jam.pages | Array | List of page content types pulled from the Parse.Object('Content') query |
| jam.plugin | Object | Registered plugins get built here and their module.exports can be accessed via the plugin's ID value. |
| jam.plugins | Array | List of registered plugins |
| jam.sidebar | Array | List of Admin sidebar navigation plugins |
| jam.url | String | The current page url. Example: http://mysite.com/sample.json would output sample.json |
| jam.users | Array | List of users. Only available in the admin pages. |
| jam.widgets | Array | Admin sidebar section widgets |
| jam.template_files | Array | List of template files. Only available in the admin pages. |
| jam.templates | Array | List of registered tempaltes. Only available int he admin pages. |


## Extending Jam
Jam functionality can be extended by creating a helper, widget, or plugin.

### Helpers
Helpers are [Handlebars](http://handlebarsjs.com/) helpers or block expressions that extend wysiwyg and metabox functionality but really can be used anywhere.
Jam comes shipped with a couple helpers:

| Helper | Description|
|--------|:----------|
|**date**| Displays the current date in the specified format|
|**lipsum**| Displays latin lorem ipsum text

#### Creating A Helper
Helpers are stored in the `~/src/app/helper` directory and typically consist of the required `mod.js` file and the optional `icon.ejs` file. Jam will automatically register helpers placed in this directory. If you wish for Jam to ignore your helper prefix the helper's directory name with an underscore `_`.

![Helpers](https://ibin.co/3IoX5HYCEpAm.png)

##### The Helper `mod.js` File

The mod.js file should expose the following properties on the `module.exports` object:

| Property | Type | Description |
|:---------|:-----|:------------|
| **id** | String | The id of the helper used to identify and register the helper, making the helper accessible in the global `jam.helpers` object.|
| **wysiwyg** | String | The Handlebars helper or block expression to inject into the wysiwyg or metabox. It's how you use the helper in content. |
| **helper** | Function | The helper replaces the `wysiwyg` string with the output of the function. The helper function should expect the options hash or context and the options hash depending on which type of helper you are registering (see: [ Handlebars Block Helpers for more info](http://handlebarsjs.com/block_helpers.html)). |


###### Example: date helper

```js
/**
 * Imports
 */
const moment = require('moment');

/**
 * Exports
 */
module.exports = {
    id: 'date',

    wysiwyg: '{{date format="mm/dd/YYYY"}}',

    helper: (opt) => {
	    let format 	= (!opt.hash.hasOwnProperty('format')) 	? 'L'           : opt.hash.format;
	    let date 	= (!opt.hash.hasOwnProperty('date')) 	? new Date()    : new Date(opt.hash.date);

	    return moment(date).format(format);
    }
};
```
#### The Helper `icon.ejs` File
The optional icon.ejs file is a simple ejs partial that stores the svg path for the icon to display in wysiwyg editors.

```html
<path d="M10 10 H 90 V 90 H 10 L 10 10" />
```
![icon.ejs at work](https://ibin.co/3IoldamPiJgM.png)

#### Using Helpers
You can process any content containing helpers by wrapping the content with the `core.hbsParse()` function

### Widgets
Widgets are typically dynamic blocks of code that have some sort of user interface. Widgets are primarily used in the admin dashboard but can be used anywhere.

#### Creating A Widget
Widgets are stored in the `~/src/app/plugin` directory and typically consist of a required `mod.js` file and an optional `widget.ejs` file. Jam will automatically register widgets placed in this directory. If you wish for Jam to ignore your widget prefix the widget's directory name with an underscore `_`.

![widget](https://ibin.co/3IpNxZUvlYrN.png)

#### The Widget `mod.js` File
The mod.js file should expose the following properties on the `module.exports` object:

| Property | Type | Description |
|:---------|:-----|:------------|
| **id** | String | The id of the widget used to identify and register the widget, making the widget accessible in the global `jam.plugin` object. |
| **index** | Number | The sort order when used in the admin dashboard. |
| **perms** | Array | List of permissions needed to access the widget. |
| **sections** | Array | List of sections to include the widget.ejs file. Primarily used for admin dashboard widgets. You can specifiy new sections and use them however you please in your view controllers so long as you call `core.add_widgets('YOUR-SECTION')` in an `exports.use` function. Think of sections as: which page to display the widget. _Admin Dashboard Values: 'page-editor', 'user-editor', 'all'_. |
| **zone** | String | The zone on the page where the widget should display. Primarily used for admin dashboard widgets. Think of zones as: where to display the widget within a section. _Admin Dashboard Values: 'sidebar', 'blocks', 'widgets'_. |

###### Example Widget `mod.js` File:

```js
module.exports = {
	id:       'sidebar-users',

	index:    2,

	perms:    ['administrator'],

	sections: ['all'],

	zone:     'sidebar'
};
```

### Cloud Code
There is a wide variety of Parse Cloud Code functions available to use anywhere.. no seriously.. anywhere, even front-end or mobile apps so be careful what and how you expose functionality in Cloud Code.

#### Creating A Cloud Function
Cloud functions are automatically registered by Jam and don't need to be included or required anywhere.
There are a couple places where you can create a cloud function:
  - In the `~/app/cloud` directory
  - A `cloud.js` file saved in a `~/app/plugin/[PLUGIN]` directory


__See the [Parse Cloud Code Guide](http://docs.parseplatform.org/cloudcode/guide/) for details on how to write and use Cloud Code.__

#### Jam Cloud Code API

##### config_get
Returns an Object Array of the Jam configuration objects stored in the `Config` table.
If the `key` parameter is specified, returns the config object value as it was defined.

| Param | Type | Description |
|:------|:-----|:------------|
| key | String | (Optional) The `Config` value to return. |

```js
Parse.Cloud.run('config_get', {key: 'title'})

Parse.Cloud.run('config_get')
```

##### config_set
Updates or creates a `Parse.Object('Config')` record by simply passing name:value pairs to the request.params of the `Parse.Cloud.run()` function.

```js
Parse.Cloud.run('config_set', {title: "Site Title", theme: "default", myconfig: ["my", "config", "item"})
```

> _** Note: After creating a new config item, you may need to do a page refresh or manually add the item to the_ `req.jam.config` _object._


##### content_get
Queries the `Parse.Object('Content')` table for the specified route.
Returns the first matching, newest object.

| Param | Type | Description |
|:------|:-----|:------------|
| route | String | The route to query |

```js
Parse.Cloud.run('content_get', {route: '/about'})
```

##### content_get_pages
Queries the `Parse.Object('Content')` table where the `type` property is `page`.

| Param | Type | Description |
|:------|:-----|:------------|
| page | Number | The pagination page number to retrieve. Default: 1. |
| limit | Number | The number of results to return per page. Default: 50. |
| order | String | The sort order `ascending|descending`. Default: descending. |
| orderBy | String | The sort order field. Default: createdAt. |
| user | Parse.User or String | The Parse.User object or objectId of the content creator. |
| status | String | The content status type: `draft|publish|publish-later|delete-later|delete`. By default, content with the `delete` status are ignored. |
| find | String | Space delimited list string that searches the `index` field for the specified values. |

```js
Parse.Cloud.run('content_get_pages', {
    page       : 3,
    limit      : 5,
    order      : 'ascending',
    orderBy    : 'title',
    user       : 'u5fMpRs2SP',
    status     : 'publish',
    find       : 'hello world'
})
```

##### content_get_posts
Queries the `Parse.Object('Content')` table where the `type` property is `post`. See content_get_pages for details.

##### content_post
Creates or updates a `Parse.Object('Content')`.

| Param | Type | Description |
|:------|:-----|:------------|
| objectId | String | The Parse.Object ID. Used when updating an object. |
| routes | Array or String | The route(s) to associate the object with. Required. |
| category | Array or String | The categories to associate the object with. Typically only used with the `post` type. The category will prepend the routes. |
| title | String | |
| meta | Object | Miscellaneous data associated with the object. Typically the meta is used to customize the display of the content. |
| publishAt | Date | The date when the content object should be published. |
| unpublishAt | Date | The date when the content object should no longer be published. |
| status | String | The content status type: `draft|publish|publish-later|delete-later|delete`. Default: 'draft'. |
| user | Parse.User or String | The author of the content object. Default: current user. |

> _** Note: There is a system wide `Parse.Cloud.beforeSave('Content')` trigger applied where input is sanitized before input. This trigger applies to all `Parse.Object('Content')` save operations_

##### content_purge
The Jam admin does not actually delete records from the Content table when you set it's status to delete. This function will delete the `delete` status records permanently.

| Param | Type | Description |
|:------|:-----|:------------|
| type | String | The content `type` to purge |
| limit | Number | Number of records to purge. Default: 1000 |

```js
Parse.Cloud.run('content_purge', {type: 'post', limit: 5})
```

> _** Note: You will need the correct ACL/Permissions in order to execute this command for all records._

##### jwt_sign
Creates a [JWT](https://jwt.io/) signature.

| Param | Type | Description |
|:------|:-----|:------------|
| payload | Mixed | The content to encrypt withing the JWT. |
| secret | String, Buffer, or Object | See the (JWT documentation)[https://github.com/auth0/node-jsonwebtoken] for detaails. |
| options | Object | See the (JWT documentation)[https://github.com/auth0/node-jsonwebtoken] for detaails. |

```js
Parse.Cloud.run('jwt_sign', {payload: "Yay!", secret: "Bears poop in the forest"})
```

##### jwt_verify
Verifies a JWT.

| Param | Type | Description |
|:------|:-----|:------------|
| token | Object | The JWT signature to verify. |
| secret | String, Buffer, or Object | The secret value used when creating the signature. |

```js
Parse.Cloud.run('jwt_verify', {token: myJWTSig, secret: "Bears poop in the forest"})
```
