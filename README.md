# arnold
advanced media center based on VLC and NW.js

# Install & run

## Mac OSX

1. Download and install [NW.js](http://nwjs.io)
```
wget http://dl.nwjs.io/v0.12.3/nwjs-v0.12.3-osx-x64.zip
tar -xvf nwjs-v0.12.3-osx-x64.zip
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

3. Link VLC (you need to have VLC installed on your system)
```
ln -s /Applications/VLC.app/Contents/MacOS/lib arnold.app/Contents/Resources/app.nw/node_modules/webchimera.js/build/Release/lib
sudo mkdir arnold.app/Contents/Resources/app.nw/node_modules/webchimera.js/build/Release/lib/vlc
sudo ln -s /Applications/VLC.app/Contents/MacOS/plugins arnold.app/Contents/Resources/app.nw/node_modules/webchimera.js/build/Release/lib/vlc/plugins
```

4. Run
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
