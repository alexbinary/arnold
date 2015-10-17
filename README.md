# arnold
advanced media center based on VLC and NW.js

# Install from source & run

## Mac OSX

1. Download and install [NW.js](http://nwjs.io)
```
wget http://dl.nwjs.io/v0.12.3/nwjs-v0.12.3-osx-x64.zip
tar -xf nwjs-v0.12.3-osx-x64.zip
cd nwjs-v0.12.3-osx-x64
mv nwjs.app arnold.app
```

2. Download Arnold's source and dependencies
```
git clone https://github.com/alexbinary/arnold.git arnold.app/Contents/Resources/app.nw
cd arnold.app/Contents/Resources/app.nw
npm install
cd ../../../../
```

3. Run
```
open arnold.app
```

Then to update with latest code run :

```
cd arnold.app/Contents/Resources/app.nw
git pull
npm install
```

# Licence

Everything public domain.
