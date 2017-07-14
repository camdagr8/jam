# Jam

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

### Install Jam
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
$ npm test
```

## Running Remotely

Open the `~/src/env.json` file and create environment variables for each entry.

Typically you will have an external MongoDB, so be sure to update your environment value for `DATABASE_URI` to the necessary connection string.

___
___
___

# Development Guide

## Architecture
Jam is a CMS built on [Node](https://nodejs.org/en/) + [Express](https://expressjs.com/) and uses [Parse Cloud Code](http://docs.parseplatform.org/cloudcode/guide/) to interact with the [MongoDB](https://www.mongodb.com/). Jam also uses [EJS](https://github.com/tj/ejs), a simple templating language as the server side rendering engine.

## Global Objects
Jam creates a couple global objects that are used to persist data through out the application. 

### 1. The Core Object
The `global.core` object is created before any script execution starts

| Property | Type | Description |
|:---------|:-----|:------------|
| core.hbsParse | Function | Parses content for Helper wysiwyg text. Returns: String |
| core.is_role | Function | Checks whether the specified `permission` is applied to the specified `user`. Returns: Boolean |

### 2. The Jam Object
The `global.jam` object is created before any script execution starts. Once execution is under way the following properties are attached: 

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

> _**Pro Tip:** You can pass the jam object to the render function and set the .ejs file's data value or use it as a global `jam.PROPERTY`_


## Themes
Themes are saved in the `~/src/app/view/themes` directory and consist of .ejs template files.

### Creating A Theme 
Create a new theme by adding a new directory in the themes directory and give it a name. You will need to update the site settings via the admin dashboard to point to the new theme directory.

![Theme Directory](https://ibin.co/3IoNg3hneJe8.png)

>_**Pro Tip:** You can create a new theme with pre-generated template files using the Jam CLI_
```
$ jam create theme --name "My Theme"
```

### Adding A Style Sheet
When you create a new theme, it's typical to want a specific style sheet for that theme. There are a couple ways to add a new style sheet. 

#### 1. The SASS Way:
Create a new .scss file in the `~/src/public/src/css` directory then create a new directory where your supporting .scss files can be stored. 
Upon compilation, the style sheet will be piped to the `~/src/public/assets/css` directory. 

![The SASS Way](https://ibin.co/3IlmRm1gnJMu.png)

```
/* default.scss */
@import 'default/layout';
@import 'default/header';
@import 'default/page';
@import 'default/footer';
```

#### 2. The Plain CSS Way:
Simply add a new .css file to the `~/src/public/assets/css` directory.

![The Plain CSS Way](https://ibin.co/3IoM9ljcNHRS.png)

>_**Pro Tip:** If you create a new theme with the Jam CLI, The SASS Way is automatically setup using the theme name you specified when creating the theme._

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

To be continued...

