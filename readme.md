# Jam
## Getting Started Locally

If you haven't already, install mongodb:
```
brew install mongodb
```

Start mongodb after installing:
```
brew services start mongodb
```

### Create the admin db user
In terminal input the following mongo commands:
```
> mongo
> use admin
> db.createUser({user:"dbadmin", pwd:"7UO84b3As9Pg", roles:[{role:"root", db:"admin"}]})
```

Create the Jam database and create a db user
```
> use jam
> db.createUser({user:"dbadmin", pwd:"7UO84b3As9Pg", roles:["readWrite"]})
> exit
```

### Configuring Server
* Open the `~src/env.json` file.
* Update the `DATABASE_URI` env variable with your jam db username and password
```
"DATABASE_URI"		: "mongodb://dbadmin:7UO84b3As9Pg@localhost:27017/jam",
```
* Save the env.json file

### Install and Start the Server
```
> npm start
```

## Running Remotely
Open the `~src/env.json` file and create environment variables for each entry. Typically you will have an external Mongo DB, so be sure to update your environment value for `DATABASE_URI` to the necessary connection string.
