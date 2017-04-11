# Jam

## Getting Started

If you haven't already, install mongodb:
```
brew install mongodb
```

Start MongoDB after installing:
```
brew services start mongodb
```

### Create the admin db user

In terminal input the following mongo commands:
```
> mongo
> use admin
> db.createUser({user:"dbadmin", pwd:"PASSWORD", roles:[{role:"root", db:"admin"}]})
```

Create the Jam database and create a db user
```
> use jam-dev
> db.createUser({user:"dbadmin", pwd:"PASSWORD", roles:["readWrite"]})
> exit
```

### Installing Jam

Install the Jam CLI tool 
``` 
npm install -g brkfst-jam-cli
```

Change directory to where you want to install jam
```
cd /User/yourname/jam
```

Run the jam install command.
```
jam install
```

You will be prompted to enter the database connection string, an admin username & password, and a port to run the server on. 

The db connection string is a combination of your MongoDB username, password, server, port, and database. 
Using the above settings it should look like this: `mongodb://dbadmin:PASSWORD@localhost:27017/jam-dev`


### Start the Local Server
```
npm test
```

## Running Remotely

Open the `~/src/env.json` file and create environment variables for each entry.

Typically you will have an external MongoDB, so be sure to update your environment value for `DATABASE_URI` to the necessary connection string.
